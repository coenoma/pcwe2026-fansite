# 物販情報ロールアウト ランブック（1 番組あたりの手順）

> セッションが切れても、担当が変わっても、誰がやっても **同じ品質・同じ手順** で進めるための作業手順書。
> ここに書いてある順序通りに進めること。逸脱が必要な場合は README に追記してから。

---

## 前提

- 作業ディレクトリ: `/Users/yutokikuchi/dev/coenoma/lp/pcwe2026-fansite`
- ブランチ: `feature/merchandise-rollout-*`（feature ブランチで作業し、まとめて main マージ）
- 各番組の現状: `data/programs.json` の `programs[].official.merchandiseDetails` を見る

---

## ステップ 1: 番組の探索情報を取得

```bash
# 例: pcwe-013 の場合
python3 -c "
import json
with open('data/programs.json') as f:
    data = json.load(f)
p = next(p for p in data['programs'] if p['id'] == 'pcwe-013')
print(json.dumps({
    'id': p['id'],
    'name': p['name'],
    'links': p['links'],
    'boothUrl': p['boothUrl'],
}, ensure_ascii=False, indent=2))
"
```

確認するもの:

- `name`（番組名 — SNS 検索に使う）
- `links.x`（X 公式 — 最優先）
- `links.instagram`（Instagram 公式）
- `links.website`（公式サイト）
- `boothUrl`（PCWE 公式ブースページ — 既に scrape 済みだが念のため）

---

## ステップ 2: 探索（優先順位順）

### A. X 公式アカウントがある場合（最優先）

1. WebSearch で `"番組名" PCWE2026 物販` を検索
   - 例: `"金曜日の焚火会" PCWE2026 物販`
2. ヒットしたら、X 投稿の URL を控える
3. WebFetch でも取れない場合は **Chrome MCP** で X タイムラインを直接開く
   - `https://x.com/{handle}` を navigate
   - 最近の投稿（2026-04 以降）で物販告知を探す

### B. Instagram の場合

1. WebFetch で `links.instagram` を開く
2. 最近の投稿で物販告知 / リール の告知を確認

### C. 公式 Web サイト

1. WebFetch で `links.website` を開く
2. 「物販」「グッズ」「PCWE2026」「お知らせ」ページを確認

### D. PCWE 公式ブースページ

1. `boothUrl` (`https://podcastexpo.jp/booth/pcwe-XXX/`) を再確認
2. `【出店予定】` 以外に X 投稿引用や note リンクが書かれていることがある

---

## ステップ 3: 物販詳細の取得（X 投稿が見つかった場合）

### 3.1 Tweet ID 抽出

X 投稿 URL から数字部分を抽出:

```
https://x.com/{handle}/status/2048685734534721542?s=20
                              ^^^^^^^^^^^^^^^^^^^
                              ← この数字が tweet ID
```

### 3.2 syndication API で取得検証

```bash
curl -s "https://cdn.syndication.twimg.com/tweet-result?id=2048685734534721542&token=a" | head -c 500
```

レスポンスに `"__typename":"Tweet"` が含まれれば取得可能。
取得不能（404 / 削除済み / protected）なら **その投稿は使わない**。

### 3.3 投稿内容の確認

- 画像があるか（埋め込みで自動表示される）
- 価格、サイズ、素材、限定数などのメタ情報
- 投稿が複数の物販を含む場合は、物販ごとに別エントリにする（同じ sourceUrl OK）

---

## ステップ 4: JSON に追記

### 編集対象

`data/sources/official/pcwe-XXX.json` の `official.merchandiseDetails` 配列。

### スキーマ（型定義）

```typescript
{
  name: string;        // グッズ名（必須・15 字以内推奨）
  description?: string; // 補足（価格・サイズ・限定数 — 投稿原文を厳密転記）
  sourceUrl: string;   // 情報源 URL（必須）
  sourceType: 'x-post' | 'instagram-post' | 'official-booth'
            | 'official-site' | 'note' | 'web';
  // imageUrl は使わない（X 規約準拠のため埋め込みで対応）
}
```

### 例

