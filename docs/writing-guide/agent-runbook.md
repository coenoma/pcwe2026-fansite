# エージェント・ランブック

並列で動く AI エージェント（Claude Code / ChatGPT 等）に **「あなたは agent-XX です。担当はこれ」**
と渡すための指示テンプレ。

このファイルは **コエノマ → エージェント** のキックオフ指示にコピペするためのもの。

---

## 基本ルール

- ✅ **AI エージェントの並列運用は OK**。LLM API キーでの直接呼び出しは NG。
- ✅ 情報収集は **fetch / Chrome / `data/sources/official/{id}.json`** から行う。
- ✅ 執筆は [docs/writing-guide/fan-guide-writing-guide.md](./fan-guide-writing-guide.md) に厳密に従う。
- ✅ 提出前に **§9 自己レビューチェックリスト** を必ず通す。
- ❌ 自分の担当外の番組には触らない（他エージェントの作業領域）。
- ❌ `data/fan-guide-assignments.json` を勝手に書き換えない（中央管理のため）。

---

## キックオフ指示テンプレ（コピペ用）

以下を、各エージェントの最初のメッセージに貼り付ける。`{AGENT_ID}` だけ書き換える。

```
あなたは PCWE2026 ファンサイトの fan-guide ライターです。
エージェント ID: {AGENT_ID}（例: agent-03）

【まずやること】
1. 自分の担当番組リストを確認
   npm run fan-guide-status -- --agent {AGENT_ID}

2. ライティングガイドを精読（必須）
   docs/writing-guide/fan-guide-writing-guide.md

3. お手本 10 番組を通読して「型」と「文体」を体感
   data/sources/fan-guide/pcwe-006.json
   data/sources/fan-guide/pcwe-013.json
   data/sources/fan-guide/pcwe-040.json
   data/sources/fan-guide/pcwe-052.json
   data/sources/fan-guide/pcwe-072.json
   data/sources/fan-guide/pcwe-097.json
   data/sources/fan-guide/pcwe-100.json
   data/sources/fan-guide/pcwe-118.json
   data/sources/fan-guide/pcwe-119.json
   data/sources/fan-guide/pcwe-127.json

   ガイド §10.1 で「型」ごとに整理されているので、自分の担当番組がどの型に
   当てはまりそうか、目星をつけられるとよい。

4. 担当番組のうち、未対応 (⬜) の 1 つを選んで執筆開始

【執筆フロー（1 番組ぶん）】
A. 公式情報を読む
   data/sources/official/{id}.json
   - description, hosts, links を確認

B. リサーチ（5〜10 分。ガイド §5 参照）
   - 公式ブースページ: https://podcastexpo.jp/booth/{id}/
   - Spotify / Apple Podcasts（links に URL があれば）
   - X（読み取り専用、投稿絶対禁止）
   - 番組サイト / note があれば

C. ガイド §5.0 の 3 フェーズで進める
   Phase 1 事実抽出: 公式 description から動詞・名詞・属性をメモ（解釈しない）
   Phase 2 解釈構築: 価値転換を考え、§4.1 の 9 つの型から 1 つ選ぶ
   Phase 3 ライティング: 以下を順に組み立てる
     - catchphrase 30〜50 字（型 + 番組固有名詞 + 価値転換）
     - catchphraseLines（任意・推奨）: catchphrase が 30 字超えなら §4.1.5 の 6 コツに沿って 2〜4 行に分割
     - subCatch 20〜40 字（「何の番組か」を端的に）
     - genre（17 種から 1 つ）
     - tags 3〜5 個（雰囲気 / シーン / 内容の 3 軸ミックス）
     - targetListener 50〜80 字（心の動きで書く）
     - vibe 7 種から 1 つ
     - themeColor / themeFont は §10.2 マッピング表を参考に

D. 提出前に §9 自己レビューチェックリストを必ず通す
   特に「他番組のフレーズ流用していないか」「JSON にコメントが残っていないか」

E. ファイル保存
   data/sources/fan-guide/{id}.json
   フォーマット:
   {
     "id": "{id}",
     "fanGuide": { ... }
   }

F. ビルド検証（zod スキーマ違反があれば即わかる）
   npm run build:programs

G. 進捗報告
   npm run fan-guide-status -- --agent {AGENT_ID}
   完了マーク (✅) が増えていることを確認

【繰り返し】
1 番組終わるごとに、担当リストの未対応 (⬜) から次の番組を取って同じフローを回す。
全 14〜15 番組を消化するまで継続。

【困ったとき】
- 公式情報が薄すぎる → リサーチを諦めず、Spotify と X を必ず見る
- vibe 判定に迷う → ガイド §4.5 のキーワード対応表
- タグセットに当てはまらない概念 → 勝手に新タグを足さず、PR 説明にメモ
- 公式ブースの og:description が物販リスト → ガイド §7.1 ❶ 参照

【絶対やってはいけないこと】
- 他エージェントの担当番組を書く（assignments で確認）
- LLM API キーで自動生成パイプを組む
- 「公式」表記をする
- リサーチ無しで一般論キャッチコピーを書く
- 番組制作者の意図に反する深読みや脚色

不明点があったら、コエノマ（ゆと）に確認すること。
```

