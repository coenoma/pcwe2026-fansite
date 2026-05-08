# v1.9 — リスト・4 番組モーダルの情報密度押し上げ

リストカード（`MapListView`）と 4 番組モーダル（`TentOverviewSheet`）に、現状ボトムシートまで開かないと見えない情報を **早期に** 出して、選別フェーズの判断スピードを倍増させる改修。

## ゴール

「ボトムシートを開く前に、行きたいか / 候補に入れたいかを判断できる」状態を実現する。
v1.8 で物販プレビューを追加済み。今回は **状態（お気に入り・会えた）** と **判断材料（hours / tags / link / catchphrase）** を加え、4 番組モーダルは **画面高さの半分弱（45-50vh）で固定 + 内側スクロール** に再構築する。

## 背景

### 現状の不足（v1.8 完了時点）

調査結果サマリー（`Phase 0a` 棚卸しより）:

| 情報 | リストカード | SlotCard | ボトムシート |
|---|:---:|:---:|:---:|
| ⭐ お気に入り状態 | ❌ | ❌ | ✅ ボタン |
| ✓ 会えた状態 | ❌ | ❌ | ✅ ボタン |
| 営業時間（hours）| ❌ | ❌ | ❌（表示すべき）|
| ジャンル | ❌ | ✅ テキスト | ✅ |
| catchphrase | ❌ | ❌ | ✅ amber 強調 |
| fanGuide.tags | ❌ | ❌ | ❌（表示すべき）|
| link アイコン（Spotify/X/IG）| ❌ | ❌ | ❌ |
| 物販プレビュー | ✅ v1.8 追加 | ✅ v1.8 追加 | ✅ v1.8 追加 |

### 4 番組モーダルの構造課題

- 現状 `max-h-[88vh] / lg:max-h-[92vh]` でほぼ全画面
- ユーザー意図: 「画面高さの半分弱で固定 + 内側スクロール」
- → **45vh 程度で固定** + SlotCard リッチ化で「情報密度 × 内側スクロール」両立

---

## 📊 進捗マトリクス

| Phase | タスク | 状況 | 担当 | 備考 |
|---|---|:---:|---|---|
| **Phase 0: 設計** | 既存資産・情報棚卸し（Phase 0a）| ✅ | Claude | Explore agent で完了 |
| | 設計書作成（Phase 0b）| ✅ | Claude | 本ドキュメント |
| | 設計書セルフレビュー（Phase 0c）| ✅ | Claude | stretched button / 絵文字 link / 既存 tagAxisClass 再利用 |
| | ユーザー承認 | ✅ | コエノマ | 方向性 OK、実装感で最適化指示あり |
| **Phase 1: 共通拡張** | `BoothStateBadges.tsx` 新規（⭐/✓ 状態バッジ）| ✅ | Claude | size sm/md、ring-2 で視認性確保 |
| | `BoothLinkIcons.tsx` 新規（Spotify/X/IG アイコン）| ✅ | Claude | 絵文字 + stopPropagation、Client Component |
| **Phase 2: format ヘルパー拡張** | `compactHours` 純粋関数追加 | ✅ | Claude | "10:00 - 18:00" → "10-18時" |
| **Phase 3: MapListView リッチ化** | HTML 構造を stretched ボタンに刷新 | ✅ | Claude | ProgramCard と整合 |
| | catchphrase 主軸（subCatch フォールバック）| ✅ | Claude | 「」で囲み |
| | fanGuide.tags 軸別カラー pill | ✅ | Claude | tagAxisClass 再利用 |
| | 営業時間 inline | ✅ | Claude | ブース番号の右に「· 10-18時」 |
| | 状態バッジ overlay（サムネ右上）| ✅ | Claude | -right-1.5 -top-1.5 |
| | link アイコン footer | ✅ | Claude | 14px、justify-end |
| | merchandiseTags の bg を secondary-100 に強化 | ✅ | Claude | fanGuide.scene tags との視覚分離 |
| **Phase 4: TentOverviewSheet 強化** | 高さ 88vh → 55vh / lg 60vh 固定 + 内側スクロール | ✅ | Claude | flex-col + flex-1 overflow-y-auto |
| | sticky ヘッダー（drag handle + タイトル + 閉じる）| ✅ | Claude | shrink-0 で固定 |
| | SlotCard に catchphrase（amber 蛍光下線）| ✅ | Claude | line-clamp-2 |
| | SlotCard に fanGuide.tags 軸別 pill | ✅ | Claude | 上位 3 件 |
| | SlotCard に営業時間 inline | ✅ | Claude | ブース番号バッジの右 |
| | SlotCard に状態バッジ overlay | ✅ | Claude | サムネ右上 |
| | TentSlotInfo に isFavorite/isVisited 追加 | ✅ | Claude | 型拡張 |
| **Phase 5: MapClient props 配線** | `MapListView` に favorites/visited 渡し | ✅ | Claude | |
| | `tentSlotsInfo` 構築時に状態注入 | ✅ | Claude | useMemo deps 更新 |
| **追加: 文言修正** | MerchandisePreview sheet-header の出典依存テキスト解消 | ✅ | Claude | 「下のブース物販セクションで詳細 ↓」に汎用化 |
| **Phase 6: 検証** | type-check | ✅ | Claude | pass |
| | lint | ✅ | Claude | warning 0 追加（既存 1 件は本 Phase 起因なし）|
| | build | ✅ | Claude | pass、bundle 問題なし |
| | 実装後セルフレビュー（4 観点）| ✅ | Claude | OK |
| **Phase 7: デプロイ** | コミット → main マージ | ✅ | Claude | feature/merchandise-with-x-embed |
| | Vercel 自動デプロイ確認 | ⏳ | コエノマ | プレビュー目視 |

