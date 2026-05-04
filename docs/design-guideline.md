# PCWE2026 ファンガイド デザインガイドライン

> 最終更新: 2026-05-02
> 対象: サイト全体（番組詳細ページの「番組らしさ」表現は別管理）

---

## 0. 設計哲学（Why）

このサイトは **「PODCAST WEEKEND 2026 出展 142 番組から、自分に刺さる番組を見つけてもらう非公式ファンガイド」**。サイト全体のトーンは下記 2 つの引用元の合成で構成する。

| 引用元 | 引き継ぐもの |
|---|---|
| **podmate.fm** | プライマリーカラー（オレンジ #DC725A）/ ファン視点の語り口 / 蛍光下線アクセント / マイクのモチーフ |
| **ahamo.com** | 都会的・知的・読みやすい Sans-serif / 余白の大胆さ / 数字主導の説得力 / セカンダリの濃いブルー |

「AI が生成した装飾過剰なテンプレ LP」に陥らないために、**装飾は意図のあるものだけ残し、ノイズを徹底的に削る**。

---

## 1. カラーシステム

### 1.1 プライマリ（podmate ブランドオレンジ）

| トークン | hex | 主な用途 |
|---|---|---|
| `primary-50` | `#fdf3f1` | 軽い背景（カード背景、selected state） |
| `primary-100` | `#fbe7e2` | 同上、よりコントラスト |
| `primary-200` | `#f5cabe` | アウトラインボタンのボーダー |
| `primary-300` | `#ee9f8a` | アウトラインボタンの hover ボーダー |
| `primary-400` | `#e58563` | 装飾アクセント |
| `primary-500` | `#dc725a` | **ブランド主色**（ロゴ・主タイトル強調） |
| `primary-600` | `#c25c44` | **主 CTA の塗り色**（「AIリコメンド」ボタンなど） |
| `primary-700` | `#a14938` | テキストでの強い強調 |

**使うところ**: ロゴ、Header の主 CTA、蛍光下線、アウトラインボタン、ホバー強調、selected state

### 1.2 セカンダリ（ahamo インスパイアの濃いブルー）

| トークン | hex | 主な用途 |
|---|---|---|
| `secondary-50` | `#eef4fc` | データバッジの淡背景 |
| `secondary-100` | `#d6e4f6` | 同上、強め |
| `secondary-300` | `#76a2dc` | 装飾線、軽い hover |
| `secondary-500` | `#2962b1` | データの中強調、ホバー色 |
| `secondary-600` | `#1a4f99` | **「数字を読ませる」ときの色** |
| `secondary-700` | `#143e7c` | データ系の強調テキスト |
| `secondary-900` | `#0a2347` | 黒に近い濃いアクセント、フッター類 |

**使うところ**:
- 開催日アイコン（カレンダー = データ的）
- 大型数字「142」「30」「44」など
- 統計・タイムテーブル系
- 「公式情報」「外部公式リンク」など知的・公式な動線
- primary との二系統対比で「探索 vs データ」を示す

⚠️ **使ってはいけない場所**: 番組詳細の番組らしさ表現、感情的なコピー、Hero の主タイトル

### 1.3 アクセント（accent-cyan、ahamo CTA インスパイア）

| トークン | hex | 主な用途 |
|---|---|---|
| `accent-cyan-300` | `#5dd9f0` | 軽い装飾 |
| `accent-cyan-400` | `#2bcae6` | リアルタイム性のあるバッジ |
| `accent-cyan-500` | `#00b3d4` | **特別な通知・新機能・ライブ配信のみ** |
| `accent-cyan-600` | `#0095b3` | 同上の hover |

**使うところ**:
- 「LIVE」「期間限定」など本当に特殊な瞬間
- 通常 UI では使わない（primary オレンジと喧嘩する）

### 1.4 補助カラー

| 色 | 用途 |
|---|---|
| `amber-200` | 蛍光下線（Hero の「これ刺さる」など。**金色の余韻**を演出） |
| `amber-50` | カード背景の軽い暖色 |
| `neutral-* (50-900)` | テキスト・ボーダー・背景の階調 |
| `red-500` | エラー、削除依頼、重大な警告のみ |

---

## 2. タイポグラフィ

### 2.1 サイト全体の基本フォント

**Noto Sans JP**（layout.tsx で next/font 経由読込、`--font-noto-sans-jp` を `--font-sans` の最初に登録）

| 重さ | 用途 |
|---|---|
| `400` | 本文 |
| `500` | サブ見出し、リード |
| `700` | 主見出し、ボタン |
| `900` | Hero の大型数字、強調タイトル |

