/**
 * 番組 ID をエージェントに割り当てる（並列 fan-guide 執筆運用）。
 *
 * 使い方:
 *   npm run assign-fan-guide                       # 既定: agent-01〜agent-10 の 10 並列
 *   npm run assign-fan-guide -- --agents 5         # 5 並列
 *   npm run assign-fan-guide -- --reassign         # 既存割り当てを破棄して再割り当て
 *   npm run assign-fan-guide -- --skip-completed   # 既に fan-guide/{id}.json がある番組は割り当て対象外
 *
 * 出力: data/fan-guide-assignments.json
 *   {
 *     "createdAt": "...",
 *     "agents": ["agent-01", ..., "agent-10"],
 *     "assignments": { "pcwe-001": "agent-03", ... }
 *   }
 *
 * 設計:
 *   - 担当者シャッフルは AGENTS.md / writing-guide §8.3「ジャンルが似た番組をまとめて
 *     1 AI が担当しない」に従い、ID をランダム並びで n 等分
 *   - 既存割り当てがあるなら、未対応 ID だけ再シャッフル（--reassign で全リセット）
 *   - 完了判定: data/sources/fan-guide/{id}.json の存在
 *   - 並列 AI 運用は別セッションで進める想定。本スクリプトは「割り当て表」の生成のみ
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BOOTH_IDS_PATH = join(ROOT, 'data/booth-ids.json');
const FAN_GUIDE_DIR = join(ROOT, 'data/sources/fan-guide');
const ASSIGNMENTS_PATH = join(ROOT, 'data/fan-guide-assignments.json');

interface BoothIdsFile {
  ids: string[];
}

interface AssignmentsFile {
  createdAt: string;
  agents: string[];
  assignments: Record<string, string>;
}

function loadBoothIds(): string[] {
  if (!existsSync(BOOTH_IDS_PATH)) {
    console.error(
      `❌ ${BOOTH_IDS_PATH} が見つかりません。先に \`npm run list-booths\` を実行してください`,
    );
    process.exit(1);
  }
  return (JSON.parse(readFileSync(BOOTH_IDS_PATH, 'utf-8')) as BoothIdsFile).ids;
}

function loadExistingAssignments(): AssignmentsFile | null {
  if (!existsSync(ASSIGNMENTS_PATH)) return null;
  return JSON.parse(readFileSync(ASSIGNMENTS_PATH, 'utf-8')) as AssignmentsFile;
}

function isCompleted(id: string): boolean {
  return existsSync(join(FAN_GUIDE_DIR, `${id}.json`));
}

/** Fisher–Yates シャッフル（破壊的）*/
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildAgentNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `agent-${String(i + 1).padStart(2, '0')}`);
}

function distributeRoundRobin(ids: string[], agents: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const shuffled = shuffle([...ids]);
  for (let i = 0; i < shuffled.length; i++) {
    result[shuffled[i]] = agents[i % agents.length];
  }
  return result;
}

function parseAgentsArg(args: string[]): number {
  const idx = args.findIndex((a) => a === '--agents');
  if (idx === -1 || args[idx + 1] === undefined) return 10;
  const n = parseInt(args[idx + 1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) {
    console.warn(`⚠️  --agents の値が不正です: ${args[idx + 1]} → 10 にフォールバック`);
    return 10;
  }
  return n;
}

function main(): void {
  const args = process.argv.slice(2);
  const reassign = args.includes('--reassign');
  const skipCompleted = args.includes('--skip-completed');
  const agentCount = parseAgentsArg(args);

  const allIds = loadBoothIds();
  const existing = reassign ? null : loadExistingAssignments();
  const agents = existing?.agents ?? buildAgentNames(agentCount);

  if (existing !== null && agents.length !== agentCount) {
    console.warn(
      `⚠️  既存の agent 数 (${agents.length}) と --agents (${agentCount}) が不一致。既存 agent 構成を維持します。再構成するには --reassign を指定してください`,
    );
  }

  const newAssignments: Record<string, string> = { ...(existing?.assignments ?? {}) };

  // 既存割り当ての中に「もう存在しない ID」があれば除去
  for (const id of Object.keys(newAssignments)) {
    if (!allIds.includes(id)) delete newAssignments[id];
  }

  // 未割り当て ID を抽出
  let unassigned = allIds.filter((id) => newAssignments[id] === undefined);

  // skip-completed: 既に fan-guide が書かれている ID は割り当て対象外
  if (skipCompleted) {
    const before = unassigned.length;
    unassigned = unassigned.filter((id) => !isCompleted(id));
    console.log(`⏭️  完了済み ${before - unassigned.length} 件は割り当てから除外`);
  }

  if (unassigned.length === 0 && !reassign) {
    console.log('✅ 全 ID が割り当て済みです（変更なし）');
    return;
  }

  // 未割り当て分を agent にラウンドロビン配分（シャッフル付き）
  const newSlice = distributeRoundRobin(unassigned, agents);
  Object.assign(newAssignments, newSlice);

  const output: AssignmentsFile = {
    createdAt: new Date().toISOString(),
    agents,
    assignments: newAssignments,
  };

  writeFileSync(ASSIGNMENTS_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`✅ ${ASSIGNMENTS_PATH} を更新しました`);

  // 集計表示
  const counts = new Map<string, number>();
  for (const agent of agents) counts.set(agent, 0);
  for (const agent of Object.values(newAssignments)) {
    counts.set(agent, (counts.get(agent) ?? 0) + 1);
  }

  console.log('');
  console.log('📊 担当配分:');
  for (const agent of agents) {
    const total = counts.get(agent) ?? 0;
    const completed = Object.entries(newAssignments).filter(
      ([id, a]) => a === agent && isCompleted(id),
    ).length;
    console.log(`  ${agent}: ${completed} / ${total} 完了`);
  }
  console.log('');
  console.log(`合計: ${Object.keys(newAssignments).length} 件 / ${agents.length} エージェント`);
}

main();
