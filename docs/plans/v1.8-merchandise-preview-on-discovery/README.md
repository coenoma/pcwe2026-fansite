# v1.8 — 物販プレビュー & ディスカバリーモーダル強化

リスト・マップ・ボトムシート・番組詳細を貫く **「物販を魅力的にちょいだし」** UI/UX 改修。

## ゴール

物販情報の **魅力（具体名 + 視覚）** をディスカバリー文脈に届ける。タグだけ・spotlight だけで終わっていた選別フェーズに「**何が買えるか**」を 0.5 秒で伝える層を追加する。同時に、既存ボトムシートの全幅化と番組詳細ページの max-width 拡張で、**情報密度に余裕がある場面はもっと見せる** 方向で底上げする。

## 背景

### 現状の課題（ユーザー指摘）

1. **リスト（MapListView）で「体験」フィルタを掛けても、番組情報とブース位置だけで物販の魅力が伝わらない**
   - タグ（🎟体験）と subCatch / spotlight しか出ない
   - X 埋め込みまで全部入れると情報過多 → 「ちょいだし」が必要

2. **マップで quad テントをタップした時の `TentOverviewSheet`（最大 4 番組モーダル）でも物販情報が見えない**
   - 4 区画それぞれの SlotCard に「番組名 + タグ最大 2」のみ → 番組差別化が弱い
   - モーダルの高さが 78vh どまりで余裕があるのに使えていない（**全幅・全高に近い大型レイアウト OK** とユーザー方針）

3. **`BoothBottomSheet` の物販セクションは X 埋め込みが入って縦に伸びる**
   - 開いた直後は X 埋め込みが目に入る → 「何が買えるか」を一覧で素早く把握する手がかりが弱い

4. **`/booth/[id]` の物販セクション、1 件時 `max-w-md`（448px）で 1 列・2 列表示時に余白が広すぎ**
   - 参考: pcwe-072 のブース物販ページで余白問題が視認可能
   - **600px に拡張**して、X 埋め込みと description のバランスを改善

### 関連既存資産

- v2-interactive-map（マップ全体、SVG/ピン/ボトムシート）
- v1-merchandise-rollout（merchandiseDetails の整備状況、108/145 完了）
- v1.7-discover-ux（リスト UI、フィルタ、CURATION）

本計画はそれらの上に「**ディスカバリー UI で物販を魅力的に見せる横串改修**」として乗る。

---

## 📊 進捗マトリクス

| Phase | タスク | 状況 | 担当 | 備考 |
|---|---|:---:|---|---|
| **Phase 0: 設計** | 既存ドキュメント・お作法調査 | ✅ | Claude | AGENTS.md / v2 / v1.7 確認済 |
| | 設計書作成（本ドキュメント） | ✅ | Claude | |
| | 設計書セルフレビュー（3 観点） | ✅ | Claude | heroImage → imagePath 修正、責務分離方針確定 |
| **Phase 1: 共通コンポーネント** | `MerchandisePreview.tsx` 新規作成 | ✅ | Claude | 3 variant: `list` / `slot` / `sheet-header` |
| | 純粋関数（既存 `groupMerchandiseDetails` 再利用） | ✅ | Claude | 重複コードなし |
| **Phase 2: リストカード強化（A 相当）** | `MapListView` に `MerchandisePreview variant="list"` を統合 | ✅ | Claude | spotlight を line-clamp-2 → 1 へ圧縮 |
| | レスポンシブ目視確認（1 列 / 2 列 / 3 列） | ⏳ | コエノマ | プレビュー環境で目視 |
| **Phase 3: 4 番組モーダル強化（B 相当）** | `TentOverviewSheet` の最大幅・最大高調整 | ✅ | Claude | 78vh → 88vh、lg 85vh → 92vh |
| | `SlotCard` に `MerchandisePreview variant="slot"` を統合 | ✅ | Claude | サムネ 40 → 56px、subCatch / spotlight 追加、タグ 2 → 3 |
| **Phase 4: ボトムシート強化（C 相当）** | `BoothBottomSheet` ヘッダー直下に `MerchandisePreview variant="sheet-header"` 追加 | ✅ | Claude | X 埋め込み前の意思決定支援 |
| **Phase 5: 詳細ページ余白調整（D 相当）** | `MerchandiseList` 1 件時 `max-w-md` → `max-w-[600px]` | ✅ | Claude | 2 件時 `max-w-3xl` は据え置き |
| **Phase 6: 検証** | type-check | ✅ | Claude | pass |
| | lint | ✅ | Claude | 既存の MapClient warning 1 件のみ（本 Phase 起因なし）|
| | build:programs | ✅ | Claude | pass |
| | build | ✅ | Claude | pass、bundle size 問題なし |
| | 実装後セルフレビュー（4 観点） | ✅ | Claude | 要件 / お作法 / ベストプラクティス / 暫定対応 OK |
| | 進捗マトリクスを完了状態に更新 | ✅ | Claude | 本ドキュメント |
| **Phase 7: デプロイ** | コミット → feature push → main merge | ⏳ | Claude | feature/merchandise-with-x-embed |
| | Vercel 自動デプロイ確認 | ⏳ | コエノマ | プレビュー環境で目視 |

