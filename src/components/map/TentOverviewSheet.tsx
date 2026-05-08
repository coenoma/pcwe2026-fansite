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

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MerchandisePreview } from '@/components/merchandise/MerchandisePreview';
import { BoothStateBadges } from './BoothStateBadges';
import { BoothInfoCompact } from './BoothInfoCompact';
import { compactHours } from '@/lib/format';
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
  const merchTags = program?.official.merchandiseTags ?? [];
  const merchDetails = program?.official.merchandiseDetails ?? [];
  const spotlight = program?.official.merchandiseSpotlight;
  const name = program?.name ?? slot.externalName ?? '番組情報未登録';
  // 物販主役エリアが何か出るかどうか（タグ or 詳細 or spotlight のいずれか）
  const hasMerchSection =
    merchTags.length > 0 || merchDetails.length > 0 || spotlight !== undefined;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white transition-all hover:border-primary-300 hover:shadow-md">
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
      <div className="pointer-events-none flex flex-1 flex-col gap-2.5 p-3">
        {/* 1. ヘッダー: ブース番号 + 営業時間 + ジャンル + 状態バッジ */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
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
          <BoothStateBadges
            isFavorite={slot.isFavorite ?? false}
            isVisited={slot.isVisited ?? false}
            size="sm"
            direction="row"
            className="shrink-0"
          />
        </div>

        {/* 2. 物販タグ（メイン・大）— フィルタ検索の答え */}
        {merchTags.length > 0 ? (
          <p className="flex flex-wrap gap-1.5">
            {merchTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-bold text-secondary-800"
              >
                {shortLabel(tag)}
              </span>
            ))}
          </p>
        ) : null}

        {/* 3. 物販ハイライト（メイン）*/}
        {merchDetails.length > 0 ? (
          <MerchandisePreview details={merchDetails} variant="card-main" />
        ) : null}

        {/* 4. spotlight 強調 box（ファンガイドおすすめ）*/}
        {spotlight !== undefined && spotlight.length > 0 ? (
          <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2">
            <p className="text-[10px] font-bold tracking-wide text-primary-700">
              ✨ ファンガイドおすすめ
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-800">
              {spotlight}
            </p>
          </div>
        ) : null}

        {/* 5. 番組情報（補助）— 物販主役エリアの後に区切り線で続く（上詰め）
            mt-auto は使わない: 物販情報量が少ないカードで縦空白が出るため。
            grid-cols-2 のグリッドでは隣のセルとの高さは grid 側で揃うので、
            個別カードは中身の高さに自然にフィットさせる方が見栄えがよい。 */}
        {program ? (
          <BoothInfoCompact
            program={program}
            thumbnailSize={40}
            catchphraseClamp={2}
            className={
              hasMerchSection
                ? 'border-t border-neutral-100 pt-2.5'
                : ''
            }
          />
        ) : (
          // external 番組（programs.json 未登録）の場合は番組名だけ大きく
          <div className="flex items-center gap-2.5 border-t border-neutral-100 pt-2.5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xl"
            >
              {isSponsor ? '🤝' : isKitchen ? '🍳' : '📍'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-bold text-neutral-900">
                {name}
              </p>
              {isExternal ? (
                <p className="mt-0.5 text-[10px] text-neutral-500">
                  {isSponsor ? 'スポンサー出展' : isKitchen ? '飲食ブース' : '外部参照'}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* 6. もっと見る hint（カード底面、stretched button にクリックを委譲）
          - 視覚的アフォーダンスのみ（実際のクリックは外殻 button が処理）
          - エピソード試聴 CTA は番組詳細ページの役目なのでここには置かない */}
      <p
        aria-hidden="true"
        className="pointer-events-none mx-3 mb-3 flex items-center justify-end gap-1 text-[11px] font-bold text-primary-700"
      >
        <span>もっと見る</span>
        <span>→</span>
      </p>
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
