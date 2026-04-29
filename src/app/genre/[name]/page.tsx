import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGenreCounts, getProgramsByGenre } from '@/lib/data';
import { ProgramCard } from '@/app/_components/ProgramCard';
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

  return { title, description };
}

export default async function GenrePage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const parsed = GenreSchema.safeParse(decoded);
  if (!parsed.success) notFound();

  const genre: Genre = parsed.data;
  const programs = getProgramsByGenre(genre);
  if (programs.length === 0) notFound();

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-sm font-bold text-neutral-600 hover:text-primary-600">
          ← 一覧へ戻る
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          {genre}
        </h1>
        <p className="mt-2 text-base text-neutral-600">
          {programs.length} 番組がこのジャンルで出展しています。
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
