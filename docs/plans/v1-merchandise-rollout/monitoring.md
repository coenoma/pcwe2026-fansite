# 物販詳細 言及なし（要再チェック）リスト

このリストにある番組は、**ユーザー（運営者）が目視で番組ホストの SNS / 公式サイトを確認した結果、
現時点では物販告知の言及が見当たらなかった** ものです。
ただし当日（2026/5/9-10）まで日数があるため、新たに告知投稿が出る可能性があります。

---

## ステータスの違い（迷わない判定フロー）

下のフローを上から順にYES/NOで判定してください。最初にマッチしたステータスを採用します。

```
Q1. SNS / 公式サイトで「PCWE2026 の物販告知」を発見できたか？
    → YES: 【done】 JSON に merchandiseDetails を追記
    → NO: Q2 へ

Q2. AI が「PCWE2026 用かどうか確証取れない候補 URL」を見つけたか？
    （例：常設グッズショップだけ、過去年度の告知、内容曖昧な投稿）
    → YES: 【needs-review】 ユーザー判断仰ぐ
    → NO: Q3 へ

Q3. 番組ホストの SNS / 公式サイトはそもそも存在するか？
    → NO: 【not-found】 探索手段なしで確定取得不可
    → YES: Q4 へ

Q4. 既に過去 PCWE 参加実績しかなく、PCWE2026 の探索余地がもうないか？
    → YES: 【not-found】 これ以上の探索余地なし
    → NO: 【monitoring】（このファイル）当日まで新規告知の可能性あり、再チェック推奨
```

### 一行サマリ

| ステータス | 一言で言うと |
|---|---|
| **done** | PCWE2026 物販告知を発見、JSON 反映済み |
| **needs-review** | 候補 URL あり、PCWE2026 確証なし、ユーザー判断待ち |
| **monitoring**（このファイル） | SNS あり、現時点で言及なし、当日まで再チェック推奨 |
| **not-found** | SNS なし or 過去 PCWE のみで探索余地なし |

---

## 再チェックの推奨タイミング

- **ロールアウト直前期（5/1〜5/7 頃）**: ホストがイベント直前に告知することが多い
- **当日（5/9・5/10）**: 当日販売情報が確定するため、現地で確認できる場合は要更新
- **イベント後**: 売り切れ / 完売情報の追記で精度が上がる

---

## 言及なしリスト

| 番組 ID | 番組名 | X | Instagram | Website | 確認結果 / 次のアクション | 確認日 |
|---|---|---|---|---|---|---|
| pcwe-005 | 日々の句読点。by SEKISUI HOUSE | — | — | — | ユーザー指摘を受け Listen.style で 3 エピソード（bnxhrtsf / isqg69cr / kct09rga）を WebFetch 確認。「ブース出展（5/9-10）」のみ告知、物販詳細記載なし。SNS なしのため当日近くの追加情報源待ち | 2026-05-06 |
| pcwe-057 | りっちゃ・りょかちのやいやいラジオ | https://x.com/yaiyai_radio | — | — | Spotify ep #306「Podcast EXPO でブース出すよ」を AI が WebFetch 確認、物販詳細記載なし。ユーザー側で Listen.style の文字起こし or 当日告知投稿を再チェック推奨。SUZURI「やいやい商店」の常設グッズあり | 2026-05-06 |
| pcwe-066 | ローカルナイトニッポン | https://x.com/lnnradio | — | — | ユーザー目視で言及なし確認。BASE 公式ショップ (lnn.base.ec) 常設のみ確認。当日近くの新規告知投稿を再チェック推奨 | 2026-05-06 |
| pcwe-099 | 本の虫のススメ | https://x.com/honnomushi_ssm | — | — | ユーザー目視で言及なし確認。文学フリマ東京 41/42 の出店告知あり、PCWE2026 の固有物販告知は未発見。当日近くの追加投稿を再チェック推奨 | 2026-05-06 |
| pcwe-118 | 朝日新聞ポッドキャスト | https://x.com/AsahiPodcast | — | — | ユーザー目視で言及なし確認。X タイムラインで「2 日間出店」のみ確認、朝リスちゃんグッズキャンペーンの固有 status URL 未特定。当日近くの追加投稿を再チェック推奨 | 2026-05-06 |
| pcwe-120 | hitokoto Radio | https://x.com/hitokotoRadio | — | — | Listen.style ep cakqiayt および Apple Podcasts ep#90「告知！PODCAST WEEKEND 2026出展決定」（ID: 1000758009722）で出展は確実。物販ラインナップ・価格は当日告知待ち。当日近くの番組更新を再チェック推奨 | 2026-05-06 |
| pcwe-016 | overture〜ミュージカル好きの語り部屋〜 | — | https://www.instagram.com/hyp_ran | — | ユーザー目視で言及なし確認（2026-05-06）。Spotify ep #91 は PCWE2024 の告知で PCWE2026 用ではない。Instagram / Spotify が active なため当日近くの新規告知を再チェック推奨 | 2026-05-06 |

