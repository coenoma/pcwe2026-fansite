import { getAllPrograms, getCurations, getMoods, getProgramsByMood } from '@/lib/data';
import { ProgramListClient } from './_components/ProgramListClient';
import { CountdownBadge } from './_components/CountdownBadge';
import { DiscoverHub } from './_components/DiscoverHub';
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

  /**
   * Event 構造化データ。
   *
   * 主役: PODCAST WEEKEND 2026（本サイトが特化するマーケットイベント）
   * 傘:   PODCAST EXPO 2026（superEvent でネスト）
   * alternateName でカタカナ・英表記・略称を網羅し、検索エンジンに表記揺れを伝える。
   */
  // location は WEEKEND / EXPO で同じなので変数化（Event.location は Google 必須項目）
  const eventLocation = {
    '@type': 'Place' as const,
    name: EVENT.venue,
    address: {
      '@type': 'PostalAddress' as const,
      streetAddress: EVENT.venueAddress,
      addressCountry: 'JP',
    },
  };
  const eventStart = `${EVENT.startDate}T10:30:00+09:00`;
  const eventEnd = `${EVENT.endDate}T19:00:00+09:00`;
  const eventImage = `${SITE.url}${SITE.ogImage}`;
  const eventOrganizer = {
    '@type': 'Organization' as const,
    name: 'PODCAST EXPO',
    url: EVENT.officialUrl,
  };

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: EVENT.name,
    alternateName: EVENT.alternateNames,
    startDate: eventStart,
    endDate: eventEnd,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: eventLocation,
    image: [eventImage],
    organizer: eventOrganizer,
    superEvent: {
      // Google 必須: name / startDate / location。任意推奨: image / organizer 等
      '@type': 'Event',
      name: EVENT.parentName,
      startDate: eventStart,
      endDate: eventEnd,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: eventLocation,
      image: [eventImage],
      organizer: eventOrganizer,
      description:
        'ポッドキャストの未来を体感する 2 日間。国内音声コンテンツの祭典 PODCAST EXPO 2026。',
      url: EVENT.officialUrl,
    },
    url: EVENT.officialUrl,
    description: SITE.description,
    isAccessibleForFree: true,
  };

  /**
   * ItemList 構造化データ。
   *
   * AI クローラー（ChatGPT / Claude / Perplexity 等）にトップページが
   * 「番組一覧サイト」であることと、各番組の URL を一括で伝える役割。
   * Google の rich results にも対応する。
   *
   * 全 142 番組を含めると JSON が大きくなるので、トップでは ID 昇順で全件入れる
   *（generateStaticParams と同じ単一性のあるリストなので問題ない）。
   */
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'PODCAST WEEKEND 2026 出展番組リスト',
    description: `${programs.length} 番組の非公式キュレーション一覧`,
    numberOfItems: programs.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: programs.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/booth/${p.id}`,
      name: p.shortName ?? p.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
      />

      {/*
        Hero: 装飾を意図的に絞る。
        - 旧 3 装飾（ドット + 左下ブロブ + 右上ブロブ）→ 右上ブロブ 1 つだけ残す
        - 旧 3 色グラデ（sky → amber → white）→ 2 色（sky → white）に
        - バッジから絵文字を取り除き、文言は「非公式ファンガイド」だけに（情報の重複解消）
      */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          {/* バッジ（控えめに）*/}
          <div className="inline-flex items-center rounded-full border border-primary-200 bg-white/80 px-4 py-1.5 text-xs font-bold text-primary-700 shadow-sm">
            非公式ファンガイド
          </div>

          {/*
            メインコピー: 142 を巨大数字化（ahamo の「20,000」風）
            secondary-700 で「データ」感を強調、tabular-nums + leading-none で
            数字を主役にする
          */}
          <h1 className="mt-6 text-3xl font-extrabold leading-relaxed tracking-tight text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="block">
              <span className="text-[64px] font-black leading-none tracking-tight text-secondary-700 tabular-nums sm:text-[88px] md:text-[112px] lg:text-[140px]">
                {programs.length}
              </span>
              <span className="ml-2 align-baseline text-2xl font-extrabold sm:text-3xl md:text-4xl lg:text-5xl">
                番組のなかから、
              </span>
            </span>
            <span className="mt-4 block sm:mt-6">
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

          {/* サブコピー（読点を減らして 1 行に）*/}
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            キャッチコピーとタグで、行きたい番組が行く前から決まる。
          </p>

          {/* イベント情報カード */}
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/80 p-4 text-left shadow-sm backdrop-blur">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-secondary-50 text-secondary-600"
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

          {/* 会場マップへの動線 */}
          <div className="mx-auto mt-8 max-w-3xl">
            <a
              href="/map"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-amber-50 px-5 py-4 transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <div className="flex items-center gap-3 text-left">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-500 text-white"
                >
                  🗺
                </span>
                <div className="text-sm">
                  <p className="font-bold text-neutral-900">
                    会場マップを見る
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    142 番組のブースを土日切替・グッズ検索で
                  </p>
                </div>
              </div>
              <span
                aria-hidden="true"
                className="text-sm font-bold text-primary-700 group-hover:translate-x-0.5 transition-transform"
              >
                →
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 探し方ハブ: AI レコメンドの 3 機能を横並びで提示 */}
      <section
        id="discover"
        className="border-t border-neutral-200 bg-gradient-to-b from-white to-neutral-50/40"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="text-xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-2xl">
              迷ったら、AI に番組を選んでもらう。
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              気分で選べる、3 つの方法。
            </p>
          </div>
          <DiscoverHub programs={programs} />
        </div>
      </section>

      {/* 番組ベースレコメンド（v1.7 新機能、ハブの「FROM A PROGRAM」から飛ぶ先）*/}
      <section
        id="from-a-program"
        className="border-t border-neutral-200 bg-gradient-to-b from-white via-purple-50/30 to-white scroll-mt-4"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              好きな番組から、次に聴く 1 本を見つける。
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              番組名を入れるだけ。「似てる」「広げる」「意外」の 3 軸で次の 1 本を提案します。
            </p>
          </div>
          <RecommendFromProgram programs={programs} />
        </div>
      </section>

      {/* 気分・シーン入口 */}
      <section className="border-t border-neutral-200 bg-gradient-to-b from-white via-amber-50/20 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              いまの気分にぴったりの番組を見つける。
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              「朝、シャキッとしたい」「夜、ひとりで沈みたい」 — 気分から始めて、絞り込めます。
            </p>
          </div>
          <MoodLanes moods={moods} countsBySlug={moodCounts} />
        </div>
      </section>

      {/* AI のキュレーション 4 タブ セクション */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              テーマ別に、AI が選んだ番組セット。
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              「夜更け」「笑える」など、その時の気分に合うひとそろえをタブで切り替え。
            </p>
          </div>
          <CurationLanes lanes={curations} />
        </div>
      </section>

      {/* 番組一覧 */}
      <section
        id="all-programs"
        aria-labelledby="all-programs-heading"
        className="scroll-mt-20 border-t border-neutral-200 bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2
              id="all-programs-heading"
              className="text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl"
            >
              全{' '}
              <span className="text-3xl font-black tabular-nums text-secondary-700 sm:text-4xl">
                {programs.length}
              </span>{' '}
              番組から、自分で探す。
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              キーワード・タグ・ジャンル・出展日で絞り込み。
            </p>
          </div>
          <ProgramListClient programs={programs} />
        </div>
      </section>
    </>
  );
}
