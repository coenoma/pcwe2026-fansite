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

## ステップ 8: 適切なステータスに移動

物販詳細が確定できなかった場合、以下のいずれかに振り分ける（[README.md](./README.md) 参照）。

### A. ユーザーが目視確認した結果「現時点で言及なし、当日に向けて期待」

`docs/plans/v1-merchandise-rollout/monitoring.md` に追記。
当日（5/9-10）が近づいたら再チェックすべき番組。

```markdown
| pcwe-XXX | 番組名 | https://x.com/handle | — | — | ユーザー目視で言及なし確認。常設グッズショップあり。当日近くの新規告知投稿を再チェック推奨 | 2026-05-06 |
```

### B. AI が候補 URL を発見したが PCWE2026 の確証が取れない

`docs/plans/v1-merchandise-rollout/needs-review.md` に追記。
ユーザー判断で done 昇格 or not-found 確定するためのリスト。

### C. 探索手段なし / 過去年度のものしか見つからない / 削除済み

`docs/plans/v1-merchandise-rollout/not-found.md` の表に追記。
確定的に取得不可と判定されたもの。

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

## 大量精査（Listen.style 一括ワークフロー）

not-found / monitoring / needs-review の番組について Listen.style の文字起こし
や番組ページから物販詳細を発掘する場合のワークフロー。**生データを必ず永続化**
することで、セッションが変わっても担当が変わっても引き継げる体制を保つ。

### 1. 担当 batch ファイルを作成

```bash
# 例: not-found 117 件を 6 batch に分割
python3 <<'EOF' > /dev/null
import json, re
with open('docs/plans/v1-merchandise-rollout/not-found.md') as f:
    nf_ids = set(re.findall(r'\|\s*(pcwe-\d{3})\s*\|', f.read()))
with open('data/programs.json') as f:
    data = json.load(f)
targets = [...]  # nf_ids に該当する番組を抽出
n = 6
for i, b in enumerate([targets[j::n] for j in range(n)]):
    with open(f'docs/plans/v1-merchandise-rollout/listen-research/pcwe-listen-batch-{i+1}.json', 'w') as out:
        json.dump(b, out, ensure_ascii=False, indent=2)
EOF
```

`docs/plans/v1-merchandise-rollout/listen-research/` 配下に永続化すること
（`/tmp` は将来消える）。

### 2. subagent で並列探索

各 batch ファイルを担当する subagent を 6 並列起動。プロンプトの厳守事項:

- 創作禁止: 投稿 / エピソード本文で言及されていない物販を勝手に書かない
- 過去年度禁止: PCWE2024（2024/11/3）/ PCWE2022 と PCWE2026 を混同しない
- 2026 年明示確認: 「PCWE2026」「2026年5月9日(土)・10日(日)」等が明示されている
  ものだけ採用

各 subagent は結果を `docs/plans/v1-merchandise-rollout/listen-research/pcwe-listen-result-N.json`
に書き出す（フォーマットは README 参照）。

### 3. 結果反映 + 整合性同期

```bash
# 1. 探索結果を JSON に反映（merchandiseDetails 追加 + links.listen 追加）
npm run apply:listen-research

# 2. programs.json 再生成
npm run build:programs

# 3. done 化した番組を旧ステータスファイルから削除（整合性同期）
npm run sync:status-files

# 4. 進捗集計
npm run progress:merchandise
```

各スクリプトは**冪等**なので再実行しても安全。

### 4. ファクトチェック必要な番組は SKIP_DONE で

subagent が found 判定したが日付やイベント名に齟齬があるケース（例:
PCWE 公式日程「5/9-10」と本文「5/19」が一致しない pcwe-092）は、
`scripts/apply-listen-research.ts` の `SKIP_DONE` セットに ID を追加して
done 化対象外にする。代わりに `needs-review.md` へ手動で行を追加し、
ユーザー確認後に再判定する。

### 5. 引き継ぎ性の担保

`docs/plans/v1-merchandise-rollout/listen-research/README.md` に生データの
構造とスクリプトの動作を記載済み。新しい担当者は以下の順で確認すれば全体像を
把握できる:

1. README.md（このディレクトリの全体方針）
2. listen-research/README.md（生データの説明）
3. progress.md（自動生成、5 段階分類で現状把握）
4. needs-review.md / monitoring.md / not-found.md（個別番組の状態）

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

