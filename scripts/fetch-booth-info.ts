/**
 * PODCAST EXPO 2026 公式ブースページから番組情報を機械的に取得する。
 *
 * 使い方:
 *   npm run fetch:official -- pcwe-040 pcwe-006 pcwe-013
 *   npm run fetch:official -- --all              # data/sources/official/ 配下すべて再取得
 *   npm run fetch:official -- --from-list        # data/booth-ids.json の全 ID を取得（推奨）
 *   npm run fetch:official -- --from-list --skip-existing  # 既に official/ にある ID はスキップ
 *
 * 出力: data/sources/official/{id}.json
 *
 * パース対象（cheerio で抽出）:
 *   - 番組名（h1）
 *   - 番組概要（説明文の段落）
 *   - ホスト名
 *   - 出展物販
 *   - 出展日（土・日・両日）/ 時間 / エリア
 *   - 配信プラットフォーム（Spotify / Apple Podcasts / YouTube / LISTEN / Amazon Music）
 *   - SNS（X / Instagram）
 *   - 公式サイト
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { OfficialSourceSchema, type OfficialSource } from '../src/lib/sources';

const BASE_URL = 'https://podcastexpo.jp/booth';
const OUTPUT_DIR = join(process.cwd(), 'data/sources/official');
const BOOTH_IDS_PATH = join(process.cwd(), 'data/booth-ids.json');
const FAILED_PATH = join(process.cwd(), 'data/fetch-failed.json');

/**
 * 公式サーバーへの負荷配慮:
 *   - デフォルト 1500ms 間隔（前回 500ms から増量、人間操作の体感速度に近づける）
 *   - 加えて ±400ms の jitter を入れて完全等間隔リクエストに見えないようにする
 *   - --interval N（ms）で上書き可能
 */
const DEFAULT_INTERVAL_MS = 1500;
const JITTER_MS = 400;

interface BoothIdsFile {
  fetchedAt: string;
  source: string;
  count: number;
  ids: string[];
}

interface FetchFailure {
  id: string;
  reason: string;
  attemptedAt: string;
}

interface FetchFailedFile {
  lastRunAt: string;
  count: number;
  failures: FetchFailure[];
}

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

interface ParsedBoothInfo {
  name: string;
  shortName?: string;
  description: string;
  hosts?: string[];
  merchandise?: string[];
  exhibition: {
    days: ('sat' | 'sun')[];
    hours: string;
    area: 'free' | 'paid';
  };
  links: {
    spotify?: string;
    applePodcasts?: string;
    youtube?: string;
    listen?: string;
    amazonMusic?: string;
    x?: string;
    instagram?: string;
    website?: string;
  };
}

