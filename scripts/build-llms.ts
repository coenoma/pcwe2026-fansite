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

最終ビルド: ${new Date().toISOString()}

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

- [llms-full.html](${SITE_URL}/data/llms-full.html): **AI / LLM クライアント向けに最適化された HTML 版**（text/plain や JSON が web sandbox で本文展開されない場合の確実なフォールバック。同データを HTML 形式で 1 ページに集約）
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

最終更新: ${new Date().toISOString()}
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

/**
 * HTML エスケープ（XSS 防止 + HTML 構文崩壊防止）
 * 番組説明文・名前等にユーザー入力由来の `<` `>` `&` `"` `'` が混じっていても安全に出力する
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * llms-full.html を生成する。
 *
 * 目的:
 *   ChatGPT 等の AI クライアントの web sandbox は text/plain や application/json の
 *   本文を展開しない実装が観測されている（URL は開けるがメタ情報のみ返す）。
 *   一方 HTML は確実に本文展開されるため、同じ全番組詳細データを HTML 形式でも
 *   提供することで AI クライアントからの確実な取得を保証する。
 *
 * 設計:
 *   - 装飾は最小限（system-ui フォント + 罫線のみ）
 *   - 各番組を <article id="pcwe-XXX"> で囲んで AI / 人間どちらも navigable
 *   - <link rel="alternate"> で txt / json 版へ相互リンク（discoverability）
 *   - sitemap.xml には含めない（Google 検索結果での重複コンテンツ回避）
 *   - 人間 UX に影響しないよう、サイト UI からはリンクしない（llms.txt と
 *     AIChatPromptModal のプロンプトからのみ案内する）
 */
