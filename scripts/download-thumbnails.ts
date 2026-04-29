/**
 * 番組サムネイル画像（公式が配信している番組ロゴ）をダウンロードする。
 *
 * 公式の番組ロゴは以下の固定 URL パターンで直接配信されている:
 *   https://podcastexpo.jp/wp-content/themes/podcastexpo/images/booth/_thumbnail/{NUM}.jpeg
 *
 * - {NUM} は番組 ID の数字部分（3 桁ゼロパディング）
 * - HTTP 200 / image/jpeg で返る
 * - 番組ごとに異なる正方形ロゴ（既存の 006.jpeg 等と整合）
 *
 * 使い方:
 *   npm run download-thumbnails                 # data/booth-ids.json の全 ID
 *   npm run download-thumbnails -- pcwe-040     # 特定 ID
 *   npm run download-thumbnails -- --force      # 既存ファイルを上書き
 *   npm run download-thumbnails -- --interval 800   # リクエスト間隔（ms）
 *
 * 失敗時:
 *   - HTTP エラー / fetch 失敗 → スキップして data/thumbnail-failed.json に記録
 *   - 残りの ID は処理続行
 *   - フォールバック画像生成は別タスク（v1.6 Phase D 想定）
 *
 * 並列度・間隔:
 *   - 並列度 4、各リクエスト間 600ms ± 200ms jitter（公式サーバー負荷配慮）
 *   - 142 件で目安 1.5 分弱
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const THUMBNAIL_BASE_URL =
  'https://podcastexpo.jp/wp-content/themes/podcastexpo/images/booth/_thumbnail';
const BOOTH_IDS_PATH = join(process.cwd(), 'data/booth-ids.json');
const OUTPUT_DIR = join(process.cwd(), 'public/thumbnails');
const FAILED_PATH = join(process.cwd(), 'data/thumbnail-failed.json');

const DEFAULT_CONCURRENCY = 4;
const DEFAULT_INTERVAL_MS = 600;
const JITTER_MS = 200;

interface BoothIdsFile {
  ids: string[];
}

interface DownloadFailure {
  id: string;
  url: string;
  reason: string;
  attemptedAt: string;
}

interface DownloadResult {
  id: string;
  status: 'saved' | 'skipped' | 'failed';
  reason?: string;
  path?: string;
  url?: string;
}

const SUPPORTED_EXT = ['jpeg', 'jpg', 'png', 'webp'] as const;

function parseIntervalArg(args: string[]): number {
  const idx = args.findIndex((a) => a === '--interval');
  if (idx === -1 || args[idx + 1] === undefined) return DEFAULT_INTERVAL_MS;
  const ms = parseInt(args[idx + 1], 10);
  if (!Number.isFinite(ms) || ms < 0) {
    console.warn(
      `⚠️  --interval の値が不正です: ${args[idx + 1]} → ${DEFAULT_INTERVAL_MS}ms にフォールバック`,
    );
    return DEFAULT_INTERVAL_MS;
  }
  return ms;
}

function jitteredWait(baseMs: number): Promise<void> {
  const jitter = Math.floor((Math.random() * 2 - 1) * JITTER_MS);
  const ms = Math.max(0, baseMs + jitter);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBinary(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; pcwe2026-fansite/1.0; +https://pcwe2026-fansite.podmate.fm)',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function existingThumbnail(num: string): string | null {
  for (const ext of SUPPORTED_EXT) {
    const p = join(OUTPUT_DIR, `${num}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

async function processOne(
  id: string,
  options: { force: boolean },
): Promise<DownloadResult> {
  const num = id.replace(/^pcwe-/, '');
  const url = `${THUMBNAIL_BASE_URL}/${num}.jpeg`;

  if (!options.force) {
    const existingPath = existingThumbnail(num);
    if (existingPath !== null) {
      return { id, status: 'skipped', reason: '既存ファイルあり', path: existingPath };
    }
  }

  try {
    const buffer = await fetchBinary(url);
    const outPath = join(OUTPUT_DIR, `${num}.jpeg`);
    writeFileSync(outPath, buffer);
    return { id, status: 'saved', path: outPath, url };
  } catch (error) {
    return {
      id,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
      url,
    };
  }
}

/** 並列度 N で順次処理。1 件ごとに jittered wait を入れる */
async function runWithConcurrency<T>(
  ids: string[],
  worker: (id: string) => Promise<T>,
  concurrency: number,
  intervalMs: number,
  onProgress: (done: number, total: number, result: T) => void,
): Promise<T[]> {
  const results: T[] = [];
  let cursor = 0;

  async function next(): Promise<void> {
    while (cursor < ids.length) {
      const i = cursor++;
      const result = await worker(ids[i]);
      results.push(result);
      onProgress(results.length, ids.length, result);
      // 最終件は待たない（早く終わらせる）
      if (results.length < ids.length) {
        await jitteredWait(intervalMs);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, () => next()),
  );
  return results;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const intervalMs = parseIntervalArg(args);
  const explicitIds = args.filter((a) => /^pcwe-\d{3}$/.test(a));

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let ids: string[];
  if (explicitIds.length > 0) {
    ids = explicitIds;
  } else {
    if (!existsSync(BOOTH_IDS_PATH)) {
      console.error(
        `❌ ${BOOTH_IDS_PATH} が見つかりません。先に \`npm run list-booths\` を実行してください`,
      );
      process.exit(1);
    }
    const data = JSON.parse(readFileSync(BOOTH_IDS_PATH, 'utf-8')) as BoothIdsFile;
    ids = data.ids;
  }

  console.log(
    `📦 ${ids.length} 件のサムネイル取得を開始（並列度 ${DEFAULT_CONCURRENCY}、間隔 ${intervalMs}ms ± ${JITTER_MS}ms）`,
  );
  console.log(`📡 URL パターン: ${THUMBNAIL_BASE_URL}/{NUM}.jpeg`);
  console.log('');

  const results = await runWithConcurrency(
    ids,
    (id) => processOne(id, { force }),
    DEFAULT_CONCURRENCY,
    intervalMs,
    (done, total, result) => {
      const mark =
        result.status === 'saved' ? '✅' : result.status === 'skipped' ? '⏭️ ' : '❌';
      console.log(`  [${done}/${total}] ${mark} ${result.id}`);
    },
  );

  const saved = results.filter((r) => r.status === 'saved');
  const skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'failed');

  // 失敗リスト永続化
  if (failed.length > 0) {
    const failures: DownloadFailure[] = failed.map((r) => ({
      id: r.id,
      url: r.url ?? '',
      reason: r.reason ?? 'unknown',
      attemptedAt: new Date().toISOString(),
    }));
    writeFileSync(
      FAILED_PATH,
      JSON.stringify(
        { lastRunAt: new Date().toISOString(), count: failures.length, failures },
        null,
        2,
      ) + '\n',
      'utf-8',
    );
    console.log('');
    console.log(`📝 失敗 ${failed.length} 件を ${FAILED_PATH} に記録しました`);
    console.log('   失敗番組はフォールバック（プレースホルダー画像）で対応する想定です');
  }

  console.log('');
  console.log(`✅ 保存: ${saved.length} 件`);
  console.log(`⏭️  スキップ: ${skipped.length} 件（既存）`);
  if (failed.length > 0) {
    console.log(`❌ 失敗: ${failed.length} 件`);
    for (const r of failed) {
      console.log(`   - ${r.id}: ${r.reason ?? 'unknown'}`);
    }
  }
}

void main().catch((error) => {
  console.error('❌ サムネイル DL 処理が失敗しました', error);
  process.exit(1);
});
