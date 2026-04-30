/**
 * fan-guide 執筆の進捗レポート（3 状態: 未対応 ⬜ / 着手中 🟡 / 完了 ✅）。
 *
 * 使い方:
 *   npm run fan-guide-status                     # 全体サマリ + agent 別カウント
 *   npm run fan-guide-status -- --agent agent-03 # 担当 ID 一覧（3 状態を ⬜ 🟡 ✅ で表示）
 *   npm run fan-guide-status -- --pending        # 未対応（⬜ のみ）ID 列挙
 *   npm run fan-guide-status -- --next agent-03  # agent-03 が次に取るべき 1 ID を出力
 *   npm run fan-guide-status -- --json           # JSON 出力（他スクリプトに食わせる用）
 *
 * 状態判定:
 *   - 完了 (✅): data/sources/fan-guide/{id}.json が存在
 *   - 着手中 (🟡): data/sources/fan-guide-wip/{id}.json が存在 + fan-guide/ には無い
 *   - 未対応 (⬜): どちらにも無い
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FAN_GUIDE_DIR = join(ROOT, 'data/sources/fan-guide');
const FAN_GUIDE_WIP_DIR = join(ROOT, 'data/sources/fan-guide-wip');
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

type ProgramState = 'completed' | 'in_progress' | 'pending';

interface ProgramStatus {
  id: string;
  agent: string | null;
  state: ProgramState;
}

interface AgentSummary {
  total: number;
  completed: number;
  inProgress: number;
  pendingIds: string[];
  inProgressIds: string[];
}

interface Report {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  unassigned: number;
  byAgent: Record<string, AgentSummary>;
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

function detectState(id: string): ProgramState {
  if (existsSync(join(FAN_GUIDE_DIR, `${id}.json`))) return 'completed';
  if (existsSync(join(FAN_GUIDE_WIP_DIR, `${id}.json`))) return 'in_progress';
  return 'pending';
}

function buildReport(): Report {
  const assignments = loadAssignments();
  const allIds = loadBoothIds();

  const programs: ProgramStatus[] = allIds.map((id) => ({
    id,
    agent: assignments?.assignments[id] ?? null,
    state: detectState(id),
  }));

  const byAgent: Report['byAgent'] = {};
  for (const agent of assignments?.agents ?? []) {
    byAgent[agent] = {
      total: 0,
      completed: 0,
      inProgress: 0,
      pendingIds: [],
      inProgressIds: [],
    };
  }
  for (const p of programs) {
    if (p.agent === null) continue;
    if (byAgent[p.agent] === undefined) {
      byAgent[p.agent] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        pendingIds: [],
        inProgressIds: [],
      };
    }
    const summary = byAgent[p.agent];
    summary.total++;
    if (p.state === 'completed') {
      summary.completed++;
    } else if (p.state === 'in_progress') {
      summary.inProgress++;
      summary.inProgressIds.push(p.id);
    } else {
      summary.pendingIds.push(p.id);
    }
  }

  return {
    total: programs.length,
    completed: programs.filter((p) => p.state === 'completed').length,
    inProgress: programs.filter((p) => p.state === 'in_progress').length,
    pending: programs.filter((p) => p.state === 'pending').length,
    // 「未割当」は『未対応 / 着手中なのに担当が決まってない』だけを数える。
    // 完了済みで担当が決まっていないのは正常状態なので含めない
    unassigned: programs.filter(
      (p) => p.agent === null && p.state !== 'completed',
    ).length,
    byAgent,
    programs,
  };
}

function bar(completed: number, total: number, width: number = 20): string {
  if (total === 0) return '─'.repeat(width);
  const filled = Math.round((completed / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function stateMark(state: ProgramState): string {
  switch (state) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '🟡';
    case 'pending':
      return '⬜';
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const report = buildReport();

  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (args.includes('--pending')) {
    report.programs
      .filter((p) => p.state === 'pending')
      .forEach((p) => console.log(p.id));
    return;
  }

  // --next agent-XX: そのエージェントが次に取るべき 1 ID を出力（着手中 wip がある番組は除外）
  const nextIdx = args.findIndex((a) => a === '--next');
  if (nextIdx !== -1 && args[nextIdx + 1] !== undefined) {
    const agent = args[nextIdx + 1];
    const next = report.programs.find(
      (p) => p.agent === agent && p.state === 'pending',
    );
    if (next === undefined) {
      console.error(`✅ ${agent} は担当をすべて消化済み（または未対応 ID なし）`);
      process.exit(2);
    }
    console.log(next.id);
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
    console.log(
      `📋 ${agent} の担当 (✅${summary.completed} 🟡${summary.inProgress} ⬜${summary.pendingIds.length} / 計${summary.total})`,
    );
    console.log('');
    const ownPrograms = report.programs.filter((p) => p.agent === agent);
    for (const p of ownPrograms) {
      console.log(`  ${stateMark(p.state)} ${p.id}`);
    }
    if (summary.pendingIds.length > 0) {
      console.log('');
      console.log(`👉 次に取るべき ID: ${summary.pendingIds[0]}`);
    } else if (summary.inProgress > 0) {
      console.log('');
      console.log(`🟡 着手中 ${summary.inProgress} 件があります（wip → fan-guide に統合してください）`);
    } else {
      console.log('');
      console.log('🎉 担当すべて完了');
    }
    return;
  }

  // デフォルト: 全体サマリ
  console.log('📊 fan-guide 執筆進捗');
  console.log('');
  console.log(
    `  全体  ✅ ${report.completed}  🟡 ${report.inProgress}  ⬜ ${report.pending}  / 計 ${report.total}`,
  );
  console.log(`        ${bar(report.completed, report.total)}`);
  if (report.unassigned > 0) {
    console.log(`  未割り当て: ${report.unassigned} 件 (npm run assign-fan-guide で割り当て)`);
  }
  console.log('');
  console.log('  エージェント別 (✅ / 🟡 / 計):');
  for (const [agent, s] of Object.entries(report.byAgent).sort(([a], [b]) => a.localeCompare(b))) {
    const wipMark = s.inProgress > 0 ? `🟡${s.inProgress}` : '   ';
    console.log(
      `    ${agent}  ${String(s.completed).padStart(2)} ${wipMark} / ${String(s.total).padStart(2)}  ${bar(s.completed, s.total, 14)}`,
    );
  }
  console.log('');
  console.log(`残り: ⬜ ${report.pending} / 🟡 ${report.inProgress}`);
}

main();