### 2.2 番組詳細「番組らしさ」フォント（vibe 別、6 種）

番組詳細ページのキャッチコピー部分でだけ使う。サイト UI には使わない。

| フォント | 推奨される vibe |
|---|---|
| Klee One | 手書き温かみ系（laid-back） |
| Noto Serif JP | 知的・落ち着き（contemplative） |
| RocknRoll One | 印象・太字系（energetic） |
| DotGothic16 | レトロ・遊び心（humorous） |
| Shippori Mincho | 上品・和（intellectual） |
| Zen Kaku Gothic New | ニュートラル現代（earnest / conversational） |

### 2.3 階層

```
h1 = text-3xl ~ text-6xl, font-extrabold (700-900)
h2 = text-xl ~ text-3xl, font-extrabold (700)
h3 = text-base ~ text-lg, font-bold (700)
body = text-sm ~ text-base, font-normal (400)
small = text-xs, font-normal
```

**iOS 自動ズーム対策**: `<input>` `<select>` `<textarea>` は **必ず 16px 以上**（globals.css に保険 CSS あり）。

---

## 3. 余白・レイアウト

### 3.1 コンテナ

```
max-w-6xl mx-auto px-4 sm:px-6  // メインコンテンツ幅
max-w-3xl                       // 番組詳細・記事系の読み物幅
```

### 3.2 セクション間の余白

```
py-10 sm:py-14   // 通常セクション
py-12 sm:py-16   // 主要セクション（CURATION, MOOD など）
py-16 sm:py-24   // Hero
```

### 3.3 余白の哲学（ahamo インスパイア）

**ノイズ削減 = 装飾を足すより、余白を増やす**。情報密度を上げず、要素 1 つ 1 つに呼吸を持たせる。

---

## 4. AI っぽさを避けるルール（最重要）

実装時に **避けるべきパターン** をリスト化。

### 4.1 装飾の引き算

| ❌ 避ける | ✅ 推奨 |
|---|---|
| グラデを 3 色（from-X via-Y to-Z）| 単色 or 2 色グラデ |
| Header / Hero に装飾線 + ドット背景 + ブロブ | 装飾は 1〜2 個に厳選 |
| `shadow-xl` `shadow-2xl` 多用 | `shadow-sm` `shadow-md` に抑える |
| `rounded-2xl` `rounded-3xl` を全カードに | 主要カード `rounded-2xl`、サムネ `rounded-xl` |
| 全カードに vibe 別のアクセント線・色 | ニュートラル、必要なら 1 ヶ所だけ強調 |

### 4.2 タイポと言語

| ❌ 避ける | ✅ 推奨 |
|---|---|
| 英大文字 + tracking-[0.18em] バッジ多用 | 日本語見出し or 完全に削除 |
| 絵文字でカテゴリ分類 🎲 ✨ 🎯 🌙 🤣 ... | 機能の絵文字はゼロ、感情の絵文字は最小限 |
| 「3 通り」「5 つの…」「4 つの…」と数字でストラクチャ化 | 数字は本当に意味があるとき（「142 番組」「30 秒」）だけ使う |
| 「、」を 3 つ以上含む文 | 1 文に「、」は 1〜2 個まで |
| 比喩的な装飾語の連続（「ふわっと」「ぴたっと」「芋づる式」を 1 文に）| 1 つだけ残してアクセントに |

### 4.3 カラー

| ❌ 避ける | ✅ 推奨 |
|---|---|
| 全カードに themeColor を当てて systemize | カード本体はニュートラル、必要なら primary だけ |
| primary / secondary / accent を同じ画面で混在使用 | 同一画面内では 1 ファミリー中心 |
| amber 蛍光下線を多用 | Hero の主タイトルなど 1〜2 ヶ所だけ |

### 4.4 レイアウト

| ❌ 避ける | ✅ 推奨 |
|---|---|
| 全部のセクションを中央寄せ + バッジ + 説明文 + CTA | 中央 / 左寄せをセクションごとに使い分け |
| カードに枠線 + 影 + アクセント線 + アイコン全部盛り | カード全体は質素、変化は hover で |

---

## 5. UI コンポーネント規約

### 5.1 ボタン階層

| 種類 | スタイル | 用途 |
|---|---|---|
| **Primary CTA** | `bg-primary-600 text-white rounded-full shadow-sm` | 主アクション（「AIリコメンド」「フォームを開く」など）。1 画面 1〜2 個まで |
| **Outline ボタン** | `border-2 border-primary-300 bg-white text-primary-700 rounded-full` | 公式リンク / 外部遷移 / 副次的なアクション |
| **Ghost** | `text-neutral-700 hover:bg-neutral-100 rounded-full` | ナビ系、副次的なリンク |

