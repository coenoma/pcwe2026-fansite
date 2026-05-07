import type { Metadata, Viewport } from 'next';
import {
  Noto_Sans_JP,
  Klee_One,
  Noto_Serif_JP,
  RocknRoll_One,
  DotGothic16,
  Shippori_Mincho,
  Zen_Kaku_Gothic_New,
} from 'next/font/google';
import './globals.css';
// react-tweet の埋め込みカード用テーマ（.react-tweet-theme スコープ、Tailwind と衝突しない）
import 'react-tweet/theme.css';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';
import { BottomNav } from './_components/BottomNav';
import { PoweredByPodmate } from './_components/PoweredByPodmate';
import { RegisterServiceWorker } from './_components/RegisterServiceWorker';
import { GoogleAnalytics } from './_components/GoogleAnalytics';
import { InstallPrompt } from './_components/InstallPrompt';
import { OfficialAndCredit } from './_components/OfficialAndCredit';
import { SITE } from '@/lib/constants';

/*
  サイト全体の基本フォント = Noto Sans JP
  ahamo に着想を得た「都会的・読みやすい・端正なサンセリフ」。
  body の font-family は globals.css の --font-sans で参照される。
*/
const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

// 番組らしさを演出するフォント群（番組詳細で vibe 別に切り替え）
const kleeOne = Klee_One({
  subsets: ['latin'],
  weight: '600',
  display: 'swap',
  variable: '--font-klee-one',
});
const notoSerifJp = Noto_Serif_JP({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--font-noto-serif-jp',
});
const rocknRollOne = RocknRoll_One({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-rocknroll-one',
});
const dotGothic16 = DotGothic16({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-dot-gothic-16',
});
const shipporiMincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: '600',
  display: 'swap',
  variable: '--font-shippori-mincho',
});
const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--font-zen-kaku',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'PODCAST WEEKEND 2026 非公式ファンガイド｜145 番組から「これ刺さる」を見つける',
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  // 検索流入の表記揺れ対策（カタカナ／英／略称／傘イベント名）。Next.js は keywords を
  // <meta name="keywords"> に出力する。Google は keywords を SEO シグナルにしないが、
  // 一部の検索エンジンや共有先（Slack/LINE プレビュー）で参照されることがあるため明示。
  keywords: [
    'PODCAST WEEKEND 2026',
    'ポッドキャストウィークエンド 2026',
    'PODCAST EXPO 2026',
    'ポッドキャストエキスポ 2026',
    'PCWE2026',
    '非公式ファンガイド',
    'ポッドキャストイベント',
    'マーケット',
    '出展番組',
    'HOME/WORK VILLAGE',
    '池尻大橋',
  ],
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  applicationName: SITE.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PCWE2026',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE.url,
    siteName: SITE.name,
    title: 'PODCAST WEEKEND 2026 非公式ファンガイド｜145 番組から「これ刺さる」を見つける',
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitterHandle,
    title: 'PODCAST WEEKEND 2026 非公式ファンガイド｜145 番組から「これ刺さる」を見つける',
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#262626' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVariables = [
    notoSansJp.variable,
    kleeOne.variable,
    notoSerifJp.variable,
    rocknRollOne.variable,
    dotGothic16.variable,
    shipporiMincho.variable,
    zenKaku.variable,
  ].join(' ');

  return (
    <html lang="ja" className={fontVariables}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        {/*
          全ページ共通の「公式情報 + 制作者紹介」セクション。
          各ページが個別に <OfficialAndCredit /> を呼ぶ必要はない（layout が担保）。
        */}
        <OfficialAndCredit />
        <Footer />
        <BottomNav />
        <PoweredByPodmate />
        <RegisterServiceWorker />
        <InstallPrompt />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
