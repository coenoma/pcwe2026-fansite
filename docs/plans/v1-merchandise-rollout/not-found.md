# 物販詳細 取得不可リスト（not-found）

このリストにある番組は、以下のいずれかの理由で **PCWE2026 物販詳細の探索余地がもう限定的** な番組です。

- **SNS / 公式サイトがそもそも存在しない**（番組ページ・配信プラットフォームのリンクなし）
- **過去 PCWE 参加実績しかなく、PCWE2026 用の探索余地なし**
- **SNS はあるが何度確認しても PCWE2026 の言及が出ず、探索手段を出し尽くした**

ユーザー（番組ホストとつながりがある人 / 当日現地で確認できる人）と協働で追加情報を埋めていくためのリスト。

---

## ステータスの違い（迷わない判定フロー）

[monitoring.md](./monitoring.md) と同じフロー。最初にマッチしたステータスを採用します。

```
Q1. SNS / 公式サイトで「PCWE2026 の物販告知」を発見できたか？
    → YES: 【done】 JSON に merchandiseDetails を追記
    → NO: Q2 へ

Q2. AI が「PCWE2026 用かどうか確証取れない候補 URL」を見つけたか？
    → YES: 【needs-review】 ユーザー判断仰ぐ
    → NO: Q3 へ

Q3. 番組ホストの SNS / 公式サイトはそもそも存在するか？
    → NO: 【not-found】（このファイル）探索手段なしで確定取得不可
    → YES: Q4 へ

Q4. 既に過去 PCWE 参加実績しかなく、PCWE2026 の探索余地がもうないか？
    → YES: 【not-found】（このファイル）これ以上の探索余地なし
    → NO: 【monitoring】 当日まで新規告知の可能性あり
```

---

## 追加情報を見つけたら

1. 物販投稿の URL を教えてもらう（X / Instagram / note / Web）
2. ランブック（[runbook.md](./runbook.md)）のステップ 3〜10 に従って JSON 追記
3. このリストから該当行を削除

---

## 取得不可リスト