### 5.2 カード

```
基本: rounded-2xl border border-neutral-200 bg-white
hover: -translate-y-1 + border-primary-300 + shadow-xl
ProgramCard の overflow: <article> は overflow-visible（tooltip クリップ防止）、
                        画像 div だけ rounded-t-2xl + overflow-hidden
```

### 5.3 画像

- `next/image` を使用（output: 'export' では unoptimized: true）
- `fill` モード時は親に `relative` + 明示的な aspect-ratio
- `'use client'` 内で動的表示する場合は **`priority` + `unoptimized`** を明示（lazy 判定遅延バグ回避）

### 5.4 アクセシビリティ

- 全 `<button>` `<a>` に `aria-label` または明示テキスト
- focus 時は `focus-visible:ring-2 focus-visible:ring-primary-500`
- 画像 `<img>`/`<Image>` の `alt` は番組名つき or 装飾なら空文字

---

## 6. 引用元との関係

このプロジェクトは下記の **ブランディングガイドライン**を尊重する：

1. **podmate-next** の `docs/DESIGN_GUIDELINE_BRANDING.md`（プライマリーオレンジ・蛍光下線・マイクのモチーフ）
2. **本ガイドライン**（PCWE2026 fansite 固有 = ahamo 由来の二次ブランド・タイポ・AI 回避ルール）
3. プロジェクトルートの `AGENTS.md`（型安全・日本語化・公式表記禁止 など実装ルール）

---

## 7. デザインの方向転換が必要なときの判断基準

「装飾を足したい」「色を新しく入れたい」と思ったら、まず以下の問いで自問する：

1. **その装飾、本当に意味があるか？** AI 装飾のバイアスではないか？
2. **それを入れるなら、どこかから装飾を削れるか？** 装飾の総量は増やさない
3. **podmate.fm / ahamo に同じ装飾があるか？** 引用元の語法に沿うか
4. **数字や絵文字でない、もっと質的な表現はないか？**

---

## 補足: vibeStyle ライブラリ

`lib/vibe-style.ts` には番組詳細ページの「番組らしさ表現用」の vibe → フォント・カラーマッピングが定義されている。
**サイト UI ではこれは使わない**（共有しないことが大事）。番組詳細ページのキャッチコピー / Hero ロゴエリアでだけ呼び出す。

---

## 8. AI フレンドリー化（Generative Engine Optimization）

ChatGPT / Claude / Perplexity / Google Gemini など生成 AI 経由で番組情報が引用される時代。
非公式ファンガイドとして、**生成 AI に正確に取り扱ってもらえる**ことを最重要視する。

### 8.1 提供している AI 向けエンドポイント

| URL | 形式 | 用途 |
|---|---|---|
| `/llms-full.html` | **HTML** | **AI クライアント向けに最適化された全 142 番組詳細（最も確実、後述 §8.1.1 参照）** |
| `/llms.txt` | Markdown | サイト全体の地図（主要ページ + ジャンル一覧 + 142 番組のリンク） |
| `/llms-full.txt` | Markdown | 全 142 番組の詳細データを 1 ファイルに集約（LLM コンテキスト 1 発取得用） |
| `/api/programs.json` | JSON | 全番組の構造化データ（zod 検証済み正式版） |
| `/sitemap.xml` | XML | 全 168 URL のサイトマップ（`/llms-full.html` は意図的に除外、§8.1.1 参照） |
| `/robots.txt` | TXT | 主要 AI ボット 15 種類を明示的に Allow |

すべて `scripts/build-llms.ts` で `prebuild` 時に自動生成・配置される。

#### 8.1.1 なぜ HTML 版（`/llms-full.html`）も用意するか

ChatGPT 等の web sandbox は **`text/plain` / `application/json` の本文を展開しない実装が観測**されている（URL は開けるがメタ情報のみ返す。検証済み 2026-05）。一方 **HTML は確実に本文展開できる**ため、同一データを HTML 形式でも提供する。

設計判断:

