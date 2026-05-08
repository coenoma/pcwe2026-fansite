/**
 * ブース詳細のボトムシート（タップで起動、半画面プレビュー）。
 *
 * 内容（縦に積む、SP 最適化）:
 *   1. ヘッダー（ブース番号 + 番組名 + サブキャッチ）
 *   2. キャッチコピー（fanGuide.catchphrase）
 *   3. グッズタグ（merchandiseTags）
 *   4. ファンガイドおすすめ（merchandiseSpotlight）
 *   5. ブース物販（MerchandiseList layout="popup" で番組詳細と同じ UI）
 *   6. お気に入り / 会えた / 番組詳細 CTA
 *
 * UX:
 *   - フォーカストラップ + Esc 閉じる + 背景タップ閉じる
 *   - sticky CTA は最下部、本文長ければスクロール
 *   - 「番組詳細を見る」で別タブ /booth/[id]
 *   - external（programs.json 未登録 / スポンサー / キッチン）の場合は kind 別 CTA
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Check, ExternalLink, Star, X } from 'lucide-react';
import { MerchandiseList } from '@/components/merchandise/MerchandiseList';
import { MerchandisePreview } from '@/components/merchandise/MerchandisePreview';
import type { Day, MerchandiseTag, Program } from '@/lib/types';
import type { SlotPlacement } from '@/lib/booth-map';
import type { TweetMap } from '@/lib/tweet-cache';

interface Props {
  /** 開いている placement、null なら閉じる */
  placement: SlotPlacement | null;
  /** 該当 program。external なら undefined */
  program?: Program;
  /** 表示中の day */
  day: Day;
  /** SSG 時に pre-fetch した X 投稿データ（compact mode で EmbeddedTweet に渡す）*/
  tweets?: TweetMap;
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
  tweets,
  onClose,
  isFavorite = false,
  isVisited = false,
  onToggleFavorite,
  onToggleVisited,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 注: 開いた瞬間のオートフォーカスはユーザー観点で「謎のオレンジ枠」になるため不採用。
  // フォーカス管理は Esc キーや背景タップで閉じる動作・ARIA 属性に任せる。

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

  // モーダル表示中は背景スクロール無効化（マップやページがスクロールしないように）
  useEffect(() => {
    if (!placement) return undefined;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [placement]);

  if (!placement) return null;

  const dayLabel = day === 'sat' ? '5/9 土' : '5/10 日';
  const isSponsor = placement.externalKind === 'sponsor';
  const isKitchenOnly = placement.externalKind === 'kitchen-only';
  const isExternal = placement.externalKind !== undefined;
  const headerLabel = isSponsor
    ? `スポンサー出展（${dayLabel}）`
    : isKitchenOnly
      ? `キッチンブース（${dayLabel}）`
      : `ブース ${placement.position}（${dayLabel}）`;

  return (
    <>
      <button
        type="button"
        aria-label="閉じる"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booth-sheet-title"
        className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-h-[80vh] max-w-5xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl animate-[slideUp_0.25s_ease-out] lg:bottom-0 lg:max-h-[88vh]"
      >
        {/* drag handle */}
        <div className="sticky top-0 flex justify-center bg-white pt-3">
          <span
            aria-hidden="true"
            className="block h-1.5 w-12 rounded-full bg-neutral-200"
          />
        </div>

        {/* スクロール領域 */}
        <div className="flex-1 overflow-y-auto pb-2">
          {/* ヘッダー */}
          <div className="flex items-start gap-3 px-5 pt-2">
            {program ? (
              <Image
                src={program.thumbnail}
                alt={`${program.name} のサムネイル`}
                width={72}
                height={72}
                className="h-18 w-18 shrink-0 rounded-2xl object-cover"
                style={{ width: 72, height: 72 }}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-3xl"
              >
                {isSponsor ? '🤝' : isKitchenOnly ? '🍳' : '📍'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-primary-600">{headerLabel}</p>
              <h2
                id="booth-sheet-title"
                className="mt-1 text-base font-bold leading-snug text-neutral-900 sm:text-lg"
              >
                {program?.name ?? placement.externalName ?? `テント ${placement.tent}`}
              </h2>
              {program?.fanGuide.subCatch ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">
                  {program.fanGuide.subCatch}
                </p>
              ) : null}
              {placement.externalNote ? (
                <p className="mt-1 text-xs text-neutral-500">
                  {placement.externalNote}
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
                  className="rounded-full bg-secondary-50 px-2.5 py-1 text-[11px] font-medium text-secondary-700"
                >
                  {tagLabel(tag)}
                </span>
              ))}
            </div>
          ) : null}

          {/* 物販ハイライト（X 埋め込み詳細を開く前の意思決定支援。
              上位 2 件の name + 残り件数を compact に表示） */}
          {program?.official.merchandiseDetails &&
          program.official.merchandiseDetails.length > 0 ? (
            <div className="mx-5 mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <MerchandisePreview
                details={program.official.merchandiseDetails}
                variant="sheet-header"
              />
            </div>
          ) : null}

          {/* ファンガイドおすすめ */}
          {program?.official.merchandiseSpotlight ? (
            <div className="mx-5 mt-3 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
              <p className="text-[11px] font-bold tracking-wide text-primary-700">
                ✨ ファンガイドからのおすすめ
              </p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-800">
                {program.official.merchandiseSpotlight}
              </p>
            </div>
          ) : null}

          {/* ブース物販（番組詳細と同じ MerchandiseList を popup レイアウトで再利用）*/}
          {program?.official.merchandiseDetails &&
          program.official.merchandiseDetails.length > 0 ? (
            <section
              aria-labelledby="booth-merch-heading"
              className="mx-5 mt-4 border-t border-neutral-100 pt-4"
            >
              <h3
                id="booth-merch-heading"
                className="text-xs font-bold tracking-wide text-neutral-500"
              >
                🛍 ブース物販
              </h3>
              <div className="mt-3">
                <MerchandiseList
                  details={program.official.merchandiseDetails}
                  layout="popup"
                  tweets={tweets}
                />
              </div>
            </section>
          ) : program?.official.merchandise &&
            program.official.merchandise.length > 0 ? (
            <div className="mx-5 mt-4 border-t border-neutral-100 pt-3">
              <p className="text-xs font-bold tracking-wide text-neutral-500">
                🛍 ブース物販（一覧）
              </p>
              <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {program.official.merchandise.map((m, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700"
                  >
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-neutral-400">
                ※ 詳細・価格・出典は番組詳細ページにて
              </p>
            </div>
          ) : null}

          {/* v1.14: external（スポンサー / キッチン等）でも物販詳細があれば表示 */}
          {placement.externalMerchandiseDetails &&
          placement.externalMerchandiseDetails.length > 0 ? (
            <section
              aria-labelledby="booth-external-merch-heading"
              className="mx-5 mt-4 border-t border-neutral-100 pt-4"
            >
              <h3
                id="booth-external-merch-heading"
                className="text-xs font-bold tracking-wide text-neutral-500"
              >
                🛍 ブース物販
              </h3>
              <div className="mt-3">
                <MerchandiseList
                  details={placement.externalMerchandiseDetails}
                  layout="popup"
                  tweets={tweets}
                />
              </div>
            </section>
          ) : null}

          {/* スポンサー専用説明 */}
          {isSponsor ? (
            <div className="mx-5 mt-4 rounded-xl bg-secondary-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-secondary-800">
                このテントは PCWE2026 の <strong>スポンサー出展枠</strong> です。番組ブースではなく企業展示・体験などが行われます。
              </p>
            </div>
          ) : null}
          {isKitchenOnly ? (
            <div className="mx-5 mt-4 rounded-xl bg-amber-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-amber-800">
                このテントは <strong>キッチンブース</strong> です。飲食提供がメインで、特定番組の出展はありません。
              </p>
            </div>
          ) : null}
        </div>

        {/* 固定 CTA */}
        <div className="border-t border-neutral-100 bg-white px-5 py-3 space-y-2">
          {/* お気に入り / 会えた（番組のときだけ）*/}
          {!isExternal && program && (onToggleFavorite || onToggleVisited) ? (
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
                  {isFavorite ? 'お気に入り済' : 'お気に入り'}
                </button>
              ) : null}
              {onToggleVisited ? (
                <button
                  type="button"
                  aria-pressed={isVisited}
                  onClick={onToggleVisited}
                  className={
                    isVisited
                      ? 'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent-cyan-500/15 px-3 py-2 text-xs font-bold text-accent-cyan-600 transition-colors hover:bg-accent-cyan-500/25'
                      : 'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 transition-colors hover:border-accent-cyan-400 hover:text-accent-cyan-600'
                  }
                >
                  <Check size={14} aria-hidden="true" />
                  {isVisited ? '会えた済' : '会えた'}
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
          ) : placement.externalUrl ? (
            <a
              href={placement.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-600"
            >
              {placement.externalName} の公式サイトへ
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          ) : (
            <p className="text-center text-xs text-neutral-500">
              この出展に関する詳細情報はまだありません
            </p>
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

function tagLabel(tag: MerchandiseTag): string {
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
  }
}
