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
import { SITE } from '@/lib/constants';

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
  const description = `${program.fanGuide.catchphrase} ${program.fanGuide.subCatch}`;

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

      <WaveDivider fillClass="fill-amber-50" />

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

      <WaveDivider fillClass="fill-white" />

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

            <p className="mt-8 text-sm">
              <a
                href={program.boothUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600"
              >
                公式ブースページを見る ↗
              </a>
            </p>
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
    </>
  );
}

