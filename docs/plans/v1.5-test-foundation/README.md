# v1.5 — テスト基盤整備

## ゴール

AGENTS.md「純粋関数分離 + 単体テスト」の方針に対し、`lib/` の純粋関数群にテストが
未整備な状態を解消する。Jest 設定を整え、ロジックの責務が大きい関数から順に
テストでガードを敷く。

## 背景

- `package.json` に `jest` / `@testing-library/jest-dom` / `jest-environment-jsdom` が
  入っているが、設定ファイル（`jest.config.*`）も `__tests__/` ディレクトリも無い。
- v1.4 で `program-quiz.ts` のスコアリングロジックを追加したが、テストでガードが
  効かず、回答→番組マッチの整合性が壊れても気付けない状態。
- 番組数が 5 → 144 に拡張されたとき、フィルタ／検索／キュレーションの境界条件で
  リグレッションが入る可能性が高い。

## スコープ

### 対象ファイル（純粋関数）

| ファイル | 優先度 | テスト観点 |
|---|---|---|
| `lib/program-quiz.ts` | 高 | scorePrograms 順序 / pickTopMatches 件数 / 全 0 点フォールバック / 全タグが公認セット |
| `lib/filter.ts` | 高 | ジャンル / タグ OR / 出展日 / 両日 / 空条件 |
| `lib/random-pick.ts` | 高 | excludeIds 動作 / count 制約 / ジャンル多様性 |
| `lib/safe-json-ld.ts` | 高 | `<` `>` `&` のエスケープ |
| `lib/tag-axis.ts` | 中 | mood / scene / content / 未分類フォールバック |
| `lib/format.ts` | 中 | dayLabel の組み合わせ |
| `lib/vibe-style.ts` | 中 | 7 vibe 全網羅 / themeFontVar |
| `lib/search.ts` | 中 | 空クエリ / マッチ / 大文字小文字 |
| `lib/favorites.ts` | 低 | localStorage モックでの add / remove / list |

### 対象外

- React コンポーネントのレンダリングテスト（v1.6 以降に切り出し）
- E2E（Playwright 等）
- スクリプト群（`scripts/*.ts`）— ビルド時の手動 smoke で十分

## 実装方針

### Jest 設定

- `next/jest` を使う（Next.js 15 公式推奨。SWC ベースで TS を高速変換）
- `jest.config.ts`：testEnvironment は `node`（lib/ の純粋関数中心のため）
- localStorage を使うテスト（favorites）のみ `@jest-environment jsdom` をファイル上部で指定
- `tsconfig.json` の `paths`（`@/lib/*`）を `moduleNameMapper` で解決

### Fixture

- `src/__tests__/fixtures.ts` に最小サンプル番組（`Program` 4–5 件）を定義
- 全 7 vibe / 主要ジャンル / 多様なタグを最低 1 件ずつカバー
- 実データの `pcwe-006` 等を読み込まず、テスト独立性を保つ

### scripts

- `npm test` は **1 回実行**（`jest --silent` ではなく `jest`、watch なし）— AGENTS.md の
  「長時間プロセス管理」ルールに従い、watch は明示的に `test:watch` のみで使う。
- `prebuild` には繋がず、CI / 手動で叩く想定。

## 受け入れ基準

- `npm test` でグリーン（0 failing）
- カバレッジは数値目標を立てない（純粋関数なので「主要パスを 1 本通したか」で判断）
- `program-quiz.ts` は採点 / 上位選出 / フォールバックの 3 シナリオが通っている
- 既存ビルド・Lint・Type-check が壊れない
- watch プロセスが残らない

## 非ゴール

- カバレッジ 100% を取りに行く
- 既存実装のリファクタリング（テストを書きながら見つかった "気になる点" は
  別タスクに切り出す）
