import { getAllPrograms, getCurations, getMoods, getProgramsByMood } from '@/lib/data';
import { ProgramListClient } from './_components/ProgramListClient';
import { CountdownBadge } from './_components/CountdownBadge';
import { RandomGachaButton } from './_components/RandomGachaButton';
import { QuizCta } from './_components/QuizCta';
import { CurationLanes } from './_components/CurationLanes';
import { MoodLanes } from './_components/MoodLanes';
import { RecommendFromProgram } from './_components/RecommendFromProgram';
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
  const curations = getCurations();
  const moods = getMoods();
  const moodCounts = Object.fromEntries(
    moods.map((m) => [m.slug, getProgramsByMood(m).length]),
  );

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

          {/* メインコピー */}
          <h1 className="mt-6 text-3xl font-extrabold leading-relaxed tracking-tight text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl">

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

          {/* メイン CTA: 番組診断（最も訴求力高い）*/}
          <div className="mt-10 flex justify-center">
            <QuizCta programs={programs} />
          </div>

          {/* サブ CTA: ガチャ（軽い気持ちで触りたい人向け）*/}
          <div className="mt-6 flex justify-center">
            <RandomGachaButton programs={programs} />
          </div>
        </div>
      </section>

      {/* 番組ベースレコメンド（v1.7 新機能、最初の能動的探索の入口）*/}
      <section className="border-t border-neutral-200 bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">
              FROM A PROGRAM
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              好きを起点に、波紋を広げる。
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              あの番組が好きなら、これも好きかも。
              <span className="hidden sm:inline">温度感も、ジャンルも、意外な共通点も。</span>
              3 つの軸で「次に聴く 1 本」を提案します。
            </p>
          </div>
          <RecommendFromProgram programs={programs} />
        </div>
      </section>

      {/* 気分・シーン入口 */}
      <section className="border-t border-neutral-200 bg-gradient-to-b from-white via-amber-50/20 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">
              MOOD
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              いまの気分から、出会いにいく。
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              「朝、シャキッとしたい」「夜、ひとりで沈みたい」——
              直感で選んでも、ちゃんとハマるはず。
            </p>
          </div>
          <MoodLanes moods={moods} countsBySlug={moodCounts} />
        </div>
      </section>

      {/* AI のキュレーション 4 タブ セクション */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">
              CURATION
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              AI が、4 つの切り口で選ぶならこれ。
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              気分や時間帯、興味の深さ。タブを切り替えて、自分に合う 5 本に出会ってください。
            </p>
          </div>
          <CurationLanes lanes={curations} />
        </div>
      </section>

      {/* 番組一覧 */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">
              ALL PROGRAMS
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              全番組から、自分で探す。
            </h2>
          </div>
          <ProgramListClient programs={programs} />
        </div>
      </section>
    </>
  );
}
