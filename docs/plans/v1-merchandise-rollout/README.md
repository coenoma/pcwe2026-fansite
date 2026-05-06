# 物販情報 全 142 番組 ロールアウト計画

## 目的

PODCAST WEEKEND 2026（PCWE2026）出展全 142 番組のブース物販情報について、
番組ホストの SNS や公式サイトで公開されている **物販詳細投稿** を可能な限り発見し、
番組詳細ページの「ブース物販」セクションに `merchandiseDetails` として埋め込む。

完了条件:

- 全 142 番組について、以下のいずれかの状態に分類されていること
  - `done`: 物販詳細投稿が見つかり、`merchandiseDetails` を JSON に追加済み
  - `not-found`: 一通り探索したが見つからず `not-found.md` に記録済み

> ⚠️ **「探索した形跡なし」のまま残してはいけない**。pending は仮の状態で、最終的にはすべて
> `done` か `not-found` のどちらかに分類しきる。

---

## 完了の定義（DoD）

1. `data/programs.json` を集計したとき、各番組が以下のいずれかに該当する
   - `merchandiseDetails` が 1 件以上ある（→ done）
   - `needs-review.md` / `monitoring.md` / `not-found.md` のいずれかに記載されている
2. `docs/plans/v1-merchandise-rollout/progress.md` がスクリプトで自動生成されている
3. `feature/merchandise-rollout-*` を main にマージ済み、Vercel 本番反映済み

## ステータスの定義（5 段階）

| ステータス | 意味 | ファイル |
|---|---|---|
| ✅ done | merchandiseDetails あり、PCWE2026 の確証もあり、本番ページに掲載済み | `data/sources/official/pcwe-XXX.json` |
| 👀 needs-review | AI が候補 URL は見つけたが、PCWE2026 の確証が取れず、ユーザー判断仰ぐ | [needs-review.md](./needs-review.md) |
| 🔄 monitoring | ユーザーが確認して現時点では物販告知なし、当日（5/9-10）に向けて再チェック推奨 | [monitoring.md](./monitoring.md) |
| 🔎 not-found | 探索手段なし / 過去年度のみ等、確定的に取得不可 | [not-found.md](./not-found.md) |
| ⏳ pending | 着手前（progress スクリプトで 0 になることが望ましい） | — |

**ステータス遷移**:
- `pending` → `done` / `needs-review` / `monitoring` / `not-found`
- `needs-review` → `done`（候補が確定したら）/ `not-found`（不採用と確定したら）/ `monitoring`（候補なくなったが今後に期待）
- `monitoring` → `done`（新告知が出たら）/ `not-found`（当日まで何もなかった、当日も販売なしと確定）

---

## 全体方針

### 探索の優先順位

1. **X 公式アカウントがある番組**（119 件）
   - `links.x` から番組の X タイムラインを開き、
     `PCWE2026 / PODCAST WEEKEND / ポッドキャストウィークエンド / 物販 / グッズ / ブース`
     で該当投稿を検索
2. **Instagram 公式アカウントがある番組**（74 件）
   - `links.instagram` を WebFetch で開き、最近の投稿で物販告知を確認
3. **公式 Web サイトがある番組**（記載例が少ないが念のため）
   - `links.website` の WebFetch
4. **SNS なしの 12 件**
   - 即 `not-found.md` に記録（探索手段が limited）

### 品質基準（runbook 詳細）

- **`sourceUrl` 必須**: 情報源 URL のないデータは作らない（創作・推測の防止）
- **投稿原文の厳密転記**: 価格、サイズ、素材、限定数は要約せず原文に従う
- **X 投稿は ID 抽出 + syndication API で取得検証**:
  `https://cdn.syndication.twimg.com/tweet-result?id=XXX&token=a` で 200 が返るか
- **`imageUrl` は使わない**: X の Display Requirements 上、
  `pbs.twimg.com` のホットリンクは禁止 → 埋め込み (react-tweet) で代替

---

## フェーズ

### Phase 0: ドキュメント整備（このフェーズ）

- README, runbook, not-found.md を作成
- `scripts/merchandise-progress.ts` で進捗自動集計

### Phase 1: 機械的に分類（事前準備）

- `links.x` も `links.instagram` も `links.website` もない 12 番組
  → 即 `not-found.md` に追記（理由: SNS 経由で物販投稿を取得不可）

### Phase 2: 調査ループ

- WebSearch + WebFetch + Chrome MCP（必要時）で 1 番組ずつ探索
- 5〜10 番組ごとに:
  1. `npm run build:programs` で programs.json 再生成
  2. `npm run build` でローカル検証（X 投稿の syndication 取得が build 時に走る）
  3. コミット → push
- not-found に該当した番組は即 `not-found.md` に追記

### Phase 3: 中間マージ

- 調査が一区切りついたタイミングで feature → main マージ → Vercel 本番反映
- 本番 URL でランダム数件をスポット確認

### Phase 4: 完了報告

- `progress.md` の最終生成
- `not-found.md` の最終整理
- ユーザー報告

---

## 番組分類（着手時点 = 2026-05-05）

- 完了: **1 / 142** (pcwe-098 KNOWフードラジオ)
- 未着手: **141 / 142**
  - X あり: 119
  - Instagram あり: 74
  - Website あり: 0
  - **SNS なし**（即 not-found 確定）: 12

最新の数字は `npm run progress:merchandise` で `progress.md` を再生成して確認。

---

## 関連ドキュメント

- [runbook.md](./runbook.md): 1 番組あたりの作業手順（手作業の再現性確保）
- [not-found.md](./not-found.md): 取得不可リスト（ユーザー協働用）
- [progress.md](./progress.md): 進捗自動レポート（スクリプト生成、手で書かない）
