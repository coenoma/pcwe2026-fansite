# 05. 実装計画

設計が確定（00-04 のレビュー完了）後の実装フェーズ分割、ライブラリ選定、リリース判定基準。

## 📊 進捗マトリクス（実装フェーズ）

| Phase | 状況 |
|---|:---:|
| **Phase 0: 設計**（00-05 + 自己レビュー）| ✅ |
| **Phase 1: データ整備**（部分完了）| 🟡 |
| Phase 2: SVG マップ + ピン + ボトムシート | ⏳ |
| Phase 3: 検索 / フィルタ / リスト切替 | ⏳ |
| Phase 4: 当日運用 | ⏳ |
| Phase 5: v2.5（当日後）| ⏳ |

---

## 1. 全体タイムライン

| Phase | 期間 | 内容 | 完了判定 |
|---|---|---|---|
| **Phase 0** | 5/7 中 | 設計ドキュメント執筆 + ユーザーレビュー | 00-04 全部にユーザー署名（合意） |
| **Phase 1** | 5/7-8 | データ整備（テント↔番組マッピング、グッズタグ） | `booth-positions.json` 完成、142 番組タグ付与完了 |
| **Phase 2** | 5/8 | SVG マップ + ピン + ボトムシート基本実装 | `/map` ルート開通、土日切替、ピンタップで番組情報 |
| **Phase 3** | 5/8-9 朝 | 検索・フィルタ・リストビュー切替 + URL 同期 | 6 カテゴリ + 検索 + リスト切替が動作 |
| **Phase 4 (当日)** | 5/9, 5/10 | 当日修正、誤情報訂正、コエノマ運営の手動更新 | 当日トラブルゼロ |
| **Phase 5 (当日後)** | 5/11 以降 | 「会えた」記録の振り返り画面、recap ページ、混雑記録 | v2.5 として追加リリース |

---

## 2. 各 Phase の詳細

### Phase 1: データ整備

#### 1-1. テント ↔ 番組マッピング ✅ 一部完了

**完了済み**:
- ✅ PCWE 公式 md 取得（テント 1-29 の 175 スロット）
- ✅ `data/sources/booth-map/booth-positions-source.md` 配置
- ✅ `data/booth-positions.json` 自動生成（142 番組すべて配置確定）
- ✅ 公式画像配置 `public/images/map/pcwe2026-day{1,2}.webp`

**残タスク**:
- 🔴 **テント 30, 31** のブース割当を取得（公式 podcastexpo.jp に確認 or 当日現地確認）
- 🔴 **3 番組（PodWalker / まかないラジオ / アイデア刺激法）**を programs.json に追加するか判断
- 🟡 SVG 座標起こし（Figma で公式 webp を背景に配置 → テント矩形を囲む → polygon 座標を booth-positions.json に追記）

**SVG 座標起こし手順**:
1. Figma で `pcwe2026-day1.webp` を背景レイヤーに配置（透明度 30%）
2. 各テント矩形を `<rect>` で囲む（テント 1-32 = 32 個）
3. 各 quad テントを 2x2 グリッドで割って A/B/C/D の座標も取る
4. ビューポート `viewBox="0 0 1000 850"` 正規化
5. 座標を `data/booth-positions.json` の各テント `polygon` に追記

#### 1-1.5. バリデーションスクリプト追加

`scripts/validate-booth-positions.ts` を新規作成:
- 142 番組の `exhibition.days` と `booth-positions.json` の `slots[].sat/sun` の整合性チェック
- 例: 番組 X が `days: ['sat']` なのにテントの `sun` スロットに居る場合エラー

#### 1-2. グッズ自動タグ付与

```bash
npm run auto-tag-merchandise
```