**凡例**: ✅ 完了 / 🟡 進行中 / ⏳ 未着手 / ⚠️ ブロック中

---

## スコープ

### A. リストカード（`MapListView`）に物販プレビュー追加

**現状の縦構造**:
```
[サムネ 64x64] ブース番号
              番組名
              subCatch (line-clamp-2)
              タグ最大 3
              spotlight (line-clamp-2)
```

**改修後の縦構造**:
```
[サムネ 64x64] ブース番号
              番組名
              subCatch (line-clamp-2)
              タグ最大 3
              ──────────────
              [代表物販画像 24x24] 代表物販 name (line-clamp-1) +N件バッジ
              ✨ spotlight (line-clamp-1)
```

**ポイント**:
- `merchandiseDetails[0].name` を line-clamp-1 で 1 行表示
- `merchandiseDetails[0].imagePath`（ある場合）か商品グループ先頭の `imagePath` を 24x24 サムネに
- 物販件数 ≥ 2 の場合は `+N件` バッジを薄い accent 色で
- 既存 spotlight は line-clamp-2 → 1 に圧縮（情報密度バランス）
- `merchandiseDetails` 0 件の番組は spotlight のみ表示（Graceful degradation）

### B. `TentOverviewSheet` の全幅化 + SlotCard 強化

**モーダル全体**:
- 高さ: `max-h-[78vh] / lg:max-h-[85vh]` → `max-h-[88vh] / lg:max-h-[92vh]`
- 幅: `max-w-5xl` 維持（70rem ≒ 1120px、PC で全幅近くなる）
- 4 区画 grid: `grid-cols-2` のまま（PC で 2 列、SP で 2 列）

**SlotCard 改修**:

現状:
```
┌─────────────────────┐
│ [14-A]  ジャンル     │
│                     │
│ [サムネ 40x40] 番組名 │
│                     │
│ 🎟体験 ✨限定        │
└─────────────────────┘
```

改修後:
```
┌──────────────────────────────────┐
│ [14-A]  ジャンル                  │
│                                  │
│ [サムネ 56x56] 番組名             │
│                subCatch (1 行)    │
│                                  │
│ 🎟体験 ✨限定 📕ZINE              │
│ ──────────────────────────────── │
│ 🛍️ [代表物販画像] 代表物販 name +N│
│ ✨ spotlight (line-clamp-1)       │
└──────────────────────────────────┘
```

**ポイント**:
- サムネ 40 → 56px に拡大（モーダル内なので余裕）
- 番組名の右側に `subCatch` 1 行を line-clamp-1 で追加
- タグは最大 3 個（現状 2 → 3）
- 物販プレビュー（`MerchandisePreview variant="slot"`）追加
- spotlight も追加（line-clamp-1）

### C. `BoothBottomSheet` ヘッダー直下に物販ハイライト

**現状の縦構造**:
```
[サムネ 72x72] ブース番号
              番組名
              subCatch
キャッチコピー (amber-50)
タグ
spotlight (primary-50)
ブース物販（MerchandiseList compact = X 埋め込みが伸びる）
```

**改修後**:
```
[サムネ 72x72] ブース番号
              番組名
              subCatch
キャッチコピー (amber-50)
タグ
🛍️ 物販ハイライト ← NEW
  [画像] 代表物販 name 1
  [画像] 代表物販 name 2
  ＋N 件・X 埋め込みで詳細 ↓
spotlight (primary-50)
ブース物販（MerchandiseList compact）
```

