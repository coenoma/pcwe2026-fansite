# v1 MVP Launch — PCWE2026 ファンサイト初回公開設計書

> **公開期限**: 2026-05-09（土）朝
> **着手日**: 2026-04-29（水）= 残り 10 日
> **責任者**: ゆと
> **位置づけ**: ジュニアエンジニアや新規担当でも、本書だけで成果がぶれずに高品質な実装ができることを目指す総合設計書。

---

## 📊 進捗マトリクス

| # | タスク | 担当 | 状態 | 期限 |
|---|---|---|---|---|
| 1 | プロジェクト初期化（Next.js / Tailwind / TS）| Claude | ⬜ | 4/29 |
| 2 | 型定義 + zod スキーマ（`lib/types.ts`）| Claude | ⬜ | 4/29 |
| 3 | ジャンル定義（`data/genres.json`）| Claude | ⬜ | 4/29 |
| 4 | サンプル 5 番組の `programs.json` 構造書き出し | Claude | ⬜ | 4/29 |
| 5 | Podmate ブランディング流用コンポーネント実装（`WaveDivider` / `BlobFrame` / `Highlight` / `SectionHeading` / `FadeInOnScroll`）| Claude | ⬜ | 4/30 |
| 6 | `ProgramCard` 実装（一覧用）| Claude | ⬜ | 4/30 |
| 7 | `ProgramHero` 実装（詳細用、Podmate Hero 風）| Claude | ⬜ | 4/30 |
| 8 | トップページ（一覧 + 検索 + フィルタ）| Claude | ⬜ | 5/1 |
| 9 | 番組詳細ページ `/booth/[id]` | Claude | ⬜ | 5/1 |
| 10 | ジャンル別ページ `/genre/[name]` | Claude | ⬜ | 5/2 |
| 11 | 気になるリスト `/plan` + localStorage | Claude | ⬜ | 5/2 |
| 12 | About ページ + 非公式表記 + 2 種フォームリンク導線 | Claude | ⬜ | 5/2 |
| 12.1 | Google フォーム A（掲載取り下げ）作成・公開 | ゆと | ⬜ | 5/8 |
| 12.2 | Google フォーム B（情報修正・追加）作成・公開 | ゆと | ⬜ | 5/8 |
| 12.3 | フォーム URL を環境変数 / 定数に設定 | Claude / ゆと | ⬜ | 5/8 |
| 13 | OGP 設定 + sitemap.xml + favicon | Claude | ⬜ | 5/3 |
| 14 | 残り 139 番組のブースページ Fetch + JSON 化 | Claude | ⬜ | 5/4-5/5 |
| 15 | 全 144 番組の `fanGuide` ライティング | Claude / ゆと | ⬜ | 5/5-5/7 |
| 16 | サムネイル画像 144 枚ダウンロード | Claude | ⬜ | 5/7 |
| 17 | E2E 動作確認（Vercel Preview）| Claude / ゆと | ⬜ | 5/8 |
| 18 | 本番デプロイ + ドメイン設定 | ゆと | ⬜ | 5/8 |
| 19 | 公開告知（X 投稿）| ゆと | ⬜ | 5/9 |

凡例: ⬜ 未着手 / 🟡 進行中 / ✅ 完了 / ⏸️ 保留

---

## 🎯 要件

### 機能要件

| ID | 要件 | 優先度 |
|---|---|---|
| F1 | 144 番組を一覧表示できる（グリッド、カード形式）| 必須 |
| F2 | 番組名・概要・タグ・ジャンルで横断検索できる（Fuse.js）| 必須 |
| F3 | ジャンル / 雰囲気タグ / 出展日でフィルタできる | 必須 |
| F4 | 番組詳細ページがあり、Podmate Hero 風カードで表示される | 必須 |
| F5 | 番組を「気になる」マークでき、localStorage に保存される | 必須 |
| F6 | 「気になる」リストを `/plan` で土・日別に表示できる | 必須 |
| F7 | ジャンル別ページがある | 必須 |
| F8 | About ページで非公式スタンス・削除依頼方法を明記 | 必須 |
| F9 | 「ランダムガチャ」で 1 番組をランダム表示できる | 推奨 |
| F10 | 気になるリストを URL でシェアできる（クエリパラメータ）| 推奨 |
| F11 | OGP / Twitter カード対応（番組詳細）| 必須 |

