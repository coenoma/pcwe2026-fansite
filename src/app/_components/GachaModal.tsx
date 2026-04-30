'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dices, X } from 'lucide-react';
import type { Program } from '@/lib/types';
import { pickDiverseRandom } from '@/lib/random-pick';
import { dayLabel } from '@/lib/format';
import { vibeStyle } from '@/lib/vibe-style';

interface Props {
  programs: Program[];
  isOpen: boolean;
  onClose: () => void;
}

/** 抽選演出の長さ（ms）— サイコロを揺らす時間 */
const SHUFFLE_MS = 850;

/**
 * ガチャ結果モーダル（v1.7 演出強化）
 *
 * 演出フロー:
 *   1. モーダルを開く / 引き直す → 「カラカラ…」抽選中ステート（850ms）
 *      - サイコロアイコンが回転＆スケール（dice-shake）
 *      - 「いま、運命の 3 番組をシャッフル中…」テキスト
 *      - サムネ予定地に番組サムネが thinking-bob でフワフワ
 *   2. 抽選完了 → 結果カードが pop-in でドラマチック登場（stagger）
 *   3. 「もう一度引く」で同じ演出を再生
 *
 * - <dialog> 要素 + showModal() で Escape / フォーカストラップに対応
 * - レスポンシブ:
 *   - SP: 全幅・1 カラム
 *   - PC: 中央 max-w-3xl・3 カラム
 */
export function GachaModal({ programs, isOpen, onClose }: Props) {
  const [picks, setPicks] = useState<Program[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [rerollKey, setRerollKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 抽選を実行（pick → 演出 → setPicks）
  // useCallback で参照を安定させ、useEffect の依存配列に入れて exhaustive-deps を満たす
  const runGacha = useCallback(
    (excludeIds?: readonly string[]) => {
      const next = pickDiverseRandom(programs, { count: 3, excludeIds });
      setIsShuffling(true);
      // 演出時間後に結果を表示。結果は事前に決めて、表示タイミングだけ遅らせる
      const t = setTimeout(() => {
        setPicks(next);
        setRerollKey((k) => k + 1);
        setIsShuffling(false);
      }, SHUFFLE_MS);
      return () => clearTimeout(t);
    },
    [programs],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // 開くたびに抽選演出スタート
      const cancel = runGacha();
      return cancel;
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, runGacha]);

  // dialog の close イベント（Escape 等で閉じた時も同期）
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  const handleReroll = () => {
    const excludeIds = picks.map((p) => p.id);
    runGacha(excludeIds);
  };

  // 背景（dialog 自体）クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="
        fixed inset-0 m-auto h-fit max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl
        overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0 shadow-2xl
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
      "
      aria-label="運命の 3 番組"
    >
      <div className="flex max-h-[90vh] flex-col">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-5">
          <p className="flex items-center gap-2 text-sm font-bold text-neutral-700">
            <Dices
              size={18}
              className={
                isShuffling
                  ? 'animate-dice-shake text-primary-600'
                  : 'text-primary-600'
              }
              aria-hidden="true"
            />
            {isShuffling ? 'いま、引いてます…' : 'AI のおすすめ 3 本'}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* スクロール領域 */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
          {/* grid コンテナに min-height を固定して、reroll / アニメ中の揺れを防ぐ */}
          <div
            key={rerollKey}
            className="grid min-h-[1080px] grid-cols-1 gap-4 sm:min-h-[400px] sm:grid-cols-3 sm:gap-5"
          >
            {isShuffling
              ? [0, 1, 2].map((i) => (
                  <ShufflingPlaceholder
                    key={`shuf-${i}`}
                    programs={programs}
                    delay={i * 120}
                  />
                ))
              : picks.map((program, index) => (
                  <GachaPick key={program.id} program={program} delay={index * 180} />
                ))}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <button
              type="button"
              onClick={handleReroll}
              disabled={isShuffling}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary-600 bg-white px-6 py-2.5 text-sm font-bold text-primary-700 transition-all active:scale-95 hover:bg-primary-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white sm:w-auto"
            >
              <Dices
                size={18}
                className={isShuffling ? 'animate-dice-shake' : ''}
                aria-hidden="true"
              />
              {isShuffling ? 'シャッフル中…' : 'もう一度引く'}
            </button>
            <p
              aria-live="polite"
              className="text-xs text-neutral-500"
            >
              {isShuffling
                ? 'カラカラカラ…運命を、選んでます'
                : 'ぐっと刺さる番組と、ここで出会えますように'}
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}

interface GachaPickProps {
  program: Program;
  /** stagger のための delay (ms) */
  delay: number;
}

function GachaPick({ program, delay }: GachaPickProps) {
  const vibe = vibeStyle(program.fanGuide.vibe);
  const themeColor = program.fanGuide.themeColor ?? vibe.defaultThemeColor;

  return (
    <Link
      href={`/booth/${program.id}`}
      className="animate-pop-in group flex h-full min-h-[340px] flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
      style={{
        borderColor: `${themeColor}40`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={program.thumbnail}
          alt={`${program.name} のロゴ画像`}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
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
        <h3 className="text-sm font-extrabold leading-snug text-neutral-900 group-hover:text-primary-700">
          {program.shortName ?? program.name}
        </h3>
        <p className="text-xs leading-relaxed text-neutral-700">
          {program.fanGuide.catchphrase}
        </p>
      </div>
    </Link>
  );
}

/**
 * 抽選中のプレースホルダー（ランダムなサムネがフワフワ漂う）
 * 実際にどの番組が選ばれるかは確定しているが、視覚的にはまだ「シャッフル中」を演出
 */
function ShufflingPlaceholder({
  programs,
  delay,
}: {
  programs: Program[];
  delay: number;
}) {
  // ランダムに 1 枚サムネを選んで揺らす（演出専用、結果には影響しない）
  const sample =
    programs[Math.floor(Math.random() * programs.length)] ?? programs[0];

  return (
    <div
      aria-hidden="true"
      className="animate-bucket flex h-full min-h-[340px] flex-col overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 to-amber-50">
        {sample !== undefined && (
          <span
            className="animate-thinking-bob relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-md sm:h-24 sm:w-24"
            style={{ animationDelay: `${delay}ms` }}
          >
            <Image
              src={sample.thumbnail}
              alt=""
              fill
              sizes="96px"
              className="object-cover opacity-70"
            />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="h-3 w-2/3 animate-shimmer rounded" />
        <div className="h-3 w-full animate-shimmer rounded" />
        <div className="h-3 w-3/4 animate-shimmer rounded" />
      </div>
    </div>
  );
}