**凡例**: ✅ 完了 / 🟡 進行中 / ⏳ 未着手 / ⚠️ ブロック中

---

## スコープ詳細

### A. リストカード（`MapListView`）改修

#### 改修後の縦構造

```
┌────────────────────────────────────────┐
│ [サムネ 64x64] ブース 042 / 5/9土・10-18時 │ ← 営業時間 NEW
│  ⭐or✓bg     あきらめラジオ                │ ← 状態バッジ overlay NEW
│              「諦めを超えて、アートに生きる」│ ← catchphrase NEW（subCatch 置換）
│              内省的 / じっくり / 一人語り   │ ← fanGuide.tags NEW
│              🎟体験 ✨限定                 │ ← merchandiseTags（既存）
│              ──────────────────────────── │
│  🛍 [画像] 命綱ターミナルチェーン  +1件     │ ← v1.8 物販プレビュー
│  ✨ ハンドメイドの諦め越え               │ ← spotlight（既存）
│              ──────────────────────────── │
│              [Spotify][X][IG]             │ ← link アイコン NEW
└────────────────────────────────────────┘
```

#### 詳細仕様

**catchphrase / subCatch 切替**:
- catchphrase が空でない番組: catchphrase（line-clamp-2、`text-xs font-bold text-neutral-900`）
- catchphrase が空: subCatch（既存 line-clamp-2 維持）
- catchphrase は手書きの強い 1-2 行コピー → リストの主軸を担うべき

**状態バッジ（オーバーレイ）**:
- サムネ右上に配置（`absolute top-1 right-1`）
- お気に入り中のみ: ⭐ amber 円、24x24
- 会えた済みのみ: ✓ accent-cyan 円、24x24
- 両方: 縦並び（⭐ 上 / ✓ 下）

**営業時間表示**:
- ブース番号の右に `· 10-18時` を inline 追加
- フォーマット: `exhibition.hours` ("10:00 - 18:00") から `H-H時` に圧縮
- 全番組共通なら割愛可、まずは表示