| pcwe-026 | 雨の日には本をさして。 | https://x.com/amehonns2 | https://www.instagram.com/amehons2 | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-044 | ひうら芳麗の楽女なニュース | https://x.com/marikosatoru | https://www.instagram.com/ladyfangchang | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-045 | PodcastTimes｜ぽっどでの新人 | https://x.com/Podcast_TimesJP | https://www.instagram.com/podcasttimes_jp/ | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-053 | 丘の上喫茶 | https://x.com/okanoue_kissa | https://www.instagram.com/okanoue_kissa/ | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-056 | ゆりしー&さほほのガールズ・カルチャー・リサーチ〜深く潜れ！！〜 | https://x.com/gcrc_divedeep | — | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-081 | 聴くと映画が観たくなる！CINEMORE | https://x.com/cinemorejp | https://www.instagram.com/cinemore_official | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-087 | LocalTacoStories~耳で味わうエシカルな旅~ | — | https://www.instagram.com/localtacostories/ | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-097 | 戦略的幸福論〜AI時代をどう生きる？〜 | https://x.com/tiedfamily244 | — | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-100 | 「いま、暇？」急いで準備するからちょっと飲まない？ | https://x.com/imahimanomanai | — | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-102 | watashito | — | https://www.instagram.com/watashito_podcast/ | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-112 | 深呼吸できる女とできない女 | https://x.com/shinjo_podcast | — | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-124 | 読書酒紀 | https://x.com/OfVoice59929 | — | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-129 | ちょいクズ男たちの恋愛本音研究所 | https://x.com/choikuzu_otoko | https://www.instagram.com/choi_kuzu_otoko | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-133 | チ的好奇心のすすめ | https://x.com/2iche_takucho | https://www.instagram.com/takuchotaku | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-135 | まるごと放送室 | https://x.com/kamiyamacast | — | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-138 | ひともの研究所 | https://x.com/hitomono_lab | — | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-140 | おくちのミカタラジオ | https://x.com/BarCamono | https://www.instagram.com/tomomi_aoki_dh | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-141 | Misa Yuka Podcast | — | https://www.instagram.com/misayuka.podcast | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-144 | 雑食日和 | https://x.com/zashokubiyori | https://www.instagram.com/zashokubiyori/ | — | 5/6 菊池さん目視で言及なし確認（A1群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |

| pcwe-019 | 高橋クリスのFA_RADIO:工場自動化ポッドキャスト | https://x.com/fulhause | — | — | 5/6 菊池さん目視で言及なし確認（B群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-041 | 酒の道～日本酒の聖地から～@しぶさわくんFM | https://x.com/shibusawakunfm | — | — | 5/6 菊池さん目視で言及なし確認（B群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-047 | クリエイターエコノミーニュース | https://x.com/creator_enews | — | — | 5/6 菊池さん目視で言及なし確認（B群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |

| pcwe-107 | ラジオただいま発酵中 | — | — | — | 5/6 菊池さん目視で言及なし確認（B群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-109 | しゃらくさラジオ | https://x.com/SyarakusaRadio | — | — | 5/6 菊池さん目視で言及なし確認（B群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |
| pcwe-115 | 吉村ジョナサンの高校古典講義 | https://x.com/dai_koku_sama | https://www.instagram.com/book_bridge_lab | — | 5/6 菊池さん目視で言及なし確認（B群探索）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |

| pcwe-139 | ぬまずっきゅーんfromみんキャス | https://x.com/numazukyun | https://www.instagram.com/numazukyun/ | — | 5/6 菊池さん目視で PCWE 言及なし確認（B群最終ターゲット）。当日近くの新規告知を再チェック推奨 | 2026-05-06 |

| pcwe-106 | 公共訴訟ラジオ｜社会を動かす裁判の話 | https://x.com/CALL4_Jp | https://www.instagram.com/call4_jp/ | — | Claude 単独確認で Listen / 公式サイト言及なし、X/IG タイムラインへの構造的アクセス手段限界。菊池さん目視待ち、当日まで monitoring | 2026-05-06 |

| pcwe-145 | PodWalker：ポッドウォーカー | — | — | https://listen.style/p/podwalker | 5/8 菊池さん目視で PCWE 言及なし確認。当日まで monitoring | 2026-05-08 |
| pcwe-147 | アイデア刺激法 〜どう？〜 | — | — | — | 5/8 菊池さん目視で PCWE 言及なし確認。当日まで monitoring | 2026-05-08 |

---

## 解決ログ

- **2026-05-08**: pcwe-008 私的エクレアイズム → done 化。Spotify 告知エピソード https://open.spotify.com/episode/0lAtamQLe1TsDGHwGRq5dJ にてラジオドラマ出演体験（3 種類のドラマ・セリフ選択制）の詳細告知

- **2026-05-08**: pcwe-046 人生百貨店 → done 化。X 投稿 https://x.com/lifedeptstores/status/2052488641465692224 にて NEW グッズ第2弾サコッシュ告知（青×赤茶、500mlペットボトル・長財布・文庫本収納可、5/10 出店）

- **2026-05-06**: pcwe-126 WONT → done 化。ユーザー提供の Instagram 投稿 https://www.instagram.com/p/DX6e2RGFHji/ にて、ステッカー・手書き名言カードの先着配布 + 大森葉子さんによる既読本交換コーナーを確認

---

## 確認後の遷移先

- **物販告知が見つかった** → [runbook.md](./runbook.md) のステップ 3〜10 に従って `data/sources/official/pcwe-XXX.json` に追記、このリストから削除
- **当日まで何も告知なし、当日も販売なし** → [not-found.md](./not-found.md) に移動
- **新たな候補 URL は見つかったが内容不明** → [needs-review.md](./needs-review.md) に移動
