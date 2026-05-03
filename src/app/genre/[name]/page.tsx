import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGenreCounts, getProgramsByGenre } from '@/lib/data';
import { ProgramListClient } from '@/app/_components/ProgramListClient';
import { GenreSchema, type Genre } from '@/lib/types';
import { safeJsonLd } from '@/lib/safe-json-ld';
import { SITE } from '@/lib/constants';

interface Props {
  params: Promise<{ name: string }>;
}

export const dynamic = 'force-static';

/**
 * ジャンルが付いている番組を集約して、該当ジャンルのみ静的生成。
 *
 * ⚠️ 注意: Next.js の generateStaticParams にはデコード済みの値を渡す。
 * encodeURIComponent をかけると Next.js が再度エンコードしてしまい、
 * URL から渡された params.name がデコード済みの「カルチャー」と一致せず
 * zod 検証に失敗 → notFound() が呼ばれて 404 になる不具合が起きる。
 */
export function generateStaticParams() {
  return getGenreCounts().map((g) => ({ name: g.genre }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const parsed = GenreSchema.safeParse(decoded);
  if (!parsed.success) return {};

  const programs = getProgramsByGenre(parsed.data);
  const title = `${parsed.data}（${programs.length} 番組）`;
  const description = `PODCAST WEEKEND 2026（ポッドキャストウィークエンド／PODCAST EXPO 2026 内のマーケットイベント）出展番組のうち「${parsed.data}」ジャンル ${programs.length} 件を、独断と偏見でキュレーションした非公式ファンガイド。`;

  return {
    title,
    description,
    alternates: { canonical: `/genre/${encodeURIComponent(parsed.data)}` },
    // Next.js は親 layout の openGraph.description を継承するので、子ページの
    // 固有 description を SNS シェア時にも反映させるには明示的に上書きが必要。
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function GenrePage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const parsed = GenreSchema.safeParse(decoded);
  if (!parsed.success) notFound();

  const genre: Genre = parsed.data;
  // 該当ジャンルの番組を絞り込んで ProgramListClient に渡し、
  // ジャンル内でさらに検索・タグ・出展日で深掘りできる UX に
  const programs = getProgramsByGenre(genre);
  if (programs.length === 0) notFound();

  // CollectionPage + ItemList 構造化データ。
  // AI クローラー / 検索エンジンに「このページは特定ジャンルの番組コレクション」と伝える。
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${genre}（${programs.length} 番組）`,
    description: `PODCAST WEEKEND 2026 出展番組のうち「${genre}」ジャンル ${programs.length} 件のコレクション。`,
    url: `${SITE.url}/genre/${encodeURIComponent(genre)}`,
    isPartOf: { '@type': 'WebSite', name: 'PCWE2026 ファンガイド（非公式）', url: SITE.url },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: programs.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: programs.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE.url}/booth/${p.id}`,
        name: p.shortName ?? p.name,
      })),
    },
  };

  return (
    <section className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="text-sm font-bold text-neutral-600 transition-colors hover:text-primary-600"
        >
          ← トップへ戻る
        </Link>

        <div className="mt-5 mb-6 sm:mb-8">
          <p className="text-sm font-bold text-primary-600">ジャンル</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
            {genre}
          </h1>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            <span className="text-2xl font-black tabular-nums text-secondary-700 sm:text-3xl">
              {programs.length}
            </span>{' '}
            番組がこのジャンルで出展中。
            <span className="ml-1 text-neutral-500">検索 / タグ / 出展日でさらに絞り込めます。</span>
          </p>
        </div>

        <ProgramListClient
          programs={programs}
          resultLabel={{
            withFilter: `が「${genre}」のなかでヒット`,
            withoutFilter: `が「${genre}」で出展中`,
          }}
        />
      </div>
    </section>
  );
}