**fanGuide.tags 表示**:
- 上位 3 件、**既存 `tagAxisClass()` で軸別カラー pill**（ProgramCard と同じ）
- 例: 「内省的」（雰囲気軸）、「じっくり」（雰囲気軸）、「一人語り」（内容軸）
- 内部実装: `src/lib/tag-axis.ts` の `tagAxis(tag)` + `tagAxisClass(axis)` を再利用
- merchandiseTags（emoji + secondary-50）とは色彩が異なる → 視覚分離自動的に達成

**link アイコン**:
- Spotify (🎧) / X (𝕏) / Instagram (📷) の 3 つ（present のみ表示）
- 既存 `ProgramCard.tsx` の Spotify ボタン（🎧 絵文字）パターンを踏襲
- 各 link は独立した `<a target="_blank">` で外部遷移
- カード footer 左寄せ、各 18-20px

**HTML 構造の刷新（必須）**:
現状 `MapListView` のカードは外殻 `<button onClick={onSelect}>` 1 枚で構成されているが、
内側に `<a>` を入れると **HTML 仕様違反**（インタラクティブ要素のネスト禁止）になる。
`ProgramCard.tsx` で使われている **「stretched ボタンパターン」** に書き換える:

```tsx
<article className="group relative rounded-2xl border ...">
  {/* 全体タップ用の stretched button（z-10）*/}
  <button
    type="button"
    onClick={() => onSelect(placement)}
    aria-label={`${name} のブース詳細を開く`}
    className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 ..."
  >
    <span className="sr-only">ブース詳細</span>
  </button>

  {/* 表示コンテンツ（ボタンに重なる、ポインターイベント素通し）*/}
  <div className="pointer-events-none p-3">
    {/* サムネ + 番組名 + tags + 物販プレビュー + spotlight */}
  </div>

  {/* 個別アクションは z-20、pointer-events 戻し */}
  <div className="relative z-20 flex gap-2 px-3 pb-3 pointer-events-auto">
    {/* link アイコン群（<a target="_blank">）*/}
    <BoothLinkIcons links={program.links} />
  </div>
</article>
```

これで HTML 仕様違反なし、link アイコンが独立クリック可能、状態バッジも overlay 可能。

### B. 4 番組モーダル（`TentOverviewSheet`）50vh 固定化

**高さ仕様**:
- `max-h-[45vh]` （SP）
- `lg:max-h-[50vh]`
- 内側スクロール（既存の `overflow-y-auto` を維持）
- sticky header（drag handle + タイトル）は固定（`sticky top-0`）

**理由**: ユーザー指示「画面高さの半分弱」 = 約 45-50vh。**マップ画面が背景に見えるサイズ感** で、コンテキストを失わずに 4 番組を比較できる。

### C. SlotCard 改修（4 番組モーダル内のカード）

#### 改修後

```
┌─────────────────────────────────┐
│ [14-A]・10-18時      ⭐or✓     │ ← 営業時間 + 状態バッジ NEW
│ ジャンル                        │
│                                 │
│ [サムネ 56x56] 番組名            │
│                subCatch 1 行    │
│                                 │
│ 「諦めを超えて、アートに生きる」 │ ← catchphrase NEW（amber-50 box）
│                                 │
│ 内省的 / じっくり / 一人語り     │ ← fanGuide.tags NEW
│ 🎟体験 ✨限定 📕ZINE 🎁無料      │ ← merchandiseTags 最大 4
│                                 │
│ 🛍 [画像] 代表物販 +N件          │ ← 物販プレビュー（既存）
│ ✨ spotlight 1 行                │ ← spotlight（既存）
└─────────────────────────────────┘
```

**変更点**:
- `[14-A]` バッジの右に `・H-H時` 営業時間 inline
- 右上に `⭐ / ✓` 状態バッジ（共通コンポーネント `BoothStateBadges` を再利用）
- catchphrase を amber-50 box で 1 行表示（`line-clamp-1`、無ければスキップ）
- fanGuide.tags 上位 3 件を `/` 区切り
- merchandiseTags 最大 3 → 4 件に拡張（`overflow-x-auto` で横スクロール許容）

