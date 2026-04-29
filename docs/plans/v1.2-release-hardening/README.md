# v1.2 Release Hardening — リリース前のセキュリティ・運用対応

> **対象**: 公開前の見落としがちな項目（セキュリティ / エラー耐性 / 運用文書 / SEO 仕上げ）
> **公開期限**: 2026-05-09（土）朝
> **位置づけ**: v1 MVP + v1.1 UI/UX の上に、本番運用に耐える堅牢性を積み上げる

---

## 📊 進捗マトリクス

| # | 項目 | カテゴリ | 状態 | 期限 |
|---|---|---|---|---|
| **要対応（必須）** | | | | |
| R1 | セキュリティヘッダー（vercel.json で設定）| セキュリティ | ✅ | 4/29 |
| R2 | エラーバウンダリ（error.tsx / global-error.tsx）| 耐性 | ✅ | 4/29 |
| R3 | canonical URL の明示（全ページ）| SEO | ✅ | 4/29 |
| R4 | Service Worker のキャッシュバージョニング自動化 | 運用 | ✅ | 4/29 |
| R5 | JSON-LD の `</script>` エスケープ強化 | セキュリティ | ✅ | 4/29 |
| R6 | 外部リンクの `rel="noopener noreferrer"` 監査 | セキュリティ | ✅ | 4/29 |
| R7 | Privacy ページ（`/privacy`）追加 | 法的・運用 | ✅ | 4/29 |
| **推奨** | | | | |
| P3 | Event 構造化データ（トップ）+ BreadcrumbList（詳細）| SEO | ✅ | 4/29 |
| P4 | viewport-fit=cover で iOS PWA 体験向上 | UX | ✅ | 4/29 |
| **任意（ユーザー判断）** | | | | |
| P1 | アクセス解析（Vercel Analytics or GA4）| 監視 | ⏸️ | 5/8 |
| P2 | Web Vitals 計測（Vercel Speed Insights）| 監視 | ⏸️ | 5/8 |

凡例: ⬜ 未着手 / ✅ 完了 / ⏸️ 保留

---

## 🎯 各項目の設計詳細

### R1: セキュリティヘッダー（vercel.json）

**重要な制約**: 本プロジェクトは `output: 'export'`（静的エクスポート）のため、`next.config.ts` の `headers()` 関数は **動作しない**。Vercel デプロイ時のヘッダーは `vercel.json` で設定する。

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), browsing-topics=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
```

**注意**:
- CSP（Content-Security-Policy）は inline script（JSON-LD）と相性が悪いため、初版は無し。後から段階的に追加。
- HSTS は Vercel が自動付与する場合があるが、明示で確実化。

### R2: エラーバウンダリ

Next.js App Router の規約:
- `app/error.tsx`: ページレベル（layout は維持）
- `app/global-error.tsx`: layout も含むルートエラー

両方を実装。日本語メッセージ + 「トップへ戻る」「再読み込み」ボタン。

### R3: canonical URL

各ページの `metadata` に明示:

```ts
export const metadata: Metadata = {
  alternates: { canonical: '/booth/pcwe-040' },
  // ...
};
```

`metadataBase` が `SITE.url` 設定済みなので、相対パスで OK。

### R4: Service Worker のキャッシュバージョニング自動化

現状: `const CACHE_VERSION = 'v1.0.0';` 固定 → 更新しても古いキャッシュが残る。

**設計**:
1. `public/sw.template.js` を作成（テンプレート、`__BUILD_ID__` プレースホルダー）
2. `scripts/build-sw.ts` で `__BUILD_ID__` を `Date.now()` か git commit hash に置換 → `public/sw.js` 生成
3. `package.json` の `prebuild` フックで自動実行
4. `.gitignore` に `public/sw.js` 追加（ビルド成果物）

→ デプロイごとに新しい SW がインストールされ、`activate` で旧キャッシュ削除。

### R5: JSON-LD の `</script>` エスケープ

**現状のリスク**:
```tsx
dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
```

番組概要に `</script>` が含まれていると、HTML 解析で script タグが終了してしまう（XSS 可）。

**修正**:
```ts
const safe = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
```

→ Unicode エスケープで `<` を全置換。JSON 仕様で問題なく、JS パース後は元の `<` に戻る。

### R6: 外部リンクの監査

`target="_blank"` の `<a>` を grep。
すべてに `rel="noopener noreferrer"` があれば OK。
漏れがあれば修正。

### R7: Privacy ページ

`app/privacy/page.tsx` を新規作成。記載内容:

1. **個人情報を扱いません**
   - サーバーへの送信なし、ログイン機能なし
2. **localStorage の使用**
   - 「気になる」リストの番組 ID のみ保存
   - 端末を超えて共有されない
3. **Service Worker のキャッシュ**
   - HTML / 画像 / JSON をブラウザにキャッシュ
   - オフライン動作のため
4. **番組情報の出典**
   - PODCAST EXPO 2026 公式サイトおよび各番組から引用
   - 著作権は各番組制作者・公式に帰属
5. **削除・修正依頼**
   - About ページのフォームへ誘導
6. **このサイトについて**
   - 非公式、コエノマ制作の旨

About ページから Privacy へのリンクを追加。Footer にも。

---

### P3: Event / BreadcrumbList JSON-LD

**Event**（トップページ）:
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "PODCAST EXPO 2026",
  "startDate": "2026-05-09T10:30:00+09:00",
  "endDate": "2026-05-10T19:00:00+09:00",
  "location": { "@type": "Place", "name": "HOME/WORK VILLAGE", "address": "東京都世田谷区池尻 2-4-5" },
  "url": "https://podcastexpo.jp/"
}
```

