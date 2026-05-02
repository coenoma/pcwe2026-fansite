import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPrograms, getProgramById } from '@/lib/data';
import { dayLabel } from '@/lib/format';
import { BoothHero } from '@/app/_components/BoothHero';
import { WaveDivider } from '@/app/_components/WaveDivider';
import { FadeInOnScroll } from '@/app/_components/FadeInOnScroll';
import { ProgramCard } from '@/app/_components/ProgramCard';
import { safeJsonLd } from '@/lib/safe-json-ld';
import { EVENT, SITE } from '@/lib/constants';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';

/** 全番組の静的パスを生成（SSG）*/
export function generateStaticParams() {
  return getAllPrograms().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const program = getProgramById(id);
  if (program === undefined) return {};

  const title = `${program.shortName ?? program.name}（${program.fanGuide.genre}）`;
  // 検索結果のスニペット用に「PODCAST WEEKEND 2026 出展 / ジャンル」を冒頭に置き、
  // 番組固有のキャッチコピーと組み合わせて自然な日本語で読める形にする。
  const description = `PODCAST WEEKEND 2026（ポッドキャストウィークエンド／PODCAST EXPO 2026 内のマーケットイベント）出展。${program.fanGuide.genre}ジャンルの「${program.fanGuide.catchphrase}」── ${program.fanGuide.subCatch}`;

  return {
    title,
    description,
    alternates: { canonical: `/booth/${program.id}` },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/booth/${program.id}`,
      images: [{ url: program.thumbnail, alt: program.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [program.thumbnail],
    },
  };
}

export default async function BoothPage({ params }: Props) {
  const { id } = await params;
  const program = getProgramById(id);
  if (program === undefined) notFound();

  const related = getAllPrograms()
    .filter((p) => p.fanGuide.genre === program.fanGuide.genre && p.id !== program.id)
    .slice(0, 3);

  // JSON-LD 構造化データ（PodcastSeries + BreadcrumbList）
  // subjectOf に Event をネストすることで、検索エンジンに「この番組は
  // PODCAST WEEKEND 2026 に出展している」という関係を伝える。
  const podcastJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: program.name,
    description: program.official.description,
    image: `${SITE.url}${program.thumbnail}`,
    url: program.links.spotify ?? program.boothUrl,
    sameAs: [program.links.x, program.links.instagram, program.links.website].filter(
      (v): v is string => typeof v === 'string'
    ),
    genre: program.fanGuide.genre,
    subjectOf: {
      '@type': 'Event',
      name: EVENT.name,
      alternateName: EVENT.alternateNames,
      startDate: `${EVENT.startDate}T10:30:00+09:00`,
      endDate: `${EVENT.endDate}T19:00:00+09:00`,
      location: { '@type': 'Place', name: EVENT.venue },
      url: program.boothUrl,
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: program.fanGuide.genre,
        item: `${SITE.url}/genre/${encodeURIComponent(program.fanGuide.genre)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: program.shortName ?? program.name,
        item: `${SITE.url}/booth/${program.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(podcastJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <BoothHero program={program} />

      {/*
        Hero 末尾に波々を乗せる（負マージンで Hero 内に侵食）
        → Hero と amber-50 セクションの間に白い余白が生まれず、自然な波の橋渡しに
      */}
      <WaveDivider fillClass="fill-amber-50" className="-mt-12 sm:-mt-16" />

      {/* こんな人に刺さる */}
      <FadeInOnScroll>
        <section className="bg-amber-50">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              📊 こんな人に、刺さるかも？
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              AI の独断と偏見で「想定リスナー」を書いてみました！
            </p>
            <p className="mt-4 text-base leading-relaxed text-neutral-800 sm:text-lg">
              {program.fanGuide.targetListener}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {program.fanGuide.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-3 py-1 text-sm font-bold text-neutral-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      <WaveDivider fillClass="fill-white" className="-mt-12 sm:-mt-16" />

      {/* 公式情報 */}
      <FadeInOnScroll>
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              📝 公式情報
            </h2>
            {/*
              公式説明文。description には公式テンプレの <br> 由来の改行（\n）が
              保持されているため、whitespace-pre-line で意図した改行を反映する
            */}
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-neutral-700">
              {program.official.description}
            </p>

            {program.recommendedEpisode !== undefined && (
              <a
                href={program.recommendedEpisode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 block rounded-2xl border-2 border-primary-200 bg-primary-50/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md sm:p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-700">
                  🎧 おすすめエピソード
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  番組ホストが選ぶ「まずはこの 1 本」
                </p>
                <p className="mt-2 text-base font-extrabold leading-snug text-neutral-900 group-hover:text-primary-700 sm:text-lg">
                  {program.recommendedEpisode.title}
                </p>
                <p className="mt-2 text-xs font-bold text-primary-600">
                  聴いてみる ↗
                </p>
              </a>
            )}

            {program.official.hosts !== undefined && program.official.hosts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-neutral-500">パーソナリティ</h3>
                <p className="mt-1 text-base text-neutral-800">
                  {program.official.hosts.join(' / ')}
                </p>
              </div>
            )}

            {program.official.merchandise !== undefined &&
              program.official.merchandise.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-neutral-500">ブース物販</h3>
                  <p className="mt-1 text-base text-neutral-800">
                    {program.official.merchandise.join(' / ')}
                  </p>
                </div>
              )}

            <div className="mt-6">
              <h3 className="text-sm font-bold text-neutral-500">出展日 / エリア</h3>
              <p className="mt-1 text-base text-neutral-800">
                {dayLabel(program.exhibition.days)} {program.exhibition.hours} ／ {program.exhibition.area === 'free' ? '無料エリア' : '有料エリア'}
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <a
                href={program.boothUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-primary-300 bg-white px-5 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md"
              >
                <span>公式ブースページを見る</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      {/* 関連番組（同じジャンル）*/}
      {related.length > 0 && (
        <FadeInOnScroll>
          <section className="bg-neutral-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                  「{program.fanGuide.genre}」の他の番組
                </h2>
                <Link
                  href={`/genre/${encodeURIComponent(program.fanGuide.genre)}`}
                  className="text-xs font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600 sm:text-sm"
                >
                  「{program.fanGuide.genre}」をもっと見る →
                </Link>
              </div>
              <p className="text-xs text-neutral-500 sm:text-sm">
                同じジャンルだから、テイストが地続きで続けて聴けるかも。
              </p>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <ProgramCard key={p.id} program={p} />
                ))}
              </div>
            </div>
          </section>
        </FadeInOnScroll>
      )}

      {/*
        ページ末尾の控えめな公式動線（番組単位の詳細ページから、
        全体イベントの公式情報・公式ライブ配信に自然に繋ぐ）
      */}
      <FadeInOnScroll>
        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600">
              OFFICIAL
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              当日の最新情報・タイムテーブルは公式サイトで。来場できない方は LISTEN による無料エリア公式ライブ配信もどうぞ。
            </p>
            <div className="mx-auto mt-5 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={EVENT.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-primary-300 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md"
              >
                <span>{EVENT.parentName} 公式サイト</span>
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={EVENT.expoTvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-primary-300 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md"
              >
                <span>📺 {EVENT.expoTvName}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </FadeInOnScroll>
    </>
  );
}