### D. 共通コンポーネント新規

#### `BoothStateBadges.tsx`

```typescript
interface Props {
  isFavorite: boolean;
  isVisited: boolean;
  size?: 'sm' | 'md'; // sm: 20px (リスト用) / md: 24px (SlotCard 用)
  className?: string;
}

export function BoothStateBadges({ isFavorite, isVisited, size = 'sm', className }: Props) {
  if (!isFavorite && !isVisited) return null;
  // ⭐ amber 円 / ✓ accent-cyan 円を縦並び
}
```

#### `BoothLinkIcons.tsx`

```typescript
interface Props {
  links: Program['links']; // spotify / x / instagram のみ参照
  programName: string;     // aria-label 生成用
  size?: number;           // 18-20px
  className?: string;
}

export function BoothLinkIcons({ links, programName, size = 18, className }: Props) {
  // present な link だけアイコン化（spotify=🎧 / x=𝕏 / instagram=📷）
  // 各 <a target="_blank" rel="noopener noreferrer"> aria-label 付き
  // ProgramCard の Spotify ボタン（🎧 絵文字）パターン踏襲
  // 不要な依存追加なし（lucide-react / Simple Icons 不要）
}
```

絵文字採用の理由:
- 既存 `ProgramCard.tsx` の Spotify ボタンが 🎧 絵文字を使用
- アイコンライブラリ追加なし（bundle 削減）
- カラフルな絵文字 → リンクの存在を瞬時に視認

---

## 設計判断ログ

### catchphrase を主にする理由

- **subCatch**（20-40 字）: 「何の番組か」の説明的コピー
- **catchphrase**（30-50 字）: 「なぜ聴くか」の感情的キャッチ、運営手書き
- ディスカバリー文脈で必要なのは **「興味を引くフック」** = catchphrase
- subCatch は補助に回す or 番組詳細でフルフォーカス

### 状態バッジを「サムネ右上 overlay」にする理由

- 一覧でスクロール中に **状態が即座に分かる** ことが重要
- カード footer に置くと縦スクロール量が増える
- サムネに乗せると視認性が高く、ジャストアイディア「もっと押す」と整合

### link アイコンをリストカードのみに置く理由

- SlotCard に置くと情報過多（4 区画 × 3 アイコン = 12 アイコン乱立）
- リストカードは縦スクロール前提なので余裕あり
- ボトムシートにも追加検討の余地あり（本 Phase では非ゴール）

### 4 番組モーダルの 45-50vh について

- **45vh** = 画面の 45%、SP iPhone 12（844px）で約 380px
- 4 区画グリッド 2x2 で各 SlotCard 約 180px → ヘッダー 80px 引いて 300px、収まる
- スクロール時は内側で完結、背景マップは見えたまま（コンテキスト維持）
- 50vh は PC で margin が増えるだけ、機能的には 45vh 同等

---

## 影響範囲

### 新規

- `src/components/map/BoothStateBadges.tsx`
- `src/components/map/BoothLinkIcons.tsx`

### 改修

- `src/components/map/MapListView.tsx`（情報追加 + props 拡張）
- `src/components/map/TentOverviewSheet.tsx`（50vh 化 + SlotCard リッチ化 + props 拡張）
- `src/app/map/_components/MapClient.tsx`（state を MapListView / TentOverviewSheet に渡す）

### 影響なし

- `data/programs.json`（データ変更なし）
- `BoothBottomSheet.tsx`（既存維持、本 Phase 範囲外）
- `MerchandisePreview.tsx`（v1.8 で確定、再利用のみ）
- マップ SVG（`VenueMap.tsx`）

---

## 受け入れ基準

### 機能面

