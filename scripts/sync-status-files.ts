/**
 * Listen 一括精査などで done 化した番組（merchandiseDetails あり）を、
 * 旧ステータスファイル（needs-review.md / monitoring.md / not-found.md）から
 * 自動的に削除する整合性同期スクリプト。
 *
 * 実行: `npm run sync:status-files`
 *
 * 設計:
 * - data/programs.json を真とし、merchandiseDetails が 1 件以上ある番組を
 *   done と判定する
 * - 各 status MD に done 番組の行が残っていれば削除する
 * - 冪等: 何度実行しても結果は同じ
 *
 * 用途:
 * - apply-listen-research.ts などで done 化した直後のクリーンアップ
 * - 手動で merchandiseDetails を追記したあとの整合性確保
 *
 * 詳細: docs/plans/v1-merchandise-rollout/runbook.md 参照
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PROGRAMS_PATH = join(ROOT, 'data/programs.json');

const STATUS_FILES = [
  'docs/plans/v1-merchandise-rollout/needs-review.md',
  'docs/plans/v1-merchandise-rollout/monitoring.md',
  'docs/plans/v1-merchandise-rollout/not-found.md',
];

interface ProgramsData {
  programs: Array<{
    id: string;
    official?: { merchandiseDetails?: unknown[] };
  }>;
}

function loadDoneIds(): Set<string> {
  const data = JSON.parse(readFileSync(PROGRAMS_PATH, 'utf8')) as ProgramsData;
  const ids = new Set<string>();
  for (const p of data.programs) {
    const md = p.official?.merchandiseDetails;
    if (md !== undefined && Array.isArray(md) && md.length > 0) {
      ids.add(p.id);
    }
  }
  return ids;
}

function cleanFile(path: string, doneIds: Set<string>): number {
  const fullPath = join(ROOT, path);
  const text = readFileSync(fullPath, 'utf8');
  const lines = text.split('\n');
  const out: string[] = [];
  let removed = 0;
  // 表行のパターン: `| pcwe-XXX | ... |`
  const re = /^\|\s*(pcwe-\d{3})\s*\|/;
  for (const line of lines) {
    const m = re.exec(line);
    if (m !== null && doneIds.has(m[1])) {
      removed += 1;
      continue;
    }
    out.push(line);
  }
  if (removed > 0) {
    writeFileSync(fullPath, out.join('\n'));
  }
  return removed;
}

function main(): void {
  console.log('🧹 ステータスファイル整合性チェック...');
  const doneIds = loadDoneIds();
  console.log(`   data/programs.json で done = ${doneIds.size} 件`);
  console.log('');

  let totalRemoved = 0;
  for (const path of STATUS_FILES) {
    const removed = cleanFile(path, doneIds);
    console.log(`   ${path}: ${removed} 行削除`);
    totalRemoved += removed;
  }
  console.log('');

  if (totalRemoved === 0) {
    console.log('✅ 既に整合性 OK（削除する行なし）');
  } else {
    console.log(`✅ ${totalRemoved} 行削除完了。\`npm run progress:merchandise\` で集計を更新してください。`);
  }
}

main();