---

## 中央管理者（ゆと）の運用フロー

### 初期セットアップ（1 回だけ）

```bash
# 1. 番組 ID 一覧（数秒）
npm run list-booths

# 2. 公式情報を 137 件取得（1.5 秒間隔 × 137 ≒ 4 分）
npm run fetch:official -- --from-list --skip-existing

# 3. サムネイル一括 DL（並列度 4 + 250ms 間隔 ≒ 1 分）
npm run download-thumbnails

# 4. 142 番組を 10 エージェントに割り当て
npm run assign-fan-guide

# 5. 失敗があれば確認
cat data/fetch-failed.json | jq '.failures[].id'
# リトライ:
npm run fetch:official -- $(jq -r '.failures[].id' data/fetch-failed.json | tr '\n' ' ')
```

### 並列エージェント起動

10 セッション分の Claude Code / ChatGPT を起動し、各々に上記キックオフ指示テンプレを `{AGENT_ID}`
だけ書き換えて貼る。

### 進捗監視

```bash
# 全体進捗
npm run fan-guide-status

# 特定エージェントの担当を確認
npm run fan-guide-status -- --agent agent-03

# 未対応 ID を列挙（CI 連携用）
npm run fan-guide-status -- --pending

# JSON 出力（他スクリプトに食わせる）
npm run fan-guide-status -- --json
```

### 受け取った fan-guide のレビュー

エージェントが書いた `data/sources/fan-guide/{id}.json` をレビュー：

1. **自動検証**: `npm run build:programs` で zod スキーマ違反は即弾かれる
2. **目視チェック**: ガイド §6 NG パターン / §9 自己レビュー結果を確認
3. **タグ分布**: 一通り終わったら全番組のタグ分布を見て偏りがないか確認

問題があったら担当エージェントに修正依頼するか、自分で手直し。

### 追加割り当て / 再割り当て

- 新規 ID を追加したい場合（番組 ID 一覧が更新された場合）:
  ```bash
  npm run list-booths       # 最新の ID 一覧を再取得
  npm run assign-fan-guide  # 未割り当て分だけ追加
  ```
- エージェント数を変えたい場合:
  ```bash
  npm run assign-fan-guide -- --agents 5 --reassign
  ```
- 完了済みは割り当て対象外にしたい場合:
  ```bash
  npm run assign-fan-guide -- --skip-completed
  ```

---

## 関連ファイル

- [fan-guide-writing-guide.md](./fan-guide-writing-guide.md): 執筆ガイド本体（エージェント必読）
- `data/booth-ids.json`: 142 番組の ID リスト
- `data/fan-guide-assignments.json`: 割り当て表（**手動編集禁止**）
- `data/fetch-failed.json`: fetch:official で失敗した ID（次回リトライ用）
- `data/sources/official/{id}.json`: 機械抽出済み公式情報
- `data/sources/fan-guide/{id}.json`: エージェントが書く fan-guide（提出物）

---

**最終更新**: 2026-04-29（v1.6.1：お手本 10 番組の通読ステップ + 3 フェーズフロー連携）