- [ ] リストカードに ⭐ お気に入り / ✓ 会えた 状態バッジが overlay 表示される
- [ ] リストカードに営業時間が表示される
- [ ] リストカードに catchphrase が主表示され、空ならば subCatch にフォールバック
- [ ] リストカードに fanGuide.tags 上位 3 件が表示される
- [ ] リストカードに Spotify / X / Instagram のリンクアイコンが表示される（present のみ）
- [ ] 4 番組モーダルが画面高さ 45vh / lg 50vh で固定され、内側スクロールが可能
- [ ] SlotCard に状態バッジ + catchphrase + 営業時間 + fanGuide.tags が追加される
- [ ] お気に入り / 会えた状態がリストカード・SlotCard で **リアルタイム** に反映される（ボトムシートで toggle した直後）

### 品質面

- [ ] `npm run type-check`: pass
- [ ] `npm run lint`: pass（warning ゼロ追加）
- [ ] `npm run build:programs`: pass
- [ ] `npm run build`: pass
- [ ] AGENTS.md 全項目遵守（any/as/eslint-disable 不使用、日本語コメント等）
- [ ] レスポンシブ（SP 375px / md 768px / lg 1280px）

### UX 面

- [ ] リストの 1 列幅でも情報過多に見えない（縦長でも OK）
- [ ] 4 番組モーダル開いた状態でマップが背景に見える（コンテキスト維持）
- [ ] お気に入り済み / 会えた済みのカードが一目で識別できる

---

## 非ゴール

- ボトムシートへの link アイコン追加（必要なら別 Phase）
- ジャンルバッジの色付け / アイコン化（v1.7 で実施済み、流用可）
- vibe / targetListener の表示（情報過多になるリスク、別 Phase で要検討）
- ProgramCard（トップページ）への同様改修（マップ画面のみが本 Phase スコープ）
- 既存 `as string` 等の AGENTS.md 違反コード（MapClient.tsx L559）の修正 — 本 Phase では別の改修と切り分け、後続 Phase で対応

---

## 実装手順（ジュニアエンジニア向け）

### Step 1: 共通コンポーネント先行実装

1. `BoothStateBadges.tsx` 作成（state 表示の共通 UI）
2. `BoothLinkIcons.tsx` 作成（リンクアイコン列）

### Step 2: MapListView 拡張

1. **HTML 構造を stretched ボタンパターンに刷新**（重要）
   - 外殻 `<button>` → 外殻 `<article>` + 内側絶対配置 `<button>` に
   - これにより内部 `<a>` link が HTML 仕様違反なく置ける
2. props 拡張: `favorites: string[]` `visited: Record<string, string>`
3. catchphrase 表示ロジック（subCatch フォールバック）
4. 営業時間 / fanGuide.tags / 状態バッジ / link アイコン 追加
5. fanGuide.tags の色付け: 既存 `tagAxisClass(tagAxis(tag))` 再利用
6. 営業時間ヘルパー: `src/lib/format.ts` に `compactHours(hours: string)` 追加 or インライン整形
7. `MapClient.tsx` 側で props 渡し

### Step 3: TentOverviewSheet 50vh 化 + SlotCard 改修

1. モーダル外殻 `max-h-[88vh] → max-h-[45vh] / lg:50vh`
2. SlotCard に props 追加（matchesFilter は既存、isFavorite / isVisited を追加）
3. SlotCard 内に catchphrase / hours / tags / state badge を追加
4. `TentSlotInfo` 型に `isFavorite?: boolean` `isVisited?: boolean` 追加
5. `MapClient.tsx` 側で `tentSlotsInfo` 構築時に渡す

### Step 4: ビルド検証

`npm run type-check && npm run lint && npm run build:programs && npm run build`

### Step 5: コミット → main マージ

進捗マトリクスを完了化、4 観点セルフレビューしてコミット。

---

## 関連ドキュメント

