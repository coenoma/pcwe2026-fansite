import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGenreCounts, getProgramsByGenre } from '@/lib/data';
import { ProgramListClient } from '@/app/_components/ProgramListClient';
import { GenreSchema, type Genre } from '@/lib/types';

interface Props {
  params: Promise<{ name: string }>;
}

export const dynamic = 'force-static';

/** ジャンルが付いている番組を集約して、該当ジャンルのみ静的生成 */
export function generateStaticParams() {
  return getGenreCounts().map((g) => ({ name: encodeURIComponent(g.genre) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const parsed = GenreSchema.safeParse(decoded);
  if (!parsed.success) return {};

  const programs = getProgramsByGenre(parsed.data);
  const title = `${parsed.data}（${programs.length} 番組）`;
  const description = `「${parsed.data}」ジャンルの出展番組 ${programs.length} 件。PCWE2026 ファンガイド。`;

  return {
    title,
    description,
    alternates: { canonical: `/genre/${encodeURIComponent(parsed.data)}` },
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

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="text-sm font-bold text-neutral-600 transition-colors hover:text-primary-600"
        >
          ← トップへ戻る
        </Link>

        <div className="mt-5 mb-6 sm:mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">
            GENRE
          </p>
          <h1 className="mt-1 text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
            {genre}
          </h1>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            <span className="font-bold text-neutral-900">{programs.length}</span> 番組が
            このジャンルで出展中。
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
