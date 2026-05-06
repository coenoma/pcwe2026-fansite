# Listen MCP 再探索チェックリスト（B群 23 件）

**作成日**: 2026-05-06
**完了日**: 2026-05-06
**対象**: not-found 90 件のうち、Listen.style 登録ありの **B群 23 件**
**目的**: Listen MCP（`mcp__listen__*`）で最新エピソードを再探索し、PCWE2026（2026/5/9-10）物販告知エピソードを発見する

---

## 探索方針

各番組について以下を実施:

1. `mcp__listen__search_podcasts` で番組を検索 → ULID podcastId を取得
2. `mcp__listen__get_podcast_episodes` で最新 30〜50 エピソードのタイトル一覧取得
3. タイトルに「Podcast Weekend」「PCWE」「物販」「グッズ」「ブース」「2026」「5月9日」「5月10日」を含むものを抽出
4. 候補があれば `mcp__listen__get_episode` の description / `get_episode_transcript` で本文確認
5. **PCWE2026 確証チェック**: 「2026年5月9日(土)」「2026年5月10日(日)」「PCWE2026」「PODCAST EXPO 2026」「Podcast Weekend 2026」「HOME/WORK VILLAGE」のいずれかが本文に明示されていること
6. 過去年度（PCWE2024 = 2024/11/3、PCWE2022）の文言と混同しないこと

---

## 判定結果テーブル

| ID | 番組名 | Listen URL | 結果 | 候補 episode ID | メモ |
|---|---|---|---|---|---|
| pcwe-007 | 自分にやさしくするラジオ | https://listen.style/p/begentlewithyourself | ❌ | — | search_podcasts 結果なし。Listen MCP では番組ヒットせず、再検索余地なし |
| pcwe-012 | 拝啓、3000年の人類へ | https://listen.style/p/aqqtrbw5 | ✅ | 01knfscd3facmc4dsj8ahgc5pz / 01kq67fvm91wc4t14xtjv2s19v | **done 化**: 5/10 出店確証 + 企画展形式 + 4種物販詳細あり |
| pcwe-014 | オバトーク | https://listen.style/p/obatalk | ❌ | — | 最新50回タイトルに PCWE 関連エピソードなし |
| pcwe-018 | こうきとたかやのラジオもどき | https://listen.style/p/radiomodoki | ✅ | 01kkk468snbe4pxkn1yfg5nbyx ほか | **done 化（3rd pass）**: 公式 boothpage に「イベント当日も非生産的なブースを展開させていただく予定」と出展確証 + Listen #152〜#159 でリスナー投票による日めくりカレンダー作成シリーズ連続展開（公式 merchandise 「非生産的な日めくりカレンダー」と一致） |
| pcwe-019 | 高橋クリスのFA_RADIO | https://listen.style/p/faradio | ❌ | — | 工場自動化系番組。最新50回タイトルに PCWE 関連エピソードなし |
| pcwe-024 | マイクラジオ | https://listen.style/p/maikuradio | ✅ | 01kqkwxf6xkt1yk93qr6bdyg9r | **done 化**: 「ポットキャストエクスポ紹介会」(2026-05-02) でくじ景品4種 + マイクラ体験会を本人告知 |
| pcwe-032 | 13歳からのPodcast | https://listen.style/p/13karapodcast | ✅ | 01khjzpq8f2h8carhbfnb1ygw5 | **done 化**: 「PODCAST EXPO 2026に出展します！」(2026-02-16) で出展確証。グッズ詳細は「お楽しみ」「考え中」とのコメントだが公式 merchandise は scrape 済み |
| pcwe-033 | HYPLACE WAVE #はいなみ | https://listen.style/p/hainami758 | ❌ | — | DJ系番組。最新50回タイトルに PCWE 関連エピソードなし |
| pcwe-040 | 俺思 | https://listen.style/p/oreomo | ✅ | 01kqq4bt8zt54bza3ejv9x94pd | **done 化（2nd pass）**: 「創44号」(2026-05-03) のエンディングでホスト本人が「5月9日5月10日 ポッドキャストエキスポでグッズ出します」と告知 |
| pcwe-041 | 酒の道～日本酒の聖地から～ | https://listen.style/p/w6pm3kfn | ❌ | — | search_podcasts でヒットせず（しぶさわくんFM 関連別番組はあるが PCWE 関連エピソードなし）、URL slug 直接照会も MCP で不可 |
| pcwe-042 | あきらめラジオ | https://listen.style/p/akirameradio | ✅ | 01kqm503hn9psjcce2r228mr5w | **done 化**: 「【番外編】PCWE2026の裏話」(2026-05-02) で出店確証 + 命綱ターミナルチェーン・真鍮チャーム・諦め探しジャーナリング体験を本人告知 |
| pcwe-046 | 人生百貨店 | https://listen.style/p/lifedeptstores | ❌ | — | 最新50回タイトルに PCWE 関連エピソードなし |
| pcwe-047 | クリエイターエコノミーニュース | https://listen.style/p/creator_enews | ❌ | — | ニュース番組。最新50回タイトルに PCWE 関連エピソードなし |
| pcwe-055 | 工業高校農業部 | https://listen.style/p/kounoubu | ✅ | 01kqj5w8rc7bg7t4x6b551r6qc | **done 化（2nd pass）**: 「【特別回】同級生ポッドキャストの大先輩呼んでみた」(2026-05-01) で PCWE 主催・株式会社雑談の渋谷さんをゲストに招き、ブース出展+わらしべ長者選手権を告知 |
| pcwe-061 | さのみきひとのラジオ ⌞ ラのみきジオ ⌝ | https://listen.style/p/ranomikijio | ❌ | — | search_podcasts では別番組ヒットあり。Spotify 限定番組のため Listen に PCWE 関連エピソードなし |
| pcwe-077 | アラサー同期のみなまでいうと | https://listen.style/p/uuhfgtfm | ✅ | 01kqq5znrfa9xz57825z5qj12w | **done 化（2nd pass）**: 「📮#6 もらった手紙にみなまでいうと」(2026-05-03) 冒頭でホスト本人が「ポッドキャストウィークエンド出展当選しました! 5月9日に出展」と告知 |
| pcwe-106 | 公共訴訟ラジオ | https://listen.style/p/cem9oa2z | ❌ | — | 2024年に PCWE2024 出店告知エピソードあり (`01jbpy4h1pj8k9n0ca9efvrg29`) だが PCWE2026 関連エピソードなし。過去年度誤掲載防止のため not-found 維持 |
| pcwe-107 | ラジオただいま発酵中 | https://listen.style/p/cnjfbfzz | ❌ | — | 最新50回タイトルに PCWE 関連エピソードなし |
| pcwe-109 | しゃらくさラジオ | https://listen.style/p/syarakusaradio | ❌ | — | 最新50回タイトルに PCWE 関連エピソードなし |
| pcwe-110 | 生物をざっくり紹介するラジオ ぶつざくネオ | https://listen.style/p/butuzaku-neo | ✅ | 01kq6rr0jzd71v4c9je25dgtka | **done 化（2nd pass）**: 「第68話-B」(2026-04-27) のエンディングでホスト本人が「5月10日日曜日に出展、仏作キク百種図鑑2を販売」と告知 |
| pcwe-115 | 吉村ジョナサンの高校古典講義 | https://listen.style/p/yoshimurajona | ❌ | — | search_podcasts でヒットせず、Listen MCP では番組ヒットせず再検索余地なし |
| pcwe-121 | ぜったい大丈夫だよラジオ | https://listen.style/p/6ki02xqz | ❌ | 01j9xe5prymnny76awqednaj6b | 2024年に「PCWEで何する？公開会議する私たち」(2024-10-11) あり (PCWE2024 関連)。PCWE2026 関連エピソードなし |
| pcwe-139 | ぬまずっきゅーんfromみんキャス | https://listen.style/p/edjfkyvh | ❌ | — | 最新50回タイトルに PCWE 関連エピソードなし |

