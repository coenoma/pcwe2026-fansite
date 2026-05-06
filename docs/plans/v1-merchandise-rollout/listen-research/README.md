# Listen.style 一括精査の生データ

このディレクトリには、subagent 6 並列で `not-found` 群を Listen.style 横断検索した
**生データ（入力 + 出力）** が永続化されています。今後セッションが変わっても、
担当が変わっても、ここを見れば探索結果と判定根拠を**完全に再現可能**です。

---

## ファイル構成

### 入力（subagent への担当割り当て）

- `pcwe-listen-batch-1.json` 〜 `pcwe-listen-batch-6.json`
  各 subagent に渡した「担当 19〜20 番組のリスト」（id / name / spotify / x / instagram）
- `initial-batches.json`: 全 batch の元データ（不可分割前）

### 出力（subagent からの探索結果）

- `pcwe-listen-result-1.json` 〜 `pcwe-listen-result-6.json`
  各 subagent が `WebSearch + WebFetch` で精査した結果。1 番組につき
  `{ id, name, status: 'found'|'not-found', listenUrl, candidates: [{url, episodeTitle, merchInfo, publishedYear}], note }` の構造。

### 過去の X 検索結果（参考）

- `pcwe-result-1.json` 〜 `pcwe-result-6.json`
  Listen 精査の前段階として実施した X 検索結果。番組ごとの X タイムライン上の
  PCWE2026 関連投稿を発掘した記録。

---

## 反映スクリプト

このディレクトリの `pcwe-listen-result-*.json` を `data/sources/official/pcwe-XXX.json`
に反映するスクリプトが `scripts/apply-listen-research.ts` です。

```bash
npm run apply:listen-research
# 内部: tsx scripts/apply-listen-research.ts
```

実行内容:

1. 全 result JSON を読み込み → `{ pcwe-XXX: 探索結果 }` のマップ作成
2. 各 `data/sources/official/pcwe-XXX.json` に対し:
   - `listenUrl` があれば `links.listen` に追加（既存値は上書きしない）
   - `status === 'found'` かつ `merchandiseDetails` がまだない場合、subagent の
     `candidates` を merchandiseDetails として登録
3. ファクトチェック未確認の番組（例: pcwe-092 の 5/19 齟齬）は `SKIP_DONE`
   セットでスキップ → 別途 `needs-review.md` に手動で追加

このスクリプトは**冪等**です（既に done 化済みの番組や既存 `links.listen` を
持つ番組は再処理されない）。安全に再実行できます。

---

## 引き継ぎポイント

### 「この探索結果は信頼できるか？」

1. **subagent の品質**: 全 6 batch とも `創作・推測禁止 / PCWE2024・2022 と
   2026 の混同禁止 / 2026 年明示の確認` を厳守する prompt で起動。
2. **生データから JSON 反映までの距離**: スクリプト 1 本のみ介在、subagent の
   原文 `merchInfo` がそのまま `description` に格納される（最大 500 字でカット）。
3. **要再確認は別管理**: 5/19 齟齬の pcwe-092 のように「subagent は found 判定
   したがファクトに矛盾がある」ケースは `SKIP_DONE` でスキップ → needs-review に
   手動追加。

### 「再探索したいときは？」

1. 新しい batch ファイル（例: `pcwe-listen-batch-2nd-pass-1.json`）を作成
2. subagent prompt は本ディレクトリ内の過去 batch prompt を参考に
3. 結果ファイルを `pcwe-listen-result-2nd-pass-N.json` で書き出し
4. `scripts/apply-listen-research.ts` の `RESULT_FILES` 配列に追加して再実行

### 「subagent が読み違えたら？」

- ユーザー目視で検証できる場合は `monitoring.md` 経由で再チェック
- AI 単独で判定しきれない場合は `needs-review.md` に置く
- 確定的に取得不可と判定したら `not-found.md` に
