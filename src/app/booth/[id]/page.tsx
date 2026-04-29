import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPrograms, getProgramById } from '@/lib/data';
import { dayLabel } from '@/lib/format';
import { BlobFrame, type BlobColor } from '@/app/_components/BlobFrame';
import { Highlight } from '@/app/_components/Highlight';
import { WaveDivider } from '@/app/_components/WaveDivider';
import { FadeInOnScroll } from '@/app/_components/FadeInOnScroll';
import { FavoriteButton } from '@/app/_components/FavoriteButton';
import { LinksRow } from '@/app/_components/LinksRow';
import { ProgramCard } from '@/app/_components/ProgramCard';
import { ShareOnX } from '@/app/_components/ShareOnX';
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

      {/* Hero（Podmate Hero 風、vibe で背景グラデを切替）*/}
      <section className={heroGradientClass(program.fanGuide.vibe)}>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/"
            className="inline-flex text-sm font-bold text-neutral-600 hover:text-primary-600"
          >
            ← 一覧へ戻る
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-center lg:gap-12">
            <div className="flex justify-center lg:justify-start">
              <BlobFrame
                src={program.thumbnail}
                alt={`${program.name} のロゴ画像`}
                blobColor={vibeBlobColor(program.fanGuide.vibe)}
                size={280}
                priority
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary-50 px-3 py-1 font-bold text-primary-700">
                  {program.fanGuide.genre}
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1 font-bold text-neutral-700">
                  {dayLabel(program.exhibition.days)}
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1 font-bold text-neutral-700">
                  ブース {program.exhibition.boothNumber}
                </span>
                <span className="ml-auto">
                  <FavoriteButton programId={program.id} size="md" />
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl md:text-4xl">
                {program.name}
              </h1>

              <p className="mt-6 text-lg font-bold leading-relaxed text-neutral-800 sm:text-xl">
                <Highlight>{program.fanGuide.catchphrase}</Highlight>
              </p>

              <p className="mt-3 text-sm text-neutral-600 sm:text-base">
                {program.fanGuide.subCatch}
              </p>

              <div className="mt-6">
                <LinksRow links={program.links} />
              </div>

              <div className="mt-6">
                <ShareOnX
                  text={`${program.shortName ?? program.name}\n${program.fanGuide.catchphrase}`}
                  url={`${SITE.url}/booth/${program.id}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fillClass="fill-amber-50" />

      {/* こんな人に刺さる */}
      <FadeInOnScroll>
        <section className="bg-amber-50">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              📻 こんな人に刺さる
            </h2>
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
            <p className="mt-4 text-base leading-relaxed text-neutral-700">
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
                {dayLabel(program.exhibition.days)} {program.exhibition.hours} ／ {program.exhibition.area === 'free' ? '無料エリア' : '有料エリア'} ／ ブース {program.exhibition.boothNumber}
              </p>
            </div>

            <p className="mt-8 text-sm">
              <a
                href={program.boothUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary-600 hover:opacity-70"
              >
                公式ブースページを見る ↗
              </a>
            </p>
          </div>
        </section>
      </FadeInOnScroll>

      {/* 関連番組 */}
      {related.length > 0 && (
        <FadeInOnScroll>
          <section className="bg-neutral-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                同じジャンルの番組
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

/** Vibe 別のブロブカラー（BlobColor リテラルを返す）*/
function vibeBlobColor(vibe: import('@/lib/types').Vibe): BlobColor {
  switch (vibe) {
    case 'earnest':
      return 'primary';
    case 'intellectual':
      return 'sky';
    case 'energetic':
    case 'humorous':
      return 'amber';
    case 'conversational':
      return 'emerald';
    case 'contemplative':
    case 'laid-back':
    default:
      return 'neutral';
  }
}

/** Vibe 別の Hero 背景クラス（Tailwind JIT 検出のため完全なクラス文字列を返す）*/
function heroGradientClass(vibe: import('@/lib/types').Vibe): string {
  switch (vibe) {
    case 'earnest':
      return 'bg-gradient-to-b from-primary-50 to-white';
    case 'intellectual':
      return 'bg-gradient-to-b from-sky-50 to-white';
    case 'energetic':
    case 'humorous':
      return 'bg-gradient-to-b from-amber-50 to-white';
    case 'conversational':
      return 'bg-gradient-to-b from-emerald-50 to-white';
    case 'contemplative':
    case 'laid-back':
    default:
      return 'bg-gradient-to-b from-neutral-50 to-white';
  }
}
