/**
 * ブース詳細のボトムシート（タップで起動、半画面プレビュー）。
 *
 * - フォーカストラップ + Esc 閉じる + 背景タップ閉じる
 * - 「番組詳細を見る」で別タブ /booth/[id]
 * - external（programs.json 未登録）の場合は CTA を「公式ブースを見る」に置換
 *
 * 軽量実装: Radix Dialog を使わず、aria 属性 + フォーカス管理を自前で。
 * 当日の電波弱・bundle 軽量を優先。
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Check, ExternalLink, Star, X } from 'lucide-react';
import type { Day, Program } from '@/lib/types';
import type { SlotPlacement } from '@/lib/booth-map';

interface Props {
  /** 開いている場合の placement、null なら閉じる */
  placement: SlotPlacement | null;
  /** 該当 program（programs.json 由来）。external なら undefined */
  program?: Program;
  /** 表示中の day（土日のサブラベル用）*/
  day: Day;
  /** 閉じるコールバック */
  onClose: () => void;
  isFavorite?: boolean;
  isVisited?: boolean;
  onToggleFavorite?: () => void;
  onToggleVisited?: () => void;
}

export function BoothBottomSheet({
  placement,
  program,
  day,
  onClose,
  isFavorite = false,
  isVisited = false,
  onToggleFavorite,
  onToggleVisited,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 開いた直後に閉じるボタンへフォーカス（フォーカストラップ起点）
  useEffect(() => {
    if (placement) {
      closeButtonRef.current?.focus();
    }
  }, [placement]);

  // Esc キーで閉じる
  useEffect(() => {
    if (!placement) return undefined;
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
  }, [placement, onClose]);

  if (!placement) return null;

  const isExternal = placement.externalName !== undefined;
  const dayLabel = day === 'sat' ? '5/9 土' : '5/10 日';

  return (
    <>
      {/* 背景オーバーレイ（タップで閉じる）*/}
      <button
        type="button"
        aria-label="閉じる"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* シート本体 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booth-sheet-title"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        {/* drag handle */}
        <div className="sticky top-0 flex justify-center bg-white pb-1 pt-3">
          <span
            aria-hidden="true"
            className="block h-1.5 w-12 rounded-full bg-neutral-200"
          />
        </div>

        <div className="flex items-start gap-3 px-5 pb-2 pt-2">
          {/* サムネ */}
          {program ? (
            <Image
              src={program.thumbnail}
              alt={`${program.name} のサムネイル`}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-2xl"
            >
              📍
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary-600">
              ブース {placement.position}（{dayLabel}）
            </p>
            <h2
              id="booth-sheet-title"
              className="mt-1 text-lg font-bold leading-tight text-neutral-900"
            >
              {program?.name ?? placement.externalName ?? `テント ${placement.tent}`}
            </h2>
            {program?.fanGuide.subCatch ? (
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                {program.fanGuide.subCatch}
              </p>
            ) : null}
            {isExternal ? (
              <p className="mt-1 text-xs text-neutral-500">
                外部参照ブース（{placement.externalNote ?? '当サイトに番組詳細未掲載'}）
              </p>
            ) : null}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="ボトムシートを閉じる"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* キャッチコピー */}
        {program?.fanGuide.catchphrase ? (
          <div className="mx-5 mt-3 rounded-xl bg-amber-50 px-4 py-3">
            <p className="text-sm font-bold leading-relaxed text-neutral-900">
              {program.fanGuide.catchphrase}
            </p>
          </div>
        ) : null}

        {/* グッズタグ */}
        {program?.official.merchandiseTags &&
        program.official.merchandiseTags.length > 0 ? (
          <div className="mx-5 mt-3 flex flex-wrap gap-1.5">
            {program.official.merchandiseTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary-50 px-2.5 py-1 text-xs font-medium text-secondary-700"
              >
                {tagLabel(tag)}
              </span>
            ))}
          </div>
        ) : null}

        {/* 物販スポットライト（コエノマ運営手書き）*/}
        {program?.official.merchandiseSpotlight ? (
          <div className="mx-5 mt-3 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-700">
              ✨ ファンガイドからのおすすめ
            </p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-800">
              {program.official.merchandiseSpotlight}
            </p>
          </div>
        ) : null}

        {/* 物販上位 3 件 */}
        {program?.official.merchandiseDetails &&
        program.official.merchandiseDetails.length > 0 ? (
          <div className="mx-5 mt-4">
            <p className="text-xs font-bold tracking-wide text-neutral-500">
              ブース物販
            </p>
            <ul className="mt-1 space-y-1">
              {program.official.merchandiseDetails.slice(0, 3).map((d, i) => (
                <li key={i} className="text-sm leading-relaxed text-neutral-700">
                  ・{d.name}
                </li>
              ))}
              {program.official.merchandiseDetails.length > 3 ? (
                <li className="text-xs text-neutral-500">
                  ＋ あと {program.official.merchandiseDetails.length - 3} 件（番組詳細で全表示）
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {/* CTA */}
        <div className="sticky bottom-0 mt-5 border-t border-neutral-100 bg-white px-5 py-3 space-y-2">
          {/* お気に入り / 会えた */}
          {(onToggleFavorite || onToggleVisited) && !isExternal ? (
            <div className="flex gap-2">
              {onToggleFavorite ? (
                <button
                  type="button"
                  aria-pressed={isFavorite}
                  onClick={onToggleFavorite}
                  className={
                    isFavorite
                      ? 'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-200'
                      : 'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 transition-colors hover:border-amber-300 hover:text-amber-700'
                  }
                >
                  <Star
                    size={14}
                    aria-hidden="true"
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                  {isFavorite ? 'お気に入り済み' : 'お気に入りに追加'}
                </button>
              ) : null}
              {onToggleVisited ? (
                <button
                  type="button"
                  aria-pressed={isVisited}
                  onClick={onToggleVisited}
                  className={
                    isVisited
                      ? 'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent-cyan-500/10 px-3 py-2 text-xs font-bold text-accent-cyan-600 transition-colors hover:bg-accent-cyan-500/20'
                      : 'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 transition-colors hover:border-accent-cyan-400 hover:text-accent-cyan-600'
                  }
                >
                  <Check size={14} aria-hidden="true" />
                  {isVisited ? '会えた済み' : '会えた'}
                </button>
              ) : null}
            </div>
          ) : null}

          {/* メイン CTA */}
          {program ? (
            <Link
              href={`/booth/${program.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-600"
            >
              番組詳細を見る
              <ExternalLink size={16} aria-hidden="true" />
            </Link>
          ) : (
            <a
              href={`https://podcastexpo.jp/booth/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-600"
            >
              公式サイトを見る
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
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

function tagLabel(tag: string): string {
  switch (tag) {
    case 'food-drink':
      return '🍴 食・飲み物';
    case 'experience':
      return '🎟 体験';
    case 'rare-curious':
      return '🔮 珍しい';
    case 'free-distribution':
      return '🎁 無料配布';
    case 'limited-new':
      return '✨ 新作・限定';
    case 'zine-book':
      return '📕 ZINE・読み物';
    default:
      return tag;
  }
}
