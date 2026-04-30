# 🤖 PCWE2026 Fansite — LLM 向け実装ガイドライン

**最終更新**: 2026-04-29

このドキュメントは、AI 開発アシスタント（LLM）向けの実装ガイドラインです。
本プロジェクトで作業を行う際は、**必ずこのファイルを最初に読み**、記載されたルールに従ってください。

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [絶対的禁止事項](#絶対的禁止事項)
3. [必須ルール](#必須ルール)
4. [ブランディング・UI ガイドライン](#ブランディングui-ガイドライン)
5. [データ構造ガイドライン](#データ構造ガイドライン)
6. [ライティング・ガイドライン](#ライティングガイドライン)
7. [非公式の徹底](#非公式の徹底)
8. [品質チェックリスト](#品質チェックリスト)

---

## 🎯 プロジェクト概要

**PCWE2026 Fansite**: PODCAST EXPO 2026 の出展 144 番組を検索・キュレーションする **非公式ファンガイドサイト**。

- 静的サイト（DB なし、API なし）
- 公開期限: 2026-05-09（イベント初日朝）
- 制作: 合同会社コエノマ ファウンダー（ゆと）
- 目的: ファンとしての貢献 + Podmate ブランディング

詳細は [README.md](./README.md) 参照。

---

## 🚫 絶対的禁止事項

### 1. `any` 型の使用禁止

必ず適切な型定義を調査・作成すること。データ構造は `lib/types.ts` に定義する。

```typescript
// ❌ 絶対禁止
const program: any = json;

// ✅ 正しい
import type { Program } from "@/lib/types";
const program: Program = json;
```

### 2. 型アサーション (as) の安易な使用禁止

`as Program`, `as unknown as` 等の使用は型の不整合の根本解決を逃す。zod 等で実行時バリデーションすること。

### 3. ESLint 警告の無視禁止

`// eslint-disable-next-line` の使用禁止。警告の根本原因を解決すること。

### 4. エラーの握りつぶし禁止

`catch {}`, `catch (_) {}` は禁止。最低限 console.error で日本語ログを出すこと。

### 5. TODO / FIXME コメントでの先送り禁止

その場で正しい実装を完了させること。残作業がある場合は `docs/plans/{plan}/README.md` の TODO マトリクスに記録すること。

### 6. 日本語必須

コメント、エラーメッセージ、ログは日本語で記述すること。

```typescript
console.log('✅ 番組データを読み込みました');
console.error('❌ 番組サムネイル画像の取得に失敗しました');
```

### 7. LLM API キーでの直接呼び出し禁止 / AI エージェント運用は OK（v1.6 改訂）

**禁止**:
- ❌ スクリプト・サイト本体から OpenAI / Anthropic 等の **LLM API キーを使った直接呼び出し**
  （API 課金発生・自動運用リスクのため）
- ❌ ユーザーアクセス時に LLM API を叩くサイト機能の追加
- ❌ 「AI が一発生成 → そのまま提出」の自動生成パイプライン構築

**OK**:
- ✅ Claude Code / ChatGPT 等の **AI エージェントが、ユーザー（コエノマ）の操作下で動き、
  fan-guide ライティングを支援する**こと（既に契約済みの定額枠で動く）
- ✅ エージェントが fetch / Chrome / `scripts/fetch-booth-info.ts` 等で情報収集し、
  [docs/writing-guide/fan-guide-writing-guide.md](./docs/writing-guide/fan-guide-writing-guide.md)
  に従って手書き品質のテキストを作ること

**運用の必須条件**:
- ライティングガイドの「自己レビューチェックリスト」を必ず通す
- 人間（コエノマ）が最終確認・必要に応じ手直し
- About ページに「AI エージェントの支援を受けつつ、人間が最終校正」スタンスを明記
- 番組制作者の意図に反する深読み・脚色は禁止
- 公式情報（番組概要・ホスト名・出展情報）の捏造は禁止

要するに：**LLM を「API で自動的に叩く」のは NG、「人間が指示して手元で動かす」のは OK**。

詳細はライティングガイド §11 参照。

### 8. 公式画像のホットリンク禁止

`https://podcastexpo.jp/wp-content/...` を `<Image src>` に直接渡さない。
`scripts/download-thumbnails.ts` で `public/thumbnails/` にダウンロードして使う。

### 9. PCWE2026 公式名乗り禁止

「公式」「official」表記は絶対にしない。常に「**非公式・ファンメイド**」を明記する。
詳細は [非公式の徹底](#非公式の徹底)。

### 10. サーバーサイド処理の追加禁止

このサイトは **静的生成（SSG）のみ**。API Route / Server Action / Database 接続を追加しない。
データは `data/programs.json` を読み込むのみ。

---

## ✅ 必須ルール

### 1. 純粋関数分離 + 単体テスト

ビジネスロジックは `lib/` に純粋関数として実装する。UI コンポーネントにロジックを書かない。

```typescript
// lib/filter.ts — 純粋関数
export function filterByGenre(programs: Program[], genre: Genre): Program[] {
  return programs.filter(p => p.fanGuide.genre === genre);
}

// components/ProgramList.tsx — 純粋関数を呼ぶだけ
import { filterByGenre } from '@/lib/filter';
```

### 2. App Router + RSC（Server Component）優先

- 一覧・詳細は **Server Component** でデータを読み込む（SEO + 初期表示）
- 検索・フィルタ・気になるリストなどインタラクティブ部分のみ **Client Component**（`'use client'`）
- `'use client'` の境界をできるだけ小さく保つ

### 3. 静的生成（SSG）

- すべてのページを `generateStaticParams` で静的生成する
- 動的ルート `app/booth/[id]/page.tsx` は 144 番組分の静的パスを生成
- `dynamic = 'force-static'` を明示

### 4. 画像最適化

- `next/image` 使用（`<img>` 禁止）
- `public/thumbnails/{boothNumber}.jpeg` を参照
- `width` / `height` 必須、`alt` 必須（番組名 + ファンガイド表記）

### 5. アクセシビリティ

- 各ボタン・リンクに適切な `aria-label`
- `focus-visible` のスタイル必須
- カラーコントラスト WCAG AA 以上

### 6. レスポンシブ

- モバイルファースト
- ブレークポイント: Tailwind デフォルト（sm: 640 / md: 768 / lg: 1024）
- SP でタップ領域 44px 以上

### 7. パフォーマンス

- LCP < 2.5s（Vercel Edge デプロイ）
- CLS < 0.1
- bundle サイズ最小化（不要なライブラリ持ち込まない）

---

## 🎨 ブランディング・UI ガイドライン

本プロジェクトは **podmate-next の DESIGN_GUIDELINE_BRANDING** を**部分的に流用**する。
ただし「公式 Podmate サイトの完全コピー」ではなく、**ファンサイトとしての独自性** を持たせる。

### 流用する要素（Podmate DNA）

| DNA | 流用 | 用途 |
|---|---|---|
| **DNA1: 波型セクション区切り** | ✅ | トップページのセクション間 2-3 箇所 |
| **DNA2: ブロブフレーム** | ✅ | 番組詳細 Hero のサムネイル装飾 |
| **DNA3: ハイライト下線（蛍光ペン）** | ✅ | 番組キャッチコピーの強調 |
| **DNA4: セクション見出しのカラーアクセント** | ✅ | `<SectionHeading>` 共通化 |
| **DNA5: スクロールフェードアップ** | ✅ | カードグリッドの登場演出 |

### カラーシステム（Podmate ベース）

| 役割 | 色 | 用途（本サイト） |
|---|---|---|
| ブランド | primary-50〜600 | CTA、アクセント、Vibe earnest 系 |
| ワクワク | amber-50〜600 | キャッチコピー下線、Vibe energetic 系 |
| 爽やか | sky-50〜600 | Hero グラデ、Vibe intellectual 系 |
| 信頼 | emerald-50〜300 | 「気になる」アクション、Vibe contemplative 系 |
| ベース | white / neutral-50 | セクション背景 |

### Vibe 別アクセント

7 種の vibe で UI 微調整（過剰にならない範囲で）:

| Vibe | アクセント色 | 例 |
|---|---|---|
| earnest | primary-50 tint | 俺思 |
| contemplative | neutral-50 tint | 本茶本茶 |
| energetic | amber-50 tint | ピスタチオパフェクラブ |
| conversational | emerald-50 tint | 失敗から学ぶゲイとおこげ |
| intellectual | sky-50 tint | 朝日新聞ポッドキャスト |
| humorous | amber-100 tint | コメディ系 |
| laid-back | neutral-100 tint | 暮らし系 |

### コピーのトーン

Podmate ガイドラインと**同じ**:
- ❌ お客様 / 弊社 / 〜してください
- ✅ あなた / Podmate（ぼく）/ 〜しよう / 〜だよ

ただし **「ファンガイド」としての立ち位置** を保つ:
- ❌ 「Podmate を使ってサイトを作ろう」（売り込み）
- ✅ 「番組を見つけよう。当日が楽しみになる。」（ファン視点）

### ファンサイト独自要素

- **ヘッダー**: 「**非公式ファンガイド**」を明示
- **フッター**: 「by 合同会社コエノマ」+ Podmate.fm への控えめリンク
- **About ページ**: 制作意図、PCWE 公式との関係（無関係）、削除依頼受付

### カードアクセント線の実装ルール（v1.7 追加）

**角丸 UI（`rounded-xl` / `rounded-2xl` 等）にアクセント線を引く際の注意**：

- ❌ **`box-shadow: inset 4px 0 0 color`** で縦線・横線を引かない
  - 線が `border-radius` に追従して **角丸でアーチ状にカーブ** してしまい、
    Podmate のフラットな世界観と齟齬する
- ✅ **絶対配置 `<span>` + 上下に `border-radius` 相当の余白** で直線のみを描く

```tsx
// ❌ NG（アーチ化する）
<div className="rounded-xl" style={{ boxShadow: `inset 4px 0 0 ${color}` }}>

// ✅ OK（直線部分のみに線を引く）
<div className="relative overflow-hidden rounded-xl">
  <span
    aria-hidden="true"
    className="pointer-events-none absolute bottom-3 left-0 top-3 w-1 rounded-full"
    style={{ backgroundColor: color }}
  />
  ...
</div>
```

**例外（カードの上下端の細い横帯）**：
- `inset-x-0 top-0 h-1` のような帯は親の `overflow-hidden` でカット
  されるため、角丸の角で「線が斜めに切れる」表現になる（アーチではない）
- これは許容（`ProgramCard` / `CurationCard` 上端のアクセントなど）

詳細は [docs/plans/v1-mvp-launch/README.md](./docs/plans/v1-mvp-launch/README.md) 参照。

---

## 📦 データ構造ガイドライン

### Program 型（`lib/types.ts`）

```typescript
export type Day = 'sat' | 'sun' | 'both';
export type Area = 'free' | 'paid';
export type Vibe = 'earnest' | 'contemplative' | 'energetic'
                 | 'conversational' | 'intellectual' | 'humorous' | 'laid-back';

export type Genre =
  | 'カルチャー' | '文芸・読書' | '食' | '映画' | '音楽'
  | '旅' | '暮らし' | '恋愛・ジェンダー' | 'ビジネス'
  | 'AI・テック' | '子育て・教育' | 'ニュース・社会'
  | '歴史' | '科学・学問' | 'スポーツ' | 'コメディ' | 'その他';

export interface Program {
  id: string;                    // "pcwe-040"
  name: string;                  // "俺思 | 週刊漫画家と装丁デザイナーのPodcast"
  shortName?: string;            // "俺思"
  thumbnail: string;             // "/thumbnails/040.jpeg"
  boothUrl: string;              // 公式 URL

  official: {
    description: string;         // 公式説明そのまま
    hosts?: string[];            // ["根本大（漫画家）", ...]
    merchandise?: string[];      // 物販
  };

  exhibition: {
    days: Day[];                 // ['sat', 'sun']
    hours: string;               // "10:00 - 18:00"
    area: Area;                  // 'free'
    boothNumber: string;         // "040"
  };

  links: {
    spotify?: string;
    applePodcasts?: string;
    youtube?: string;
    listen?: string;
    amazonMusic?: string;
    x?: string;
    instagram?: string;
    website?: string;
  };

  fanGuide: {
    catchphrase: string;         // 30-50 字、コエノマ手書き
    subCatch: string;            // 20-40 字
    genre: Genre;
    tags: string[];              // 3-5 個
    targetListener: string;      // 50-80 字
    vibe: Vibe;
  };
}
```

### JSON ファイル

`data/programs.json` に Program 配列を保存。バージョン管理:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-29",
  "totalPrograms": 144,
  "programs": [ /* Program[] */ ]
}
```

### バリデーション

`lib/types.ts` に zod スキーマを定義し、ビルド時に `programs.json` を検証する（`scripts/validate-data.ts`）。

---

## ✍️ ライティング・ガイドライン

### キャッチコピー（30-50 字）

**3 原則**:
1. 公式説明から「番組固有の動詞 / 名詞」を 1 つ抜く
2. それを「読み手にとっての価値」に転換
3. 比喩・対比・独自フレーズで記憶に残す

**避ける**:
- ❌ 「〇〇について語る番組」（説明文）
- ❌ 「楽しい話が聴ける」（一般論）
- ❌ 番組名と被る

**例**:
- 俺思 → 「漫画家と装丁デザイナーが、世界に雑に同意しない 1 時間。」
- 本茶本茶 → 「本の感想じゃなくて、本がくれた静けさを語る番組。」

### サブキャッチ（20-40 字）

「**何の番組か**」を簡潔に。キャッチが「**なぜ聴くか**」、サブが「**何**」。

### ジャンル分類（17 種、共通定義）

`data/genres.json` で管理。1 番組 1 ジャンル。

カルチャー / 文芸・読書 / 食 / 映画 / 音楽 / 旅 / 暮らし / 恋愛・ジェンダー / ビジネス / AI・テック / 子育て・教育 / ニュース・社会 / 歴史 / 科学・学問 / スポーツ / コメディ / その他

### タグ（3-5 個、3 軸ミックス）

| 軸 | 値 |
|---|---|
| **雰囲気** | 笑える / じっくり / 軽快 / 内省的 / 熱量高い / 癒し / 知的 / 共感 |
| **シーン** | 朝向き / 夜向き / 通勤 / 作業 BGM / 寝る前 |
| **内容** | ニッチ / 学べる / 考えさせる / 元気が出る / 寄り添う / マイノリティ / 二人以上の掛け合い / 一人語り |

各番組は 3-5 個、3 軸からバランス良く付ける。

### ターゲットリスナー（50-80 字）

「**こんな人に刺さる**」を、悩み or 状態で書く。

例: 「クリエイターとして『自分はそう思わない』を抱えながら作っている人。創作の納得感を一緒に分解したい人。」

---

## 🚧 非公式の徹底

このサイトは **PCWE2026 の公式ガイドではない**。常に以下を保つこと。

### 必須表記

- **ヘッダー**: 「非公式ファンガイド」バッジ
- **フッター**: 「※ 本サイトは PODCAST EXPO 2026 公式とは無関係のファンメイドです」
- **About ページ**: 制作意図、削除依頼の受付方法

### 依頼受付の運用（2 種の Google フォーム）

About ページに 2 種類のフォームへの導線を置く。詳細フローは [v1-mvp-launch 設計書 > 運用想定](./docs/plans/v1-mvp-launch/README.md#運用想定番組制作者リスナーからの依頼受付) 参照。

#### フォーム A: 掲載取り下げ依頼（番組制作者本人向け）

- **対応 SLA**: 24 時間以内に削除
- **対応手順**: フォーム受信 → 本人確認 → `data/programs.json` 編集 → commit → push → Vercel 自動デプロイ → 依頼者へ完了連絡
- **連絡先（バックアップ）**: ゆと X DM (@yuto_podmate)

#### フォーム B: 情報修正・追加依頼（誰でも）

- **対応 SLA**: 1 週間以内に反映可否判断 → 可なら 3 日以内に反映
- **対応手順**: フォーム受信 → 内容判断 → JSON 編集 → commit → push（反映不可なら依頼者へ説明返信）
- **判断基準**: 公式事実の誤り / 配信先 URL 追加 → 反映 / キュレーション方針に関わる表現変更 → 慎重に判断

#### フォーム URL の管理

- 環境変数: `NEXT_PUBLIC_FORM_TAKEDOWN_URL`, `NEXT_PUBLIC_FORM_FIX_URL`
- 未設定時は About ページに「準備中」と表示
- 公開前に必ず設定すること

#### 自動化方針

依頼件数が年 10 件以下の想定のため自動化はしない。すべて手動運用。

### Podmate の言及スタンス

- ❌ 「Podmate を使ってサイトを作ろう」（前面ピッチ）
- ✅ フッターに「制作: 合同会社コエノマ / Podmate.fm」（控えめ）
- ✅ About ページに「ファンとして」「Podmate チーム制作」と説明

---

## ✅ 品質チェックリスト

### 公開前 Tier 1（絶対）

- [ ] 「公式」表記がない
- [ ] 「非公式ファンガイド」明記がヘッダー / フッター両方にある
- [ ] 削除依頼受付方法が明記されている
- [ ] 公式画像をホットリンクしていない（public/ にダウンロード済み）
- [ ] AI API を呼んでいない
- [ ] `any` / `as` / `eslint-disable` がない
- [ ] 日本語コメント・ログ統一

### 公開前 Tier 2（品質）

- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] モバイル / PC 両方で正しく表示
- [ ] 検索が機能する（Fuse.js）
- [ ] フィルタが機能する（ジャンル・タグ・出展日）
- [ ] 気になるリストが localStorage に保存される
- [ ] OGP が各番組ページに設定されている
- [ ] アクセシビリティ（キーボード操作・スクリーンリーダー）

### 公開前 Tier 3（仕上げ）

- [ ] 144 番組すべてに fanGuide が付いている（または明示的にサンプル限定なら明記）
- [ ] 全番組のサムネイル画像が public/ にある
- [ ] sitemap.xml が生成されている
- [ ] favicon が設定されている
- [ ] PCWE 公式へのリンクが各番組詳細ページにある

---

## 関連ドキュメント

- [README.md](./README.md): プロジェクト概要
- [docs/writing-guide/fan-guide-writing-guide.md](./docs/writing-guide/fan-guide-writing-guide.md): **fan-guide 執筆ガイド（並列 AI 想定）**
- [docs/writing-guide/agent-runbook.md](./docs/writing-guide/agent-runbook.md): **並列エージェント運用手順（割り当て・進捗・キックオフテンプレ）**
- [docs/plans/v1-mvp-launch/README.md](./docs/plans/v1-mvp-launch/README.md): 初回公開の設計書
- [docs/plans/v1.6-fan-guide-scaling/README.md](./docs/plans/v1.6-fan-guide-scaling/README.md): 144 番組展開の設計書
- [Podmate Branding Guideline](../../podmate-next/docs/DESIGN_GUIDELINE_BRANDING.md): 流用元
- [Podmate CLI guide_cmd](../../podmate-cli/src/podmate_cli/guide_cmd.py): ライティングガイドの流用元コンセプト
- [Podmate AGENTS.md](../../podmate-next/AGENTS.md): 流用元の作法

---

**作成日**: 2026-04-29
**メンテナ**: ゆと（合同会社コエノマ）
