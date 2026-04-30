import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/constants';

/**
 * Google Analytics 4 タグの埋め込み
 *
 * - 環境変数 NEXT_PUBLIC_GA_MEASUREMENT_ID（例: G-XXXXXXXXXX）が未設定なら何も出力しない
 * - 開発環境（NODE_ENV !== 'production'）でも何も出力しない
 *   → ローカルでのテストアクセスを GA に送らないため
 * - 本番のみ gtag.js + 初期化スクリプトを後置で読み込む
 *
 * Cookie 同意 UI（バナー）は本コンポーネントのスコープ外。
 * 必要になったタイミングで別途追加する想定（リリース後の運用判断）。
 */
export function GoogleAnalytics() {
  if (GA_MEASUREMENT_ID === '') return null;
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