### 🚨 過去年度誤掲載の防止（必読）

過去ロールアウトで以下の誤掲載が発生した。**同じミスを繰り返さない**。

- **pcwe-016 overture**: Spotify ep91 を PCWE2026 物販告知と判断したが、**実際は PCWE2024（2024/11/3）の告知**だった
- **pcwe-054 よるののうか**: Spotify エピソードを PCWE2026 八朔ジュース告知と判断したが、**実際は PCWE2022 の告知**だった

**チェックリスト**: 物販詳細を JSON に追記する前に、以下を **必ず** 確認:

1. [ ] 情報源（投稿・記事）に「**PCWE2026**」「**PODCAST EXPO 2026**」「**Podcast Weekend 2026**」「**2026年5月9日**」「**2026年5月10日**」など、**2026 年または 5/9-10 を明示する記述**があるか
2. [ ] 投稿日 / 記事公開日が **2026 年** か（X 投稿は `created_at` を syndication API で確認）
3. [ ] 「11月3日」「11/3」「秋」など PCWE2024 を示唆する日付 / 文言がないか（PCWE2024 = 2024/11/3）
4. [ ] 「PCWE2024」「Podcast Weekend 2024」「PODCAST EXPO 2024」が記述されていないか

**1〜4 のいずれかでも引っかかったら、その情報源は採用しない**。
- 安易に「最新エピソードだから 2026 のはず」と判断しない
- 「ポッドキャストウィークエンド」だけでは年が特定できない（毎年開催）

### 「販売」「頒布」「配布」の使い分け

- **販売**（有料）: ホストが「販売」「お買い求め」「価格 ¥xxx」と明記しているもの
- **頒布**（同人界隈で「販売」と同義に使われることも多い）: 文脈不明なときは使わない方が無難
- **配布**（無料配布）: ホストが「先着」「無料」「ノベルティ」と明記しているもの

---

## 画像活用ルール（A + B ハイブリッド方式）

### 方針

X 以外の出典（note / web / Instagram 等）でも、**お品書き概要画像のように「物販ラインナップを俯瞰できる視覚情報」がある場合は、画像を活用してリスナー体験を豊かにする**。X 投稿は `react-tweet` 埋め込みで自動的に画像が出るが、それ以外の出典は意図的に画像を扱う必要がある。

採用方式は **A + B のハイブリッド**:

- **方式 A（DL + 自サイト配信 + 引用要件遵守）**: お品書き概要画像のような「物販を俯瞰できる視覚情報」を `public/images/sources/` に DL して配信。**日本式出典明記必須**。
- **方式 B（カード埋め込み = 出典で見る CTA）**: メイン出典への CTA として `note で見る` `web で見る` ボタンを最下部に常設。リスナーは出典記事へジャンプ可能。

### A 方式（画像 DL + 自サイト配信）の利用条件

引用要件（著作権法 32 条）を満たすこと:

1. **出典明記必須**: `imageCredit` フィールドで著者名 + 出典（note / web 等）を明記
2. **主従関係**: 自サイト本文（番組紹介・物販一覧）が主、引用画像は従
3. **必要性**: 画像なしでは伝わらない情報がある（例: 物販一覧のレイアウト・パッケージ・配布物の見た目）
4. **改変なし**: トリミング以外の改変は不可（リサイズ・画質調整は OK）
5. **公開済み一次情報**: 公開された note / 公式サイトの画像のみ。DM やクローズドチャネルの画像は不可

### B 方式（カード埋め込み = 出典で見る CTA）

メイン出典への CTA リンクは **常に表示**。リスナーが原典を確認できる導線を保証する。

UI 上の表現:

- X 投稿: `react-tweet` 埋め込み（既存実装）
- note: `note で見る →` ボタン（`bg-primary-50` のソフトボタン）
- web / 公式サイト: `web で見る →` ボタン
- Instagram 投稿: `Instagram 投稿で見る →` ボタン
- 公式ブース: `公式ブースで見る →` ボタン

### 王道パターン: X 概要 + note 詳細 + お品書き画像

**最も情報量が多く、かつ番組ホストの「生の声」も伝わる構成**。今後はこのパターンを意識的に集めていく。

- **メイン出典 = note**（詳細お品書き記事）
- **`additionalSources` に X 投稿**（番組ホストの告知ツイート）
- **`imagePath` でお品書き概要画像**（note からの引用画像）

UI 上の表現:

