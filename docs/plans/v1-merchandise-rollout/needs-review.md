# 物販詳細 ユーザー確認待ちリスト（needs-review）

このリストは「**候補となる情報源 URL は見つかったが、PCWE2026 当日販売の確証が AI 側では取れなかった**」番組です。
ユーザー（番組ホストとつながりがある人 / 当日現地で確認できる人）の判断で、
done に昇格させるか not-found に確定するかを決めるためのリスト。

---

## 凡例

- **常設グッズショップのみ**: 番組のオリジナルグッズが BASE / SUZURI / BOOTH 等で販売されているが、
  「PCWE2026 ブースで売る」とホストが明示していないもの。実態としては当日販売される確率が高いが、
  AI 側で creating せずユーザー判断に委ねる。
- **過去年度の振り返り**: PCWE2024 など過去開催の物販記事のみ存在し、PCWE2026 で同じものを売るか不明
- **告知言及はあるが固有 URL 未特定**: ホストが SNS で物販告知してると思われるが、
  WebSearch では status URL まで辿れなかった

---

## 確認 → 反映の手順

1. 候補 URL や別の情報源を確認
2. 物販詳細が確定できる場合：
   - [runbook.md](./runbook.md) ステップ 3〜10 に従って `data/sources/official/pcwe-XXX.json` に追記
   - このリストから該当行を削除
3. 「PCWE2026 では売らない」「物販詳細不明のまま」と確定した場合：
   - [not-found.md](./not-found.md) に移動
   - このリストから該当行を削除

---

## 確認待ちリスト

| 番組 ID | 番組名 | 候補 URL | カテゴリ | AI コメント |
|---|---|---|---|---|
| pcwe-016 | overture〜ミュージカル好きの語り部屋〜 | https://creators.spotify.com/pod/profile/u6052u5149u7f8eu91cc/episodes/91-PCWE-e2pb2fh | 過去年度の振り返り（要再調査） | **AI が一度 done として誤掲載 → 降格**。Spotify エピソード #91「ゲスト回感想メール紹介＆PCWE 番組グッズ公開」は **PCWE2024（2024/11/3）の物販告知**であり、PCWE2026 用ではない。PCWE2026 用の物販告知は別エピソードや SNS にあるかもしれず、要再調査。 |
| pcwe-037 | 映画の話したすぎるラジオ | https://suzuri.jp/virtualeigabar | https://x.com/virtualeigabar （X 投稿で 5/10 ZINE 販売告知あり、URL 取得不可） | SUZURI に「virtualeigabar」公式ショップあり。PCWE 限定告知は未確認。 |
| pcwe-057 | りっちゃ・りょかちのやいやいラジオ | https://x.com/yaiyai_radio (Spotify ep #306)  | 常設グッズショップのみ | X タイムラインで「グッズなど売る予定」言及あり (4/19 ep #306「Podcast EXPO でブース出すよ」) だが具体的な商品ラインナップ・価格は未告知。SUZURI「やいやい商店」の常設グッズあり |
| pcwe-066 | ローカルナイトニッポン | https://lnn.base.ec/ | 常設グッズショップのみ | BASE 公式ショップあり。PCWE 限定告知は未確認。 |
| pcwe-074 | チカブレンド | https://www.threads.com/@chika_blend/post/DRiSHGSCNrE / https://ckbld.official.ec/ | 告知言及あるが固有 URL 未特定 | Threads に物販投稿（完売・再販告知）あり、CHIKA BLEND STORE 公式 EC あり。Threads は埋め込み未対応のため、別の SNS / 公式サイト URL があれば望ましい。 |
| pcwe-099 | 本の虫のススメ | https://x.com/honnomushi_ssm | 告知言及あるが固有 URL 未特定 | 文フリ東京と PCWE 両方に出展、自著「Podcastのススメ」を Booth/Amazon で販売中、過去 PCWE 参加実績あり。X タイムラインで PCWE 物販告知投稿が見つかれば即 done 化可能。 |
| pcwe-101 | ゲイで茶を沸かす | https://wabisabi-cha.com/column/874/ | 過去年度の振り返り | PCWE2024 ブース紹介記事（T シャツ・ミニ扇子＝茶マーク）。記事内で PCWE2026 5/9 出店予定にも言及。2026 で同じ物販を売るかは不明。 |
| pcwe-118 | 朝日新聞ポッドキャスト | https://x.com/AsahiPodcast | 告知言及あるが固有 URL 未特定 | X タイムラインで「朝リスちゃんグッズ 3 ステップキャンペーン」を PCWE2026 開催に合わせて告知中（subagent 報告）。固有 status URL 取得できれば react-tweet で即埋め込み可能。 |
| pcwe-120 | hitokoto Radio | https://podcasts.apple.com/us/podcast/90-%E5%91%8A%E7%9F%A5-podcast-weekend-2026%E5%87%BA%E5%B1%95%E6%B1%BA%E5%AE%9A/id1805418751 | 告知言及あるが物販詳細なし | ホスト本人による PCWE2026 出展告知エピソード #90 あり（5/9-10 出展）。エピソード説明文には物販詳細・商品名なし。エピソード本編で物販に言及している可能性あり。 |
| pcwe-126 | 神崎恵＆大森葉子の「WONT」 | https://www.instagram.com/wont_podcast/ | 告知言及あるが固有 URL 未特定 | subagent 報告では「PCWE2026 5/10 ブース出店、来場者にオリジナルステッカー先着配布」と Instagram 告知あり。固有 IG 投稿 URL を特定できれば即 done 化可能。 |

---

## 数の振り返り

- **20 件**を一律 not-found としていたが、ファクト的には「常設グッズあり / 過去販売実績 / 告知言及あり」など強い兆候が確認できているケースが多い。
- ユーザーの目（番組ホストとつながりがある / 過去 PCWE 参加経験 / 当日現地確認可能）で判断すれば、半数以上は done に昇格する見込み。