### 非機能要件

| ID | 要件 | 値 |
|---|---|---|
| NF1 | LCP | < 2.5s |
| NF2 | CLS | < 0.1 |
| NF3 | モバイル / PC レスポンシブ | 必須 |
| NF4 | アクセシビリティ | WCAG AA 以上 |
| NF5 | 静的生成（SSG）| 全ページ必須 |
| NF6 | TypeScript エラー 0 件 | 必須 |
| NF7 | ESLint エラー 0 件 | 必須 |

### 制約

- DB なし、API なし、サーバーレス
- AI API 呼び出しなし（コスト発生のため）
- 公式画像はホットリンクせず、`public/thumbnails/` にダウンロード
- 公開期限は 5/9 朝、間に合わない機能は後追い OK（最低限 F1-F8 + F11）

---

## 🏗️ 技術設計

### 流用コンポーネント戦略（copy）

podmate-next の Hero / WaveDivider / BlobFrame / Highlight / SectionHeading / FadeInOnScroll は**コピーして同等品を本プロジェクトに実装する**（共通パッケージ化しない）。

理由:
- 独立性優先: 本サイトは公開後ほぼメンテしない
- 依存最小化: podmate-next の更新で壊れたくない
- ライセンス: 同一組織内なのでコピーに法的問題なし
- 軽量化: 必要な部分だけ持ってくる

実装時は podmate-next のソースを参照し、本サイト用に**最小限の改変**で持ち込む。

### 採用技術

| 項目 | 選定 | 理由 |
|---|---|---|
| フレームワーク | Next.js 15.5（App Router）| Podmate 本体と整合、SSG が容易 |
| 言語 | TypeScript 5 | 型安全性、podmate-next と整合 |
| スタイル | Tailwind CSS v4 | Podmate ブランディングを直接流用可能 |
| 検索 | Fuse.js | クライアント側で軽量、144 件は十分 |
| 状態 | React Hooks + localStorage | サーバー状態なし、シンプル |
| データ | JSON ファイル | DB 不要、Git 管理可能 |
| デプロイ | Vercel（coenoma プロファイル）| Next.js 標準、自動デプロイ |
| ドメイン | `pcwe2026-fansite.podmate.fm` | Podmate サブドメイン、非公式感を残す |

### ディレクトリ構成

