import { getAllPrograms } from '@/lib/data';
import { ProgramListClient } from './_components/ProgramListClient';
import { EVENT } from '@/lib/constants';

export const dynamic = 'force-static';

/**
 * トップページ
 *
 * - サーバー側で全番組を読み込む（SSG）
 * - 検索・フィルタ・気になるは Client Component に渡す
 */
export default function HomePage() {
  const programs = getAllPrograms();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-sky-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-sm font-bold text-primary-600">{EVENT.shortName} 非公式ファンガイド</p>
          <h1 className="mt-4 text-3xl font-extrabold leading-relaxed tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            <span className="block">{EVENT.name} を、</span>
            <span className="relative inline-block">
              <span className="relative z-10">120% 楽しむ。</span>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-amber-200/70"
              />
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            {programs.length} 番組から「これ刺さる」を探す。
            <br className="hidden sm:block" />
            キャッチコピーとタグで、行く理由がきっと見つかる。
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            {EVENT.startDate.replace(/-/g, '/')}（土）・{EVENT.endDate.replace(/-/g, '/')}（日） {EVENT.hours}
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> ／ </span>
            {EVENT.venue}（{EVENT.venueAccess}）
          </p>
        </div>
      </section>

      {/* 番組一覧（Client Component で検索・フィルタ）*/}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <ProgramListClient programs={programs} />
        </div>
      </section>
    </>
  );
}
