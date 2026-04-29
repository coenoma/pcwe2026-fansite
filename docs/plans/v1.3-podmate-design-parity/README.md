# v1.3 Podmate デザインパリティ — 番組ごとの themeColor + themeFont で個性を出す

> **対象**: 番組詳細の Hero を podmate-next の **ClassicHero 1 種** に統一しつつ、
> 「ペルソナ設定」のように **メインカラー + フォントで番組らしさを出す** 仕組みを導入。
>
> **ねらい**: 全番組同じレイアウトでも、見た目で「その番組のサイト」感が立ち上がる。
> トップページの装飾メリハリも本家ガイドライン水準に。

---

## 📊 進捗マトリクス

| # | 項目 | 状態 |
|---|---|---|
| 1 | Program 型に `themeColor` / `themeFont` を追加（任意フィールド）| ⬜ |
| 2 | `lib/vibe-style.ts` に vibe → デフォルトカラー / フォントを追加 | ⬜ |
| 3 | Google Fonts を `next/font/google` で 5 種読み込み | ⬜ |
| 4 | ClassicHero ベースの `BoothHero` 実装 | ⬜ |
| 5 | サンプル 5 番組の `themeColor` を手動設定 | ⬜ |
| 6 | 番組詳細を `BoothHero` に置き換え | ⬜ |
| 7 | 「番組らしさ」バッジ追加（"お茶のような落ち着き" 等） | ⬜ |
| 8 | トップページに WaveDivider + ジャンルチップ | ⬜ |
| 9 | ビルド + 実装レビュー | ⬜ |

---

## 1. データモデル拡張

```typescript
// src/lib/types.ts
fanGuide: {
  ..., // 既存
  /** 番組のテーマカラー（hex）。未指定なら vibe からデフォルトを使用 */
  themeColor?: string;
  /** 番組らしさを演出するフォント。未指定なら vibe からデフォルトを使用 */
  themeFont?: ThemeFont;
}

type ThemeFont = 'klee-one' | 'noto-serif-jp' | 'rocknroll-one' | 'dot-gothic-16' | 'shippori-mincho' | 'zen-kaku';
```

## 2. vibe → デフォルトマッピング

| vibe | デフォルトカラー | デフォルトフォント |
|---|---|---|
| earnest | `#DC725A`（primary）| noto-serif-jp |
| intellectual | `#3B82F6`（sky）| noto-serif-jp |
| energetic | `#F59E0B`（amber）| rocknroll-one |
| humorous | `#F59E0B`（amber）| dot-gothic-16 |
| conversational | `#10B981`（emerald）| zen-kaku |
| contemplative | `#6B7280`（neutral）| klee-one |
| laid-back | `#9CA3AF`（neutral）| shippori-mincho |

## 3. Google Fonts（5 種）

`next/font/google` で読み込み:

| フォント | 用途 | weight |
|---|---|---|
| Klee One | 温かみ・手書き風 | 600 |
| Noto Serif JP | 知的・落ち着き | 700 |
| RocknRoll One | 印象的・太字 | 400 |
| DotGothic16 | レトロ・遊び心 | 400 |
| Shippori Mincho | 上品・和 | 600 |
| Zen Kaku Gothic New | ニュートラル現代 | 700 |

CSS 変数化 (`--font-klee-one` 等) して、Tailwind から `font-[var(--font-klee-one)]` で参照。

→ Next.js `next/font` が自動で preload + display: swap + fallback 設定。静的エクスポート対応。

## 4. BoothHero（ClassicHero ベース）

```
┌────────────────────────────────────────┐
│ ◯ 装飾円（themeColor 派生）              │
│                                          │
│  [ジャンル][日][ブース #][♡]             │
│                                          │
│  番組名（themeFont、large）              │
│                                          │
│  ✨ キャッチコピー                        │
│  （themeColor 蛍光下線）                  │
│                                          │
│  サブキャッチ                            │
│                                          │
│  ┌─────┐                              │
│  │ サムネ │（themeColor border）           │
│  └─────┘                              │
│  ◯ 装飾円                                │
│                                          │
│  [Spotify][X][Instagram]                 │
│  [この番組を教えてあげる]                  │
└────────────────────────────────────────┘
```

実装ポイント:
- 背景: `${themeColor}0d`（透過 5%）
- 装飾円ボーダー: `${themeColor}30`
- 装飾円塗り: `${themeColor}20`
- 番組名フォント: themeFont の var
- キャッチコピー下線: `${themeColor}aa`（やや濃い）
- 画像枠ボーダー: `${themeColor}40`

inline style で動的色を適用、Tailwind は固定構造のみ。

## 5. サンプル 5 番組の themeColor 設定

| 番組 | vibe | themeColor 案 | themeFont 案 |
|---|---|---|---|
| pcwe-040 俺思 | earnest | `#2D3748`（インクのような濃灰）| noto-serif-jp |
| pcwe-006 本茶本茶 | contemplative | `#7C9070`（緑茶のような）| klee-one |
| pcwe-013 ピスタチオパフェクラブ | energetic | `#94B447`（ピスタチオ緑）| rocknroll-one |
| pcwe-072 失敗から学ぶゲイ | conversational | `#E879A6`（あゆピンク）| zen-kaku |
| pcwe-118 朝日新聞ポッドキャスト | intellectual | `#C8001E`（朝日新聞の赤）| noto-serif-jp |

→ いずれも JSON に手動で書く。実際の番組ロゴから感性で選択。後日番組制作者から「違う」と要望あれば修正フォームで受付。

## 6. 「番組らしさ」バッジ

Hero 直下に小さく:

```
🎨 ぼくは「この番組は◯◯」と捉えました。違ったら教えてください。
```

vibe ごとに表現:
| vibe | 表現 |
|---|---|
| earnest | 誠実に対話を分解していく番組 |
| intellectual | 知的に世界を解像する番組 |
| energetic | 熱量で空気を変える番組 |
| humorous | 笑いで核心を捉える番組 |
| conversational | 共感の余白がある番組 |
| contemplative | 静かに余韻を残す番組 |
| laid-back | くつろぎが滲む番組 |

## 7. トップページの追加メリハリ

| 改善 | 方法 |
|---|---|
| Hero → 一覧セクション間に WaveDivider | 既存 `<WaveDivider fillClass="fill-white" />` 流用 |
| 一覧セクションに見出し追加 | `<SectionHeading>` で「{N} 番組から、これ刺さるを探す」 |
| ジャンルチップを横スクロール | 17 ジャンル → タップでジャンル別へ |

---

## 設計レビュー観点

| 観点 | チェック |
|---|---|
| 動的色は inline style | ✅ Tailwind v4 動的クラス回避 |
| themeFont は CSS 変数経由 | ✅ next/font の自動セットアップを活用 |
| 番組ごとの色違いの一貫性 | ✅ vibe デフォルトでカバー、override は任意 |
| アクセシビリティ | ⚠ 蛍光下線の色は明度差で読めるか個別検証 |
| レスポンシブ | ✅ ClassicHero の grid lg:grid-cols-2 を流用 |

---

## 受け入れ基準

- [ ] 5 番組すべてで themeColor / themeFont が反映され、見た目が明確に違う
- [ ] 「番組らしさ」バッジが正しく表示
- [ ] フォント読み込みが LCP を悪化させない（display: swap）
- [ ] ビルド OK / TypeScript / ESLint エラー 0
- [ ] iOS Safari でフォントが正しく表示

---

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-04-29 | 初版（3 pattern 案）|
| 2026-04-29 | v3.1 — ClassicHero 1 種に絞り、themeColor + themeFont で個性化に方針変更 |
