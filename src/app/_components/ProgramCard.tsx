'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useState } from 'react';
import type { Program } from '@/lib/types';
import { dayLabel } from '@/lib/format';
import { vibeStyle } from '@/lib/vibe-style';
import { tagAxis, tagAxisClass } from '@/lib/tag-axis';
import { getGenresMap } from '@/lib/data';
import { highlightText } from '@/lib/highlight-text';
import { FavoriteButton } from './FavoriteButton';
import { GenreIcon } from './GenreIcon';

interface Props {
  program: Program;
  /** 検索クエリ（マッチ箇所をハイライト表示）*/
  highlightQuery?: string;
}

const GENRES_MAP = getGenresMap();

/**
 * 一覧用カード（Podmate ブランディング）
 *
 * - vibe 別のトップアクセントラインで番組らしさを出す
 * - 画像はスケルトン → フェードインで「止まった？」を回避
 * - PC ホバーで浮上 + Spotify ボタン出現
 * - React.memo で再レンダリング抑制
 */
function ProgramCardImpl({ program, highlightQuery = '' }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const vibe = vibeStyle(program.fanGuide.vibe);
  const genreMeta = GENRES_MAP[program.fanGuide.genre];

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl"
    >
      {/* vibe トップアクセントライン */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${vibe.topAccent}`}
      />

      <Link
        href={`/booth/${program.id}`}
        className="block focus-visible:outline-none"
        aria-label={`${program.name} の詳細を見る`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          {/* スケルトン */}
          {!imgLoaded && (
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200"
            />
          )}

          <Image
            src={program.thumbnail}
            alt={`${program.name} のロゴ画像`}
            fill
            className={`object-cover transition-opacity duration-500 group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
            decoding="async"
          />

          {/* PC ホバー時の Spotify ボタン */}
          {program.links.spotify !== undefined && (
            <a
              href={program.links.spotify}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${program.name} を Spotify で聴く`}
              className="absolute right-3 top-3 hidden h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-700 opacity-0 shadow-lg transition-opacity duration-300 hover:bg-white hover:text-primary-700 group-hover:opacity-100 lg:flex"
            >
              <span aria-hidden="true">🎧</span>
            </a>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/genre/${encodeURIComponent(program.fanGuide.genre)}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 font-bold text-primary-700 hover:bg-primary-100"
          >
            <GenreIcon name={genreMeta?.icon ?? 'Circle'} size={12} />
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
            {highlightText(program.shortName ?? program.name, highlightQuery)}
          </h2>
        </Link>

        <p className="text-sm leading-relaxed text-neutral-700">
          <span className="relative inline">
            <span className="relative z-10">
              {highlightText(program.fanGuide.catchphrase, highlightQuery)}
            </span>
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
              className={`rounded-full border px-2 py-0.5 text-xs font-bold ${tagAxisClass(tagAxis(tag))}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export const ProgramCard = memo(ProgramCardImpl);
