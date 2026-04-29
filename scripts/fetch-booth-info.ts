/**
 * PODCAST EXPO 2026 公式ブースページから番組情報を機械的に取得する。
 *
 * 使い方:
 *   npm run fetch:official -- pcwe-040 pcwe-006 pcwe-013
 *   npm run fetch:official -- --all                # data/sources/official/ 配下すべて再取得
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
  //   1. .entry-detail / .entry-content（番組詳細エリア）
  //   2. og:description / twitter:description
  //   3. 段落から長文抽出（「【出店予定】」「【出店内容】」は物販リストなので除外）
  const isMerchandiseText = (text: string): boolean => /^[\s　]*【出店(予定|内容)】/.test(text);

  let description = '';
  for (const selector of ['.entry-detail', '.entry-content', '.booth-description', '.description']) {
    const text = $(selector).first().text().trim();
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

  // 出展日 / 時間 / エリア
  const bodyText = $('body').text();
  const days: ('sat' | 'sun')[] = [];
  if (/5月9日|5\/9|5月9日（土）|土曜/.test(bodyText)) days.push('sat');
  if (/5月10日|5\/10|5月10日（日）|日曜/.test(bodyText)) days.push('sun');
  if (days.length === 0 && /両日|2日間/.test(bodyText)) {
    days.push('sat', 'sun');
  }

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
    exhibition: { days, hours, area },
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
  let ids: string[];
  if (args.includes('--all')) {
    ids = readdirSync(OUTPUT_DIR)
      .filter((f) => /^pcwe-\d{3}\.json$/.test(f))
      .map((f) => f.replace('.json', ''));
    if (ids.length === 0) {
      console.error('❌ --all を指定したが data/sources/official/ が空です。番組 ID を引数で指定してください');
      process.exit(1);
    }
  } else if (args.length === 0) {
    console.error('使い方: npm run fetch:official -- pcwe-040 pcwe-006 ...');
    console.error('       npm run fetch:official -- --all');
    process.exit(1);
  } else {
    ids = args.filter((arg) => /^pcwe-\d{3}$/.test(arg));
  }

  for (const id of ids) {
    try {
      await processOne(id);
      // 公式サーバーへの負荷軽減: 1 件ごとに 500ms 待機
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ ${id} の取得失敗`, error);
    }
  }

  console.log(`✅ ${ids.length} 件処理完了`);
}

void main();