**ポイント**:
- ハイライトセクションは「上位 2 件の name + サムネ + 残り件数」
- 既存 X 埋め込みの上に出す → スクロール前に「何があるか」が見える
- `MerchandisePreview variant="sheet-header"` で 1 つの責務に統一

### D. `MerchandiseList` 1 件時の max-width を 600px に拡張

**変更**:
- 1 件: `max-w-md`（448px）→ `max-w-[600px]`
- 2 件: `max-w-3xl`（768px）据え置き
- 3 件以上: グリッド据え置き

**理由**:
- 1 件時の X 埋め込み（標準 ≒ 550px 幅）を活かしつつ、name / description が読みやすい
- 2 件時の 768px は中央寄せで PC レイアウトが崩れない範囲

---

## 設計

### コンポーネント分割

#### 新規: `src/components/merchandise/MerchandisePreview.tsx`

```typescript
import type { MerchandiseDetail } from '@/lib/types';

type Variant = 'list' | 'slot' | 'sheet-header';

interface Props {
  /** 表示する物販詳細群（merchandiseDetails をそのまま渡す）*/
  details: ReadonlyArray<MerchandiseDetail>;
  /** 表示バリエーション */
  variant: Variant;
  /** 追加のスタイリング上書き */
  className?: string;
}

export function MerchandisePreview({ details, variant, className }: Props): JSX.Element | null;
```

**variant ごとの責務**:

| variant | 表示要素 | 用途 |
|---|---|---|
| `list` | サムネ 24px（imagePath あれば）or アイコン + 代表 name 1 行 + `+N件` バッジ | `MapListView` のリストカード |
| `slot` | サムネ 28px or アイコン + 代表 name 1 行 + `+N件` バッジ | `TentOverviewSheet` の SlotCard |
| `sheet-header` | サムネ 32px or アイコン + 代表 name 上位 2 件（箇条書き）+ `全M件・X投稿で詳細↓` テキスト | `BoothBottomSheet` のヘッダー直下 |

**責務分離の方針**:
- `MerchandisePreview` は **物販に関する情報のみ** を扱う
- spotlight、catchphrase、subCatch、タグなどの **番組/コピー要素は呼び出し側で別途配置** する
- これにより、各呼び出し側は「物販プレビューの上下に何を出すか」を独立して決められる

**実装方針**:
- 1 つのコンポーネントで variant 切替（重複削減）
- `details.length === 0` のときは `null` を返す（呼び出し側で条件分岐不要）
- ロジック（代表アイテム選定・残り件数算出）は内部関数として実装、コンポーネント外に純粋関数を切り出すかは Phase 1 着手時に判断

### 代表アイテム選定ロジック

**前提**: 既存の `groupMerchandiseDetails(details)`（`src/components/merchandise/MerchandiseGroupCard.tsx`）が「連続する同 sourceUrl 物販を 1 グループに集約する」 純粋関数として既に実装されている。これを **そのまま再利用** する。

**選定方針**:
1. `groups[0]`（先頭グループ。運営が並び順で意図している前提）
2. `groups[0].items[0]` を「代表アイテム」とし、その `name` をプレビュー先頭に表示
3. 上位 N 件（variant により決まる）は `groups` を順に走査して name を取り出す

**画像優先順位（サムネ表示）**:
1. `groups[0].items[0].imagePath`（`MerchandiseDetail` スキーマに定義あり、`/images/sources/` 配下のローカル画像）
2. なければ **アイコン（🛍️）でフォールバック**

> X 投稿出典の物販は `imagePath` を持たないことが多い（X 埋め込みで画像が出るため）。フォールバックは品質低下ではなく **設計上の正常系**。

### 件数表示（`+N件` バッジ）の定義

| 表示位置 | バッジ表記 | 計算式 |
|---|---|---|
| `MapListView` カード（variant=list）| `+N件` | `details.length - 1`（先頭 1 件は表示済み）|
| `SlotCard`（variant=slot）| `+N件` | 同上 |
| `BoothBottomSheet` ヘッダー（variant=sheet-header）| 「全 M 件」（テキスト）| `M = details.length`、上位 2 件の `name` を箇条書き表示 + `M >= 3` のとき「他 N 件は下に X 投稿で詳細 ↓」テキスト |