- `AGENTS.md`: プロジェクトお作法
- `docs/plans/v1.8-merchandise-preview-on-discovery/README.md`: 直前 Phase（物販プレビュー）
- `docs/plans/v2-interactive-map/README.md`: マップ全体の前提
- `docs/plans/v1.7-discover-ux/README.md`: ProgramCard / フィルタの前提
- `src/lib/types.ts`: Program 型定義
- `src/lib/booth-visit.ts`: favorites / visited 純粋関数

---

**作成日**: 2026-05-08
**メンテナ**: Claude（コエノマ運用下）

---

## 📝 v1.9.1 補正（2026-05-08 ユーザー再指摘）

### 設計誤解の修正

**誤**: モーダル全体を 50vh 弱（半分弱）にする
**正**: **1 SlotCard が 50vh 弱、4 番組（2x2）で画面いっぱい** にする

### 補正後の高さ設計

| 要素 | 当初実装（誤）| 補正後（正）|
|---|---|---|
| モーダル全体 | `max-h-[55vh] / lg:60vh` | `max-h-[95vh] / lg:95vh` |
| 1 SlotCard | 自然伸縮（圧縮）| **min-h-[48vh]**（50vh 弱の縦長カード）|
| グリッド | 2 列 = 1 段 + スクロール | 2 列 x 2 段 = 4 番組フル展開 |

### SlotCard の縦長化に伴う情報追加

50vh 弱（≒ 400px）の縦スペースを活かし、現状の縦圧縮表示 → **詳細ページに準じる情報量** へ拡張:

| 表示要素 | 当初 v1.9 | 補正後 |
|---|---|---|
| サムネサイズ | 56x56 | **72x72** |
| 番組名 | line-clamp-2 | **line-clamp-2 / 大きめフォント (text-sm)** |
| subCatch | line-clamp-1 | **line-clamp-2** |
| catchphrase | line-clamp-2（蛍光下線）| **line-clamp-3（蛍光下線、本文 text-xs）**|
| fanGuide.tags | 上位 3 件 | **全件表示**（最大 5 件）|
| merchandiseTags | 上位 3 件 | **全件表示**（最大 6 件）|
| 物販プレビュー | 代表 1 件 + +N | **代表 1 件 + サムネ + +N**（v1.8 既存維持）|
| spotlight | line-clamp-1 | **line-clamp-2**（amber/primary 強調） |
| **追加候補** |  |  |
| recommendedEpisode | 非表示 | **「🎧 このエピソード聴く」CTA** |
| 営業時間 | inline 1 行 | inline 1 行（変更なし）|
| 状態バッジ | サムネ右上 | サムネ右上（変更なし）|

### 補正による進捗マトリクス追加

| Phase | タスク | 状況 | 担当 | 備考 |
|---|---|:---:|---|---|
| **Phase 8: SlotCard 縦長化** | モーダル高さ 55vh → 95vh | ✅ | Claude | SP/lg 共通 |
| | SlotCard min-h-[48vh] | ✅ | Claude | flex-col、CTA を mt-auto で底面に |
| | SlotCard 外殻を stretched button パターンに | ✅ | Claude | recommendedEpisode を内側 a タグに置くため |
| | サムネ 56 → 72px | ✅ | Claude | h-18 w-18 |
| | catchphrase line-clamp-3 | ✅ | Claude | text-xs、amber 蛍光下線 |
| | subCatch line-clamp-1 → line-clamp-2 | ✅ | Claude | |
| | fanGuide.tags 全件 | ✅ | Claude | flex-wrap、text-[10px] |
| | merchandiseTags 全件 | ✅ | Claude | flex-wrap |
| | spotlight line-clamp-2 | ✅ | Claude | |
| | recommendedEpisode CTA | ✅ | Claude | 「🎧 エピソードを試聴する」external link |
| **Phase 9: 検証 + コミット** | type-check / lint / build | ✅ | Claude | pass |
| | コミット → main マージ | ✅ | Claude | |

### スクロール挙動

