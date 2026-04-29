import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMoods, getMoodBySlug, getProgramsByMood } from '@/lib/data';
import { ProgramCard } from '@/app/_components/ProgramCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getMoods().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mood = getMoodBySlug(slug);
  if (mood === undefined) return {};

  const programs = getProgramsByMood(mood);
  return {
    title: `${mood.label}（${programs.length} 番組）`,
    description: `${mood.description} PCWE2026 のなかから、いまの気分に刺さる ${programs.length} 番組。`,
    alternates: { canonical: `/mood/${mood.slug}` },
  };
}

export default async function MoodPage({ params }: Props) {
  const { slug } = await params;
  const mood = getMoodBySlug(slug);
  if (mood === undefined) notFound();

  const programs = getProgramsByMood(mood);

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-neutral-200"
        style={{
          background: `linear-gradient(180deg, ${mood.themeColor}1a 0%, #ffffff 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/"
            className="text-sm font-bold text-neutral-600 transition-colors hover:text-primary-600"
          >
            ← トップへ戻る
          </Link>

          <div className="mt-6 flex flex-col items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm sm:h-16 sm:w-16 sm:text-4xl"
              style={{ backgroundColor: `${mood.themeColor}26` }}
            >
              {mood.emoji}
            </span>
            <h1 className="text-3xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-4xl">
              {mood.label}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-neutral-700 sm:text-lg">
              {mood.description}
            </p>
            <p className="text-sm text-neutral-600">
              <span className="font-bold text-neutral-900">{programs.length}</span>{' '}
              番組が、いまの気分にハマるかも。
            </p>
          </div>
        </div>
      </section>

      {/* 番組一覧 */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          {programs.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-12 text-center">
              <p className="text-base font-bold text-neutral-700">
                この気分にハマる番組は、まだ準備中です。
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                他の入口からも探してみてください。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {programs.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
