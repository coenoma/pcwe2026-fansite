import type { Metadata, Viewport } from 'next';
import {
  Klee_One,
  Noto_Serif_JP,
  RocknRoll_One,
  DotGothic16,
  Shippori_Mincho,
  Zen_Kaku_Gothic_New,
} from 'next/font/google';
import './globals.css';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';
import { BottomNav } from './_components/BottomNav';
import { PoweredByPodmate } from './_components/PoweredByPodmate';
import { RegisterServiceWorker } from './_components/RegisterServiceWorker';
import { SITE } from '@/lib/constants';

// 番組らしさを演出するフォント群（CSS 変数で切り替え）
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
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
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
    title: SITE.name,
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitterHandle,
    title: SITE.name,
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
        <Footer />
        <BottomNav />
        <PoweredByPodmate />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
