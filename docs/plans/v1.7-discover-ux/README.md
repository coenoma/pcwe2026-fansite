# v1.7 — Discovery UX の磨き込み

## ゴール

全 142 番組が出揃ったあとの「**見つけられる体験**」を 60 → 100 点に。

ファンガイドの中身（catchphrase / fan-guide）が高品質でも、見つけ方の UI が荒いと
刺さる前に離脱する。検索・キュレーション・ランダムの 3 機能を改善し、
新しい「番組起点」レコメンドを足す。

## 背景

v1.6 完了時点での課題（ユーザー指摘）:

1. **検索 UI が縦に大きすぎる** — タグピル 19 個がフルで展開され、番組カード 1 段
   すら見えない（スクリーンショット添付の指摘）
2. **CURATION の 3 セクションが既存お手本 10 番組から動いていない** — 全 142 番組
   出揃ったのに、キュレーションが更新されていない
3. **既存ガチャと「目当ての番組から広げる」レコメンドが欲しい** — ガチャは 100%
   ランダム、ユーザーが既知の好み番組から広げる軸が無い

## スコープ

### A. 検索 UI スリム化

- タグピル群を **デフォルト折り畳み**（`絞り込み` ボタンで開閉）
- 選択中タグは **チップで常時可視**（折り畳み中でも何で絞ってるか分かる）
- 検索バー + 出展日 + タグボタンを **PC 1 段、SP 2 段** にコンパクト化
- 既存 `/` ショートカット / Esc クリアは維持

実装: `src/app/_components/ProgramListClient.tsx` を改修

### B. CURATION 4 タブ化 + 番組選定リフレッシュ

切り口を 3 → **4 タブ**に拡張、各 5 本に増やす（計 20 本）:

| タブ | 切り口 | 想定 vibe / tags | 番組例 |
|---|---|---|---|
| 🚪 沼の入口 | 初心者・万人受け | conversational / humorous / 笑える / 共感 | 072, 100, 050, 013, 014 |
| 🌙 夜ふかしに沈む | 内省・癒し系 | contemplative / laid-back / 寝る前 | 006, 127, 022, 027, 005 |
| 🌅 朝のテンポ作り | 通勤・知的刺激 | intellectual / energetic / 朝向き | 118, 097, 091, 104, 052 |
| 🔍 偏愛のニッチ | マニア・深掘り | earnest / humorous / ニッチ / 一人語り | 040, 119, 019, 110, 115 |

UI:
- WAI-ARIA Tabs Pattern 準拠（tablist / tab / tabpanel + id 結びつけ）
- アクティブタブのみ番組リスト表示（縦に伸びすぎない）
- レスポンシブ: SP 2 列 / md 3 列 / lg 5 列
- アクセント色は `curation.themeColor` を反映

データ:
- `data/curations.json` に `emoji` フィールド追加（schema 拡張、optional）
- `programIds: 5 本` に増やす（既存 schema の min 2 制約は維持）

### C. 番組ベースレコメンド（新機能）

「あの番組が好き → 似てる / 広げる / 意外な共通点」の 3 軸でレコメンド。

- **入力**: 番組名のインクリメンタル検索（部分一致）→ 候補から 1 番組選択
- **出力**: 起点番組から 3 軸で各 3 本ずつ
  - 🎯 同 vibe + 同 genre + tag 重複（ど真ん中で似てる）
  - 🌐 同 vibe + 異 genre + tag 重複（ジャンル広げるなら）
  - 💫 異 vibe + 異 genre + tag 重複あり（意外な共通点）

実装:
- `src/lib/recommend.ts` — 純粋関数（類似度ロジック）
- `src/app/_components/RecommendFromProgram.tsx` — クライアント UI（combobox + 結果表示）
- `src/app/page.tsx` — CURATION 下に新セクション統合

### D. 細かな表記調整（合わせて実施）

- 「ブース番号」（公式 URL 連番）を画面表示から除去（当日の物理ブース番号と一致しないため）
- 「非公式スタンス」 → 「非公式の徹底」に統一（カタカナ語のフワッと感を排除）

## アクセシビリティ要件

- 検索 UI の絞り込みボタン: `aria-expanded`
- 選択中タグのチップ: 解除ボタンに `aria-label`
- レコメンド検索: WAI-ARIA Combobox Pattern（role="combobox" / aria-expanded /
  aria-controls / aria-autocomplete + role="listbox" + role="option" + aria-selected）
- レコメンド検索: Esc キーでサジェスト閉じる
- CURATION タブ: WAI-ARIA Tabs Pattern（id / aria-controls / aria-labelledby /
  tabIndex active=0/inactive=-1）

## 受け入れ基準

- 検索 UI でカード 1 段が常時可視（タグ展開時を除く）
- CURATION 4 タブが切り替えで動作、各 5 本のキュレーションが表示
- 番組ベースレコメンドで起点選択 → 3 軸 9 番組がレンダリング
- type-check / lint / build すべて通過
- 既存機能（ガチャ / 診断 / 気になる / 検索 / フィルタ）への後退なし

## 非ゴール

- キーボード ↑↓ ナビ（combobox / tabs）— v1.8+ で改善余地
- レコメンド類似度の機械学習化 — シンプルなスコア計算で十分
- A/B テスト機構

## 関連ファイル

- 既存: `data/curations.json`（schema 拡張 + 4 タブ× 5 本に再キュレーション）
- 新規: `src/lib/recommend.ts`
- 新規: `src/app/_components/RecommendFromProgram.tsx`
- 改修: `src/app/_components/ProgramListClient.tsx` / `CurationLanes.tsx` / `BoothHero.tsx` / `booth/[id]/page.tsx` / `page.tsx`

---

**最終更新**: 2026-04-30（v1.7 完了時に事後ドキュメント化）
