import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPrograms, getMoods, getMoodBySlug, getProgramsByMood } from '@/lib/data';
import { ProgramListClient } from '@/app/_components/ProgramListClient';

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
  const title = `${mood.label}（${programs.length} 番組）`;
  const description = `${mood.description} PODCAST WEEKEND 2026（ポッドキャストウィークエンド／PODCAST EXPO 2026 内のマーケットイベント）の出展 142 番組のなかから、いまの気分に刺さる ${programs.length} 番組を非公式ファンガイドが提案。`;
  return {
    title,
    description,
    alternates: { canonical: `/mood/${mood.slug}` },
    // 親 layout の openGraph.description が継承されないよう、子で明示的に上書き。
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function MoodPage({ params }: Props) {
  const { slug } = await params;
  const mood = getMoodBySlug(slug);
  if (mood === undefined) notFound();

  // mood 配下では「全番組から mood の matchTags をプリセット選択した状態」で
  // 始めてもらう。ProgramListClient の検索・フィルタ・ソート機能を使い、
  // ユーザーがその場でさらに絞り込み・並び替えできる体験にする。
  const allPrograms = getAllPrograms();
  const matchedCount = getProgramsByMood(mood).length;

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-neutral-200"
        style={{
          background: `linear-gradient(180deg, ${mood.themeColor}1a 0%, #ffffff 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/"
            className="text-sm font-bold text-neutral-600 transition-colors hover:text-primary-600"
          >
            ← トップへ戻る
          </Link>

          <div className="mt-5 flex flex-col items-start gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-3xl shadow-sm sm:h-14 sm:w-14 sm:text-4xl"
              style={{ backgroundColor: `${mood.themeColor}26` }}
            >
              {mood.emoji}
            </span>
            <h1 className="text-2xl font-extrabold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
              {mood.label}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
              {mood.description}
            </p>
            <p className="text-xs text-neutral-600 sm:text-sm">
              <span className="font-bold text-neutral-900">{matchedCount}</span> 番組が
              この気分にハマる候補。
              <span className="ml-1 text-neutral-500">
                さらに検索・タグ・出展日で絞り込めます。
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 番組一覧（mood の matchTags を初期選択 + ProgramListClient で絞り込み）*/}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          {matchedCount === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-12 text-center">
              <p className="text-base font-bold text-neutral-700">
                この気分にハマる番組は、まだ準備中です。
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                他の入口からも探してみてください。
              </p>
            </div>
          ) : (
            <ProgramListClient
              programs={allPrograms}
              initialTags={mood.matchTags}
              resultLabel={{
                withFilter: 'がこの気分にハマる候補',
                withoutFilter: 'がこの気分にハマる候補',
              }}
            />
          )}
        </div>
      </section>
    </>
  );
}
