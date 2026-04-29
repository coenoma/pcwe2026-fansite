import Link from 'next/link';
import Image from 'next/image';
import type { Program } from '@/lib/types';
import { dayLabel } from '@/lib/format';
import { FavoriteButton } from './FavoriteButton';

interface Props {
  program: Program;
}

/**
 * 一覧用カード（コンパクト）
 *
 * Podmate ブランディング: ハイライト下線でキャッチコピーを強調。
 */
export function ProgramCard({ program }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-primary-300 hover:shadow-lg">
      <Link
        href={`/booth/${program.id}`}
        className="block focus-visible:outline-none"
        aria-label={`${program.name} の詳細を見る`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          <Image
            src={program.thumbnail}
            alt={`${program.name} のロゴ画像`}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/genre/${encodeURIComponent(program.fanGuide.genre)}`}
            className="rounded-full bg-primary-50 px-2 py-0.5 font-bold text-primary-700 hover:bg-primary-100"
          >
            {program.fanGuide.genre}
          </Link>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-bold text-neutral-700">
            {dayLabel(program.exhibition.days)}
          </span>
          <span className="ml-auto">
            <FavoriteButton programId={program.id} />
          </span>
        </div>

        <Link href={`/booth/${program.id}`} className="block">
          <h2 className="text-base font-extrabold leading-snug tracking-tight text-neutral-900 hover:text-primary-700">
            {program.shortName ?? program.name}
          </h2>
        </Link>

        <p className="text-sm leading-relaxed text-neutral-700">
          <span className="relative inline">
            <span className="relative z-10">{program.fanGuide.catchphrase}</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-2 bg-amber-200/60"
            />
          </span>
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {program.fanGuide.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
