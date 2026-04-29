import type { Metadata } from 'next';
import { getAllPrograms } from '@/lib/data';
import { PlanClient } from './_PlanClient';

export const metadata: Metadata = {
  title: '気になるリスト',
  description: '気になる番組をまとめて、当日効率よく回るためのプラン。',
  alternates: { canonical: '/plan' },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-static';

/**
 * 気になるリスト（当日プラン）
 *
 * 全番組をクライアントに渡し、localStorage の ID と突き合わせて表示。
 */
export default function PlanPage() {
  const programs = getAllPrograms();

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          気になるリスト
        </h1>
        <p className="mt-3 text-base text-neutral-600 sm:text-lg">
          当日効率よく回るために、気になる番組を土・日別にまとめました。
        </p>

        <div className="mt-10">
          <PlanClient programs={programs} />
        </div>
      </div>
    </section>
  );
}