**理由**: 「物販件数」（= 商品の数）の方がユーザー直感（「いっぱい買えそう！」）に近い。「投稿件数」（= groups.length）は内部実装の都合で UI 上は隠す。

### 既存型確認結果（Phase 0c で実施済）

`src/lib/types.ts` の `MerchandiseDetailSchema`（行 113-163）を確認:
- ✅ `name: string`（必須）
- ✅ `description?: string`
- ✅ `imagePath?: string`（パス形式 `/images/sources/XXX.{png,jpg,jpeg,webp}` のみ許可）
- ✅ `imageAlt?: string`
- ❌ `heroImage` は存在しない（誤り、`imagePath` に統一）

→ 設計書反映済み。実装時にスキーマ追加・変更は不要。

### レスポンシブ方針

| ブレークポイント | リストカード列数 | TentOverviewSheet 幅 | BoothBottomSheet |
|---|---|---|---|
| SP (~640px) | 1 列 | 横全幅 | 横全幅、bottom sheet |
| sm (640+) | 2 列 | 横全幅 | 中央寄せ max-w-5xl |
| lg (1024+) | 3 列 | 中央寄せ max-w-5xl | 同上 |

`MerchandisePreview variant="list"` は 1 列時に余裕がある場合でも 24x24 サムネ + name で固定し、追加の縦伸びを避ける。

### アクセシビリティ

- リストカードのプレビューは `<button>` 全体のラベル（既存）に物販を含めるか、`aria-describedby` で補助情報として接続する
- サムネ画像は `alt=""`（装飾扱い）とし、隣接する name を読み上げ対象とする
- `+N件` バッジは `aria-label="残り N 件"` で読み上げ対応

### パフォーマンス

- サムネは `next/image` を使用（`width={24}` `height={24}` 等明示）
- ImagePath が存在しない番組はサムネ DOM をレンダリングしない（初期 DOM サイズ削減）
- variant 切替は純関数 + 三項演算子で実現、Tailwind の utility はビルド時にプリロード（dynamic class 名禁止）

---

## 影響範囲（変更ファイル一覧）

### 新規

- `src/components/merchandise/MerchandisePreview.tsx`

### 改修

- `src/components/map/MapListView.tsx`（プレビュー組込み + spotlight 圧縮）
- `src/components/map/TentOverviewSheet.tsx`（モーダル拡大 + SlotCard 拡張 + プレビュー組込み）
- `src/components/map/BoothBottomSheet.tsx`（ヘッダー直下にプレビュー組込み）
- `src/components/merchandise/MerchandiseList.tsx`（1 件時 max-width 拡張）

### 影響なし

- `data/programs.json`（データ追加・スキーマ変更なし）
- 既存 `MerchandiseGroupCard.tsx`（compact / popup モード維持）
- マップ SVG（`VenueMap.tsx` ロジックには触れない）

---

## 受け入れ基準

### 機能面

- [ ] `MapListView` で `merchandiseDetails` ≥ 1 の番組カードに代表物販 name + サムネが表示される
- [ ] `merchandiseDetails` ≥ 2 の番組カードに `+N件` バッジが表示される
- [ ] `merchandiseDetails` 0 件の番組カードは従来どおり（タグ + spotlight）表示
- [ ] `TentOverviewSheet` モーダルが従来より大きく表示される（高さ 88vh / lg 92vh）
- [ ] `TentOverviewSheet` の SlotCard に物販プレビュー + spotlight 1 行が追加される
- [ ] `BoothBottomSheet` のヘッダー直下に物販ハイライトセクションが表示される（`merchandiseDetails` ≥ 1 時）
- [ ] `/booth/[id]` の物販 1 件番組（pcwe-072 等）で max-width が 600px に拡張される
- [ ] `/booth/[id]` の物販 2 件以上番組でレイアウトに後退なし

### 品質面

- [ ] `npm run type-check`: pass
- [ ] `npm run lint`: pass（warning ゼロ）
- [ ] `npm run build:programs`: pass
- [ ] `npm run build`: pass
- [ ] AGENTS.md の絶対禁止事項（any / as / eslint-disable / 日本語ログ等）を遵守
- [ ] 既存テスト（あれば）が全 pass、新規追加分の意図的なテスト追加は本 Phase では非ゴール
- [ ] レスポンシブ目視確認（SP 375px / md 768px / lg 1280px）