```json
"merchandiseDetails": [
  {
    "name": "オリジナルロゴステッカー",
    "description": "事前 ¥500 / 当日 ¥600。番組ロゴ + イラスト 2 種から選択。",
    "sourceUrl": "https://x.com/example/status/1234567890123456789",
    "sourceType": "x-post"
  }
]
```

### 物販グッズ名がない場合（投稿で複数同梱告知）

1 投稿で複数物販を紹介してる場合は、物販ごとに別エントリ（同じ sourceUrl）。
1 投稿に物販名が明示されてない場合は **その投稿は使わない**（命名を推測しない）。

---

## ステップ 5: programs.json の再生成

```bash
npm run build:programs
```

`data/programs.json` が再生成される。これがフロント側の参照元。

---

## ステップ 6: ローカルビルド検証

```bash
# 残留プロセスを kill
pkill -f "serve out" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# 古い成果物削除
rm -rf .next out

# build（X 投稿があれば syndication API を build 時に叩く）
npm run build
```

ビルド成功 → tweet データが正常取得できた証拠。
ビルド失敗 / 警告 → tweet ID が削除済み or rate limit。`not-found.md` に移動。

---

## ステップ 7: ビジュアル確認（任意・数件まとめて 1 度でも OK）

```bash
npx serve out -p 3015 &
# Chrome で http://localhost:3015/booth/pcwe-XXX を開く
```

ブース物販セクションに 3 カラム（ワイド画面）で投稿が表示されれば成功。

---

## ステップ 8: not-found に移動（投稿が見つからなかった場合）

`docs/plans/v1-merchandise-rollout/not-found.md` の表に追記。
記載項目:

- 番組 ID
- 番組名
- 公式 X / Instagram / Website URL
- 調査メモ（どこを見て、なぜ見つからなかったか）
- 最終調査日

例:

```markdown
| pcwe-XXX | 番組名 | https://x.com/handle | （IG なし） | （Web なし） | X タイムラインに 2026-04 以降 PCWE2026 関連投稿なし。最新投稿は 2026-03-15 | 2026-05-05 |
```

---

## ステップ 9: 進捗の更新

```bash
npm run progress:merchandise
```

`docs/plans/v1-merchandise-rollout/progress.md` が再生成される。手で編集しない。

---

## ステップ 10: コミット（5〜10 番組まとめて）

```bash
git add data/sources/official/pcwe-*.json
git add data/programs.json
git add public/data/llms-full
git add docs/plans/v1-merchandise-rollout/

git commit -m "$(cat <<'EOF'
feat(merchandise): 物販詳細を N 番組追加（pcwe-XXX, pcwe-YYY, ...）

【追加】
- pcwe-XXX 番組名: 商品名 (X 投稿)
- pcwe-YYY 番組名: 商品名 1 / 商品名 2 (X 投稿)

【not-found】
- pcwe-ZZZ 番組名（理由: X タイムラインに該当投稿なし）

進捗: N/142 完了

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## エラー対応

### `getTweet()` が失敗してビルドが警告を出す

- 削除済み投稿: `not-found.md` に移動
- rate limit: 数分待ってリトライ
- protected アカウント: そもそも syndication API 不可 → `not-found.md`

### Chrome MCP で X が認証要求してくる

- ぼく側のブラウザは未認証で OK（X はログアウト状態でも投稿読める）
- 「ログインして続ける」が表示されたら、その投稿は protected の可能性 → `not-found.md`

### 番組サイトが SPA で WebFetch が空

- WebFetch は HTML を見るので JS rendered SPA は読めない
- Chrome MCP で navigate → read_page で代替

---

## 禁則事項

- ❌ 創作: 投稿で言及されていない物販を勝手に書かない
- ❌ 推測: 「たぶんステッカーでしょう」のような曖昧記載は禁止
- ❌ 価格の四捨五入: 投稿が `¥1,400` なら `¥1400` 等に変えない
- ❌ ID の捏造: `status/0000000000` のような placeholder は絶対禁止
- ❌ pbs.twimg.com の `imageUrl` 直接リンク: X 規約違反