- モーダル全体: 95vh の box（ほぼ全画面）
- ヘッダー（drag handle + タイトル + 閉じる）: shrink-0 固定 ≒ 60px
- グリッド領域: flex-1 overflow-y-auto
- 4 番組フィット時: スクロール不要（2 段で収まる）
- 1 番組ヒット時: max-w-md で中央 1 列、縦長 1 SlotCard

### 受け入れ基準（補正版）

- [ ] モーダル開いたとき画面ほぼいっぱい（背景マップは隅にちらり見える）
- [ ] 4 番組ヒット時、2x2 で全番組が縦スクロールなしに見える（SlotCard 内のスクロールは内側ヒエラルキーで）
- [ ] catchphrase が line-clamp-3 でホストの世界観が伝わる
- [ ] recommendedEpisode CTA がブース未訪問でも音源で先に試聴できる動線になる

---

## 📝 v1.9.2 補正（2026-05-08 ユーザー再指摘）

### 設計思想の根本転換

**ユーザー指摘**:
> 「体験」とか「珍しい」とか、なにができるの？で検索してるのに、番組名どーん、サムネイルどーん、一言説明、がメインででるって違くない？

**問題**: v1.9.1 までの SlotCard / リストカードは **「番組情報主役 + 物販情報補助」** の構造。
ユーザーが merchandiseTags フィルタで絞り込んでいる **選別フェーズ** では、
「何が買えるか / 何が体験できるか」が知りたいので、**物販情報を主役**にすべき。

### 主役の入れ替え

| 要素 | v1.9.1 までの位置 | v1.9.2 補正後 |
|---|---|---|
| 物販タグ（merchandiseTags）| 中段、small pill | **最上段、大きめ pill / 視認性最重視** |
| 代表物販 name + サムネ | 中段、1 件のみ + +N | **メイン、上位 2 件 name + サムネを大きく** |
| 物販ハイライト（spotlight）| 末尾、line-clamp-1 | **強調 box（amber/primary 背景）、line-clamp-2** |
| 番組サムネ | 大（72px）| **補助（40-48px）** |
| 番組名 | text-sm 主役 | **text-xs / 補助エリアに格下げ** |
| catchphrase | 蛍光下線 line-clamp-3 | **line-clamp-2、補助エリア内** |
| subCatch | line-clamp-2 | **line-clamp-1 補助** |
| fanGuide.tags | 全件 | **上位 3 件、補助エリア内** |
| 状態バッジ | サムネ右上 | **ヘッダー右上**（番組サムネを小さくするため位置移動）|

### 新構造（4 番組モーダル SlotCard）

```
┌─────────────────────────────────────────┐
│ [11-A] 10-18時 · その他          ⭐✓     │ ← ヘッダー（小）
├─────────────────────────────────────────┤
│ 🎟体験  ✨限定  📕ZINE  🎁無料           │ ← 物販タグ（メイン、大きめ）
│                                         │
│ 🛍 ブース物販                            │
│ ・[画像] 命綱ターミナルチェーン          │ ← 上位 2 件、画像 32-40px
│ ・[画像] 真鍮のあきらめラジオチャーム    │
│ +1 件、下のリストで詳細                  │
│                                         │
│ ✨ ファンガイドおすすめ                  │ ← spotlight（強調 box）
│ ハンドメイドの諦め越え                   │
│   primary-50 背景                       │
├─────────────────────────────────────────┤
│ [サムネ 40px] あきらめラジオ            │ ← 番組情報（補助、コンパクト）
│              「諦めを超えて、アートに    │
│              生きる」（line-clamp-2）   │
│              内省的 / じっくり / 一人語り│
├─────────────────────────────────────────┤
│ 🎧 エピソードを試聴する                  │ ← CTA
└─────────────────────────────────────────┘
```

### 新構造（リストカード）