- **sitemap.xml には含めない**: Google 検索結果での重複コンテンツ回避。AI クローラには `/llms.txt` 内のリンク + `AIChatPromptModal` のプロンプト指定で十分発見可能。
- **サイト UI からはリンクしない**: 人間 UX を汚さない（人間ユーザーの 99% は不要）。透明性は About ページに任せず `/llms.txt` の「機械可読データエンドポイント」セクションで担保。
- **CSS は最小インライン**: 装飾より可読性。`system-ui` + 罫線のみ。
- **目次（`<nav class="toc">`）を `<details>` で折り畳み**: AI は読み込むが人間は邪魔されない。
- **`<link rel="alternate">`** で txt / json 版へ相互リンク → AI が同じデータの別フォーマットも辿れる。
- **`rel="nofollow noopener"`** は外部リンクのみ（Spotify / Apple Podcasts 等）。内部リンクは通常通り。

### 8.2 各ページの構造化データ（JSON-LD）

| ページ | スキーマ | 内容 |
|---|---|---|
| トップ | `Event` + `ItemList` | PODCAST WEEKEND 2026 / superEvent: PODCAST EXPO 2026 + 142 番組リスト |
| 番組詳細 | `PodcastSeries` + `BreadcrumbList` | 番組情報 + subjectOf に Event ネスト |
| ジャンル一覧 | `CollectionPage` + `ItemList` | 該当ジャンルの番組コレクション |
| 気分別一覧 | `CollectionPage` + `ItemList` | 該当 mood の番組コレクション |

JSON-LD は必ず `lib/safe-json-ld.ts` の `safeJsonLd()` を経由して `<` `>` `&` を Unicode エスケープ（XSS 対策）。

### 8.3 robots.txt で明示している AI ボット

- OpenAI: `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`
- Anthropic: `ClaudeBot`, `Claude-Web`, `anthropic-ai`
- Perplexity: `PerplexityBot`, `Perplexity-User`
- Google: `Google-Extended`
- Apple: `Applebot-Extended`
- Common Crawl: `CCBot`
- Microsoft: `Bingbot`
- Amazon: `Amazonbot`
- Meta: `meta-externalagent`
- Cohere: `cohere-ai`

新しい AI ボットが登場したら `src/app/robots.ts` に追加する。

### 8.4 AI フレンドリー化のルール

- **新しいデータフィールドを追加した時は `scripts/build-llms.ts` も更新**
  - `llms-full.txt` の `formatProgram()` に追加
- **Schema.org の正式型を使う**
  - 独自の `@type` を作らない、Schema.org の語彙に合わせる
- **`alternateName` を活用**
  - イベント名の表記揺れ（カナ・英・略称）を網羅的に
- **Markdown は LLM が好む形式**
  - 装飾を最小限に、見出し階層と箇条書きで構造化
- **CORS 開放**
  - `/api/*` `/llms*.txt` は `Access-Control-Allow-Origin: *` で外部からの fetch 許可

### 8.5 AI endpoint の HTTP ヘッダー設計（vercel.json 運用ルール）

`/llms.txt` `/llms-full.txt` `/api/programs.json` は **HTML 用のセキュリティヘッダーを付けない**こと。
（CSP / X-Frame-Options / Permissions-Policy は HTML 文書に対するブラウザ実行コンテキスト向けの仕組みで、
テキスト / JSON 単独配信には意味がなく、AI クローラを混乱させる恐れがある）

**vercel.json での具体的な書き方**:

- ❌ `source: "/(.*)"` で全パスにセキュリティヘッダーを付ける書き方
  - Vercel の `headers` は **specific source が global を上書きしない** 挙動
    （observed: 同じ key を後段の specific source で書いても merge されず、global の値が残る）
  - その結果、AI endpoint にも巨大 CSP や `Content-Disposition: filename="llms.txt"` が付き、
    AI クライアント（ChatGPT Web ツール等）が「ダウンロード対象」と誤認識して本文取得に失敗するケースが発生

- ✅ global の source を **negative lookahead で AI endpoint を除外**:
  ```json
  { "source": "/((?!llms\\.txt|llms-full\\.txt|api/programs\\.json).*)" }
  ```
  AI endpoint 側は specific source で `Content-Type: text/plain`（llmstxt.org は text/markdown 推奨だが、
  ChatGPT 等の AI クライアントの web sandbox は text/markdown を「コード扱い」して
  本文展開しないケースが観測されたため text/plain を採用）/ `Content-Disposition: inline`（filename を付けない）/
  `Cache-Control: public, max-age=3600` のみ。

**新しい AI endpoint を追加するときの手順**:
1. `vercel.json` の global negative lookahead に新パスを追加
2. specific source に minimal な headers（Content-Type / Cache-Control / CORS / Content-Disposition: inline）を定義
3. デプロイ後、`curl -sI https://pcwe2026-fansite.podmate.fm/{新パス}` で
   CSP / X-Frame-Options 等が **返っていないこと** を確認
