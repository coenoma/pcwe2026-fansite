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
| pcwe-127 | 暮らしのおへそラジオ | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-127/) のみ参照可能 | 2026-05-05 |
| pcwe-132 | 高揚館 | — | — | — | links に x/instagram/website いずれもなし。公式ブースページ (https://podcastexpo.jp/booth/pcwe-132/) のみ参照可能 | 2026-05-05 |
| pcwe-106 | 公共訴訟ラジオ｜社会を動かす裁判の話 | https://x.com/CALL4_Jp | https://www.instagram.com/call4_jp/ | — | PCWE2024ではポスター展示、ワッペン作り体験、チャリティーグッズ販売等を実施した実績はあるが、PCWE2026固有の物販詳細投稿は確認できなかった | 2026-05-05 |
| pcwe-139 | ぬまずっきゅーんfromみんキャス | https://x.com/numazukyun | https://www.instagram.com/numazukyun/ | — | 沼津マルシェ等のローカルイベントでオリジナルグッズ販売実績はあるが、PCWE2026固有の物販詳細投稿は未確認 | 2026-05-05 |

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
