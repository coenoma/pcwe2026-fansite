# A1群 SNS 探索チェックリスト

**作成日**: 2026-05-06
**対象**: not-found 78 件のうち、Listen 未登録だが SNS（X / Instagram / 公式 Web）あり = **56 件**

---

## 並行作業ルール（2026-05-06 19:30 更新）

**運用切り替え**: Claude 単独の WebSearch / nitter / Chrome MCP では X タイムライン横断探索が
実質不可能と判明（X 検索インデックスが薄く、SPA で取れない）。役割を再定義：

- **👤 菊池さん（探索の主担当・全件）**: ブラウザログイン状態で X / IG タイムラインを
  直接スクロール → 物販告知投稿 URL をチャットに貼る
- **🤖 Claude（反映専任）**: 菊池さんが貼った URL を syndication API / Listen MCP /
  WebFetch で取得 → `merchandiseDetails` 反映 → コミット / push / main マージ

**発見 URL 報告フォーマット**: 「pcwe-XXX 発見 URL」だけで OK
**not-found 報告フォーマット**: 「pcwe-XXX 言及なし」だけで OK
**main マージ**: 都度マージ（毎回コミット → push → main）。残り日数も少ないので
ファクトチェックを早く回す

---

## 状態凡例

- ⏳ 未着手
- 🔍 探索中
- ✅ done 化済み
- ❌ 告知なし確定（探索完了、PCWE2026 言及なし）
- 👀 候補あり要判断

---

## チェックリスト

