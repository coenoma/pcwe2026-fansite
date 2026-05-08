/**
 * リストビュー（マップの代替表示）。
 *
 * v1.9 で大幅刷新:
 * - HTML 構造を「stretched ボタンパターン」に変更（ProgramCard.tsx と整合）
 *   外殻 <article> + 内側絶対配置 <button> でカード全体タップ可能に。
 *   リンクアイコンと状態バッジは z-20 領域に置き、独立したインタラクション可能。
 * - catchphrase を主軸に格上げ（subCatch はフォールバック）
 * - fanGuide.tags（軸別カラー pill）を表示
 * - 営業時間（compactHours）を表示
 * - お気に入り / 会えた状態のオーバーレイバッジ表示
 * - 主要リンク（Spotify / X / Instagram）の絵文字アイコン列を footer に追加
 *
 * フィルタ・検索結果と連動。カードタップで onSelect → 親側でマップに戻して
 * その位置にズーム + ボトムシートを起動する。
 */

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { MerchandisePreview } from '@/components/merchandise/MerchandisePreview';
import { BoothStateBadges } from './BoothStateBadges';
import { BoothLinkIcons } from './BoothLinkIcons';
import { compactHours } from '@/lib/format';
import { tagAxis, tagAxisClass } from '@/lib/tag-axis';
import type { Day, MerchandiseTag, Program } from '@/lib/types';
import { type SlotPlacement } from '@/lib/booth-map';

interface Props {
  programs: Program[];
  placements: SlotPlacement[];
  day: Day;
  onSelect: (placement: SlotPlacement) => void;
  /** お気に入り登録中の program ID 配列（未指定時は状態バッジ非表示）*/
  favorites?: string[];
  /** 「会えた」記録（key = position、未指定時は状態バッジ非表示）*/
  visited?: Record<string, string>;
}

export function MapListView({
  programs,
  placements,
  day,
  onSelect,
  favorites,
  visited,
}: Props) {
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
      {items.map(({ placement, program }) => {
        const name = program?.name ?? placement.externalName ?? '番組情報未登録';
        const isFavorite = program !== undefined &&
          favorites !== undefined &&
          favorites.includes(program.id);
        const isVisited = visited !== undefined && placement.position in visited;
        const hoursLabel = program
          ? compactHours(program.exhibition.hours)
          : null;
        const catchphrase = program?.fanGuide.catchphrase;
        const subCatch = program?.fanGuide.subCatch;
        const fanTags = program?.fanGuide.tags ?? [];
        const merchTags = program?.official.merchandiseTags ?? [];
        const merchDetails = program?.official.merchandiseDetails ?? [];
        const spotlight = program?.official.merchandiseSpotlight;

        return (
          <li key={`${placement.position}-${day}`}>
            <article className="group relative rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
              {/* stretched button: カード全体タップ可能（z-10、interactive 子要素より下）*/}
              <button
                type="button"
                onClick={() => onSelect(placement)}
                aria-label={`${name} のブース詳細を開く`}
                className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <span className="sr-only">ブース詳細を開く</span>
              </button>

              {/* 表示コンテンツ（pointer-events-none でクリックを stretched button に通す）*/}
              <div className="pointer-events-none p-3">
                <div className="flex items-start gap-3">
                  {/* サムネ + 状態バッジ overlay */}
                  <div className="relative shrink-0">
                    {program ? (
                      <Image
                        src={program.thumbnail}
                        alt={`${program.name} のサムネイル`}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-xl"
                      >
                        📍
                      </div>
                    )}
                    <BoothStateBadges
                      isFavorite={isFavorite}
                      isVisited={isVisited}
                      size="sm"
                      className="absolute -right-1.5 -top-1.5"
                    />
                  </div>

                  {/* 番組情報 */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-primary-600">
                      ブース {placement.position}
                      {hoursLabel ? (
                        <span className="ml-1 font-medium text-neutral-400">
                          · {hoursLabel}
                        </span>
                      ) : null}
                    </p>
                    <h3 className="mt-0.5 truncate text-sm font-bold text-neutral-900">
                      {name}
                    </h3>

                    {/* catchphrase 主軸（無ければ subCatch にフォールバック）*/}
                    {catchphrase !== undefined && catchphrase.length > 0 ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-700">
                        「{catchphrase}」
                      </p>
                    ) : subCatch !== undefined && subCatch.length > 0 ? (
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                        {subCatch}
                      </p>
                    ) : null}

                    {/* fanGuide.tags（軸別カラー pill、上位 3 件）*/}
                    {fanTags.length > 0 ? (
                      <p className="mt-1.5 flex flex-wrap gap-1">
                        {fanTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${tagAxisClass(
                              tagAxis(tag),
                            )}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </p>
                    ) : null}

                    {/* merchandiseTags（既存）*/}
                    {merchTags.length > 0 ? (
                      <p className="mt-1 flex flex-wrap gap-1">
                        {merchTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex rounded-full bg-secondary-100 px-1.5 py-0.5 text-[10px] font-medium text-secondary-800"
                          >
                            {shortTagLabel(tag)}
                          </span>
                        ))}
                      </p>
                    ) : null}

                    {/* 物販プレビュー（v1.8）*/}
                    {merchDetails.length > 0 ? (
                      <MerchandisePreview
                        details={merchDetails}
                        variant="list"
                        className="mt-2 border-t border-neutral-100 pt-2"
                      />
                    ) : null}

                    {/* 物販ハイライト（spotlight）*/}
                    {spotlight !== undefined && spotlight.length > 0 ? (
                      <p className="mt-1.5 line-clamp-1 text-[11px] leading-snug text-primary-700">
                        ✨ {spotlight}
                      </p>
                    ) : null}
                  </div>

                  <ExternalLink
                    size={14}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-neutral-400"
                  />
                </div>
              </div>

              {/* link アイコン footer（z-20、pointer-events 戻して独立クリック可能）*/}
              {program ? (
                <div className="relative z-20 flex justify-end px-3 pb-2 pointer-events-auto">
                  <BoothLinkIcons
                    links={program.links}
                    programName={program.name}
                    size={14}
                  />
                </div>
              ) : null}
            </article>
          </li>
        );
      })}
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
