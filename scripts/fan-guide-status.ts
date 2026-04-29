/**
 * fan-guide 執筆の進捗レポート。
 *
 * 使い方:
 *   npm run fan-guide-status                     # 全体サマリ + agent 別カウント
 *   npm run fan-guide-status -- --agent agent-03 # 担当 ID 一覧（完了 / 未対応）
 *   npm run fan-guide-status -- --pending        # 未対応 ID のみ列挙
 *   npm run fan-guide-status -- --json           # JSON 出力（他スクリプトに食わせる用）
 *
 * 完了判定: data/sources/fan-guide/{id}.json の存在
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FAN_GUIDE_DIR = join(ROOT, 'data/sources/fan-guide');
const ASSIGNMENTS_PATH = join(ROOT, 'data/fan-guide-assignments.json');
const BOOTH_IDS_PATH = join(ROOT, 'data/booth-ids.json');

interface AssignmentsFile {
  createdAt: string;
  agents: string[];
  assignments: Record<string, string>;
}

interface BoothIdsFile {
  ids: string[];
}

interface ProgramStatus {
  id: string;
  agent: string | null;
  completed: boolean;
}

interface Report {
  total: number;
  completed: number;
  pending: number;
  unassigned: number;
  byAgent: Record<string, { total: number; completed: number; pending: string[] }>;
  programs: ProgramStatus[];
}

function loadAssignments(): AssignmentsFile | null {
  if (!existsSync(ASSIGNMENTS_PATH)) return null;
  return JSON.parse(readFileSync(ASSIGNMENTS_PATH, 'utf-8')) as AssignmentsFile;
}

function loadBoothIds(): string[] {
  if (!existsSync(BOOTH_IDS_PATH)) return [];
  return (JSON.parse(readFileSync(BOOTH_IDS_PATH, 'utf-8')) as BoothIdsFile).ids;
}

function isCompleted(id: string): boolean {
  return existsSync(join(FAN_GUIDE_DIR, `${id}.json`));
}

function buildReport(): Report {
  const assignments = loadAssignments();
  const allIds = loadBoothIds();

  const programs: ProgramStatus[] = allIds.map((id) => ({
    id,
    agent: assignments?.assignments[id] ?? null,
    completed: isCompleted(id),
  }));

  const byAgent: Report['byAgent'] = {};
  for (const agent of assignments?.agents ?? []) {
    byAgent[agent] = { total: 0, completed: 0, pending: [] };
  }
  for (const p of programs) {
    if (p.agent === null) continue;
    if (byAgent[p.agent] === undefined) {
      byAgent[p.agent] = { total: 0, completed: 0, pending: [] };
    }
    byAgent[p.agent].total++;
    if (p.completed) {
      byAgent[p.agent].completed++;
    } else {
      byAgent[p.agent].pending.push(p.id);
    }
  }

  return {
    total: programs.length,
    completed: programs.filter((p) => p.completed).length,
    pending: programs.filter((p) => !p.completed).length,
    unassigned: programs.filter((p) => p.agent === null).length,
    byAgent,
    programs,
  };
}

function bar(completed: number, total: number, width: number = 20): string {
  if (total === 0) return '─'.repeat(width);
  const filled = Math.round((completed / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function main(): void {
  const args = process.argv.slice(2);
  const report = buildReport();

  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (args.includes('--pending')) {
    const pending = report.programs.filter((p) => !p.completed).map((p) => p.id);
    pending.forEach((id) => console.log(id));
    return;
  }

  const agentIdx = args.findIndex((a) => a === '--agent');
  if (agentIdx !== -1 && args[agentIdx + 1] !== undefined) {
    const agent = args[agentIdx + 1];
    const summary = report.byAgent[agent];
    if (summary === undefined) {
      console.error(`❌ ${agent} は割り当てられていません`);
      process.exit(1);
    }
    console.log(`📋 ${agent} の担当 (${summary.completed}/${summary.total} 完了)`);
    console.log('');
    const ownPrograms = report.programs.filter((p) => p.agent === agent);
    for (const p of ownPrograms) {
      const mark = p.completed ? '✅' : '⬜';
      console.log(`  ${mark} ${p.id}`);
    }
    return;
  }

  // デフォルト: 全体サマリ
  console.log('📊 fan-guide 執筆進捗');
  console.log('');
  console.log(`  全体     ${report.completed} / ${report.total}  ${bar(report.completed, report.total)}`);
  if (report.unassigned > 0) {
    console.log(`  未割り当て: ${report.unassigned} 件 (npm run assign-fan-guide で割り当て)`);
  }
  console.log('');
  console.log('  エージェント別:');
  for (const [agent, s] of Object.entries(report.byAgent).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(
      `    ${agent}  ${String(s.completed).padStart(2)} / ${String(s.total).padStart(2)}  ${bar(s.completed, s.total, 14)}`,
    );
  }
  console.log('');
  console.log(`残り: ${report.pending} 件`);
  if (report.pending > 0 && report.pending <= 10) {
    console.log('  pending IDs: ' + report.programs.filter((p) => !p.completed).map((p) => p.id).join(', '));
  }
}

main();