| ID | 番組名 | X | Instagram | Website | 担当 | 状態 | 発見 URL / メモ | 更新日 |
|---|---|---|---|---|---|---|---|---|
| pcwe-001 | 電波惹句 | https://x.com/signal_cp | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-003 | すべての道はジャズに通ず。 | https://x.com/subejazz | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-006 | 本茶本茶ー１冊の本をお茶とともに | https://x.com/honcha_honcha | — | — | 👤 菊池 | ✅ | https://x.com/honcha_honcha/status/2029180276392517902 両日出店、本＆お茶 | 05-06 |
| pcwe-010 | 地方ゲイだけど丁寧な暮らしがしたい | https://x.com/chihougay | — | — | 👤 菊池 | ✅ | https://x.com/chihougay/status/2051644039129432304 PCWE限定ステッカー3種 | 05-06 |
| pcwe-011 | てきと〜 | https://x.com/tekito9899 | https://instagram.com/tekito9899 | — | 👤 菊池 | ⏳ | — | — |
| pcwe-013 | ピスタチオパフェクラブ | https://x.com/pisparfaitclub | https://www.instagram.com/pisparfaitclub | — | 👤 菊池 | ⏳ | — | — |
| pcwe-015 | 好き趣味発見！まにまにラジオ | https://x.com/mani2radio | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-022 | ねむれぬ夜にはラブレター | https://x.com/ameniwaarisa | https://www.instagram.com/ameniwaarisa | — | 👤 菊池 | ✅ | https://listen.style/p/ameniwaarisa/snfmpsjj 5/10 ブース16-B、新刊ZINE+トート+缶バッジ | 05-06 |
| pcwe-023 | 脳内口外 | https://x.com/nounaikougai | https://www.instagram.com/nounaikougai/ | — | 👤 菊池 | ⏳ | — | — |
| pcwe-026 | 雨の日には本をさして。 | https://x.com/amehonns2 | https://www.instagram.com/amehons2 | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-027 | 月岡ツキの月面通信 | https://x.com/olunnun | https://www.instagram.com/tsukky_dayo/ | — | 🤖 Claude | ✅ | https://www.instagram.com/p/DXeHu3vn2xh/ 5/10 著書4種+ステッカー+となしばアクキー | 05-06 |
| pcwe-030 | ダンドー・キュー | — | https://www.instagram.com/podcastddq | — | 👤 菊池 | ✅ | https://www.instagram.com/p/DWQNDKZgcVI/ 「台湾AI男子」PCWE限定ポストカード | 05-06 |
| pcwe-031 | 中2の魂100まで | https://x.com/soulofchu2_100 | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-036 | とみこはん&佐々木敬子「とみことけいこのたびたび、旅｣ | https://x.com/sasakikeiko8 | https://www.instagram.com/tomikohan | — | 👤 菊池 | ✅ | URL 修正 + X投稿2件: 電鍋手ぬぐい・湯気手ぬぐい・エコバッグ・台湾パイにゃっプルケーキ・スタンプ・書籍 | 05-06 |
| pcwe-044 | ひうら芳麗の楽女なニュース | https://x.com/marikosatoru | https://www.instagram.com/ladyfangchang | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-045 | PodcastTimes｜ぽっどでの新人 | https://x.com/Podcast_TimesJP | https://www.instagram.com/podcasttime... | — | 🤖 Claude | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-053 | 丘の上喫茶 | https://x.com/okanoue_kissa | https://www.instagram.com/okanoue_kissa/ | — | 👤 菊池 | ⏳ | — | — |
| pcwe-056 | ゆりしー&さほほのガールズ・カルチャー・リサーチ〜深く潜れ！ | https://x.com/gcrc_divedeep | — | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-059 | 月からミミミ | https://x.com/tsukimimi_radio | — | — | 🤖 Claude | ✅ | https://listen.style/p/tsukimimi/nugzthen ガチャ500円(マグカップ等)・チェキ・直接会える | 05-06 |
| pcwe-068 | ピーチウーロンの〇〇な気がする | https://x.com/peachoolong000 | — | — | 👤 菊池 | ✅ | https://x.com/peachoolong000/status/2042254245827883098 ZINE+手編みグッズ | 05-06 |
| pcwe-071 | 炊き込みご飯わくわく舎 | https://x.com/takiwakusha | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-073 | Radio18s/Teenagerからの映画部 | https://x.com/Radio18s | https://www.instagram.com/radio18s | — | 👤 菊池 | ⏳ | — | — |
| pcwe-078 | ３時のおやつは貝柱 | https://x.com/shona_emi | https://www.instagram.com/shona_emi | — | 👤 菊池 | ✅ | https://x.com/shona_emi/status/2051466993673638003 5/10 お菓子販売 | 05-06 |
| pcwe-079 | 歴史を紐解く！聞き流し偉人伝 | https://x.com/nasutokai | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-081 | 聴くと映画が観たくなる！CINEMORE | https://x.com/cinemorejp | https://www.instagram.com/cinemore_of... | — | 👤 菊池 | ⏳ | — | — |
| pcwe-084 | 映画雑談 | https://x.com/zatsudan2020 | https://www.instagram.com/eigazatsudan | — | 👤 菊池 | ✅ | https://x.com/zatsudan2020/status/2051124679537299574 NEW ZINE+NEW Tシャツ+キーホルダー | 05-06 |
| pcwe-086 | 風呂あがりのアイスキャンディー | https://x.com/ofucan1121 | — | — | 👤 菊池 | ✅ | https://x.com/ofucan1121/status/2034645926711812240 しおり「サンセットブックマーク」 | 05-06 |
| pcwe-087 | LocalTacoStories~耳で味わうエシカルな旅~ | — | https://www.instagram.com/localtacost... | — | 👤 菊池 | ⏳ | — | — |
| pcwe-088 | 推しと原稿の間で | https://x.com/okiarichan27 | — | — | 👤 菊池 | ✅ | https://x.com/okiarichan27/status/2051950185056731205 エンタメ処方箋・公開収録 | 05-06 |
| pcwe-090 | 桃花茶館〜薬膳もも子ラジオ〜 | — | https://www.instagram.com/tofachakan_radio | — | 👤 菊池 | ✅ | https://www.instagram.com/p/DWDOBbrEoaI/ 5/9 薬膳ジェラート・茶・レシピ本・ステッカー・おまもりポーチ | 05-06 |
| pcwe-091 | Kids’ News – キッズニュース | https://x.com/rinaarailevia | — | — | 🤖 Claude | ✅ | https://x.com/RinaAraiLevia/status/2051927908072202520 5/10 キッズニュースビンゴ・ワークブック | 05-06 |
| pcwe-094 | 荒ぶるペーのオネエじゃないのよ | https://x.com/fuji_tate_p | https://www.instagram.com/fuji_tate_p | — | 👤 菊池 | ✅ | https://x.com/fuji_tate_p/status/2051855154996281618 5/10 新作グッズ（工作） | 05-06 |
| pcwe-095 | ハタとキシマの“黙っていられん” | https://x.com/damaren_radio | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-097 | 戦略的幸福論〜AI時代をどう生きる？〜 | https://x.com/tiedfamily244 | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-100 | 「いま、暇？」急いで準備するからちょっと飲まない？ | https://x.com/imahimanomanai | — | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-102 | watashito | — | https://www.instagram.com/watashito_p... | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-103 | SONICWAVEの3355ラジオ | https://x.com/weare_sonicwave | https://www.instagram.com/we_are_soni... | — | 👤 菊池 | ⏳ | — | — |
| pcwe-108 | BACKYARD TO CLOSET | https://x.com/slwanstdy | https://www.instagram.com/at_slowands... | — | 👤 菊池 | ✅ | https://listen.style/p/sands/mckvryof 両日 ペインティットブランク商品 | 05-06 |
| pcwe-111 | ワイングラスからこぼれ話。 | https://x.com/jellysPodcast | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-112 | 深呼吸できる女とできない女 | https://x.com/shinjo_podcast | — | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-114 | 愛されたい女たちのラブホ女子会 | https://x.com/aisaretaijyoshi | https://www.instagram.com/aisaretai.j... | — | 👤 菊池 | ✅ | https://listen.style/p/aisaretaijyoshi/jryqisgx シール2種・缶バッジ3色・CDチャーム10限定・アクセ | 05-06 |
| pcwe-116 | カウチポテトブラザーズ | https://x.com/radio_CPB | https://www.instagram.com/radio_cpb/ | — | 👤 菊池 | ✅ | https://listen.style/p/pze2qlhk/sxztifkn 両日 おみくじ・撮影体験・ZINE・楽曲DLカード等 | 05-06 |
| pcwe-117 | 玄石の原石 | https://x.com/genseki_podcast | — | — | 🤖 Claude | ✅ | https://x.com/genseki_podcast/status/2050165025474822345 5/10 ステッカー・石井玄氏来場 | 05-06 |
| pcwe-123 | 読んでみてはラジオ | https://x.com/yondemiteha | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-124 | 読書酒紀 | https://x.com/OfVoice59929 | — | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-125 | 女性がよく寝てよく働けるラジオ　わたしとねむり研究所 | https://x.com/watashitonemuri/status/... | https://www.instagram.com/sleep.femtech/ | — | 👤 菊池 | ⏳ | — | — |
| pcwe-128 | アシタ・シアター | https://x.com/ashita_theater | — | — | 👤 菊池 | ✅ | https://x.com/ashita_theater/status/2050564095641002330 5/9 雑貨制作体験・ZINE・ステッカー・展示（0円多め） | 05-06 |
| pcwe-129 | ちょいクズ男たちの恋愛本音研究所 | https://x.com/choikuzu_otoko | https://www.instagram.com/choi_kuzu_o... | — | 🤖 Claude | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-133 | チ的好奇心のすすめ | https://x.com/2iche_takucho | https://www.instagram.com/takuchotaku | — | 👤 菊池 | ⏳ | — | — |
| pcwe-134 | カイブツラジオ | https://x.com/LLCSquad152636 | https://www.instagram.com/kaibutsu_sq... | — | 👤 菊池 | ✅ | https://www.instagram.com/reel/DXjzJFSErLO/ 両日 カイブツプロジェクト紹介+子どもたち出店 | 05-06 |
| pcwe-135 | まるごと放送室 | https://x.com/kamiyamacast | — | — | 👤 菊池 | ⏳ | — | — |
| pcwe-137 | HOG POT | https://x.com/PURE_COMEDY | https://www.instagram.com/p_ure_comedy/ | — | 👤 菊池 | ⏳ | — | — |
| pcwe-138 | ひともの研究所 | https://x.com/hitomono_lab | — | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-140 | おくちのミカタラジオ | https://x.com/BarCamono | https://www.instagram.com/tomomi_aoki_dh | — | 👤 菊池 | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-141 | Misa Yuka Podcast | — | https://www.instagram.com/misayuka.po... | — | 🤖 Claude | ❌ | 菊池さん目視で PCWE 言及なし確認 | 05-06 |
| pcwe-144 | 雑食日和 | https://x.com/zashokubiyori | https://www.instagram.com/zashokubiyori/ | — | 👤 菊池 | ⏳ | — | — |

---

## サマリ（自動更新）

- ⏳ 未着手: 23 件
- 🔍 探索中: 0 件
- ✅ done 化済み: 21 件（pcwe-006, 010, 022, 027, 030, 036, 059, 068, 078, 084, 086, 088, 090, 091, 094, 108, 114, 116, 117, 128, 134）
- ❌ 告知なし確定: 12 件（pcwe-026, 044, 045, 056, 100, 102, 112, 124, 129, 138, 140, 141）
- 👀 候補あり要判断: 0 件