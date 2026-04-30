/**
 * 並列 AI が data/sources/fan-guide-wip/ に書いた下書きを、レビュー後に
 * data/sources/fan-guide/ へ統合する。
 *
 * 使い方:
 *   npm run merge-fan-guide                       # wip にある全件を検証して統合
 *   npm run merge-fan-guide -- pcwe-040           # 指定 ID のみ
 *   npm run merge-fan-guide -- --dry-run          # 検証だけ実行（移動はしない）
 *   npm run merge-fan-guide -- --keep-wip         # 統合後も wip ファイルを残す
 *   npm run merge-fan-guide -- --no-overwrite     # fan-guide 側に既に同 ID があれば skip
 *
 * 実行内容:
 *   1. wip ファイルを読み込み
 *   2. FanGuideSourceSchema (zod) で検証
 *   3. 検証 NG なら fan-guide/ には移さず、エラー表示してその ID は skip
 *   4. 検証 OK なら fan-guide/{id}.json に書き込み
 *   5. デフォルトでは wip ファイルを削除（--keep-wip で保持）
 *   6. 全 wip 処理後、まとめてサマリ表示
 *
 * 想定運用:
 *   - 並列 AI（agent-01〜agent-07）が wip に書く
 *   - コエノマ（人間）が wip の内容を目視確認 → 問題なければこのスクリプトで統合
 *   - 不適切な wip はコエノマが手で修正してから統合（or wip を rm して未対応に戻す）
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { FanGuideSourceSchema } from '../src/lib/sources';

const ROOT = process.cwd();
const FAN_GUIDE_DIR = join(ROOT, 'data/sources/fan-guide');
const WIP_DIR = join(ROOT, 'data/sources/fan-guide-wip');

interface MergeOptions {
  dryRun: boolean;
  keepWip: boolean;
  noOverwrite: boolean;
}

interface MergeResult {
  id: string;
  status: 'merged' | 'skipped' | 'failed';
  reason?: string;
}

function listWipIds(): string[] {
  if (!existsSync(WIP_DIR)) return [];
  return readdirSync(WIP_DIR)
    .filter((f) => /^pcwe-\d{3}\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

function processOne(id: string, options: MergeOptions): MergeResult {
  const wipPath = join(WIP_DIR, `${id}.json`);
  const finalPath = join(FAN_GUIDE_DIR, `${id}.json`);

  if (!existsSync(wipPath)) {
    return { id, status: 'failed', reason: `wip ファイルが存在しない: ${wipPath}` };
  }

  // パース
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(wipPath, 'utf-8'));
  } catch (error) {
    return {
      id,
      status: 'failed',
      reason: `JSON パース失敗: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // zod 検証（FanGuideSourceSchema = id + fanGuide）
  const parsed = FanGuideSourceSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
      .join(' / ');
    return { id, status: 'failed', reason: `スキーマ検証 NG: ${issues}` };
  }

  // ID 整合性
  if (parsed.data.id !== id) {
    return {
      id,
      status: 'failed',
      reason: `id フィールド (${parsed.data.id}) がファイル名 (${id}) と一致しない`,
    };
  }

  // fan-guide に既存ファイルがある場合
  if (existsSync(finalPath) && options.noOverwrite) {
    return {
      id,
      status: 'skipped',
      reason: '既存 fan-guide あり (--no-overwrite)',
    };
  }

  if (options.dryRun) {
    return { id, status: 'merged', reason: '(dry-run) 検証 OK、統合スキップ' };
  }

  // 書き込み
  if (!existsSync(FAN_GUIDE_DIR)) mkdirSync(FAN_GUIDE_DIR, { recursive: true });
  writeFileSync(
    finalPath,
    JSON.stringify(parsed.data, null, 2) + '\n',
    'utf-8',
  );

  // wip 削除
  if (!options.keepWip) {
    unlinkSync(wipPath);
  }

  return { id, status: 'merged' };
}

function main(): void {
  const args = process.argv.slice(2);
  const options: MergeOptions = {
    dryRun: args.includes('--dry-run'),
    keepWip: args.includes('--keep-wip'),
    noOverwrite: args.includes('--no-overwrite'),
  };

  const explicitIds = args.filter((a) => /^pcwe-\d{3}$/.test(a));
  const ids = explicitIds.length > 0 ? explicitIds : listWipIds();

  if (ids.length === 0) {
    console.log('ℹ️  wip にも引数にも対象 ID がありません');
    console.log(`   wip 探索先: ${WIP_DIR}`);
    return;
  }

  console.log(
    `🔀 ${ids.length} 件を処理${options.dryRun ? '（dry-run、移動しません）' : ''}`,
  );
  console.log('');

  const results = ids.map((id) => processOne(id, options));

  const merged = results.filter((r) => r.status === 'merged');
  const skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'failed');

  for (const r of results) {
    const mark =
      r.status === 'merged' ? '✅' : r.status === 'skipped' ? '⏭️ ' : '❌';
    console.log(`  ${mark} ${r.id}${r.reason !== undefined ? ` — ${r.reason}` : ''}`);
  }

  console.log('');
  console.log(`✅ 統合: ${merged.length} 件`);
  if (skipped.length > 0) console.log(`⏭️  スキップ: ${skipped.length} 件`);
  if (failed.length > 0) {
    console.log(`❌ 失敗: ${failed.length} 件`);
    console.log('   不適切な wip は手で修正してから再実行するか、rm で未対応に戻してください');
  }

  // 失敗があれば exit code 1（CI 連携用）
  if (failed.length > 0) process.exit(1);
}

main();