async function fetchBoothHtml(id: string): Promise<string> {
  const url = `${BASE_URL}/${id}/`;
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

function parseBoothHtml(html: string): ParsedBoothInfo {
  const $ = cheerio.load(html);

  // 番組名: 優先順位 og:title → twitter:title → <title>（"– PODCAST EXPO" を除去）→ h1
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
  const twTitle = $('meta[name="twitter:title"]').attr('content')?.trim();
  const docTitle = $('title')
    .text()
    .trim()
    .replace(/\s*[–\-—]\s*PODCAST EXPO.*$/i, '')
    .trim();
  const h1 = $('h1').first().text().trim();
  const name = ogTitle ?? twTitle ?? docTitle ?? h1 ?? '';

  // 番組概要: 優先順位
  //   1. .entry-detail / .entry-content（番組詳細エリア、<br> を \n に変換、SNS エリア除外）
  //   2. og:description / twitter:description（フォールバック、改行は元から無い）
  //   3. 段落から長文抽出（「【出店予定】」「【出店内容】」は物販リストなので除外）
  const isMerchandiseText = (text: string): boolean => /^[\s　]*【出店(予定|内容)】/.test(text);

  /**
   * cheerio 要素から description を抽出する。
   * - SNS リスト（ul.sns-area / ul）を除外
   * - <br> と <p> の末尾だけを改行として扱う（公式の意図した改行を保持）
   * - HTML ソース上のインデント由来の物理改行・タブ・連続空白はすべて半角空白 1 つに正規化
   *   （これをやらないと「br じゃない単なるソース改行」も保存されてしまい、
   *    whitespace-pre-line 表示で文章が異常な行間で表示される不具合になる）
   */
  const NEWLINE_MARKER = '';
  const extractDescriptionWithBreaks = (selector: string): string => {
    const $el = $(selector).first();
    if ($el.length === 0) return '';
    const $clone = $el.clone();
    // SNS リンクのリストを除外（番組固有の本文ではないため）
    $clone.find('ul.sns-area, ul').remove();
    // <br> をマーカー（U+0001）に置換
    $clone.find('br').each((_, br) => {
      $(br).replaceWith(NEWLINE_MARKER);
    });
    // <p> 末尾にもマーカーを追加（複数段落の境界を保持）
    $clone.find('p').each((_, p) => {
      $(p).append(NEWLINE_MARKER);
    });
    return $clone
      .text()
      // すべての whitespace（\n / \t / 半角・全角空白）を半角空白 1 つに正規化
      // （HTML ソース上のインデント由来の改行を「文章の改行」として誤認させない）
      .replace(/\s+/g, ' ')
      // マーカー前後の余分なスペースを巻き込んで実改行に変換
      .replace(/ ?+ ?/g, '\n')
      // 連続改行を 1 つに圧縮（段落間の余分な空行は不要）
      .replace(/\n+/g, '\n')
      .trim();
  };

  let description = '';
  for (const selector of ['.entry-detail', '.entry-content', '.booth-description', '.description']) {
    const text = extractDescriptionWithBreaks(selector);
    if (text.length > 30 && !isMerchandiseText(text)) {
      description = text;
      break;
    }
  }
  if (description === '') {
    const ogDesc = $('meta[property="og:description"]').attr('content')?.trim() ?? '';
    const twDesc = $('meta[name="twitter:description"]').attr('content')?.trim() ?? '';
    if (ogDesc.length > 0 && !isMerchandiseText(ogDesc)) description = ogDesc;
    else if (twDesc.length > 0 && !isMerchandiseText(twDesc)) description = twDesc;
  }
  if (description === '') {
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (description === '' && text.length > 30 && text.length < 1500 && !isMerchandiseText(text)) {
        description = text;
      }
    });
  }

  /*
   * 出展日 / 時間 / エリア
   * ⚠️ 重要: bodyText（ページ全体）から「5月9日」「5月10日」を正規表現で拾う旧方式は、
   * ヘッダー・フッターに両方の日付が含まれるため **全番組が両日判定** になる不具合があった。
   *
   * 実際のサーバー応答では、各ブースの実際の出展日が `<span class="the_day ...">` の
   * テキストとして次のいずれかで出力されている:
   *   - 「2DAYS」 → 両日
   *   - 「5/9 Sat」 → 土曜のみ
   *   - 「5/10 Sun」 → 日曜のみ
   * （`is-active` クラスはクライアントサイド JS で付与されるためサーバー応答には無い）
   */
  const days: ('sat' | 'sun')[] = [];
  $('.the_day').each((_, el) => {
    const t = $(el).text().trim();
    if (/2DAYS|両日|2日間/i.test(t)) {
      days.push('sat', 'sun');
    } else if (/Sat|5\/9|5月9日/.test(t)) {
      days.push('sat');
    } else if (/Sun|5\/10|5月10日/.test(t)) {
      days.push('sun');
    }
  });
  // 重複除去 + 並び順安定化（sat → sun）
  const uniqueDays = Array.from(new Set(days)).sort() as ('sat' | 'sun')[];

  // フォールバック: .the_day から取れなかった場合は最終手段で両日扱い + 警告
  if (uniqueDays.length === 0) {
    console.warn('  ⚠️ .the_day が取得できず、出展日判定不能。両日扱いにフォールバック');
    uniqueDays.push('sat', 'sun');
  }

  // 時間・エリアは body 全体テキストから（公式テンプレで共通記載されている前提）
  const bodyText = $('body').text();

  const hoursMatch = bodyText.match(/(\d{1,2}:\d{2})\s*[-〜~ー]\s*(\d{1,2}:\d{2})/);
  const hours = hoursMatch !== null ? `${hoursMatch[1]} - ${hoursMatch[2]}` : '10:00 - 18:00';

  const area: 'free' | 'paid' = /有料エリア|有料/.test(bodyText) ? 'paid' : 'free';

  // ホスト・物販（h2/h3 + ul or テーブルから抽出）
  const hosts: string[] = [];
  const merchandise: string[] = [];
  $('h2, h3, h4, dt, .label, strong').each((_, el) => {
    const label = $(el).text().trim();
    const next = $(el).next();
    if (/ホスト|出演|パーソナリティ/.test(label)) {
      const value = next.text().trim();
      if (value.length > 0 && value.length < 200) {
        hosts.push(...value.split(/[、,／\/・\n]+/).map((s) => s.trim()).filter((s) => s.length > 0));
      }
    }
    if (/物販|販売|出展物|グッズ/.test(label)) {
      const value = next.text().trim();
      if (value.length > 0 && value.length < 300) {
        merchandise.push(...value.split(/[、,／\/・\n]+/).map((s) => s.trim()).filter((s) => s.length > 0));
      }
    }
  });

  // PCWE2026 公式 SNS（番組固有でないので除外）
  const isOfficialPcweAccount = (url: string): boolean => {
    return /\b(podcast_expo|podcastexpo)\b/i.test(url);
  };

  // SNS / 配信プラットフォームのリンクを a[href] から抽出
  const links: ParsedBoothInfo['links'] = {};
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (/open\.spotify\.com\/show\//.test(href) && links.spotify === undefined) {
      links.spotify = href.split('?')[0];
    } else if (/podcasts\.apple\.com/.test(href) && links.applePodcasts === undefined) {
      links.applePodcasts = href;
    } else if (/youtube\.com|youtu\.be/.test(href) && links.youtube === undefined) {
      links.youtube = href;
    } else if (/listen\.style/.test(href) && links.listen === undefined) {
      links.listen = href;
    } else if (/music\.amazon/.test(href) && links.amazonMusic === undefined) {
      links.amazonMusic = href;
    } else if (
      /(?:^|\/\/)(twitter\.com|x\.com)\//i.test(href) &&
      links.x === undefined &&
      !/intent|share/.test(href) &&
      !isOfficialPcweAccount(href)
    ) {
      links.x = href.split('?')[0].replace(/twitter\.com/, 'x.com');
    } else if (
      /instagram\.com\//.test(href) &&
      links.instagram === undefined &&
      !/share/.test(href) &&
      !isOfficialPcweAccount(href)
    ) {
      links.instagram = href.split('?')[0];
    }
  });

  return {
    name,
    description,
    hosts: hosts.length > 0 ? hosts : undefined,
    merchandise: merchandise.length > 0 ? merchandise : undefined,
    exhibition: { days: uniqueDays, hours, area },
    links,
  };
}

