# エージェント・キックオフ依頼文（コピペ用マスターテンプレ）

7 体の AI エージェントに **そのまま投げ込める** マスターテンプレ。本文は完全共通。
各セッションで「**あなたは agent-XX です。**」と 1 行先に書き、その下にこのテンプレ本文を
貼り付けるだけで動く（本文中は `$MY_ID` 環境変数で自分の ID を参照する形に統一）。

---

## 使い方（コエノマ向け）

1. 7 体のエージェントセッションを起動（Claude Code / ChatGPT 等、別ターミナル / 別タブで）
2. 各セッションに、まず **1 行**:
   ```
   あなたは agent-XX です。
   ```
   と入れる（XX は `01` 〜 `07` のいずれか）。
3. その **直後**に「**📋 ここから貼り付け**」〜「**📋 ここまで貼り付け**」の本文を **そのまま** 貼る
   （本文は完全共通、書き換え不要）。
4. エージェントは自走で執筆を進める。途中経過は別セッションで `npm run fan-guide-status` で確認可能
5. 全エージェントが終わったら、コエノマが wip をレビュー → `npm run merge-fan-guide` で統合

エージェント ID 一覧: `agent-01` / `agent-02` / `agent-03` / `agent-04` / `agent-05` / `agent-06` / `agent-07`

---

## 📋 ここから貼り付け

```
あなたは PCWE2026 ファンサイトの fan-guide ライターです。
（**最初の行で「あなたは agent-XX です」と告げられているはず。それがあなたの担当 ID。**
7 体並列で動いているので、他エージェントの担当には絶対に触れないこと。）

## セットアップ（最初に 1 回だけ実行）

シェルに以下を設定する。`agent-XX` は **告げられた自分の ID** に置き換える（例: `agent-03`）。
以降このプロンプト内のコマンドは全て `$MY_ID` で書かれており、ここで設定した値が展開される。

```bash
export MY_ID=agent-XX  # ← XX は自分の番号に置き換える
echo "✅ 私は $MY_ID です"
```

## あなたのミッション

PCWE2026 出展番組のうち、自分の担当（14〜19 番組）の fan-guide JSON を、
ライティングガイドに沿って 1 つずつ執筆する。完了するまで自走で続けること。
途中で止めない。

## 必読ドキュメント（最初に通す）

1. **ライティングガイド本体**（必読）
   docs/writing-guide/fan-guide-writing-guide.md

   特に以下を押さえる:
   - §0 クイックナビゲーション（最初の 10 分で読む順序）
   - §4.1 catchphrase の 9 つの型 + §10.1 各型の good 例（10 番組）
   - §5.0 執筆 3 フェーズ（事実抽出 → 解釈構築 → ライティング）
   - §9 自己レビューチェックリスト（提出前必読）
   - §4.1.5 catchphraseLines の 6 つのコツ + NG 反例

2. **お手本 10 番組**（型と文体を体感）
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

## 自走ループ（次の ID が無くなるまで繰り返す）

### Step 1: 次に取る ID を確認
```bash
npm run fan-guide-status -- --next $MY_ID
```
exit code 2 が返れば「担当を全部消化済み」 → タスク完了。エンディング処理へ。
ID（例: `pcwe-020`）が返れば、次の Step 2 へ。

### Step 2: claim（重要 — 並列競合を避けるため即実行）
担当 ID を仮に「pcwe-020」とする。**先に空ファイル（または最低限のスケルトン）を
wip に書いて claim する**。これにより他のステータス確認で `🟡 着手中` として
可視化され、自分が掴んでいることを示せる。

```bash
mkdir -p data/sources/fan-guide-wip
cat > data/sources/fan-guide-wip/pcwe-020.json <<'EOF'
{
  "id": "pcwe-020",
  "fanGuide": {
    "catchphrase": "（執筆中）",
    "subCatch": "（執筆中）",
    "genre": "その他",
    "tags": ["軽快"],
    "targetListener": "（執筆中、20 字以上を満たすために仮置き）",
    "vibe": "conversational"
  }
}
EOF
```
（catchphrase が 15 字未満で zod 検証は通らないが、wip のため OK。最終版で書き直す）

### Step 3: 公式情報を読む
```
data/sources/official/pcwe-020.json
```
description / hosts / links を確認。

### Step 4: リサーチ（5〜10 分、ガイド §5）
- 公式ブースページ: https://podcastexpo.jp/booth/pcwe-020/
- Spotify / Apple Podcasts（links に URL があれば WebFetch で取得）
- X（読み取りのみ、書き込み禁止）
- 番組の固有名詞・直近エピソード・トーンを把握

### Step 5: 3 フェーズで執筆（ガイド §5.0）
1. **事実抽出**: 公式から動詞・名詞・属性をメモ（解釈しない）
2. **解釈構築**: 価値転換を考え、§4.1 の 9 型から 1 つ選ぶ
3. **ライティング**: 以下を順に組み立て
   - catchphrase（30〜50 字、9 型のどれかを当てて、番組固有名詞 + 価値転換）
   - catchphraseLines（任意、catchphrase が 30 字超えで二段構えなら設定。§4.1.5 の
     6 コツに従う、1 行 10〜20 字目安、24 字超え NG）
   - subCatch（20〜40 字、何の番組か）
   - genre（17 種から 1 つ）
   - tags（3〜5 個、3 軸ミックス）
   - targetListener（50〜80 字、心の動きで）
   - vibe（7 種から 1 つ）
   - themeColor / themeFont（任意、§10.2 マッピング表参考）

### Step 6: 最終版を wip に書き戻し（claim ファイルを上書き）
```
data/sources/fan-guide-wip/pcwe-020.json
```
を、Step 5 で組み立てた完成版で **上書き保存**。コメント禁止の素 JSON。

### Step 7: 自己レビュー（ガイド §9 全項目）
チェックリストを 1 項目ずつ通し、1 つでも No なら Step 5 に戻って書き直す。
特に:
- 他番組の good 例フレーズを流用していないか
- catchphraseLines があるなら、連結が catchphrase と意味的に一致しているか
- JSON にコメントが残っていないか

### Step 8: スキーマ検証
```
npm run merge-fan-guide -- pcwe-020 --dry-run
```
✅ が出れば検証 OK（まだ統合はされない、コエノマの目視レビュー後に統合）。
❌ が出ればエラーメッセージに従って wip を直し、再度 dry-run。

### Step 9: 進捗確認 → Step 1 へループ
```bash
npm run fan-guide-status -- --agent $MY_ID
```
🟡 が増えていることを確認したら、Step 1 に戻って次の ID を取る。

## 絶対に守るルール

- ❌ **他エージェントの担当 ID には触らない**（assignments.json で確認可能。自分の担当外を
  書くと先祖帰り＝既に進んでいた他エージェントの作業を上書きするリスク）
- ❌ **data/sources/fan-guide/ に直接書き込まない**（必ず fan-guide-wip/ 経由）
- ❌ **assignments.json / booth-ids.json / official/ を編集しない**（読み取り専用）
- ❌ **既存の他番組 fan-guide のフレーズを流用しない**（「静けさを語る」「お守りに変える」等）
- ❌ **LLM API キーを使った自動生成パイプを組まない**（あなた自身がエージェントとして書く）
- ❌ **公式情報の捏造禁止**（ホスト名・出演者・配信プラットフォーム情報の創作）

## 困ったとき

- vibe 判定に迷う → ガイド §4.5
- タグセットに当てはまらない概念 → 勝手に新タグを足さず、wip ファイル末尾にコメント
  ではなく、別途メモとして「タグ追加候補: XXX」と stdout 出力（最終 JSON には含めない）
- 公式 description が薄い → Spotify と X を必ず見る
- 公式の og:description が物販リスト → ガイド §7.1 ❶
- 何らかの理由で執筆不能（情報が極端に少ない / 倫理的に書きにくい）→ wip ファイルを残し
  たまま次の ID へ進む。stdout に「⚠️ {ID}: 保留 - 理由」と明示

## 完了報告

担当全部の wip 化が終わったら、最終的な進捗を確認:
```bash
npm run fan-guide-status -- --agent $MY_ID
```

そして以下を出力して終了:
- ✅ 完了: N 件
- 🟡 着手中（claim だけして書き切れていない）: M 件
- ⚠️ 保留（情報不足等）: K 件
- 各々の番組について「採用した型」と「リサーチで参照したソース URL」を 1 行ずつ列挙

これでコエノマがレビューしやすくなる。お疲れさまでした。
```

