/**
 * テント全体のクイックビュー（quad テントタップ時に最初に出るシート）。
 *
 * 流れ:
 *   テントタップ → このシートで A/B/C/D 4 区画を一覧 → 任意の区画タップ → BoothBottomSheet
 *
 * 4 区画のうち、その日に出展がある区画のみハイライト、なしはグレー表示。
 *
 * UX 意図:
 * - SP でも A/B/C/D を確実に押せる（小さい区画にピンポイントタップが不要）
 * - 「同じテント内の他番組」も視覚で把握できる
 * - 公式マップ的な「テント単位の集約感」を再現
 */

'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MerchandisePreview } from '@/components/merchandise/MerchandisePreview';
import { BoothStateBadges } from './BoothStateBadges';
import { compactHours } from '@/lib/format';
import { tagAxis, tagAxisClass } from '@/lib/tag-axis';
import type { Day, Program, MerchandiseTag } from '@/lib/types';

export interface TentSlotInfo {
  position: string; // "14-A"
  slot?: 'A' | 'B' | 'C' | 'D';
  program?: Program;
  externalKind?: 'sponsor' | 'kitchen-only' | 'external-program';
  externalName?: string;
  /** 現在のフィルタ条件にヒットしているか（フィルタなしなら true）*/
  matchesFilter?: boolean;
  /** お気に入り登録中か（v1.9 状態バッジ表示用）*/
  isFavorite?: boolean;
  /** 「会えた」記録ありか（v1.9 状態バッジ表示用）*/
  isVisited?: boolean;
}

interface Props {
  /** テント番号（14 等）。null なら閉じる */
  tentId: number | null;
  /** その日のテント内 4 区画 */
  slots: TentSlotInfo[];
  /** 表示中の day */
  day: Day;
  /** 区画選択時 */
  onSelectSlot: (position: string) => void;
  /** 閉じる */
  onClose: () => void;
}