function buildOfficialSource(id: string, parsed: ParsedBoothInfo, existing?: OfficialSource): OfficialSource {
  const boothNumber = id.replace('pcwe-', '');
  const fetchedAt = new Date().toISOString();

  return {
    id,
    name: parsed.name,
    shortName: existing?.shortName,
    thumbnail: existing?.thumbnail ?? `/thumbnails/${boothNumber}.jpeg`,
    boothUrl: `${BASE_URL}/${id}/`,
    fetchedAt,
    official: {
      description: parsed.description,
      hosts: parsed.hosts,
      merchandise: parsed.merchandise,
    },
    exhibition: {
      days: parsed.exhibition.days,
      hours: parsed.exhibition.hours,
      area: parsed.exhibition.area,
      boothNumber,
    },
    links: parsed.links,
  };
}

async function processOne(id: string): Promise<void> {
  console.log(`📡 ${id} を取得中...`);
  const html = await fetchBoothHtml(id);
  const parsed = parseBoothHtml(html);

  const outputPath = join(OUTPUT_DIR, `${id}.json`);
  let existing: OfficialSource | undefined;
  if (existsSync(outputPath)) {
    try {
      existing = OfficialSourceSchema.parse(JSON.parse(readFileSync(outputPath, 'utf-8')));
    } catch {
      // 旧形式は無視
    }
  }

  const source = buildOfficialSource(id, parsed, existing);
  const validated = OfficialSourceSchema.parse(source);

  writeFileSync(outputPath, JSON.stringify(validated, null, 2) + '\n', 'utf-8');
  console.log(`✅ ${id} 保存: ${parsed.name}`);
}

