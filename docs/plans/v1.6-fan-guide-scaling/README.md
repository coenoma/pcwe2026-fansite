# v1.6 — 144 番組展開（fan-guide スケーリング）

## ゴール

5 番組サンプル運用 → 144 番組フル展開。

並列 AI 10 人 + 人間校正で fan-guide JSON を量産しつつ、機械抽出パイプライン
（ID 一覧 → 公式情報 → サムネイル）の最後のピースを埋める。

## 背景

- v1.5 までは 5 番組（pcwe-006 / 013 / 040 / 072 / 118）を手動で書き、機能設計を固めてきた
- 公開期限は 2026-05-09。残り日数で 144 番組の fan-guide を書き切るには、AI 並列運用が現実的
- AGENTS.md ルール 7（AI API 禁止）を改訂し、「サイト実行時禁止 / 執筆時下書きは許容」へ更新済み

## スコープ

### Phase A: 機械抽出パイプラインの完成（自動）

| タスク | 内容 |
|---|---|
| `scripts/list-booths.ts` | PCWE 公式の出展者一覧から 144 個の `pcwe-XXX` を抽出 → `data/booth-ids.json` |
| `scripts/download-thumbnails.ts` | 各 ID の og:image を `public/thumbnails/{number}.{ext}` に保存。並列度・既存スキップ |
| `scripts/lint-fan-guide.ts`（**任意 / 後続**）| 提出された fan-guide JSON を §6 NG パターンで機械チェック |

これにより `npm run list-booths && npm run fetch:official -- --all && npm run download-thumbnails`
の 3 ステップで公式情報側は完全自動化。

### Phase B: ライティングガイド整備（完了）

- ✅ [docs/writing-guide/fan-guide-writing-guide.md](../../writing-guide/fan-guide-writing-guide.md)
- ✅ AGENTS.md ルール 7 改訂

### Phase C: 並列 AI 執筆運用

執筆体制:

- 144 番組を 10 等分（14〜15 番組 / AI）にランダムシャッフル割り当て
- 各 AI はライティングガイド + 担当番組の official.json + 番組ブース URL を入力にする
- 提出物: `data/sources/fan-guide/{id}.json` + リサーチメモ + 自己チェック結果

レビュー体制（中央 = ゆと + 必要に応じ code-reviewer エージェント）:

- ビルド時 zod 検証で弾く（自動）
- catchphrase の凡庸さチェック（人間目視 5〜10 秒/件）
- タグ分布の偏り検出（`scripts/tag-distribution.ts` を将来作る）

### Phase D: 全番組統合 + フォールバック UI

- `fanGuide` が無い番組のフォールバック UI（catchphrase なし → 公式 description のみ表示等）
- 検索・フィルタ・診断・キュレーションは fanGuide 付き番組に限定（質を保つ）
- `Program.fanGuide` を optional にする型変更が必要かを検討

## 進め方

1. Phase A の 2 スクリプトを実装（このプランの直近着手）
2. 144 番組の official.json を `--all` で取得
3. サムネイルを一括 DL
4. 並列 AI 執筆を発注（実際の AI 並列運用は別作業セッション）
5. 受け取った fan-guide を順次マージ → 部分公開
6. Phase D（フォールバック UI）を必要に応じ実装

## 受け入れ基準

- `data/booth-ids.json` に 144 個の ID が入る
- `data/sources/official/` に 144 個の official.json が揃う
- `public/thumbnails/` に 144 枚のサムネが揃う
- ビルドが通る（fan-guide が揃った番組だけ programs.json に入る、欠けは警告）
- 残りの fan-guide 執筆は **本プランのスコープ外** とし、別運用で進める

## 非ゴール

- 144 番組すべての fan-guide をこのプラン内で書く
- AI 自動採点 / lint 自動化（Phase D 以降）
- 番組制作者へのアウトリーチ（別運用）