`scripts/auto-tag-merchandise.ts` を新規作成:
- 全 `data/sources/official/pcwe-XXX.json` を読み込み
- `merchandise[]` + `merchandiseDetails[].name + description` を結合
- [03-merchandise-taxonomy §4-2](./03-merchandise-taxonomy.md#4-2-phase-a-キーワード自動タグ) のキーワード辞書で自動タグ付与
- 結果を `data/merchandise-tags-review.csv` に出力（人間レビュー用）

#### 1-3. 人間レビュー

菊池さんが `merchandise-tags-review.csv` をレビュー → 確定タグを反映 → `data/sources/official/pcwe-XXX.json` の `official.merchandiseTags` に書き込み。

#### 1-4. `merchandiseSpotlight` 手書き

食・体験・珍しい系の番組から最低 30 件を選んで、コエノマ運営目線で「散策型に響く一行」を執筆。

#### 1-5. スキーマ拡張

`src/lib/types.ts` の `OfficialInfoSchema` に:
- `merchandiseTags?: MerchandiseTag[]`
- `merchandiseSubTypes?: MerchandiseSubType[]`
- `merchandiseSpotlight?: string`（min 8, max 60）

`ExhibitionSchema` に:
- `position?: { tent: number; slot?: 'A'|'B'|'C'|'D'; label: string }`
- `positionBySatSun?: { sat: ...; sun: ... }`（両日異なる場合）

### Phase 2: SVG マップ + ピン + ボトムシート

#### 2-1. ライブラリ追加

```bash
npm install react-zoom-pan-pinch @radix-ui/react-dialog framer-motion
```

#### 2-2. ファイル構成

```
src/
├── app/
│   └── map/
│       ├── page.tsx           # /map ルート、SSR で programs.json を読み込み props に渡す
│       └── _components/
│           └── MapClient.tsx   # 'use client' でインタラクション実装
├── components/
│   └── map/
│       ├── VenueMap.tsx        # SVG マップ全体（react-zoom-pan-pinch でラップ）
│       ├── BoothPin.tsx         # 個別ピン（テント or A/B/C/D）
│       ├── TentGroup.tsx        # quad テント（4 区画）
│       ├── BoothBottomSheet.tsx # ボトムシート（Radix Dialog）
│       ├── DayToggle.tsx        # 土日切替トグル
│       ├── MapDecoration.tsx    # ロゴ・枠・装飾の SVG
│       └── ...
└── lib/
    └── map/
        ├── booth-positions.ts   # booth-positions.json の型 + 取得ヘルパー
        └── pin-state.ts          # 選択状態・お気に入り状態の管理
```

#### 2-3. データフロー

```
data/booth-positions.json
        ↓
data/programs.json ──(merge by programId)──→ src/app/map/page.tsx (server)
                                                ↓ props
                                         src/app/map/_components/MapClient.tsx (client)
                                                ↓
                              VenueMap, BoothPin, BoothBottomSheet
```

#### 2-4. 実装順序

1. ✅ 静的 SVG レイアウト（テント矩形 + 番号）
2. ✅ 土日切替で `slots[day]` 切り替え
3. ✅ ピンタップで `BoothBottomSheet` 起動（最小実装：番組名 + 詳細リンク）
4. ✅ `react-zoom-pan-pinch` でズーム・パン
5. ✅ ARIA + tabindex + キーボード操作

### Phase 3: 検索・フィルタ・リストビュー

#### 3-1. 検索バー

- `src/components/map/MapSearchBar.tsx`
- 入力 → 候補リスト（番組名、ブース番号、グッズキーワード）
- 選択 → マップに該当ピンへズーム + ハイライト

#### 3-2. フィルタチップ

- `src/components/map/MapFilterChips.tsx`
- 6 カテゴリ + 日付チップ
- URL `useSearchParams` 同期

#### 3-3. リストビュー

- `src/app/map/_components/MapListView.tsx`
- マップと同じデータソース、表示形式だけ変える
- 上部の `[🗺] [☰]` トグルで切替

#### 3-4. URL 状態保存

- `src/lib/map/url-state.ts`
- `?day=sat&cat=food-drink&q=占い` のパース・シリアライズ

### Phase 4: 当日運用

- ハッシュタグ運用: `#PCWE2026 #コエノマMAP`
- 修正リクエストフォーム
- 「最新情報: 5/9 12:00」表示
- コエノマ運営 Slack 通知（GitHub Actions の merge → Vercel deploy）

### Phase 5: v2.5（当日後）

- `/map/recap` ページ（「会えた」記録のまとめ）
- OGP 自動生成画像
- 混雑記録ヒートマップ（過去データに基づく静的版）

---

## 3. ライブラリ選定の根拠

### 3-1. `react-zoom-pan-pinch`

- **採用**: タッチ・マウスのパン・ピンチズームを最小コードで実現
- **代替**: `react-svg-pan-zoom` は API 古い、`@dnd-kit` は drag 専用
- **懸念**: bundle size 約 30KB（許容）

### 3-2. `@radix-ui/react-dialog`

- **採用**: ボトムシートのアクセシブルな実装。フォーカストラップ・Esc 閉じる対応
- **代替**: 自前実装（実装コスト大）、`@headlessui/react`（Tailwind 互換）も候補
- **懸念**: Radix のデフォルト styling は外して全カスタム必要

### 3-3. `framer-motion`

- **採用**: ボトムシートのスプリングジェスチャ・スワイプ閉じる
- **代替**: `@react-spring/web`、または CSS のみ（簡易版）
- **懸念**: bundle size 約 70KB → 必要最小機能だけ tree-shake で取り出す

### 3-4. `Fuse.js`

- **採用**: 検索バーの fuzzy 検索
- **代替**: 自前正規表現（精度ノイズ）
- **懸念**: 5KB と軽量、問題なし

---

## 4. リリース判定基準

### Phase 2 完了判定

- [ ] `/map?day=sat` で土曜マップが表示される
- [ ] `/map?day=sun` で日曜マップが表示される
- [ ] ピンタップで該当番組のボトムシートが開く
- [ ] ボトムシート内の「番組詳細を見る」で `/booth/pcwe-XXX` に遷移
- [ ] ピンチズーム・パンが動く（モバイル + デスクトップ）
- [ ] Lighthouse Accessibility スコア 90 以上

### Phase 3 完了判定

- [ ] 検索で「愛の抵抗」と入力 → 該当ピンにジャンプ + ハイライト
- [ ] 「占い」フィルタで pcwe-014（オバトーク等）が絞り込まれる
- [ ] [🗺] [☰] でマップ ⇄ リスト切替できる
- [ ] URL `?cat=food-drink&day=sat` をブックマーク → 同じ画面が再現
- [ ] スクリーンリーダーで「ブース 14-A 愛の抵抗」と読み上げられる

### v2 リリース判定（5/8 夜）

- [ ] Phase 2 + 3 全完了
- [ ] 142 番組のタグ付け完了（タグなし 0 件）
- [ ] テント↔番組マッピング 100% 完了（要確認: PCWE 公式から取得 or 起こし）
- [ ] モバイル Safari / Chrome / Android Chrome で動作確認
- [ ] フッターに「Beta 版・5/9 LIVE 更新中」明記

### v2.5 リリース判定（5/11 以降）

- [ ] `/map/recap` 動作
- [ ] 混雑データ（運営手動更新）が反映
- [ ] OGP 自動画像生成

---

## 5. リスクと回避策

| リスク | 確率 | 影響 | 回避策 |
|---|---|---|---|
| 公式から配置データ取れず、手起こしに丸 1 日 | 高 | 中 | 5/7 中に依頼 + 並行で起こし開始 |
| SVG 座標と実会場のズレ | 中 | 中 | 当日 5/9 朝に菊池さんが現地確認 → 当日修正 |
| 当日アクセス過多で Vercel 落ち | 低 | 高 | Vercel Pro プラン契約済み？要確認 |
| グッズタグの誤分類で散策型がガッカリ | 中 | 中 | Phase B の人間レビュー徹底、`spotlight` で印象操作 |
| ボトムシートのモバイル UX 微妙 | 中 | 中 | 5/8 夜に菊池さん含めユーザビリティテスト |
| 物理位置データが直前に変わる（公式変更） | 低 | 高 | JSON ベースなので即時更新可能。GitHub Actions 連携 |

---

## 6. 既存コードベースとの整合

### 6-1. 既存の `/booth/[id]` ページとの関係

マップから「番組詳細を見る」で既存 `/booth/[id]` に遷移。既存ページに影響なし。

### 6-2. ナビゲーション統合

- ヘッダーに `[🗺 マップ]` リンクを追加
- トップページ `/` のヒーローエリアに「会場マップを見る」CTA

### 6-3. AGENTS.md / README.md 更新

実装後:
- `AGENTS.md` に「マップ機能の実装パターン」を追記
- `README.md` トップに「インタラクティブ会場マップ」機能の紹介

---

## 7. やらないこと（明示的非対応）

- ❌ 屋内 GPS による現在地表示
- ❌ AR ナビ
- ❌ ログイン機能
- ❌ 番組ホスト・運営との双方向コミュニケーション機能
- ❌ チケット販売（PCWE 公式の領域）
- ❌ 動画・音声配信機能
- ❌ Mapbox / Leaflet（オーバーキル）

---

## 9. ユーザー確認事項の最終回答（Phase 0 合意済み）

| # | 質問 | ユーザー回答 | 反映 |
|---|---|---|---|
| Q1 | テント 30, 31 のブース割当 | **一旦空白** | booth-positions.json で placeholder（`note: '一旦空白で進行'`）|
| Q2 | 3 番組（PodWalker / まかないラジオ / アイデア刺激法）の追加 | **追加** | programs.json schema は触らず、booth-positions.json で `external` 参照として追加（fanGuide 必須項目を捏造しないため）|
| Q3 | ファンガイドトップのテイスト統一（primary オレンジベース）| **YES** | 02-data-and-svg.md §5-1 でカラートークンを既存 `--color-primary-500` 等に統一明記 |
| Q4 | 公式画像 DL ボタン UIUX | **Claude 判断** | 02-data-and-svg.md §5-2 で「マップ下部の独立セクション」配置案、サムネ + DL ボタン + 公式リンク |
| Q5 | v2 必須機能リスト | **OK** | README §「v2 リリース必須機能まとめ」確定 |
| Q6 | 公式へ事前報告 | **しない** | 「公式画像をもとに独自に描き直してます／公式画像はこちらから DL」を透明に明記（02-data-and-svg.md §5-3）|

## 10. 設計書レビュー結果（自己レビュー、AGENTS.md 整合）

### 10-1. AGENTS.md 絶対的禁止事項のチェック

| 禁止事項 | チェック結果 |
|---|---|
| `any` 型禁止 | ✅ 全コンポーネントは `MerchandiseDetail` 等の既存型を使う設計 |
| `as` 安易使用禁止 | ✅ booth-positions.json の値は zod スキーマで実行時検証 |
| ESLint 警告無視禁止 | ✅ 既存 lint pass の継続を維持 |
| エラー握りつぶし禁止 | ✅ Tweet 取得失敗時は既存 `<TweetNotFound>` パターン |
| TODO/FIXME 先送り禁止 | ✅ TODO は本ドキュメントの進捗マトリクスで管理 |
| 日本語必須 | ✅ コンポーネント説明・エラーログすべて日本語 |
| LLM API 直接呼び出し禁止 | ✅ クライアント・サーバーで LLM API を呼ばない |
| 公式画像ホットリンク禁止 | ✅ `public/images/map/` に配置、DL リンクは自サイト経由 |
| 「公式」表記禁止 | ✅ 「位置情報の出典: 公式マップ」と引用としてのみ言及、ファンサイト自体は「公式画像をもとに独自描画」 |
| サーバーサイド処理追加禁止 | ✅ 全機能 SSG + クライアントインタラクション、API Route なし、Server Action なし |

### 10-2. 必須ルールのチェック

| ルール | 設計反映 |
|---|---|
| 純粋関数分離 | ✅ ピン状態・フィルタロジックは `src/lib/map/` の純粋関数に分離設計 |
| App Router + RSC 優先 | ✅ `app/map/page.tsx` は Server Component で programs/booth-positions を読み込み props 渡し、`MapClient.tsx` が `'use client'` |
| 静的生成 SSG | ✅ `export const dynamic = 'force-static'` |
| next/image | ✅ 公式画像 DL サムネ・番組サムネはすべて `next/image` |
| アクセシビリティ | ✅ ARIA + tabindex + キーボード操作、リストモードでスクリーンリーダー対応 |
| レスポンシブ | ✅ モバイルファースト、タップ領域 44px+ |
| パフォーマンス | ✅ ライブラリ選定で bundle 抑制（react-zoom-pan-pinch ~30KB、Radix Dialog 軽量、Framer Motion は tree-shake）|

### 10-3. ベストプラクティス（Next.js 15.5 / React 19 / Tailwind 4）

- ✅ App Router + Server Component 優先
- ✅ `'use client'` は最小境界（VenueMap, BoothBottomSheet, MapFilterChips, MapSearchBar, useSearchParams 系）
- ✅ `useSearchParams` で URL 状態同期（クライアントサイド）
- ✅ Tailwind 4 既存トークン (`--color-primary-500` 等) を `bg-primary-500` で参照
- ✅ Static Export モード (`output: 'export'`) と互換: 動的ルートは `generateStaticParams` で対応、API Route 使わない
- ✅ Service Worker は v2.5 で検討（v2 では Vercel CDN + ブラウザキャッシュで足りる想定）

### 10-4. 既存実装との整合

| 既存資産 | 整合性 | 備考 |
|---|---|---|
| `src/lib/types.ts` の `MerchandiseDetail` | ✅ 既存維持、`MerchandiseTag` 列挙を新規追加 |
| `src/components/merchandise/MerchandiseList.tsx` | ✅ ボトムシート内で `layout="popup"` で再利用可能（v1 で既に実装済み）|
| `data/programs.json` schema | ✅ `OfficialInfoSchema` に optional 追加のみ、既存番組への影響なし |
| `scripts/build-programs.ts` | ✅ 既存ビルドフローを維持、merchandiseTags 追加だけ |
| `next.config.ts` の `output: 'export'` | ✅ 維持、API Route 不要 |

---

## 8. 設計レビュー後のアクション

このドキュメント群（00-05）を菊池さんがレビュー後:

1. **論点で迷ったポイントの合意**: 例えば「rare-curious カテゴリは要るか」「ボトムシートの drag handle は必要か」
2. **データ取得経路の確定**: 公式に依頼するかコエノマで起こすか
3. **Phase 1 着手のゴーサイン**

ゴーサイン後 24-48 時間で v2 リリース可能（タイトな日程だが現実的）。