export function TentOverviewSheet({
  tentId,
  slots,
  day,
  onSelectSlot,
  onClose,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // 開いた瞬間のオートフォーカスは「謎のオレンジ枠」の原因になるため不採用。

  useEffect(() => {
    if (tentId === null) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [tentId, onClose]);

  // モーダル表示中は背景スクロール無効化
  useEffect(() => {
    if (tentId === null) return undefined;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [tentId]);

  if (tentId === null) return null;

  const dayLabel = day === 'sat' ? '5/9 土' : '5/10 日';

  // A/B/C/D の順で並び替え
  const order: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const sortedSlots = order
    .map((s) => slots.find((sl) => sl.slot === s))
    .filter((s): s is TentSlotInfo => s !== undefined);

  // フィルタが効いてる場合: マッチした slot だけ表示
  // 全部マッチしている、もしくはフィルタ未適用の場合は通常の 4 件表示
  const hasFilter = sortedSlots.some((s) => s.matchesFilter === false);
  const displaySlots = hasFilter
    ? sortedSlots.filter((s) => s.matchesFilter !== false)
    : sortedSlots;
  const filteredOutCount = sortedSlots.length - displaySlots.length;

  return (
    <>
      <button
        type="button"
        aria-label="閉じる"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tent-overview-title"
        className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-h-[95vh] max-w-5xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl animate-[slideUp_0.25s_ease-out] lg:bottom-0 lg:max-h-[95vh]"
      >
        {/* sticky ヘッダー（drag handle + タイトル + 閉じる）*/}
        <div className="shrink-0 bg-white">
          <div className="flex justify-center pb-1 pt-3">
            <span
              aria-hidden="true"
              className="block h-1.5 w-12 rounded-full bg-neutral-200"
            />
          </div>

          <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-1">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-primary-600">
                テント {tentId}（{dayLabel}・{sortedSlots.length} 区画）
              </p>
              <h2
                id="tent-overview-title"
                className="mt-0.5 text-sm font-bold leading-tight text-neutral-900"
              >
                {hasFilter
                  ? `条件ヒット ${displaySlots.length} 件 ✨`
                  : '気になるブースを選んでね'}
              </h2>
              {hasFilter ? (
                <p className="mt-0.5 text-[10px] text-neutral-500">
                  ({filteredOutCount} 件は条件外で非表示)
                </p>
              ) : null}
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              aria-label="閉じる"
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* スクロール可能エリア */}
        <div className="flex-1 overflow-y-auto">
          <div
            className={
              displaySlots.length === 1
                ? 'mx-auto grid max-w-md grid-cols-1 gap-3 px-5 pb-4 pt-2'
                : 'grid grid-cols-2 gap-3 px-5 pb-4 pt-2'
            }
          >
            {displaySlots.map((slot) => (
              <SlotCard
                key={slot.position}
                slot={slot}
                onClick={() => onSelectSlot(slot.position)}
              />
            ))}
            {/* フィルタ未適用 + 区画 4 未満の場合のプレースホルダー */}
            {!hasFilter
              ? Array.from({ length: 4 - sortedSlots.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    aria-hidden="true"
                    className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-3 text-center"
                  >
                    <p className="text-xs text-neutral-400">空き / 情報未取得</p>
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

function SlotCard({
  slot,
  onClick,
}: {
  slot: TentSlotInfo;
  onClick: () => void;
}) {
  const program = slot.program;
  const isExternal = slot.externalKind !== undefined;
  const isKitchen = slot.externalKind === 'kitchen-only';
  const isSponsor = slot.externalKind === 'sponsor';
  const hoursLabel = program ? compactHours(program.exhibition.hours) : null;
  const fanTags = program?.fanGuide.tags ?? [];
  const merchTags = program?.official.merchandiseTags ?? [];
  const name = program?.name ?? slot.externalName ?? '番組情報未登録';
  const recommendedEpisode = program?.recommendedEpisode;

  return (
    <article className="group relative flex min-h-[48vh] flex-col rounded-2xl border border-neutral-200 bg-white transition-all hover:border-primary-300 hover:shadow-md">
      {/* stretched button: カード全体タップで onClick（z-10）*/}
      <button
        type="button"
        onClick={onClick}
        aria-label={`${name} のブース詳細を開く`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <span className="sr-only">ブース詳細を開く</span>
      </button>

      {/* 表示コンテンツ（pointer-events-none で stretched button にクリック透過）*/}
      <div className="pointer-events-none flex flex-1 flex-col p-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-bold text-white">
            {slot.position}
          </span>
          {hoursLabel !== null ? (
            <span className="text-[10px] text-neutral-500">{hoursLabel}</span>
          ) : null}
          {program?.fanGuide.genre ? (
            <span className="truncate text-[10px] text-neutral-500">
              ・{program.fanGuide.genre}
            </span>
          ) : null}
        </div>

        {/* サムネ + 状態バッジ + 番組名 + subCatch */}
        <div className="mt-2 flex items-start gap-3">
          <div className="relative shrink-0">
            {program ? (
              <Image
                src={program.thumbnail}
                alt=""
                width={72}
                height={72}
                className="h-18 w-18 rounded-lg object-cover"
                style={{ width: 72, height: 72 }}
                aria-hidden="true"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex items-center justify-center rounded-lg bg-neutral-100 text-3xl"
                style={{ width: 72, height: 72 }}
              >
                {isSponsor ? '🤝' : isKitchen ? '🍳' : '📍'}
              </span>
            )}
            <BoothStateBadges
              isFavorite={slot.isFavorite ?? false}
              isVisited={slot.isVisited ?? false}
              size="sm"
              className="absolute -right-1.5 -top-1.5"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900">
              {name}
            </p>
            {program?.fanGuide.subCatch ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-neutral-600">
                {program.fanGuide.subCatch}
              </p>
            ) : null}
          </div>
        </div>

        {/* catchphrase（amber 蛍光下線、line-clamp-3）*/}
        {program?.fanGuide.catchphrase ? (
          <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-neutral-800">
            <span
              className="box-decoration-clone"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, transparent 78%, rgba(252, 211, 77, 0.4) 78%, rgba(252, 211, 77, 0.4) 94%, transparent 94%)',
                paddingInline: '0.1em',
              }}
            >
              {program.fanGuide.catchphrase}
            </span>
          </p>
        ) : null}

        {/* fanGuide.tags（軸別カラー pill、全件 flex-wrap）*/}
        {fanTags.length > 0 ? (
          <p className="mt-2 flex flex-wrap gap-1">
            {fanTags.map((tag) => (
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

        {/* グッズタグ（全件 flex-wrap）*/}
        {merchTags.length > 0 ? (
          <p className="mt-1 flex flex-wrap gap-1">
            {merchTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-secondary-100 px-1.5 py-0.5 text-[10px] font-medium text-secondary-800"
              >
                {shortLabel(tag)}
              </span>
            ))}
          </p>
        ) : null}

        {/* 物販プレビュー: 代表物販 name + +N件 バッジ */}
        {program?.official.merchandiseDetails &&
        program.official.merchandiseDetails.length > 0 ? (
          <MerchandisePreview
            details={program.official.merchandiseDetails}
            variant="slot"
            className="mt-2.5 border-t border-neutral-100 pt-2"
          />
        ) : null}

        {/* spotlight（ファンガイドおすすめ、line-clamp-2）*/}
        {program?.official.merchandiseSpotlight ? (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-primary-700">
            ✨ {program.official.merchandiseSpotlight}
          </p>
        ) : null}

        {isExternal ? (
          <p className="mt-1 text-[10px] text-neutral-500">
            {isSponsor ? 'スポンサー' : isKitchen ? '飲食ブース' : '外部参照'}
          </p>
        ) : null}
      </div>

      {/* recommendedEpisode CTA（z-20、独立クリック可）*/}
      {recommendedEpisode !== undefined ? (
        <a
          href={recommendedEpisode.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} のおすすめエピソード「${recommendedEpisode.title}」を聴く`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="relative z-20 mx-3 mb-3 mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-primary-50 px-3 py-2 text-[11px] font-bold text-primary-700 transition-colors hover:bg-primary-100 pointer-events-auto"
        >
          <span aria-hidden="true">🎧</span>
          <span className="line-clamp-1">エピソードを試聴する</span>
        </a>
      ) : null}
    </article>
  );
}

function shortLabel(tag: MerchandiseTag): string {
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