```
┌─────────────────────────────────────────┐
│ ブース 042 · 10-18時 · 5/9 土   ⭐✓     │ ← ヘッダー
├─────────────────────────────────────────┤
│ 🎟体験  ✨限定                            │ ← 物販タグ（大）
│                                         │
│ 🛍 ブース物販                            │
│ ・[画像] 命綱ターミナルチェーン          │ ← 上位 2 件
│ ・[画像] ステッカーセット                │
│ +1 件                                   │
│                                         │
│ ✨ ハンドメイドの諦め越え                │ ← spotlight（amber/primary）
├─────────────────────────────────────────┤
│ [サムネ 48px] あきらめラジオ            │ ← 番組（補助）
│              内省的 / 一人語り           │
├─────────────────────────────────────────┤
│ [🎧][𝕏][📷]                              │ ← link footer
└─────────────────────────────────────────┘
```

### 新規・改修コンポーネント

#### `MerchandiseSpotlight.tsx`（新規、共通）
- 上位 2 件の name + 物販画像 + +N件 を構造化表示
- `MerchandisePreview variant="sheet-header"` を踏襲・強化
- 4 番組モーダル / リストカード両方で使用

#### `BoothInfoCompact.tsx`（新規、共通）
- 番組サムネ（小）+ 番組名 + catchphrase / subCatch + fanGuide.tags
- 補助エリアとして再利用可能

#### 既存改修
- `MapListView.tsx`: 構造を物販主役に再構築
- `TentOverviewSheet.tsx`: SlotCard 構造を物販主役に再構築

### 進捗マトリクス（v1.9.2）

| Phase | タスク | 状況 | 担当 | 備考 |
|---|---|:---:|---|---|
| **Phase 10: 設計** | 設計書（本セクション）| ✅ | Claude | |
| | セルフレビュー | ✅ | Claude | MerchandisePreview に新 variant 追加、BoothInfoCompact 新規方針 |
| | ユーザー承認 | ✅ | コエノマ | 「完璧！」 |
| **Phase 11: 共通コンポーネント** | `MerchandisePreview.tsx` に `card-main` variant 追加 | ✅ | Claude | 見出し + サムネ 36px + 上位 2 件 + +N件 |
| | `BoothInfoCompact.tsx` 新規 | ✅ | Claude | サムネ + 番組名 + subCatch + catchphrase + fanGuide.tags |
| **Phase 12: SlotCard 物販主役化** | 構造を 6 セクションに再分割 | ✅ | Claude | header / merchTags / merchHighlight / spotlight box / 番組補助 / CTA |
| | merchandiseTags の視覚強化 | ✅ | Claude | px-2 py-0.5 text-xs font-bold（フィルタ検索の答え）|
| | spotlight を amber/primary 背景の box に | ✅ | Claude | rounded-xl border bg-primary-50 |
| | 番組情報を mt-auto で底面寄せ + 区切り線 | ✅ | Claude | 主役物販と視覚分離 |
| **Phase 13: リストカード 物販主役化** | 同様の構造再分割 | ✅ | Claude | stretched button 維持 |
| | 状態バッジをサムネ overlay → header 右上に | ✅ | Claude | サムネ縮小に伴う移動 |
| **Phase 14: 検証** | type-check / lint / build | ✅ | Claude | pass、TentOverviewSheet の未使用 Image import を削除 |
| | 4 観点セルフレビュー | ✅ | Claude | OK |
| **Phase 15: デプロイ** | コミット → main マージ | ✅ | Claude | |

### 受け入れ基準（v1.9.2）

- [ ] フィルタ「体験」で絞ったとき、🎟体験 タグと体験内容（物販 name）が **画面上半分** に出る
- [ ] 番組名・サムネ・catchphrase は **画面下半分**（補助）に
- [ ] spotlight が amber / primary 背景で **目立つ box** として表示される
- [ ] 物販詳細 ≥ 2 件の番組で、上位 2 件の name + サムネ画像が見える
- [ ] 状態バッジ（⭐/✓）はヘッダー右上に移動
- [ ] type-check / lint / build pass
