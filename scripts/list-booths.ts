/**
 * PCWE2026 公式の出展者一覧から、出展番組 ID（pcwe-XXX）を機械的に抽出する。
 *
 * 使い方:
 *   npm run list-booths           # 一覧取得 → data/booth-ids.json に保存
 *   npm run list-booths -- --print  # 取得結果を標準出力にも出す
 *
 * 出力: data/booth-ids.json
 *   {
 *     "fetchedAt": "2026-04-29T...",
 *     "source": "https://podcastexpo.jp/booth/",
 *     "count": 142,
 *     "ids": ["pcwe-001", "pcwe-002", ...]
 *   }
 *
 * 注意:
 *   - PCWE2026 は 144 番組と謳われているが、欠番（pcwe-009 等）があり実数は 142 程度
 *   - ID 抽出パターン: /booth/pcwe-XXX/ のリンク
 *   - 公式サーバー負荷軽減のため、ページは 1 回しか取得しない
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BOOTH_LIST_URL = 'https://podcastexpo.jp/booth/';
const TOP_URL = 'https://podcastexpo.jp/';
const OUTPUT_PATH = join(process.cwd(), 'data/booth-ids.json');

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; pcwe2026-fansite/1.0; +https://pcwe2026-fansite.podmate.fm)',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function extractIds(html: string): string[] {
  // 1 ページ内に `/booth/pcwe-XXX/` の形でリンクが入っている前提で正規表現抽出
  const matches = html.match(/\/booth\/pcwe-\d{3}\//g) ?? [];
  const ids = new Set<string>();
  for (const m of matches) {
    const id = m.replace(/^\/booth\//, '').replace(/\/$/, '');
    ids.add(id);
  }
  return Array.from(ids).sort();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldPrint = args.includes('--print');

  console.log('📡 PCWE 出展者一覧を取得中...');

  // booth トップ（一番網羅的）→ それでも足りなければサイトトップも合算
  const boothHtml = await fetchHtml(BOOTH_LIST_URL);
  const boothIds = extractIds(boothHtml);

  let ids = boothIds;
  if (boothIds.length < 100) {
    console.log(
      `⚠️ /booth/ から ${boothIds.length} 件しか取れなかったため、トップページもフォールバック取得します`,
    );
    const topHtml = await fetchHtml(TOP_URL);
    const topIds = extractIds(topHtml);
    ids = Array.from(new Set([...boothIds, ...topIds])).sort();
  }

  if (ids.length === 0) {
    console.error('❌ 番組 ID を 1 件も抽出できませんでした。HTML 構造が変わった可能性があります');
    process.exit(1);
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source: BOOTH_LIST_URL,
    count: ids.length,
    ids,
  };

  if (!existsSync(dirname(OUTPUT_PATH))) {
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');

  console.log(`✅ ${ids.length} 件の番組 ID を ${OUTPUT_PATH} に保存しました`);
  if (shouldPrint) {
    console.log(ids.join('\n'));
  }
}

void main().catch((error) => {
  console.error('❌ 番組 ID 一覧の取得に失敗しました', error);
  process.exit(1);
});