### UX 面

- [ ] リストでフィルタ「体験」を掛けたとき、各カードで「何が体験できるか」が 1 行で読める
- [ ] マップで quad テントを開いたとき、4 区画の差別化が物販で見える
- [ ] ボトムシート開いた直後に X 埋め込みより上で物販ハイライトが目に入る

---

## 非ゴール

- 物販に `featured` フラグなどデータスキーマ追加（必要性が出たら別 Phase で）
- 物販画像のミニサムネ自動切り抜き / 圧縮
- タグごとの色分け（experience: cyan / zine-book: amber 等）— ユーザーが「中」優先と判断、本 Phase では実施しない
- 「✨限定」「🎁無料」など特定タグだけバッジ強調 — 同上
- 物販レコメンド機能
- マップ SVG 自体のレイアウト変更
- ボトムシート CTA ボタンの再配置

---

## 実装手順（ジュニアエンジニア向け）

### Step 1: 既存型確認（Phase 0c で実施）

`src/lib/types.ts` の `MerchandiseDetail` 型を Read し、`imagePath` `heroImage` の有無を確認。
不足があれば設計書を更新してから Phase 1 に進む。

### Step 2: `MerchandisePreview.tsx` 作成（Phase 1）

1. ファイル作成: `src/components/merchandise/MerchandisePreview.tsx`
2. Props 型定義（上記「コンポーネント分割」参照）
3. variant ごとの JSX 分岐実装
4. 単独で確認するため `MapListView` から先に組み込む（Phase 2）

### Step 3: `MapListView` 統合（Phase 2）

1. import 追加: `MerchandisePreview`
2. spotlight 行の上に `<MerchandisePreview details={...} variant="list" />` を挿入
3. spotlight の line-clamp-2 → line-clamp-1 に変更
4. 動作確認: `npm run dev` で `/map?view=list` にアクセス、フィルタ操作

### Step 4: `TentOverviewSheet` 改修（Phase 3）

1. モーダル外殻の `max-h-[78vh]` → `max-h-[88vh]` 等に変更
2. SlotCard 内のサムネサイズ 40 → 56px
3. 番組名の右に subCatch 1 行追加
4. タグ最大 2 → 3 に拡張
5. `<MerchandisePreview variant="slot" />` を追加
6. 動作確認: マップで quad テント（テント 14 など）をタップ

### Step 5: `BoothBottomSheet` 改修（Phase 4）

1. タグの直下、spotlight の上に `<MerchandisePreview variant="sheet-header" />` を挿入
2. `merchandiseDetails` 0 件時は何も表示しない（コンポーネント側で null 返却）
3. 動作確認: 任意番組のボトムシート起動

### Step 6: `MerchandiseList` 1 件時 max-width 変更（Phase 5）

1. `count === 1` 分岐内の `max-w-md` → `max-w-[600px]`
2. 動作確認: `/booth/pcwe-072` 等で目視

### Step 7: 統合検証（Phase 6）

1. `npm run type-check && npm run lint && npm run build:programs && npm run build`
2. レスポンシブ目視確認
3. 既存機能後退チェック（フィルタ / 検索 / お気に入り / 会えた）

### Step 8: コミット & main マージ（Phase 7）

1. 進捗マトリクスを完了状態（✅）に更新
2. コミット（feat 4-6 セクション形式: 背景 / 変更内容 / 検証 / 影響範囲）
3. feature push → main merge → main push

---

## 関連ドキュメント

- `AGENTS.md`: プロジェクトお作法（any/as 禁止、日本語ログ等）
- `docs/plans/v2-interactive-map/README.md`: マップ全体の設計（前提）
- `docs/plans/v1.7-discover-ux/README.md`: リスト UI / フィルタの前提
- `docs/plans/v1-merchandise-rollout/README.md`: 物販データ整備の経緯
- `src/lib/types.ts`: 型定義
- `src/components/merchandise/MerchandiseList.tsx`: 既存物販リスト UI
- `src/components/merchandise/MerchandiseGroupCard.tsx`: 物販カード（compact / popup モード）

---

**作成日**: 2026-05-08
**メンテナ**: Claude（コエノマ運用下）