| 番組 ID | 番組名 | X | Instagram | Website | 調査メモ | 最終調査日 |
|---|---|---|---|---|---|---|
| pcwe-008 | 私的エクレアイズム | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-008/) のみ参照可能 | 2026-05-05 |
| pcwe-017 | 女性消防設備士の休憩室ラジオ | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-017/) のみ参照可能 | 2026-05-05 |
| pcwe-052 | シンプルKEIBA～難しくない競馬ラジオ～ | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-052/) のみ参照可能 | 2026-05-05 |
| pcwe-065 | そうめん屋ですが何か？ | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-065/) のみ参照可能 | 2026-05-05 |
| pcwe-083 | ハコとくら | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-083/) のみ参照可能 | 2026-05-05 |
| pcwe-096 | 日暮里ゼミナール | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-096/) のみ参照可能 | 2026-05-05 |
| pcwe-107 | ラジオただいま発酵中 | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-107/) のみ参照可能 | 2026-05-05 |
| pcwe-127 | 暮らしのおへそラジオ | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-127/) のみ参照可能 | 2026-05-05 |
| pcwe-132 | 高揚館 | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-132/) のみ参照可能 | 2026-05-05 |
| pcwe-001 | 電波惹句 | https://x.com/signal_cp | — | — | Spotifyエピソードで言及あるが物販詳細URL特定できず | 2026-05-05 |
| pcwe-023 | 脳内口外 | https://x.com/nounaikougai | https://www.instagram.com/nounaikougai/ | — | ZINE制作言及あるが物販URL特定できず | 2026-05-05 |
| pcwe-041 | 酒の道～日本酒の聖地から～@しぶさわくんFM | https://x.com/shibusawakunfm | — | — | PCWE物販投稿の特定なし | 2026-05-05 |
| pcwe-047 | クリエイターエコノミーニュース | https://x.com/creator_enews | — | — | 検索ヒットなし | 2026-05-05 |
| pcwe-061 | さのみきひとのラジオ ⌞ ラのみきジオ ⌝ | https://x.com/ranomikijio | — | — | 検索ヒットなし | 2026-05-05 |
| pcwe-068 | ピーチウーロンの〇〇な気がする | https://x.com/peachoolong000 | — | — | 検索ヒットなし | 2026-05-05 |
| pcwe-095 | ハタとキシマの“黙っていられん” | https://x.com/damaren_radio | — | — | 検索ヒットなし | 2026-05-05 |
| pcwe-103 | SONICWAVEの3355ラジオ | https://x.com/weare_sonicwave | https://www.instagram.com/we_are_sonicwave/ | — | 検索ヒットなし | 2026-05-05 |
| pcwe-116 | カウチポテトブラザーズ | https://x.com/radio_CPB | https://www.instagram.com/radio_cpb/ | — | PCWE2024参加情報のみPCWE2026物販不明 | 2026-05-05 |
| pcwe-129 | ちょいクズ男たちの恋愛本音研究所 | https://x.com/choikuzu_otoko | https://www.instagram.com/choi_kuzu_otoko | — | PCWE出展希望言及あるが物販詳細不明 | 2026-05-05 |
| pcwe-011 | てきと〜 | https://x.com/tekito9899 | https://instagram.com/tekito9899 | — | 番組ホスト（@tekito9899）のPCWE2026関連物販告知投稿は見つからなかった。 | 2026-05-05 |
| pcwe-056 | ゆりしー&さほほのガールズ・カルチャー・リサーチ〜深く潜れ！！〜 | https://x.com/gcrc_divedeep | — | — | 番組ホスト（@gcrc_divedeep）のPCWE2026物販詳細投稿は見つからなかった。 | 2026-05-05 |
| pcwe-084 | 映画雑談 | https://x.com/zatsudan2020 | https://www.instagram.com/eigazatsudan | — | 番組グッズとしてTシャツ販売情報があるが、PCWE2026専用物販詳細投稿（@zatsudan2020）は特定できなかった。 | 2026-05-05 |
| pcwe-090 | 桃花茶館〜薬膳もも子ラジオ〜 | — | https://www.instagram.com/tofachakan_radio/ | — | PODCAST EXPO 2026出店確認できるが、Instagram（@tofachakan_radio）の物販詳細投稿は特定できなかった。 | 2026-05-05 |
| pcwe-097 | 戦略的幸福論〜AI時代をどう生きる？〜 | https://x.com/tiedfamily244 | — | — | 番組ホスト（@tiedfamily244）のPCWE2026物販詳細投稿は見つからなかった。 | 2026-05-05 |
| pcwe-111 | ワイングラスからこぼれ話。 | https://x.com/jellysPodcast | — | — | PODCAST EXPO 2026出店確認できるが、X（@jellysPodcast）の物販詳細投稿は特定できなかった。 | 2026-05-05 |
| pcwe-117 | 玄石の原石 | https://x.com/genseki_podcast | — | — | 番組（@genseki_podcast）でステッカー作成等の動きはあるが、PCWE2026物販詳細投稿は特定できなかった。 | 2026-05-05 |
| pcwe-123 | 読んでみてはラジオ | https://x.com/yondemiteha | — | — | 番組ホスト（@yondemiteha）のPCWE2026物販詳細投稿は見つからなかった。 | 2026-05-05 |
| pcwe-137 | HOG POT | https://x.com/PURE_COMEDY | https://www.instagram.com/p_ure_comedy/ | — | 番組ホスト（@PURE_COMEDY）のPCWE2026物販詳細投稿は見つからなかった。 | 2026-05-05 |
| pcwe-003 | すべての道はジャズに通ず。 | https://x.com/subejazz | — | — | PCWE2026 (5/9-10) 出店番組として確認できる物販詳細投稿は WebSearch で発見できず。過去 (Podcast Weekend 2024) には参加実績ありだが 2026 向けの物販ラインナップを示す SNS 投稿/note は未確認。X: https://x.com/subejazz をユーザー側で直接確認推奨。 | 2026-05-05 |
| pcwe-019 | 高橋クリスのFA_RADIO:工場自動化ポッドキャスト | https://x.com/fulhause | — | — | PCWE2026 出店組としての言及・物販詳細投稿は WebSearch で発見できず。X: https://x.com/fulhause を直接確認推奨。 | 2026-05-05 |
| pcwe-031 | 中2の魂100まで | https://x.com/soulofchu2_100 | — | — | 番組のX投稿で雑談系ポッドキャスト系イベントへの参加表明は確認できたが、PCWE2026 物販ラインナップを示す詳細投稿は WebSearch で発見できず。X: https://x.com/soulofchu2_100 直接確認推奨。 | 2026-05-05 |
| pcwe-078 | ３時のおやつは貝柱 | https://x.com/shona_emi | https://www.instagram.com/shona_emi | — | PCWE2026 物販詳細投稿は WebSearch で発見できず。X (https://x.com/shona_emi) / Instagram を直接確認推奨。 | 2026-05-05 |
| pcwe-091 | Kids’ News – キッズニュース | https://x.com/rinaarailevia | — | — | PCWE2026 物販詳細を示す投稿は WebSearch で発見できず。X: https://x.com/rinaarailevia を直接確認推奨。 | 2026-05-05 |
| pcwe-112 | 深呼吸できる女とできない女 | https://x.com/shinjo_podcast | — | — | PCWE2026 物販詳細投稿は WebSearch で発見できず。X: https://x.com/shinjo_podcast を直接確認推奨。 | 2026-05-05 |
| pcwe-124 | 読書酒紀 | https://x.com/OfVoice59929 | — | — | PCWE2026 物販詳細投稿は WebSearch で発見できず。X: https://x.com/OfVoice59929 を直接確認推奨。 | 2026-05-05 |
| pcwe-138 | ひともの研究所 | https://x.com/hitomono_lab | — | — | PCWE2026 物販詳細投稿は WebSearch で発見できず。X: https://x.com/hitomono_lab を直接確認推奨。 | 2026-05-05 |
| pcwe-144 | 雑食日和 | https://x.com/zashokubiyori | https://www.instagram.com/zashokubiyori/ | — | PCWE2026 物販詳細投稿は WebSearch で発見できず。X (https://x.com/zashokubiyori) / Instagram (https://www.instagram.com/zashokubiyori/) を直接確認推奨。 | 2026-05-05 |
| pcwe-013 | ピスタチオパフェクラブ | https://x.com/pisparfaitclub | https://www.instagram.com/pisparfaitclub | — | PCWE2026出店は確定しているが、物販詳細を発信する番組ホストのSNS投稿・noteは確認できなかった | 2026-05-05 |
| pcwe-026 | 雨の日には本をさして。 | https://x.com/amehonns2 | https://www.instagram.com/amehons2 | — | PCWE2026出店は確認できたが、物販詳細を伝える番組ホストSNS/note等の投稿は確認できなかった | 2026-05-05 |
| pcwe-044 | ひうら芳麗の楽女なニュース | https://x.com/marikosatoru | https://www.instagram.com/ladyfangchang | — | 番組やSNSでPCWE2026の物販詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-071 | 炊き込みご飯わくわく舎 | https://x.com/takiwakusha | — | — | 番組SNSでPCWE2026の物販詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-079 | 歴史を紐解く！聞き流し偉人伝 | https://x.com/nasutokai | — | — | 番組SNSでPCWE2026の物販詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-086 | 風呂あがりのアイスキャンディー | https://x.com/ofucan1121 | — | — | PCWE2026出店は確認できたが、物販詳細を伝える番組SNS投稿は確認できなかった | 2026-05-05 |
| pcwe-100 | 「いま、暇？」急いで準備するからちょっと飲まない？ | https://x.com/imahimanomanai | — | — | PCWE2024ではステッカー、お正月のお守り等を販売した実績はあるが、PCWE2026固有の物販詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-106 | 公共訴訟ラジオ｜社会を動かす裁判の話 | https://x.com/CALL4_Jp | https://www.instagram.com/call4_jp/ | — | PCWE2024ではポスター展示、ワッペン作り体験、チャリティーグッズ販売等を実施した実績はあるが、PCWE2026固有の物販詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-125 | 女性がよく寝てよく働けるラジオ　わたしとねむり研究所 | https://x.com/watashitonemuri/status/2031120340861006226 | https://www.instagram.com/sleep.femtech/ | — | 番組SNS・公式サイトでPCWE2026出展や物販に関する詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-133 | チ的好奇心のすすめ | https://x.com/2iche_takucho | https://www.instagram.com/takuchotaku | — | 番組SNSでPCWE2026の物販詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-139 | ぬまずっきゅーんfromみんキャス | https://x.com/numazukyun | https://www.instagram.com/numazukyun/ | — | 沼津マルシェ等のローカルイベントでオリジナルグッズ販売実績はあるが、PCWE2026固有の物販詳細投稿は未確認 | 2026-05-05 |
| pcwe-014 | オバトーク | https://x.com/obatalk2024 | — | — | PCWE2026 出展は確認済みだが、ホストの SNS / note / 公式サイトで PCWE2026 物販に特化した詳細投稿は発見できず。SUZURI グッズの存在は把握。 | 2026-05-05 |
| pcwe-033 | HYPLACE WAVE #はいなみ | https://x.com/hainami_758 | https://www.instagram.com/mash_january25 | — | 「HYPLACE WAVE はいなみ PCWE2026 物販」「Podcast Weekend グッズ 物販」で検索したが、PCWE2026 出展告知や物販詳細投稿は発見できず。番組内では Key Music Party 等のイベントは紹介されている。 | 2026-05-05 |
| pcwe-045 | PodcastTimes｜ぽっどでの新人 | https://x.com/Podcast_TimesJP | https://www.instagram.com/podcasttimes_jp/ | — | 「PodcastTimes ぽっどでの新人 PCWE2026 物販」「グッズ ノベルティ」で検索したが、PCWE2026 出展は確認できるものの物販詳細投稿は発見できず。 | 2026-05-05 |
| pcwe-053 | 丘の上喫茶 | https://x.com/okanoue_kissa | https://www.instagram.com/okanoue_kissa/ | — | 「丘の上喫茶 PCWE2026 物販」「Podcast Weekend グッズ 出展」で検索したが、出展告知投稿や物販詳細投稿は発見できず。 | 2026-05-05 |
| pcwe-059 | 月からミミミ | https://x.com/tsukimimi_radio | — | — | 「月からミミミ PCWE2026 物販」「Podcast Weekend 2026 グッズ」で検索したが、PCWE2026 出展は確認できるものの物販詳細投稿は発見できず。 | 2026-05-05 |
| pcwe-087 | LocalTacoStories~耳で味わうエシカルな旅~ | — | https://www.instagram.com/localtacostories/ | — | 「LocalTacoStories PCWE2026 物販」「Podcast Weekend グッズ 出展」で検索したが、PCWE2026 物販詳細投稿は発見できず。9/20 のリアル試食イベント告知は確認できたが、PCWE2026 物販と直接関連する投稿は未確認。 | 2026-05-05 |
| pcwe-108 | BACKYARD TO CLOSET | https://x.com/slwanstdy | https://www.instagram.com/at_slowandsteady | — | 「BACKYARD TO CLOSET PCWE2026 物販」「Podcast Weekend 2026 出展」で検索したが、SLOW&STEADY の S&S CLUB（メンバーシップ）の情報は確認できるものの、PCWE2026 物販詳細投稿は未確認。 | 2026-05-05 |
| pcwe-114 | 愛されたい女たちのラブホ女子会 | https://x.com/aisaretaijyoshi | https://www.instagram.com/aisaretai.jyoshikai | — | 「愛されたい女たち ラブホ女子会 PCWE2026 物販」「Podcast Weekend グッズ 出展」で検索したが、出展告知や物販詳細投稿は発見できず。 | 2026-05-05 |
| pcwe-134 | カイブツラジオ | https://x.com/LLCSquad152636 | https://www.instagram.com/kaibutsu_squad/ | — | 「カイブツラジオ PCWE2026 物販」「Podcast Weekend グッズ」で検索したが、出展告知や物販詳細投稿は発見できず。 | 2026-05-05 |
| pcwe-140 | おくちのミカタラジオ | https://x.com/BarCamono | https://www.instagram.com/tomomi_aoki_dh | — | 「おくちのミカタラジオ PCWE2026 物販」「Podcast Weekend 物販 グッズ」で検索したが、出展告知や物販詳細投稿は発見できず。 | 2026-05-05 |
| pcwe-007 | 自分にやさしくするラジオ | https://x.com/sophieauthentic | — | — | WebSearchで「自分にやさしくするラジオ PCWE2026 物販」「グッズ」を検索しても物販詳細投稿は見つからず、一般的なラジオサービスの情報のみ。 | 2026-05-05 |
| pcwe-015 | 好き趣味発見！まにまにラジオ | https://x.com/mani2radio | — | — | WebSearchで物販・グッズ関連の具体的な投稿は見つからず。番組固有の物販詳細投稿の特定不可。 | 2026-05-05 |
| pcwe-046 | 人生百貨店 | https://x.com/lifedeptstores | https://www.instagram.com/lifedepartmentstores/ | — | PCWE2026出店は確認できたが、物販詳細投稿の特定はできず。 | 2026-05-05 |
| pcwe-073 | Radio18s/Teenagerからの映画部 | https://x.com/Radio18s | https://www.instagram.com/radio18s | — | PCWE2026参加は確認できたが、PCWE2026の物販詳細投稿の特定はできず。 | 2026-05-05 |
| pcwe-081 | 聴くと映画が観たくなる！CINEMORE | https://x.com/cinemorejp | https://www.instagram.com/cinemore_official | — | 番組情報は確認できたが、PCWE2026の物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-088 | 推しと原稿の間で | https://x.com/okiarichan27 | — | — | WebSearchで物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-094 | 荒ぶるペーのオネエじゃないのよ | https://x.com/fuji_tate_p | https://www.instagram.com/fuji_tate_p | — | 5/10（日）にPCWE2026出店の言及はあるが、物販詳細投稿の特定はできず。 | 2026-05-05 |
| pcwe-102 | watashito | — | https://www.instagram.com/watashito_podcast/ | — | WebSearchで物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-109 | しゃらくさラジオ | https://x.com/SyarakusaRadio | — | — | 番組情報は確認できたが、PCWE2026の物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-115 | 吉村ジョナサンの高校古典講義 | https://x.com/dai_koku_sama | https://www.instagram.com/book_bridge_lab | — | WebSearchで物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-121 | ぜったい大丈夫だよラジオ | https://x.com/daijobu_radio | — | — | 番組情報は確認できたが、PCWE2026の物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-128 | アシタ・シアター | https://x.com/ashita_theater | — | — | PCWE2026の物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-135 | まるごと放送室 | https://x.com/kamiyamacast | — | — | 神山まるごと高専Podcast部の番組として確認できたが、PCWE2026の物販詳細投稿は見つからず。 | 2026-05-05 |
| pcwe-141 | Misa Yuka Podcast | — | https://www.instagram.com/misayuka.podcast | — | 番組情報は確認できたが、PCWE2026の物販詳細投稿は見つからず。 | 2026-05-05 |

---

## カテゴリ別の傾向

### A. SNS リンクなし

- 公式ブースページに `links.x` も `links.instagram` も `links.website` も記載がない番組
- ホスト個人で物販告知している可能性はあるが、辿るリンクがないため発見困難
- → ユーザーが番組ホストと接点があれば直接確認するのが最も確実

### B. SNS あるが物販告知なし

- ホストが SNS を持っているが、PCWE2026 関連の物販告知投稿が見当たらない番組
- 当日会場のみ販売 / 公式ブースリストに頼る運営方針 / 告知が DM やクローズドチャネルなどの可能性
- → 当日現地確認 or ホストへの直接問い合わせ

### C. 削除済み / protected

- 物販告知投稿が削除されている / アカウントが protected で syndication API で取得不可
- → アーカイブが取れないため掲載不可
