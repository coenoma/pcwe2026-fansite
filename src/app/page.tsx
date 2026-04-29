import { getAllPrograms } from '@/lib/data';
import { ProgramListClient } from './_components/ProgramListClient';
import { CountdownBadge } from './_components/CountdownBadge';
import { RandomGachaButton } from './_components/RandomGachaButton';
import { safeJsonLd } from '@/lib/safe-json-ld';
import { EVENT, SITE } from '@/lib/constants';
import { CalendarDays, MapPin } from 'lucide-react';

export const dynamic = 'force-static';

/**
 * トップページ
 *
 * - サーバー側で全番組を読み込む（SSG）
 * - 検索・フィルタ・気になる・カウントダウン・ガチャは Client Component
 */
export default function HomePage() {
  const programs = getAllPrograms();

  // Event 構造化データ（PCWE2026 自体）
  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: EVENT.name,
    startDate: `${EVENT.startDate}T10:30:00+09:00`,
    endDate: `${EVENT.endDate}T19:00:00+09:00`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: EVENT.venue,
      address: { '@type': 'PostalAddress', streetAddress: EVENT.venueAddress, addressCountry: 'JP' },
    },
    url: EVENT.officialUrl,
    description: SITE.description,
    isAccessibleForFree: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(eventJsonLd) }}
      />

      {/* Hero（装飾豊か）*/}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-amber-50/40 to-white">
        {/* 背景装飾: 控えめなドットパターン */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* 背景装飾: 右上のブロブ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl"
        />
        {/* 背景装飾: 左下のブロブ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          {/* バッジ */}
          <div className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-primary-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-primary-700 shadow-sm backdrop-blur sm:px-4 sm:text-xs">
            <span aria-hidden="true">🎙️</span>
            <span className="truncate">
              {EVENT.shortName} を 120% 楽しむ、非公式ファンガイド
            </span>
          </div>

          {/* メインコピー（明朝体でロゴ感 + 親しみ）*/}
          <h1
            className="mt-6 text-3xl font-extrabold leading-relaxed tracking-tight text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-noto-serif-jp)' }}
          >
            <span className="block">{programs.length} 番組のなかから、</span>
            <span className="mt-2 block">
              <span className="relative inline-block">
                <span className="relative z-10">「これ刺さる」</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-amber-200/70 sm:h-4"
                />
              </span>
              <span className="ml-1">を、見つける。</span>
            </span>
          </h1>

          {/* サブコピー */}
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            行く前に「あの番組、目当てにしよう」が決まる。
            <br className="hidden sm:block" />
            キャッチコピーとタグで、当日が、楽しみになる。
          </p>

          {/* イベント情報カード */}
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/80 p-4 text-left shadow-sm backdrop-blur">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-50 text-primary-600"
              >
                <CalendarDays size={18} />
              </span>
              <div className="text-sm">
                <p className="font-bold text-neutral-900">
                  {EVENT.startDate.replace(/-/g, '/')}（土）・{EVENT.endDate.slice(-2)}（日）
                </p>
                <p className="mt-0.5 text-neutral-600">{EVENT.hours}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/80 p-4 text-left shadow-sm backdrop-blur">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sky-50 text-sky-600"
              >
                <MapPin size={18} />
              </span>
              <div className="text-sm">
                <p className="font-bold text-neutral-900">{EVENT.venue}</p>
                <p className="mt-0.5 text-neutral-600">{EVENT.venueAccess}</p>
              </div>
            </div>
          </div>

          {/* カウントダウン */}
          <div className="mt-8">
            <CountdownBadge />
          </div>

          {/* ガチャ CTA */}
          <div className="mt-10 flex justify-center">
            <RandomGachaButton programs={programs} />
          </div>
        </div>
      </section>

      {/* 番組一覧 */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <ProgramListClient programs={programs} />
        </div>
      </section>
    </>
  );
}
