import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Curation, Program } from '@/lib/types';
import { dayLabel } from '@/lib/format';
import { vibeStyle } from '@/lib/vibe-style';

interface Props {
  lanes: { curation: Curation; programs: Program[] }[];
}

/**
 * 手動キュレーション 3 セクション
 *
 * - サーバーコンポーネント（静的、お気に入りなど Client 機能は使わない）
 * - 横スクロール（snap-x）で番組カードを並べる
 * - 1 レーン = 「ぼくのコメント」 + 番組カード列
 */
export function CurationLanes({ lanes }: Props) {
  if (lanes.length === 0) return null;

  return (
    <div className="space-y-10 sm:space-y-14">
      {lanes.map(({ curation, programs }) => (
        <Lane key={curation.id} curation={curation} programs={programs} />
      ))}
    </div>
  );
}

function Lane({ curation, programs }: { curation: Curation; programs: Program[] }) {
  const accentBar = `${curation.themeColor}33`;

  return (
    <section aria-labelledby={`curation-${curation.id}`}>
      <header className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-8 rounded-full"
              style={{ backgroundColor: curation.themeColor }}
            />
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: curation.themeColor }}
            >
              CURATION
            </p>
          </div>
          <h3
            id={`curation-${curation.id}`}
            className="text-xl font-extrabold leading-snug text-neutral-900 sm:text-2xl"
          >
            {curation.title}
          </h3>
          <p className="mt-1 text-sm text-neutral-600 sm:text-base">
            {curation.subtitle}
          </p>
        </div>
      </header>

      {/* 番組カード（横スクロール）*/}
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <ul
          className="flex snap-x snap-mandatory gap-4 pb-2 sm:gap-5"
          style={{ scrollPaddingLeft: '1rem' }}
        >
          {programs.map((program) => (
            <li
              key={program.id}
              className="w-[72%] shrink-0 snap-start sm:w-[260px]"
            >
              <CurationCard program={program} accentBar={accentBar} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CurationCard({
  program,
  accentBar,
}: {
  program: Program;
  accentBar: string;
}) {
  const vibe = vibeStyle(program.fanGuide.vibe);
  const themeColor = program.fanGuide.themeColor ?? vibe.defaultThemeColor;

  return (
    <Link
      href={`/booth/${program.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl active:scale-[0.99]"
    >
      <span
        aria-hidden="true"
        className="block h-1"
        style={{ backgroundColor: accentBar }}
      />
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={program.thumbnail}
          alt={`${program.name} のロゴ画像`}
          fill
          sizes="(max-width: 640px) 72vw, 260px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15 mix-blend-multiply"
          style={{ backgroundColor: themeColor }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span
            className="rounded-full px-2 py-0.5 font-bold"
            style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}
          >
            {program.fanGuide.genre}
          </span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-bold text-neutral-600">
            {dayLabel(program.exhibition.days)}
          </span>
        </div>
        <h4 className="line-clamp-2 text-sm font-extrabold leading-snug text-neutral-900 group-hover:text-primary-700">
          {program.shortName ?? program.name}
        </h4>
        <p className="line-clamp-3 text-xs leading-relaxed text-neutral-700">
          {program.fanGuide.catchphrase}
        </p>
        <p className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-primary-700 opacity-0 transition-opacity group-hover:opacity-100">
          詳しく見る
          <ArrowRight size={12} aria-hidden="true" />
        </p>
      </div>
    </Link>
  );
}
