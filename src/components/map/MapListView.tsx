/**
 * リストビュー（マップの代替表示）。
 *
 * - フィルタ・検索結果と連動
 * - カードタップで onSelect → 親側で「マップに戻ってその位置にズーム + ボトムシート起動」
 * - サムネ・番組名・ブース位置・グッズタグ・spotlight
 */

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { MerchandisePreview } from '@/components/merchandise/MerchandisePreview';
import type { Day, MerchandiseTag, Program } from '@/lib/types';
import { type SlotPlacement } from '@/lib/booth-map';

interface Props {
  programs: Program[];
  placements: SlotPlacement[];
  day: Day;
  onSelect: (placement: SlotPlacement) => void;
}

export function MapListView({ programs, placements, day, onSelect }: Props) {
  const programsById = new Map(programs.map((p) => [p.id, p]));

  // placement に program 情報を付加
  const items = placements
    .map((pl) => ({
      placement: pl,
      program: pl.programId ? programsById.get(pl.programId) : undefined,
    }))
    .filter((x) => x.program !== undefined || x.placement.externalName !== undefined);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center">
        <p className="text-3xl" aria-hidden="true">🔍✨</p>
        <p className="mt-3 text-sm font-bold text-neutral-700">
          条件にぴったりのブースは見つからなかった！
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          フィルタを外す・検索キーワードを変える・別の日も覗いてみる ── どれかで見つかるかも ✨
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ placement, program }) => (
        <li key={`${placement.position}-${day}`}>
          <button
            type="button"
            onClick={() => onSelect(placement)}
            className="block w-full rounded-2xl border border-neutral-200 bg-white p-3 text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <div className="flex items-start gap-3">
              {program ? (
                <Image
                  src={program.thumbnail}
                  alt={`${program.name} のサムネイル`}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xl"
                >
                  📍
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-primary-600">
                  ブース {placement.position}
                </p>
                <h3 className="mt-0.5 truncate text-sm font-bold text-neutral-900">
                  {program?.name ?? placement.externalName}
                </h3>
                {program?.fanGuide.subCatch ? (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                    {program.fanGuide.subCatch}
                  </p>
                ) : null}
                {program?.official.merchandiseTags &&
                program.official.merchandiseTags.length > 0 ? (
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    {program.official.merchandiseTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-full bg-secondary-50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-700"
                      >
                        {shortTagLabel(tag)}
                      </span>
                    ))}
                  </p>
                ) : null}
                {program?.official.merchandiseDetails &&
                program.official.merchandiseDetails.length > 0 ? (
                  <MerchandisePreview
                    details={program.official.merchandiseDetails}
                    variant="list"
                    className="mt-2 border-t border-neutral-100 pt-2"
                  />
                ) : null}
                {program?.official.merchandiseSpotlight ? (
                  <p className="mt-1.5 line-clamp-1 text-[11px] leading-snug text-primary-700">
                    ✨ {program.official.merchandiseSpotlight}
                  </p>
                ) : null}
              </div>
              <ExternalLink
                size={14}
                aria-hidden="true"
                className="mt-1 shrink-0 text-neutral-400"
              />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function shortTagLabel(tag: MerchandiseTag): string {
  switch (tag) {
    case 'food-drink':
      return '🍴食';
    case 'experience':
      return '🎟体験';
    case 'rare-curious':
      return '🔮珍';
    case 'free-distribution':
      return '🎁無料';
    case 'limited-new':
      return '✨限定';
    case 'zine-book':
      return '📕ZINE';
  }
}