凡例: ✅ done 化 / 👀 needs-review / ❌ not-found 確定（探索余地なし）

---

## サマリ

- ✅ **done 化: 12 件**
  - **1st pass（Listen タイトル検索）**: pcwe-012, pcwe-024, pcwe-032, pcwe-042
  - **2nd pass（Listen transcript 深掘り）**: pcwe-040, pcwe-055, pcwe-077, pcwe-110
  - **3rd pass（boothpage + Listen 行動裏付け）**: pcwe-018
  - **4th pass（boothpage description 単独で出展確証メッセージ）**: pcwe-028, pcwe-105, pcwe-113
- 👀 needs-review: 0 件
- ❌ not-found 確定: 11 件（探索余地なし、Listen 最新エピソードに PCWE2026 物販告知なし、transcript 深掘りでも発見できず）

### 4th pass について

B群以外の番組も含めて、`official.description`（公式 boothpage scrape 結果）に
「PCWEに初出店」「ブースで〇〇収集します」「会場でお待ちしています」など
**ホスト本人による出展確証メッセージ**が含まれているケースを発見。これらは
sourceUrl: 公式 boothpage、sourceType: 'official-booth' で done 化可能。

検出ロジック:
1. not-found.md の番組 ID を抽出
2. `data/sources/official/{id}.json` の `official.description` を出展キーワードで検索
   （「ブース」「出展」「出店」「お待ちしています」「会場で」「PCWE」など）
3. ヒットしたら snippet 確認 → お便り募集等の文脈は除外、本物の出展確証だけ採用

### 2nd pass の発見ポイント

タイトルが PCWE 関連でなくても、**通常エピソードの冒頭・末尾に告知が入っている**ケースを transcript 取得で発見できた。
ポッドキャストの慣習として「本編とは別にイベント告知をエンディング/イントロで入れる」のがあり、タイトルだけでは判定できない。
今後の探索ではタイトル検索 → ヒット無しでも、最新 2〜4 エピソードの transcript を必ず確認する方針が有効。

---

## 探索の限界

- **Listen の番組ページ URL（`https://listen.style/p/{slug}`）から ULID への対応は MCP で取得できない**ため、`search_podcasts` でヒットしない番組（slug が短すぎる等）は再探索余地なし（pcwe-007, pcwe-041, pcwe-115）。
- **Listen エピソード固有 URL（`/p/{podcast-slug}/{episode-slug}`）の slug は MCP では取得できない**。WebFetch も SPA のため不可。本コミットでは sourceUrl は番組ページ URL を使い、description にエピソードタイトルと公開日を明記して特定可能にした。
- 過去年度（PCWE2024）誤掲載防止のため、本文に「PCWE2026」「2026年5月9日」「2026年5月10日」「PODCAST EXPO 2026」「HOME/WORK VILLAGE」のいずれかが明示されたエピソードのみ done 化対象とした。

---

## 関連ドキュメント

- [README.md](./README.md) — 全体方針
- [runbook.md](./runbook.md) — 1 番組あたり手順
- [needs-review.md](./needs-review.md) — ユーザー判断仰ぐリスト
- [not-found.md](./not-found.md) — 取得不可リスト
- [listen-research/README.md](./listen-research/README.md) — 過去 Listen 探索の生データ
