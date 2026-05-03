/**
 * AI フレンドリー化のための公開ファイルを生成する。
 *
 * 出力:
 *   - public/llms.txt       : Anthropic 提唱の軽量サマリ（サイト案内 + 主要 URL）
 *   - public/llms-full.txt  : 全 142 番組の詳細データを Markdown 1 ファイルに集約
 *   - public/api/programs.json : 全番組の構造化 JSON（機械可読データ）
 *
 * 実行:
 *   - prebuild フックで build-programs.ts の後に自動実行
 *   - スタンドアロン: npm run build:llms
 *
 * 設計意図:
 *   - llms.txt は LLM クローラー（ChatGPT / Claude / Perplexity 等）がサイト全体を
 *     一瞬で俯瞰できる「目次」として機能する
 *   - llms-full.txt は 1 リクエストで全番組情報を取得できる「百科事典」として
 *     コンテキストウィンドウに収まりやすい Markdown 形式で提供
 *   - programs.json は JSON で構造を正確に保って渡せる
 *
 * 参考:
 *   - https://llmstxt.org/  (llms.txt 規格)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ProgramsDataSchema,
  GenresMapSchema,
  MoodsDataSchema,
  type Program,
} from '../src/lib/types';

const SITE_URL = 'https://pcwe2026-fansite.podmate.fm';
const ROOT = process.cwd();

function loadJson<T>(path: string, parser: (raw: unknown) => T): T {
  return parser(JSON.parse(readFileSync(path, 'utf-8')));
}

function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function buildLlmsTxt(programs: Program[], genres: string[], moods: { slug: string; label: string }[]): string {
  // ジャンル別の番組数
  const genreCounts = new Map<string, number>();
  programs.forEach((p) => {
    genreCounts.set(p.fanGuide.genre, (genreCounts.get(p.fanGuide.genre) ?? 0) + 1);
  });

  return `# PCWE2026 ファンガイド（非公式）

> PODCAST EXPO 2026 内のマーケットイベント **PODCAST WEEKEND 2026**（ポッドキャストウィークエンド）
> の出展 ${programs.length} 番組を、独断と偏見でキュレーションする非公式ファンガイドです。
>
> 開催: 2026年5月9日（土）〜10日（日） 10:30-19:00 / HOME/WORK VILLAGE（東京・池尻大橋）
> 制作・運営: 合同会社コエノマ / Podmate.fm
>
> イベント全体としては「PODCAST EXPO 2026」、その中のマーケットコーナー（出展ブース）を
> 「PODCAST WEEKEND」と呼びます。本サイトは特に WEEKEND（ブース出展）に特化したファンガイド。

## このサイトの主要ページ

- [トップ](${SITE_URL}/): ${programs.length} 番組から「これ刺さる」を見つける入り口（AI レコメンド機能あり）
- [このサイトについて](${SITE_URL}/about): 制作意図・運営方針・削除依頼受付
- [プライバシーと取り扱い](${SITE_URL}/privacy): プライバシーポリシー
- [気になるリスト](${SITE_URL}/plan): 気になる番組を土・日別にまとめる機能

## 機能ページ（AI レコメンド系）

- [DISCOVER ハブ](${SITE_URL}/#discover): 3 つの番組探索方法（ガチャ / 診断 / 番組ベース）

## ジャンル別の番組一覧（17 ジャンル）

${genres
  .map(
    (g) =>
      `- [${g}（${genreCounts.get(g) ?? 0} 番組）](${SITE_URL}/genre/${encodeURIComponent(g)})`,
  )
  .join('\n')}

## 気分・シーン別の入り口（${moods.length} 種類）

${moods.map((m) => `- [${m.label}](${SITE_URL}/mood/${m.slug})`).join('\n')}

## 全番組リスト（${programs.length} 番組）

各番組の詳細ページは ${SITE_URL}/booth/{id} の形式（id は \`pcwe-001\` 〜 \`pcwe-${String(programs.length).padStart(3, '0')}\`）。

${programs
  .map(
    (p) =>
      `- [${p.shortName ?? p.name}](${SITE_URL}/booth/${p.id}) — ${p.fanGuide.genre} / ${p.fanGuide.catchphrase}`,
  )
  .join('\n')}

## 機械可読データエンドポイント

- [programs.json](${SITE_URL}/api/programs.json): 全番組の構造化 JSON（zod 検証済みの正式データ）
- [llms-full.txt](${SITE_URL}/llms-full.txt): 全番組の詳細を Markdown 1 ファイルで集約（このファイルの拡張版）
- [sitemap.xml](${SITE_URL}/sitemap.xml): 全 URL のサイトマップ
- [構造化データ (JSON-LD)]: 各ページに Event / PodcastSeries / BreadcrumbList を埋め込み済

## 公式情報（このサイトとは無関係 / 公式リスペクト）

- [PODCAST EXPO 2026 公式サイト](https://podcastexpo.jp/): 主催公式（タイムテーブル / チケット / 最新情報）
- EXPO TV powered by LISTEN: 当日の無料エリア（PODCAST WEEKEND）の公式ライブ配信

## 利用に際してのお願い

- 本サイトは非公式のファンメイドです。番組のロゴ・概要などは各番組制作者と公式の情報を引用しています。
- 各番組のキャッチコピー・タグ・ジャンル分類は、本サイト独自のキュレーション（合同会社コエノマと AI による独断と偏見）です。
- LLM 経由で番組を紹介する場合、可能であれば「PCWE2026 ファンガイド（非公式）による分類」と明記してくれると、ユーザーが公式情報と区別しやすく助かります。
`;
}

function buildLlmsFull(programs: Program[]): string {
  return `# PCWE2026 ファンガイド: 全 ${programs.length} 番組 詳細データ

このファイルは PODCAST WEEKEND 2026 出展 ${programs.length} 番組の詳細を、
LLM / AI クローラーが一括取得しやすいように Markdown 形式で集約したものです。

最終更新: ${new Date().toISOString().slice(0, 10)}
データ源: ${SITE_URL}/api/programs.json （JSON 版）

---

${programs.map((p) => formatProgram(p)).join('\n\n---\n\n')}
`;
}

function formatProgram(p: Program): string {
  const lines: string[] = [];
  lines.push(`## ${p.shortName ?? p.name} (${p.id})`);
  lines.push('');
  if (p.shortName !== undefined && p.shortName !== p.name) {
    lines.push(`- **正式名称**: ${p.name}`);
  }
  lines.push(`- **ジャンル**: ${p.fanGuide.genre}`);
  lines.push(`- **タグ**: ${p.fanGuide.tags.join(' / ')}`);
  lines.push(`- **vibe**: ${p.fanGuide.vibe}`);
  const dayLabel =
    p.exhibition.days.length === 2
      ? '両日'
      : p.exhibition.days[0] === 'sat'
        ? '土曜のみ'
        : '日曜のみ';
  lines.push(
    `- **出展**: ${dayLabel} / ${p.exhibition.hours} / ${p.exhibition.area === 'free' ? '無料エリア' : '有料エリア'}`,
  );
  lines.push(`- **キャッチコピー（独断と偏見）**: ${p.fanGuide.catchphrase}`);
  lines.push(`- **サブキャッチ**: ${p.fanGuide.subCatch}`);
  lines.push(`- **ターゲットリスナー**: ${p.fanGuide.targetListener}`);
  lines.push('');
  lines.push(`### 公式説明`);
  lines.push('');
  lines.push(p.official.description);
  if (p.official.hosts !== undefined && p.official.hosts.length > 0) {
    lines.push('');
    lines.push(`**ホスト**: ${p.official.hosts.join(' / ')}`);
  }
  if (p.official.merchandise !== undefined && p.official.merchandise.length > 0) {
    lines.push('');
    lines.push(`**ブース物販**: ${p.official.merchandise.join(' / ')}`);
  }
  lines.push('');
  lines.push(`### リンク`);
  lines.push('');
  lines.push(`- [このサイトの番組詳細ページ](${SITE_URL}/booth/${p.id})`);
  lines.push(`- [PCWE 公式ブースページ](${p.boothUrl})`);
  if (p.links.spotify !== undefined) lines.push(`- [Spotify](${p.links.spotify})`);
  if (p.links.applePodcasts !== undefined) lines.push(`- [Apple Podcasts](${p.links.applePodcasts})`);
  if (p.links.youtube !== undefined) lines.push(`- [YouTube](${p.links.youtube})`);
  if (p.links.x !== undefined) lines.push(`- [X (Twitter)](${p.links.x})`);
  if (p.links.instagram !== undefined) lines.push(`- [Instagram](${p.links.instagram})`);
  if (p.recommendedEpisode !== undefined) {
    lines.push('');
    lines.push(
      `**番組ホストおすすめエピソード**: [${p.recommendedEpisode.title}](${p.recommendedEpisode.url})`,
    );
  }
  return lines.join('\n');
}

function main(): void {
  console.log('🤖 AI フレンドリーファイル生成中...');

  const programsData = loadJson(join(ROOT, 'data/programs.json'), (raw) =>
    ProgramsDataSchema.parse(raw),
  );
  const programs = programsData.programs;

  const genresMap = loadJson(join(ROOT, 'data/genres.json'), (raw) => GenresMapSchema.parse(raw));
  const genres = Object.keys(genresMap);

  const moodsData = loadJson(join(ROOT, 'data/moods.json'), (raw) => MoodsDataSchema.parse(raw));
  const moods = moodsData.moods.map((m) => ({ slug: m.slug, label: m.label }));

  // public/api/ ディレクトリを準備
  ensureDir(join(ROOT, 'public/api'));

  // 1. llms.txt（軽量サマリ）
  const llmsTxt = buildLlmsTxt(programs, genres, moods);
  writeFileSync(join(ROOT, 'public/llms.txt'), llmsTxt, 'utf-8');
  console.log(`✅ public/llms.txt 生成 (${llmsTxt.length} 文字)`);

  // 2. llms-full.txt（全番組詳細）
  const llmsFull = buildLlmsFull(programs);
  writeFileSync(join(ROOT, 'public/llms-full.txt'), llmsFull, 'utf-8');
  console.log(`✅ public/llms-full.txt 生成 (${llmsFull.length} 文字)`);

  // 3. programs.json を public/api/ に複製（直接配信できるように）
  const programsJson = readFileSync(join(ROOT, 'data/programs.json'), 'utf-8');
  writeFileSync(join(ROOT, 'public/api/programs.json'), programsJson, 'utf-8');
  console.log(`✅ public/api/programs.json 配置 (${programs.length} 番組)`);

  console.log('🤖 完了');
}

main();