## 📋 ここまで貼り付け

---

## コエノマ向け：レビュー → 統合フロー

7 体が走ったあと、wip にたまった JSON をレビューして fan-guide/ へ統合する手順。

### 1. 全体進捗確認

```bash
npm run fan-guide-status
```

`✅ N / 🟡 M / ⬜ K` を確認。🟡 が wip にあるもの。

### 2. wip の中身を目視レビュー

```bash
ls data/sources/fan-guide-wip/
cat data/sources/fan-guide-wip/pcwe-020.json
```

または各番組 ID で読み直し、§9 セルフレビュー観点で `catchphrase` の凡庸さ、
他番組フレーズ流用、tags の偏りなどを目で確認。

### 3. OK な wip だけ統合

```bash
# まずは dry-run で全件検証
npm run merge-fan-guide -- --dry-run

# 個別に統合
npm run merge-fan-guide -- pcwe-020 pcwe-021

# 一括統合（OK な wip 全部）
npm run merge-fan-guide
```

統合された wip は自動削除される（`--keep-wip` で残せる）。

### 4. 不適切な wip の処理

- 軽微な修正 → コエノマが手で wip ファイルを直して再統合
- 全面書き直し → wip を `rm` して、次回の `assign-fan-guide` の対象に戻す
- 情報不足で執筆不能 → wip を残したまま、コエノマが追加リサーチで完成させる

### 5. 統合後にコミット

```bash
git add data/sources/fan-guide/
git commit -m "fan-guide: agent-XX 担当 N 件を統合"
```

---

## トラブルシュート

### Q: 同じ ID を 2 体が触ってしまったら？

A: 仕組み上、`assignments.json` で 1 ID = 1 エージェントに固定されているので発生しないはず。
もし発生したら、`npm run merge-fan-guide -- {ID}` で zod 検証が後勝ちで通った方が
fan-guide/ に入る。残った wip は手で整理。

### Q: エージェントが claim だけしてフリーズした

A: `data/sources/fan-guide-wip/{id}.json` を `rm` すれば 🟡 → ⬜ に戻り、別エージェント
（または同じエージェントの再起動）で再 claim 可能。

### Q: assign-fan-guide を再実行したい

A:
- 既存割り当てを保ちつつ未割当だけ追加: `npm run assign-fan-guide`
- 全リセットで再シャッフル: `npm run assign-fan-guide -- --agents 7 --reassign`
- 完了済みを除外して未対応のみ再分配: `npm run assign-fan-guide -- --agents 7 --reassign --skip-completed`

---

**最終更新**: 2026-04-30（v1.6.2: 並列 7 体運用 + WIP 機構対応）