**BreadcrumbList**（番組詳細）:
ホーム → ジャンル → 番組

### P4: viewport-fit=cover

```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // ...
};
```

`safe-area-inset-*` を活用して iOS のノッチ・ホームバーに被らないレイアウト維持（既に対応済み）。

---

## 🔬 設計レビュー観点

| 観点 | チェック |
|---|---|
| 静的エクスポートの制約 | ✅ vercel.json で headers、next.config.ts は使えない |
| Next.js App Router の規約 | ✅ error.tsx / global-error.tsx の役割分担 |
| SW のライフサイクル | ✅ install → activate → fetch、新バージョンで古いキャッシュ削除 |
| JSON-LD の XSS 経路 | ✅ `</script>` だけでなく、番組概要全文に含まれる文字をエスケープ |
| Permissions-Policy | ✅ 不要な API（camera, mic, geo, topics）を全部 disable |

---

## 📦 実装順序

1. R6 → R5（コードレビュー寄り、軽微）
2. R1（vercel.json 新規）
3. R3（metadata 修正、各ページ）
4. R2（error.tsx 新規）
5. R4（sw template + 生成スクリプト）
6. R7（privacy ページ）+ Footer リンク
7. P3（Event / BreadcrumbList）
8. P4（viewport-fit）
9. ビルド + 検証 + コミット

---

## ✅ 受け入れ基準

- [ ] `npm run build` が成功
- [ ] TypeScript / ESLint エラー 0
- [ ] vercel.json が valid JSON、headers 6 種設定
- [ ] error.tsx で意図的にエラーを起こした際に画面が表示される
- [ ] 各ページの HTML に canonical タグあり
- [ ] sw.js のビルドごとに `CACHE_VERSION` が変わる
- [ ] JSON-LD の `</script>` エスケープが効いている（手動テスト）
- [ ] 全外部 `<a target="_blank">` に `rel="noopener noreferrer"`
- [ ] /privacy ページが表示できる
- [ ] About と Footer から /privacy へのリンクあり
- [ ] Event JSON-LD がトップに、BreadcrumbList が詳細に出力
- [ ] iOS 実機 PWA で safe-area が崩れない（viewport-fit=cover）

---

## 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-04-29 | 初版作成（R1-R7 + P3 + P4、P1/P2 はユーザー判断保留）|