[README.md](../../README.md#ディレクトリ構成) 参照。

### データフロー

```
[ビルド時]
data/programs.json
  ↓ generateStaticParams
app/booth/[id]/page.tsx → 144 静的 HTML
app/genre/[name]/page.tsx → 17 静的 HTML
app/page.tsx → 1 静的 HTML（一覧、検索は client）

[ランタイム]
ユーザー操作
  ↓
SearchInput / FilterBar (Client Component)
  ↓ Fuse.js / filter.ts
ProgramCard グリッド更新

ユーザーが「気になる」クリック
  ↓
FavoriteButton (Client Component)
  ↓ localStorage
保存
```

### コンポーネント階層

```
RootLayout (app/layout.tsx)
  ├─ Header [非公式バッジ]
  ├─ <main>
  │   └─ Page Content
  └─ Footer [Podmate.fm 控えめリンク + 削除依頼]

トップページ (app/page.tsx)
  ├─ HeroSection [タイトル + イベント情報]
  ├─ FilterBar (Client) [ジャンル / 雰囲気 / 日付]
  ├─ SearchInput (Client) [Fuse.js]
  └─ ProgramGrid
      └─ ProgramCard × 144
          └─ FavoriteButton (Client)

番組詳細 (app/booth/[id]/page.tsx)
  ├─ ProgramHero [Podmate Hero 風]
  │   ├─ BlobFrame [サムネ装飾]
  │   ├─ Highlight [キャッチコピー強調]
  │   └─ FavoriteButton (Client)
  ├─ TargetListenerSection
  ├─ TagsList
  ├─ OfficialInfoSection
  ├─ LinksSection [Spotify / X / Instagram]
  └─ RelatedPrograms
```

---

## 📦 データ設計

### Program 型

[AGENTS.md > データ構造ガイドライン](../../AGENTS.md#-データ構造ガイドライン) 参照。

### サンプルデータ（5 番組、確定済み）

| ID | 番組名 | キャッチコピー | ジャンル | Vibe |
|---|---|---|---|---|
| 040 | 俺思 | 漫画家と装丁デザイナーが、世界に雑に同意しない 1 時間。 | カルチャー | earnest |
| 006 | 本茶本茶 | 本の感想じゃなくて、本がくれた静けさを語る番組。 | 文芸・読書 | contemplative |
| 013 | ピスタチオパフェクラブ | 深夜ラジオ世代の "脳内ハガキ" を、そのまま電波に流すラジオ。 | コメディ | energetic |
| 072 | 失敗から学ぶゲイとおこげのニュースト | 誰にも言えない失敗を、お守りに変えるラジオ。 | 恋愛・ジェンダー | conversational |
| 118 | 朝日新聞ポッドキャスト | 新聞の "尺" に収まらなかった話を、ここで聴ける。 | ニュース・社会 | intellectual |

### ジャンル定義

`data/genres.json` で管理。各ジャンルにアイコン（lucide-react）とアクセントカラーを紐付ける（任意）。

```json
{
  "カルチャー": { "icon": "Sparkles", "accent": "primary" },
  "文芸・読書": { "icon": "BookOpen", "accent": "neutral" },
  "食": { "icon": "UtensilsCrossed", "accent": "amber" },
  "...": "..."
}
```

### Vibe 別アクセントマッピング

[AGENTS.md > Vibe 別アクセント](../../AGENTS.md#vibe-別アクセント) 参照。

---

## 🎨 UI 設計

### Hero（トップページ）

```
┌────────────────────────────────────┐
│  PODCAST EXPO 2026 を 120% 楽しむ      │
│  ━━━━━━━━━━━━━━━━━━━━━━━           │
│                                       │
│  [非公式ファンガイド]                    │
│                                       │
│  144 番組から「これ刺さる」を探す。      │
│  当日が、楽しみになる。                  │
│                                       │
│  [検索ボックス]                         │
│  [ジャンル]  [雰囲気]  [出展日]          │
│                                       │
│  あと N 日                              │
└────────────────────────────────────┘
～ WaveDivider fill-white ～
```

### ProgramCard（一覧グリッド、コンパクト）

```
┌──────────────┐
│  [サムネ正方形]  │
│                │
│  [ジャンル]      │
│  [日]           │
│                │
│  番組名         │
│  ━━━━━━       │
│  「キャッチ」    │
│                │
│  [♡]           │
└──────────────┘
```

サイズ: `aspect-square` のサムネ + テキスト下部、最大 `max-w-xs`。
グリッド: `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`。

### ProgramHero（詳細、Podmate Hero 風）

```
┌──────────────────────────────────────────┐
│                                           │
│   ╭~~~~~~~~~~╮                            │
│  ~ [サムネ大]  ~      [ジャンル][日][♡]   │
│  ~  280 x 280 ~                            │
│   ╰~~~~~~~~~~╯       番組名（large）       │
│   (BlobFrame)                              │
│                       「キャッチ」          │
│                       ━━━━━━━━           │
│                       (amber-200/70 下線)  │
│                                           │
│                       サブキャッチ          │
│                                           │
│                       [Spotify][X][...]    │
│                                           │
└──────────────────────────────────────────┘
～ 波 fill-amber-50 ～

[こんな人に刺さる] amber-50 セクション
[タグ並び]
～ 波 fill-white ～

[公式情報] white セクション
ホスト / 概要 / 物販 / 公式 URL

[関連番組（同ジャンル）] neutral-50
```

### 波型区切り

Podmate ガイドライン準拠。トップページとブース詳細ページに 2-3 箇所ずつ。

---

## ✍️ ライティング・フレーム

[AGENTS.md > ライティング・ガイドライン](../../AGENTS.md#-ライティングガイドライン) 参照。

### 144 番組の執筆フロー

1. 各ブースページから公式情報を Fetch（`scripts/fetch-booth-info.ts`）
2. JSON に `official` セクション保存
3. コエノマ（ゆと）が公式情報を読みながら `fanGuide` を手書き
   - キャッチコピー 3 案 → 1 つ採用
   - ジャンル分類
   - タグ 3-5 個付与
   - ターゲットリスナー
   - Vibe 1 単語
4. JSON 更新

→ 144 件 × 5-10 分 = **12-24 時間** の手作業。5/5-5/7 で集中作業する。
→ 間に合わない場合は段階公開: 5/9 時点でサンプル 30 件、当日中に追加。

---

## 🧪 テスト戦略

### MVP 範囲（必須）

- **Jest 単体テスト**: `lib/` の純粋関数すべて
  - `lib/filter.ts`: ジャンル / タグ / 日付フィルタ
  - `lib/fuse.ts`: 検索の正常系・空入力・特殊文字
  - `lib/favorites.ts`: localStorage 操作（モック）
- **zod バリデーション**: `scripts/validate-data.ts` をビルドフックで実行
  - 144 番組すべての必須フィールド検証
  - 型エラーで `next build` を失敗させる

### MVP 後（時間あれば）

- **Playwright E2E**: 主要動線 3 本
  1. トップ → 検索 → 詳細遷移
  2. ジャンル絞り込み → 気になるマーク → /plan で表示
  3. /plan の URL シェア → 復元
- **Lighthouse CI**: PR 時に LCP / CLS チェック

### 単体テストファイル配置

```
lib/
  filter.ts
  filter.test.ts      # Jest
  fuse.ts
  fuse.test.ts
  favorites.ts
  favorites.test.ts
```

---

## 🛡️ エラーハンドリング方針

### ビルド時

- `data/programs.json` を zod で検証 → エラーなら `next build` 失敗
- 画像未取得（`public/thumbnails/{n}.jpeg` 不在）→ 警告ログ + ビルド継続（プレースホルダーで代替）

### ランタイム

- SSG なのでサーバーエラーは原則発生しない
- localStorage 操作失敗（プライベートモード等）→ 銀行可能なよう try/catch + 日本語警告ログ
- 画像 404 → `next/image` の onError で graceful fallback

```typescript
// lib/favorites.ts
export function saveFavorites(ids: string[]): boolean {
  try {
    localStorage.setItem('pcwe2026-favorites', JSON.stringify(ids));
    return true;
  } catch (error) {
    console.warn('⚠️ お気に入りの保存に失敗しました（プライベートモードの可能性）', error);
    return false;
  }
}
```

---

## 🌐 SEO・メタデータ戦略

### 全ページ共通

- `<title>`: 「{番組名} | PCWE2026 ファンガイド（非公式）」
- `<meta description>`: キャッチコピー + サブキャッチ
- OGP 画像: 番組サムネイル（1200x630 にトリミング）
- Twitter Card: `summary_large_image`

### 構造化データ（JSON-LD）

各番組詳細ページに `PodcastSeries` JSON-LD を埋め込む:

```json
{
  "@context": "https://schema.org",
  "@type": "PodcastSeries",
  "name": "俺思 | 週刊漫画家と装丁デザイナーのPodcast",
  "description": "...",
  "image": "https://pcwe2026-fansite.podmate.fm/thumbnails/040.jpeg",
  "url": "https://open.spotify.com/show/...",
  "sameAs": [
    "https://x.com/oreha_omowanai",
    "https://www.instagram.com/orehasoha_omowanai/"
  ]
}
```

### sitemap.xml / robots.txt

`next-sitemap` 等を使わず手動生成（依存削減）:
- `app/sitemap.ts`: トップ + 144 番組 + 17 ジャンル + plan + about = 約 165 URL
- `app/robots.ts`: 全公開、noindex なし

---

## 🚀 デプロイ戦略

### Vercel プロジェクト設定

| 項目 | 値 |
|---|---|
| Vercel チーム | coenoma |
| プロジェクト名 | `pcwe2026-fansite` |
| Framework Preset | Next.js |
| Root Directory | `.` |
| Build Command | `npm run build`（Next.js デフォルト）|
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node.js Version | 20.x |

### CLI 操作（coenoma プロファイル使用）

```bash
# CLAUDE.md ルール準拠: 素の vercel コマンドは使わない
cd ~/dev/coenoma/lp/pcwe2026-fansite

# 初回 link
vercel --global-config ~/.vercel-profiles/coenoma link

# プレビューデプロイ
vercel --global-config ~/.vercel-profiles/coenoma

# 本番デプロイ
vercel --global-config ~/.vercel-profiles/coenoma --prod
```

### DNS 設定（pcwe2026-fansite.podmate.fm）

`podmate.fm` ドメインの DNS で以下を追加（Cloudflare or Route 53 等）:

```
Type:  CNAME
Name:  pcwe2026-fansite
Value: cname.vercel-dns.com
```

Vercel 側で「Domains」タブから `pcwe2026-fansite.podmate.fm` を追加 → 自動で SSL 発行。

### 運用想定（番組制作者・リスナーからの依頼受付）

About ページに **2 種類の Google フォーム** へのリンクを設置する。フォーム本体は別途作成（公開前までに用意）。

#### フォーム A: 掲載取り下げ依頼

**目的**: 番組制作者本人から「載せないでほしい」要望を受けたら、24h 以内に削除する。

**フォーム項目案**:

| 項目 | 必須 | 入力タイプ |
|---|---|---|
| 番組名 | 必須 | 短文回答 |
| ブース番号（pcwe-XXX）| 必須 | 短文回答 |
| ご本人確認: 番組運営に関わる立場 | 必須 | ラジオ（出演者 / 制作スタッフ / その他関係者） |
| ご連絡先（X DM or メール）| 必須 | 短文回答 |
| 取り下げ理由（任意）| 任意 | 段落 |
| 確認チェック | 必須 | チェック「番組制作者本人または正当な代理人として依頼している」|

**完了画面文言案**:
> ご連絡ありがとうございます。
> 24 時間以内に該当番組を削除し、ご連絡先にご返信します。
> ご不明点は X @yuto_podmate（ゆと）まで。

#### フォーム B: 情報修正・追加依頼

**目的**: 番組制作者・リスナーから「タイポ修正」「配信先追加」「キャッチコピーの違和感」等を受け付ける。

**フォーム項目案**:

| 項目 | 必須 | 入力タイプ |
|---|---|---|
| 番組名 | 必須 | 短文回答 |
| ブース番号 | 必須 | 短文回答 |
| 修正・追加の種類 | 必須 | チェックボックス（複数可）<br>・配信先 URL の追加・修正<br>・SNS リンクの追加・修正<br>・キャッチコピー / サブキャッチへの違和感<br>・タグ・ジャンルの違和感<br>・公式情報（ホスト名・概要）の誤り<br>・その他 |
| 詳細（修正案・追加情報）| 必須 | 段落 |
| ご立場 | 任意 | ラジオ（番組制作者 / リスナー / その他）|
| ご連絡先（任意）| 任意 | 短文回答 |

**完了画面文言案**:
> ご連絡ありがとうございます。
> 内容を確認のうえ、可能なものから順次反映します（数日〜1 週間目安）。
> 反映できない場合もご了承ください（例: キャッチコピーの完全な表現変更等は本サイトのキュレーション方針に基づき判断します）。

#### 運用フロー

##### 取り下げ依頼（フォーム A）

| Step | 内容 | SLA |
|---|---|---|
| 1 | フォーム送信 → ゆとへメール通知（Google フォーム標準機能）| — |
| 2 | ゆとが内容確認、本人性チェック（疑わしい場合は X DM で本人確認）| 受信 6h 以内 |
| 3 | `data/programs.json` から該当 ID オブジェクトを削除 | 受信 12h 以内 |
| 4 | `git commit -m "fix: pcwe-XXX を削除（制作者要望、依頼日 YYYY-MM-DD）"` → `git push` | 受信 18h 以内 |
| 5 | Vercel 自動デプロイ（5 分以内）| — |
| 6 | 依頼者へメール / DM で完了連絡 | 受信 24h 以内 |

##### 情報修正・追加依頼（フォーム B）

| Step | 内容 | SLA |
|---|---|---|
| 1 | フォーム送信 → ゆとへメール通知 | — |
| 2 | ゆとが内容確認、修正案を判断 | 受信 1 週間以内 |
| 3 | 反映可なら `data/programs.json` 修正 → コミット → デプロイ | 判断後 3 日以内 |
| 4 | 反映不可なら依頼者へ理由とともに返信 | — |

##### About ページの記載例

```
このサイトについて疑問・修正希望があれば下記からご連絡ください。

▶ 掲載を取り下げてほしい（番組制作者の方）
  [Google フォーム A のリンク]
  → 24 時間以内に削除します

▶ 情報の修正・追加依頼（どなたでも）
  [Google フォーム B のリンク]
  → 数日〜1 週間で反映を判断します

▶ その他のご質問・ご感想
  X DM @yuto_podmate（ゆと）までお気軽に
```

#### 実装上の考慮

- フォーム URL は `lib/constants.ts` に定数化:
  ```typescript
  export const FORM_TAKEDOWN_URL = process.env.NEXT_PUBLIC_FORM_TAKEDOWN_URL ?? '';
  export const FORM_FIX_URL = process.env.NEXT_PUBLIC_FORM_FIX_URL ?? '';
  ```
- 環境変数が空なら About ページに「準備中」と表示（公開前までに必ず設定）
- フォーム送信先のメールアドレスは Google フォーム標準機能でゆとのメールに通知
- 自動化はしない（年に数件〜十数件の想定、手動運用で十分）

#### 受付ログ管理（任意・運用後）

将来的にフォーム受付件数が増えたら、`docs/operations/inquiries-log.md` に記録:

```markdown
| 日付 | 種類 | 番組 ID | 内容 | 対応 | 完了日 |
|---|---|---|---|---|---|
| 2026-05-10 | 取り下げ | pcwe-099 | 「載せないで」要望 | 削除完了 | 2026-05-11 |
```

→ MVP では不要、運用後 5 件以上溜まったら作成検討。

---

## 🚀 実装計画（タスク分解）

### Phase 1: 基盤（4/29 中）

1. Next.js 16 + Tailwind v4 + TypeScript プロジェクト初期化
2. 型定義 + zod スキーマ（`lib/types.ts`）
3. ジャンル定義（`data/genres.json`）
4. サンプル 5 番組の `programs.json` 構造書き出し
5. .gitignore / .eslintrc / tsconfig

### Phase 2: 共通コンポーネント（4/30）

6. WaveDivider / BlobFrame / Highlight / SectionHeading / FadeInOnScroll
7. ProgramCard（一覧用）
8. ProgramHero（詳細用、Podmate Hero 風）
9. FavoriteButton + localStorage hook（`useFavorites`）

### Phase 3: ページ実装（5/1-5/2）

10. トップページ（一覧 + Hero + 検索 + フィルタ）
11. 番組詳細ページ `/booth/[id]`（generateStaticParams で 5 番組）
12. ジャンル別 `/genre/[name]`
13. 気になるリスト `/plan`
14. About ページ

### Phase 4: 仕上げ（5/3）

15. OGP メタタグ + sitemap.xml + robots.txt + favicon
16. ランダムガチャ（推奨機能）
17. アクセシビリティ最終調整

### Phase 5: データ拡充（5/4-5/7）

18. 残り 139 番組のブースページ Fetch（並列、20 件 × 7 バッチ）
19. サムネイル画像 144 枚ダウンロード
20. 全 144 番組の fanGuide ライティング（コエノマ + Claude 補助）

### Phase 6: 公開（5/8-5/9）

21. Vercel Preview デプロイ + E2E 確認
22. 本番デプロイ + DNS（pcwe2026-fansite.podmate.fm）
23. 5/9 朝の X 投稿で公開告知

---

## ✅ 受け入れ基準

### 5/9 公開時に満たすべき条件

- [ ] [F1-F8, F11 必須機能] が全て動作する
- [ ] 144 番組のうち最低 30 番組（Phase 5 進捗次第）に fanGuide が付いている
- [ ] LCP < 2.5s / CLS < 0.1
- [ ] モバイル / PC で正しく表示
- [ ] 「公式」表記がない、「非公式ファンガイド」明記が随所にある
- [ ] 削除依頼受付方法が About ページに明記されている
- [ ] TypeScript / ESLint エラー 0 件

### 5/10 イベント終了時に追加で満たすべき条件

- [ ] 144 番組すべてに fanGuide が付いている
- [ ] 推奨機能（ランダムガチャ / シェア URL）が動作
- [ ] OGP / Twitter カードが各番組ページで正しく表示

---

## 🔗 関連ドキュメント

- [プロジェクト README](../../../README.md)
- [AGENTS.md](../../../AGENTS.md)
- [Podmate Branding Guideline](../../../../podmate-next/docs/DESIGN_GUIDELINE_BRANDING.md)
- [Podmate AGENTS.md](../../../../podmate-next/AGENTS.md)
- [PCWE 公式](https://podcastexpo.jp/)

---

## 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-04-29 | 初版作成 |
| 2026-04-29 | v1.1 — 設計レビュー反映: 流用 copy 戦略 / テスト範囲明確化 / エラーハンドリング方針 / SEO（JSON-LD）/ Vercel デプロイ詳細 / 削除依頼フロー |