async function main(): Promise<void> {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const skipExisting = args.includes('--skip-existing');

  let ids: string[];
  if (args.includes('--from-list')) {
    if (!existsSync(BOOTH_IDS_PATH)) {
      console.error(
        `❌ ${BOOTH_IDS_PATH} が見つかりません。先に \`npm run list-booths\` を実行してください`,
      );
      process.exit(1);
    }
    const data = JSON.parse(readFileSync(BOOTH_IDS_PATH, 'utf-8')) as BoothIdsFile;
    ids = data.ids;
    console.log(`📋 booth-ids.json から ${ids.length} 件読み込みました`);
  } else if (args.includes('--all')) {
    ids = readdirSync(OUTPUT_DIR)
      .filter((f) => /^pcwe-\d{3}\.json$/.test(f))
      .map((f) => f.replace('.json', ''));
    if (ids.length === 0) {
      console.error('❌ --all を指定したが data/sources/official/ が空です。--from-list か個別 ID を指定してください');
      process.exit(1);
    }
  } else if (args.filter((arg) => /^pcwe-\d{3}$/.test(arg)).length === 0) {
    console.error('使い方:');
    console.error('  npm run fetch:official -- pcwe-040 pcwe-006 ...');
    console.error('  npm run fetch:official -- --all                       # official/ にある ID を再取得');
    console.error('  npm run fetch:official -- --from-list                 # booth-ids.json の全 ID');
    console.error('  npm run fetch:official -- --from-list --skip-existing # 未取得 ID のみ');
    console.error('  npm run fetch:official -- --from-list --interval 2500 # リクエスト間隔を 2.5 秒に');
    console.error('');
    console.error('失敗した ID は data/fetch-failed.json に記録されます。');
    process.exit(1);
  } else {
    ids = args.filter((arg) => /^pcwe-\d{3}$/.test(arg));
  }

  // skip-existing: 既に official/{id}.json がある ID を除外
  if (skipExisting) {
    const before = ids.length;
    ids = ids.filter((id) => !existsSync(join(OUTPUT_DIR, `${id}.json`)));
    console.log(`⏭️  既存 ${before - ids.length} 件をスキップ。残り ${ids.length} 件を取得します`);
  }

  if (ids.length === 0) {
    console.log('✅ 取得対象なし。すべて完了済みです');
    return;
  }

  const intervalMs = parseIntervalArg(args);
  console.log(
    `⏱️  リクエスト間隔: ${intervalMs}ms ± ${JITTER_MS}ms（公式サーバー負荷配慮）`,
  );
  console.log('');

  let successCount = 0;
  const failures: FetchFailure[] = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    console.log(`  [${i + 1}/${ids.length}] ${id}`);
    try {
      await processOne(id);
      successCount++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({
        id,
        reason,
        attemptedAt: new Date().toISOString(),
      });
      console.error(`❌ ${id} の取得失敗: ${reason}`);
    }

    // 最終件は待たない
    if (i < ids.length - 1) {
      await jitteredWait(intervalMs);
    }
  }

  // 失敗リストを永続化（次回 retry に使える）
  if (failures.length > 0) {
    const failedFile: FetchFailedFile = {
      lastRunAt: new Date().toISOString(),
      count: failures.length,
      failures,
    };
    writeFileSync(FAILED_PATH, JSON.stringify(failedFile, null, 2) + '\n', 'utf-8');
    console.log('');
    console.log(`📝 失敗 ${failures.length} 件を ${FAILED_PATH} に記録しました`);
    console.log('   リトライ: npm run fetch:official -- $(jq -r \'.failures[].id\' data/fetch-failed.json | tr "\\n" " ")');
  }

  console.log('');
  console.log(`✅ 成功: ${successCount} 件`);
  if (failures.length > 0) console.log(`❌ 失敗: ${failures.length} 件`);
}

void main();
