# PCWE2026 Fansite — 非公式ファンガイド

> **PODCAST EXPO 2026 (PCWE2026)** の出展 144 番組を、ジャンル / タグ / キーワードで検索できる **非公式ファンガイドサイト**。
> 「行く理由を増やす」「当日 120% 楽しむ」を目的とする、ファンメイドのキュレーションサイト。

---

## 概要

| 項目 | 内容 |
|---|---|
| **イベント** | [PODCAST EXPO 2026](https://podcastexpo.jp/)（PCWE2026） |
| **会期** | 2026 年 5 月 9 日（土）・5 月 10 日（日）10:30 〜 19:00 |
| **会場** | HOME/WORK VILLAGE（東京都世田谷区池尻 2-4-5） |
| **公開予定** | 2026-05-09（イベント初日朝）|
| **ドメイン** | `pcwe2026-fansite.podmate.fm`（Podmate サブドメイン）|
| **位置づけ** | **非公式・ファンメイド**（公式とは無関係、コエノマ社がファンとして制作）|

## 目的

- 144 番組のうち **「これ刺さる」を見つけて、行く理由を増やす**
- 当日は **気になるリスト + ジャンル / タグでサクッと回れる** ガイドにする
- 公式が「ロゴ + 名前 + 概要文」しか出していない情報の弱さを、**Podmate 流の最強カード UI** で補強する

## 何ではないか

- 公式ガイドではない（PCWE 公式とは無関係）
- 番組紹介の "正解" ではない（ファンの視点での非公式キュレーション）
- マネタイズ目的ではない（広告なし、Podmate へのリンクは控えめに）

## 制約

- **DB なし**（静的サイト + JSON データ）
- **追加 API コストなし**（AI 生成 API は使わない、ライティングはコエノマ手動）
- **公式画像はホットリンクしない**（一度ダウンロードして public/ に配置）
- **言行一致**: AI 生成箇所は明示、公式情報と非公式キュレーションを分離
- **公開期限**: 5 月 9 日朝までに公開、間に合わない場合はサンプル数件でも公開して順次拡張

## 技術スタック

| 項目 | 採用技術 |
|---|---|
| フレームワーク | Next.js 15.5（App Router）+ TypeScript 5 |
| スタイリング | Tailwind CSS v4 |
| データ | `data/programs.json`（144 番組）|
| 検索 | Fuse.js（クライアントサイド、軽量）|
| 状態 | localStorage（気になるリスト）|
| デプロイ | Vercel（coenoma プロファイル）|
| 画像 | Next.js Image + public/thumbnails/（番組画像）|

## ディレクトリ構成

```
pcwe2026-fansite/
├── README.md                      # このファイル
├── AGENTS.md                      # LLM 向け実装ガイドライン
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx                   # トップ（一覧 + 検索 + フィルタ）
│   ├── booth/[id]/page.tsx        # 番組詳細
│   ├── plan/page.tsx              # 気になるリスト・当日プラン
│   ├── genre/[name]/page.tsx      # ジャンル別
│   └── about/page.tsx             # サイトについて
├── components/
│   ├── ProgramCard.tsx            # 一覧カード
│   ├── ProgramHero.tsx            # 詳細 Hero（Podmate Hero 風）
│   ├── FilterBar.tsx
│   ├── SearchInput.tsx
│   ├── FavoriteButton.tsx
│   ├── WaveDivider.tsx            # Podmate 流用
│   ├── BlobFrame.tsx              # Podmate 流用
│   ├── Highlight.tsx              # Podmate 流用
│   ├── SectionHeading.tsx         # Podmate 流用
│   └── FadeInOnScroll.tsx         # Podmate 流用
├── lib/
│   ├── fuse.ts                    # 検索ロジック（純粋関数）
│   ├── filter.ts                  # フィルタロジック（純粋関数）
│   ├── favorites.ts               # localStorage 操作（純粋関数）
│   └── types.ts                   # 型定義
├── data/
│   ├── programs.json              # 144 番組データ
│   └── genres.json                # ジャンル定義
├── public/
│   └── thumbnails/                # 番組画像（公式から DL）
├── scripts/
│   ├── fetch-booth-info.ts        # 各ブースページのスクレイピング
│   └── download-thumbnails.ts     # 画像ダウンロード
└── docs/
    └── plans/
        └── v1-mvp-launch/         # 初回公開（5/9）の設計書
            └── README.md
```

## AI フレンドリー化（公開エンドポイント）

ChatGPT / Claude / Perplexity などの生成 AI クライアントから扱いやすいよう、以下のエンドポイントを公開しています。

| URL | 形式 | 用途 |
|---|---|---|
| `/llms.txt` | Markdown | サイト地図（[llms.txt 規格](https://llmstxt.org/)）。主要ページ・ジャンル・全番組リンクの目次 |
| `/llms-full.txt` | Markdown | 全 142 番組の詳細を 1 ファイルに集約（LLM コンテキスト 1 発取得用）|
| `/api/programs.json` | JSON | 全番組の構造化データ（zod 検証済み）|
| `/sitemap.xml` | XML | 全 168 URL のサイトマップ |
| `/robots.txt` | TXT | 主要 AI ボット 15 種類を明示的に Allow |

これらは [`scripts/build-llms.ts`](./scripts/build-llms.ts) が `prebuild` フックで毎回再生成します。
詳細・運用ルールは [docs/design-guideline.md §8](./docs/design-guideline.md#8-ai-フレンドリー化generative-engine-optimization) 参照。

## ステータス

- 🚧 **開発中**（2026-04-29 開始、5/9 公開予定）
- 進捗: [docs/plans/v1-mvp-launch/README.md](./docs/plans/v1-mvp-launch/README.md) のマトリクス参照

## 関連

- 親ディレクトリ: `~/dev/coenoma/lp/`（コエノマ LP コレクション）
- Podmate 本体: `~/dev/coenoma/podmate-next/`
- Podmate トラクション戦略: `~/dev/coenoma/podmate-traction/`

## ライセンス・著作権

- 番組情報・画像は各番組制作者・PODCAST EXPO 2026 公式に帰属
- 本サイトは**非公式のファンガイド**であり、公式とは無関係
- 番組制作者から「載せないで」要望があれば即時対応

## 制作

合同会社コエノマ ファウンダー（ゆと）が個人 / 趣味 / Podmate ブランディングの一環として制作。