function buildLlmsFullHtml(programs: Program[]): string {
  const buildTime = new Date().toISOString();

  const programArticles = programs
    .map((p) => {
      const dayLabel =
        p.exhibition.days.length === 2
          ? '両日'
          : p.exhibition.days[0] === 'sat'
            ? '土曜のみ'
            : '日曜のみ';
      const linkRows: string[] = [];
      linkRows.push(
        `<li><a href="${SITE_URL}/booth/${p.id}">このサイトの番組詳細ページ</a></li>`,
      );
      linkRows.push(
        `<li><a href="${escapeHtml(p.boothUrl)}" rel="nofollow noopener">PCWE 公式ブースページ</a></li>`,
      );
      if (p.links.spotify !== undefined)
        linkRows.push(`<li><a href="${escapeHtml(p.links.spotify)}" rel="nofollow noopener">Spotify</a></li>`);
      if (p.links.applePodcasts !== undefined)
        linkRows.push(
          `<li><a href="${escapeHtml(p.links.applePodcasts)}" rel="nofollow noopener">Apple Podcasts</a></li>`,
        );
      if (p.links.youtube !== undefined)
        linkRows.push(`<li><a href="${escapeHtml(p.links.youtube)}" rel="nofollow noopener">YouTube</a></li>`);
      if (p.links.x !== undefined)
        linkRows.push(`<li><a href="${escapeHtml(p.links.x)}" rel="nofollow noopener">X (Twitter)</a></li>`);
      if (p.links.instagram !== undefined)
        linkRows.push(
          `<li><a href="${escapeHtml(p.links.instagram)}" rel="nofollow noopener">Instagram</a></li>`,
        );

      const recommendedHtml =
        p.recommendedEpisode !== undefined
          ? `<p><strong>番組ホストおすすめエピソード</strong>: <a href="${escapeHtml(p.recommendedEpisode.url)}" rel="nofollow noopener">${escapeHtml(p.recommendedEpisode.title)}</a></p>`
          : '';

      const aliasName =
        p.shortName !== undefined && p.shortName !== p.name
          ? `<p class="meta">正式名称: ${escapeHtml(p.name)}</p>`
          : '';

      const hostsHtml =
        p.official.hosts !== undefined && p.official.hosts.length > 0
          ? `<p><strong>ホスト</strong>: ${escapeHtml(p.official.hosts.join(' / '))}</p>`
          : '';

      const merchHtml =
        p.official.merchandise !== undefined && p.official.merchandise.length > 0
          ? `<p><strong>ブース物販</strong>: ${escapeHtml(p.official.merchandise.join(' / '))}</p>`
          : '';

      return `<article id="${p.id}">
  <h2>${escapeHtml(p.shortName ?? p.name)} <span class="meta">(${p.id})</span></h2>
  ${aliasName}
  <ul class="meta-list">
    <li><strong>ジャンル</strong>: ${escapeHtml(p.fanGuide.genre)}</li>
    <li><strong>タグ</strong>: ${escapeHtml(p.fanGuide.tags.join(' / '))}</li>
    <li><strong>vibe</strong>: ${escapeHtml(p.fanGuide.vibe)}</li>
    <li><strong>出展</strong>: ${dayLabel} / ${escapeHtml(p.exhibition.hours)} / ${p.exhibition.area === 'free' ? '無料エリア' : '有料エリア'}</li>
  </ul>
  <p><strong>キャッチコピー（独断と偏見）</strong>: ${escapeHtml(p.fanGuide.catchphrase)}</p>
  <p><strong>サブキャッチ</strong>: ${escapeHtml(p.fanGuide.subCatch)}</p>
  <p><strong>ターゲットリスナー</strong>: ${escapeHtml(p.fanGuide.targetListener)}</p>
  <h3>公式説明</h3>
  <p>${escapeHtml(p.official.description)}</p>
  ${hostsHtml}
  ${merchHtml}
  <h3>リンク</h3>
  <ul>
${linkRows.map((r) => `    ${r}`).join('\n')}
  </ul>
  ${recommendedHtml}
</article>`;
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PCWE2026 全 ${programs.length} 番組 詳細データ（LLM 向け） | PCWE2026 ファンガイド（非公式）</title>
<meta name="description" content="PODCAST WEEKEND 2026 出展 ${programs.length} 番組の詳細を 1 ページに集約した LLM / AI クライアント向け HTML データページ。人間向けのファンガイドはトップページから。">
<link rel="canonical" href="${SITE_URL}/data/llms-full.html">
<link rel="alternate" type="text/plain" href="${SITE_URL}/llms-full.txt" title="同データの Markdown 版">
<link rel="alternate" type="application/json" href="${SITE_URL}/api/programs.json" title="同データの JSON 版">
<style>
:root { color-scheme: light; }
body { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; max-width: 980px; margin: 0 auto; padding: 24px 16px 64px; line-height: 1.7; color: #222; background: #fff; }
header { padding-bottom: 16px; border-bottom: 2px solid #DC725A; }
header h1 { margin: 0 0 8px; font-size: 24px; }
header p { margin: 4px 0; color: #444; font-size: 14px; }
nav.toc { margin: 24px 0; padding: 12px 16px; background: #f5f5f5; border-radius: 8px; }
nav.toc summary { cursor: pointer; font-weight: bold; }
nav.toc ol { columns: 2; column-gap: 24px; padding-left: 20px; margin: 12px 0 0; }
nav.toc li { font-size: 13px; break-inside: avoid; }
article { border-top: 1px solid #ddd; padding: 24px 0; }
article h2 { margin: 0 0 8px; font-size: 20px; }
article h3 { margin: 16px 0 4px; font-size: 15px; color: #555; }
article ul.meta-list { padding-left: 20px; margin: 8px 0; }
article ul.meta-list li { font-size: 14px; }
article p { margin: 6px 0; }
.meta { color: #888; font-size: 13px; font-weight: normal; }
footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; color: #666; font-size: 13px; }
a { color: #1a5fb4; }
</style>
</head>
<body>
<header>
  <h1>PCWE2026 全 ${programs.length} 番組 詳細データ（LLM 向け）</h1>
  <p>PODCAST EXPO 2026 内のマーケットイベント <strong>PODCAST WEEKEND 2026</strong>（2026 年 5 月 9 日〜10 日 / 東京・池尻大橋 HOME/WORK VILLAGE）出展 ${programs.length} 番組の詳細を 1 ページに集約した、LLM / AI クライアント向けの HTML データページです。</p>
  <p>人間向けファンガイドは <a href="${SITE_URL}/">トップページ</a>。同じデータの他フォーマット: <a href="${SITE_URL}/llms-full.txt">llms-full.txt</a> / <a href="${SITE_URL}/api/programs.json">programs.json</a> / <a href="${SITE_URL}/llms.txt">llms.txt（サイト地図）</a></p>
  <p class="meta">最終ビルド: <time datetime="${buildTime}">${buildTime}</time> / 制作: 合同会社コエノマ / Podmate.fm（非公式・ファンメイド）</p>
</header>

<nav class="toc">
  <details>
    <summary>番組目次（${programs.length} 番組）</summary>
    <ol>
${programs.map((p) => `      <li><a href="#${p.id}">${escapeHtml(p.shortName ?? p.name)}</a></li>`).join('\n')}
    </ol>
  </details>
</nav>

<main>
${programArticles}
</main>

<footer>
  <p>本サイトは <strong>PODCAST EXPO 2026 公式とは無関係のファンメイド</strong>です。各番組のロゴ・概要は各番組制作者と公式の情報を引用し、キャッチコピー・タグ・ジャンル分類は本サイト独自のキュレーション（合同会社コエノマと AI による独断と偏見）です。</p>
  <p>掲載取り下げ・情報修正のご依頼は <a href="${SITE_URL}/about">About ページ</a>からどうぞ。</p>
</footer>
</body>
</html>
`;
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

  // 2.5. /data/llms-full.html（LLM 向け HTML 版 / ChatGPT 等の sandbox 制約対策）
  //      ルート直下 /llms-full.html だと Vercel + Next.js (output: 'export') の
  //      routing と衝突して 404 になる現象が観測されたため /data/ サブディレクトリに配置
  ensureDir(join(ROOT, 'public/data'));
  const llmsFullHtml = buildLlmsFullHtml(programs);
  writeFileSync(join(ROOT, 'public/data/llms-full.html'), llmsFullHtml, 'utf-8');
  console.log(`✅ public/data/llms-full.html 生成 (${llmsFullHtml.length} 文字)`);

  // 3. programs.json を public/api/ に複製（直接配信できるように）
  //    lastUpdated をビルド時刻で動的に上書き → 毎デプロイで内容が変わり
  //    ETag が必ず更新されるため、Vercel Edge Cache が確実に invalidate される
  //    （これをしないと vercel.json のヘッダー変更が反映されない問題が発生）
  const programsRaw = readFileSync(join(ROOT, 'data/programs.json'), 'utf-8');
  const programsJson = JSON.parse(programsRaw) as Record<string, unknown>;
  programsJson.lastUpdated = new Date().toISOString();
  writeFileSync(
    join(ROOT, 'public/api/programs.json'),
    JSON.stringify(programsJson, null, 2),
    'utf-8',
  );
  console.log(`✅ public/api/programs.json 配置 (${programs.length} 番組)`);

  console.log('🤖 完了');
}

main();
