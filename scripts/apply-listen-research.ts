/**
 * Listen.style 一括精査の生データ
 * （docs/plans/v1-merchandise-rollout/listen-research/pcwe-listen-result-*.json）
 * を読み込み、`data/sources/official/pcwe-XXX.json` に反映するスクリプト。
 *
 * 反映内容:
 * - `listenUrl` があれば `links.listen` に追加（既存値は上書きしない）
 * - `status === 'found'` かつ `merchandiseDetails` がまだない番組について、
 *   subagent の `candidates` から `merchandiseDetails` を生成
 *
 * 実行: `npm run apply:listen-research`
 *
 * 設計:
 * - 冪等: 既に done 化済み番組や既存 `links.listen` を持つ番組はスキップ
 * - SKIP_DONE: ファクトチェック未確認の番組（例: pcwe-092 の 5/19 齟齬）は
 *   done 化対象外。listenUrl のみ反映する。
 * - 出力は dry-run / apply で確認可能（環境変数 `DRY_RUN=1` で試運転）
 *
 * 詳細: docs/plans/v1-merchandise-rollout/listen-research/README.md 参照
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RESEARCH_DIR = join(
  ROOT,
  'docs/plans/v1-merchandise-rollout/listen-research',
);
const SOURCES_DIR = join(ROOT, 'data/sources/official');

/** ファクトチェック未確認のため done 化スキップする番組 ID */
const SKIP_DONE = new Set<string>(['pcwe-092']);

/** dry-run（書き込みせずに集計だけ表示） */
const DRY_RUN = process.env.DRY_RUN === '1';

interface Candidate {
  url: string;
  episodeTitle?: string;
  merchInfo?: string;
  publishedYear?: string;
}

interface ResearchResult {
  id: string;
  name?: string;
  status: 'found' | 'not-found';
  listenUrl?: string | null;
  candidates?: Candidate[];
  note?: string;
}

interface ResearchFile {
  batch: number;
  results: ResearchResult[];
}

function loadAllResults(): Map<string, ResearchResult> {
  const files = readdirSync(RESEARCH_DIR).filter(
    (f) => f.startsWith('pcwe-listen-result-') && f.endsWith('.json'),
  );
  const map = new Map<string, ResearchResult>();
  for (const file of files) {
    const json = JSON.parse(
      readFileSync(join(RESEARCH_DIR, file), 'utf8'),
    ) as ResearchFile;
    for (const r of json.results) {
      // 同じ ID が複数 batch で重複した場合、後勝ち（実際には被らない設計）
      map.set(r.id, r);
    }
  }
  return map;
}

interface Stats {
  listenAdded: number;
  doneAdded: number;
  skippedFactCheck: number;
  skippedExistingMerch: number;
  skippedExistingListen: number;
}

function applyToProgram(
  pid: string,
  result: ResearchResult,
  stats: Stats,
): void {
  const path = join(SOURCES_DIR, `${pid}.json`);
  if (!existsSync(path)) return;

  const program = JSON.parse(readFileSync(path, 'utf8')) as {
    links?: Record<string, string>;
    official?: { merchandiseDetails?: unknown[] };
  };
  let modified = false;

  // 1. listenUrl 反映
  if (result.listenUrl !== null && result.listenUrl !== undefined) {
    program.links ??= {};
    if (program.links.listen === undefined) {
      program.links.listen = result.listenUrl;
      stats.listenAdded += 1;
      modified = true;
    } else {
      stats.skippedExistingListen += 1;
    }
  }

  // 2. found なら merchandiseDetails 追加（条件: 既存 details なし、SKIP_DONE 外）
  if (result.status === 'found' && result.candidates && result.candidates.length > 0) {
    if (SKIP_DONE.has(pid)) {
      stats.skippedFactCheck += 1;
    } else if (program.official?.merchandiseDetails !== undefined) {
      stats.skippedExistingMerch += 1;
    } else {
      const details: Record<string, string>[] = [];
      for (const c of result.candidates) {
        if (c.merchInfo === undefined || c.url === undefined) continue;
        const epTitle = (c.episodeTitle ?? '').trim();
        const name = epTitle.length > 0
          ? `PCWE2026 出展告知（${epTitle.slice(0, 30)}）`
          : 'PCWE2026 出展告知';
        const description = c.merchInfo.trim().slice(0, 500);
        details.push({
          name,
          description,
          sourceUrl: c.url,
          sourceType: 'web',
        });
      }
      if (details.length > 0) {
        program.official ??= {};
        (program.official as Record<string, unknown>).merchandiseDetails = details;
        stats.doneAdded += 1;
        modified = true;
      }
    }
  }

  if (modified && !DRY_RUN) {
    writeFileSync(path, JSON.stringify(program, null, 2) + '\n');
  }
}

function main(): void {
  console.log(
    `🔢 Listen 探索結果を反映中${DRY_RUN ? '（dry-run、書き込みなし）' : ''}...`,
  );

  const results = loadAllResults();
  console.log(`   読み込んだ番組数: ${results.size}`);

  const stats: Stats = {
    listenAdded: 0,
    doneAdded: 0,
    skippedFactCheck: 0,
    skippedExistingMerch: 0,
    skippedExistingListen: 0,
  };

  for (const [pid, result] of results) {
    applyToProgram(pid, result, stats);
  }

  console.log('');
  console.log('📊 反映結果:');
  console.log(`   listen URL 追加: ${stats.listenAdded} 件`);
  console.log(`   done 化（merchandiseDetails 新規追加）: ${stats.doneAdded} 件`);
  console.log(`   ファクトチェック未確認でスキップ: ${stats.skippedFactCheck} 件`);
  console.log(`   既に merchandiseDetails あり（スキップ）: ${stats.skippedExistingMerch} 件`);
  console.log(`   既に links.listen あり（スキップ）: ${stats.skippedExistingListen} 件`);

  if (DRY_RUN) {
    console.log('');
    console.log('💡 実際に反映するには: `npm run apply:listen-research`');
  }
}

main();