```
┌────────────────────────────────────┐
│ [お品書き画像]                     │ ← imagePath
│ © 著者名／note 記事より引用        │ ← imageCredit
│                                    │
│ 商品 1                             │
│ 商品 2                             │
│ ...                                │
│ ──────────────────────             │
│ 出典: 著者「タイトル」note、       │ ← Citation 自動生成
│ 2026年5月4日公開（5月7日 参照）    │
│                                    │
│ 📣 番組ホストの告知ツイート        │
│ [X 埋め込み: 番組ホストの生の声]   │ ← additionalSources の x-post
│ ──────────────────────             │
│ [📖 note で見る →]                 │ ← メイン CTA
└────────────────────────────────────┘
```

### JSON 記述例

```json
{
  "name": "Love Letter from 愛の抵抗（番組ペーパー）",
  "description": "A3二つ折り、白黒裏表（A4・4面）／100円。...",
  "sourceUrl": "https://note.com/asa_utsumi/n/n5a82a1833e81",
  "sourceType": "note",
  "imagePath": "/images/sources/pcwe-002-asa_utsumi-okashinagaki.png",
  "imageAlt": "愛の抵抗 PCWE2026 出展商品ラインアップ概要",
  "imageCredit": "© 内海あさ（@asa_utsumi）／note 記事より引用",
  "accessedAt": "2026-05-07T07:33+09:00",
  "sourcePublishedAt": "2026-05-04",
  "sourceAuthor": "内海あさ",
  "sourceTitle": "PCWE2026 出展商品ラインアップ",
  "additionalSources": [
    {
      "url": "https://x.com/asa_utsumi/status/2051227151329067247",
      "type": "x-post",
      "label": "番組ホストの告知ツイート"
    }
  ]
}
```

### 画像のファイル名規約

`public/images/sources/{programId}-{handle}-{slug}.{ext}`

- `programId`: pcwe-XXX
- `handle`: 著者の SNS ハンドル（@ なし、@asa_utsumi → asa_utsumi）
- `slug`: 内容を表す英小文字 / kebab-case（例: okashinagaki, lineup, flyer）
- `ext`: 元画像の拡張子に揃える（png / jpg / jpeg / webp）

例:
- `pcwe-002-asa_utsumi-okashinagaki.png`
- `pcwe-074-chikablend-flyer.jpg`

### DL 手順

```bash
# 例: note のお品書き画像
curl -sL "https://assets.st-note.com/img/XXX.png?width=1200" \
  -o "public/images/sources/pcwe-002-asa_utsumi-okashinagaki.png"
```

ダウンロード後、`Read` ツールで画像を確認して内容と一致するか必ず目視チェック。

### 日本式出典フォーマット

`MerchandiseGroupCard` の `Citation` コンポーネントが自動生成。JSON で以下を埋めておけば、UI で日本式の出典が組み立てられる:

| フィールド | 表示 |
|---|---|
| `sourceAuthor` | "内海あさ" |
| `sourceTitle` | 「PCWE2026 出展商品ラインアップ」 |
| `sourceType` | note |
| `sourcePublishedAt` | "2026年5月4日公開" |
| `accessedAt` | "（2026年5月7日 07:33 参照）" |

→ 「出典: 内海あさ「PCWE2026 出展商品ラインアップ」note、2026年5月4日公開（2026年5月7日 07:33 参照）」

メタが何もない場合は出典明記スキップ（CTA リンクのみで十分）。

### 何を画像 DL するか / しないかの判断

| ケース | 判断 |
|---|---|
| お品書き概要画像（物販一覧を俯瞰できる） | ✅ DL する（情報量大） |
| 個別商品の写真（1 枚 = 1 商品） | △ 商品理解に必要なら DL、テキストで十分なら省略 |
| 番組ホスト本人の写真 | ❌ DL しない（肖像権・主従関係の問題） |
| 公式ロゴ・キービジュアル | △ 番組告知の文脈なら OK、装飾目的なら不要 |
| 価格表のスクリーンショット | ✅ DL する（テキスト転記より誤りが少ない） |
| 過去年度（PCWE2024 等）の画像 | ❌ 採用禁止（年度誤掲載の温床） |

→ ホストが使っていない言葉に**勝手に置き換えない**。「販売」と書かれていれば「販売」、不明なら「PCWE2026 ブースで取り扱い予定」など中立表現を使う。
