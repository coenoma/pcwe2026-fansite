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
import type { Day, Program, MerchandiseTag } from '@/lib/types';

export interface TentSlotInfo {
  position: string; // "14-A"
  slot?: 'A' | 'B' | 'C' | 'D';
  program?: Program;
  externalKind?: 'sponsor' | 'kitchen-only' | 'external-program';
  externalName?: string;
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

  useEffect(() => {
    if (tentId !== null) closeButtonRef.current?.focus();
  }, [tentId]);

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

  if (tentId === null) return null;

  const dayLabel = day === 'sat' ? '5/9 土' : '5/10 日';

  // A/B/C/D の順で並び替え
  const order: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const sortedSlots = order
    .map((s) => slots.find((sl) => sl.slot === s))
    .filter((s): s is TentSlotInfo => s !== undefined);

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
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="sticky top-0 flex justify-center bg-white pb-1 pt-3">
          <span
            aria-hidden="true"
            className="block h-1.5 w-12 rounded-full bg-neutral-200"
          />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary-600">
              テント {tentId}（{dayLabel}・4 区画）
            </p>
            <h2
              id="tent-overview-title"
              className="mt-1 text-lg font-bold leading-tight text-neutral-900"
            >
              気になるブースを選んでね
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              A・B・C・D の 4 区画から気になるブースをタップ
            </p>
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

        {/* A/B/C/D グリッド */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-4 pt-3">
          {sortedSlots.map((slot) => (
            <SlotCard
              key={slot.position}
              slot={slot}
              onClick={() => onSelectSlot(slot.position)}
            />
          ))}
          {/* 区画が 4 つ未満の場合のプレースホルダー（テント形状で 4 区画あるが情報なし）*/}
          {Array.from({ length: 4 - sortedSlots.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              aria-hidden="true"
              className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-3 text-center"
            >
              <p className="text-xs text-neutral-400">空き / 情報未取得</p>
            </div>
          ))}
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

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-3 text-left transition-all hover:border-primary-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary-500"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary-500 px-2 text-xs font-bold text-white">
          {slot.position}
        </span>
        {program?.fanGuide.genre ? (
          <span className="truncate text-[10px] text-neutral-500">
            {program.fanGuide.genre}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {program ? (
          <Image
            src={program.thumbnail}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
            aria-hidden="true"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-lg"
          >
            {isSponsor ? '🤝' : isKitchen ? '🍳' : '📍'}
          </span>
        )}
        <p className="line-clamp-2 min-w-0 flex-1 text-xs font-bold text-neutral-900">
          {program?.name ?? slot.externalName ?? '番組情報未登録'}
        </p>
      </div>

      {/* グッズタグ（先頭 2 件のみ）*/}
      {program?.official.merchandiseTags &&
      program.official.merchandiseTags.length > 0 ? (
        <p className="mt-2 flex flex-wrap gap-1">
          {program.official.merchandiseTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full bg-secondary-50 px-1.5 py-0.5 text-[9px] font-medium text-secondary-700"
            >
              {shortLabel(tag)}
            </span>
          ))}
        </p>
      ) : null}

      {isExternal ? (
        <p className="mt-1 text-[10px] text-neutral-500">
          {isSponsor ? 'スポンサー' : isKitchen ? '飲食ブース' : '外部参照'}
        </p>
      ) : null}
    </button>
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
