/**
 * 番組ごとの「ブース位置プレビュー画像」を量産するスクリプト。
 *
 * 番組詳細ページの BoothPositionPreview セクションに表示されている SVG を
 * Puppeteer 経由でスクショ取得し、PNG として保存する。
 * リスナーへの SNS 投稿（出展者本人のお品書き告知など）にそのまま使える
 * 「サムネ + ここ！吹き出し入りのブース案内画像」を 1 番組分ずつ生成する。
 *
 * 前提:
 *   - ローカル dev サーバーが http://localhost:3015 で起動済み
 *     ターミナル A: npm run dev
 *     ターミナル B: npx tsx scripts/generate-booth-position-image.ts pcwe-098
 *
 * 使い方:
 *   npx tsx scripts/generate-booth-position-image.ts pcwe-098                 # 単発
 *   npx tsx scripts/generate-booth-position-image.ts pcwe-001 pcwe-002 ...    # 複数
 *   npx tsx scripts/generate-booth-position-image.ts --all                    # 全番組
 *
 * 出力: public/booth-position-images/{label}.png
 *   例: 25-D.png（pcwe-098 KNOWフードラジオ、5/10 日のみ）
 *   例: 11-A.png + 14-B.png（両日異位置の番組は 2 ファイル）
 *   例: 11-A_sat.png + 11-A_sun.png（両日同位置だが片日だけ画像化したい場合は将来対応）
 *
 * 仕組み:
 *   - puppeteer-core でシステム Chrome（macOS の /Applications/Google Chrome.app）を起動
 *   - viewport 1200x1200, deviceScaleFactor 2 で高解像度レンダリング
 *   - figure[data-booth-preview-day="..."] svg をセレクタで特定して element.screenshot
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CHROME_PATH =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEV_BASE = process.env.PCWE_DEV_BASE ?? 'http://localhost:3015';
const OUTPUT_DIR = 'public/booth-position-images';
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 1400;
const SCALE = 2;
const FONT_RENDER_WAIT_MS = 1200;

interface ProgramExhibition {
  days: ('sat' | 'sun')[];
  position?: { label: string };
  positionBySatSun?: {
    sat?: { label: string };
    sun?: { label: string };
  };
}

interface Program {
  id: string;
  name: string;
  exhibition: ProgramExhibition;
}

interface PositionTarget {
  label: string;
  day: 'sat' | 'sun';
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const ids = args.filter((a) => a.startsWith('pcwe-'));

  const programsData = JSON.parse(
    readFileSync('data/programs.json', 'utf-8'),
  ) as { programs: Program[] };
  const allPrograms = programsData.programs;

  let targets: Program[];
  if (all) {
    targets = allPrograms.filter(hasPosition);
  } else if (ids.length > 0) {
    targets = ids
      .map((id) => allPrograms.find((p) => p.id === id))
      .filter((p): p is Program => p !== undefined);
  } else {
    console.error(
      '使い方: tsx scripts/generate-booth-position-image.ts pcwe-098 [pcwe-XXX...]',
    );
    console.error('       tsx scripts/generate-booth-position-image.ts --all');
    process.exit(1);
  }

  if (targets.length === 0) {
    console.error('対象番組が見つかりません');
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`📸 ${targets.length} 番組分を処理します`);
  console.log(`   dev サーバー: ${DEV_BASE}`);
  console.log(`   出力先: ${OUTPUT_DIR}/`);
  console.log('');

  // dev サーバー起動確認
  try {
    const res = await fetch(`${DEV_BASE}/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    console.error(
      `❌ dev サーバーに接続できません（${DEV_BASE}）。先に \`npm run dev\` を起動してください。`,
    );
    console.error(`   詳細: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  console.log('✓ Chromium 起動');

  let okCount = 0;
  let errCount = 0;

  for (const program of targets) {
    const positions = collectPositions(program);
    if (positions.length === 0) {
      console.warn(`  ⚠️ ${program.id}: 位置情報なし、スキップ`);
      continue;
    }

    const page = await browser.newPage();
    await page.setViewport({
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: SCALE,
    });

    try {
      const url = `${DEV_BASE}/booth/${program.id}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[data-booth-preview-day]', { timeout: 10000 });

      // フォントレンダリング待ち（重要: 明朝→sans-serif の切替が反映されるまで）
      await new Promise((r) => setTimeout(r, FONT_RENDER_WAIT_MS));

      for (const { label, day } of positions) {
        const selector = `figure[data-booth-preview-day="${day}"][data-booth-preview-position="${label}"] svg`;
        const element = await page.$(selector);
        if (!element) {
          console.error(`  ✗ ${program.id} ${day} ${label}: SVG 要素が見つからない`);
          errCount++;
          continue;
        }

        const filename = `${label}.png`;
        const outputPath = join(OUTPUT_DIR, filename);
        await element.screenshot({ path: outputPath, omitBackground: false });
        console.log(`  ✓ ${program.id} (${program.name}) → ${filename}`);
        okCount++;
      }
    } catch (e) {
      console.error(
        `  ✗ ${program.id}: ${e instanceof Error ? e.message : e}`,
      );
      errCount++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('');
  console.log(`✅ 完了: ${okCount} 件成功 / ${errCount} 件エラー`);
  if (errCount > 0) {
    process.exit(1);
  }
}

function collectPositions(program: Program): PositionTarget[] {
  const ex = program.exhibition;
  const ret: PositionTarget[] = [];
  if (ex.position) {
    const day = ex.days[0]!;
    ret.push({ label: ex.position.label, day });
  } else if (ex.positionBySatSun) {
    const sat = ex.positionBySatSun.sat;
    const sun = ex.positionBySatSun.sun;
    if (sat && sun && sat.label !== sun.label) {
      ret.push({ label: sat.label, day: 'sat' });
      ret.push({ label: sun.label, day: 'sun' });
    } else if (sat) {
      ret.push({ label: sat.label, day: 'sat' });
    } else if (sun) {
      ret.push({ label: sun.label, day: 'sun' });
    }
  }
  return ret;
}

function hasPosition(p: Program): boolean {
  const ex = p.exhibition;
  return Boolean(
    ex.position || ex.positionBySatSun?.sat || ex.positionBySatSun?.sun,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
