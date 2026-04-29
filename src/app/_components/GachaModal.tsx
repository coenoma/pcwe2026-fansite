'use client';

import { useEffect, useRef, useState } from 'react';
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

/**
 * ガチャ結果モーダル
 *
 * - ぼくのおすすめ 3 番組を、ふわんふわんと表示
 * - 「もう一度引く」で何度でも引き直せる（直前の 3 件は除外）
 * - <dialog> 要素 + showModal() で Escape / フォーカストラップに対応
 * - レスポンシブ:
 *   - SP: 全幅・1 カラム
 *   - PC: 中央 max-w-3xl・3 カラム
 */
export function GachaModal({ programs, isOpen, onClose }: Props) {
  const [picks, setPicks] = useState<Program[]>([]);
  const [rerollKey, setRerollKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      setPicks(pickDiverseRandom(programs, { count: 3 }));
      setRerollKey((k) => k + 1);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, programs]);

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
    setPicks(pickDiverseRandom(programs, { count: 3, excludeIds }));
    setRerollKey((k) => k + 1);
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
            <Dices size={18} className="text-primary-600" aria-hidden="true" />
            ぼくのおすすめ 3 本
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
          <div
            key={rerollKey}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
          >
            {picks.map((program, index) => (
              <GachaPick key={program.id} program={program} delay={index * 180} />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <button
              type="button"
              onClick={handleReroll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary-600 bg-white px-6 py-2.5 text-sm font-bold text-primary-700 transition-all active:scale-95 hover:bg-primary-50 hover:shadow-md sm:w-auto"
            >
              <Dices size={18} aria-hidden="true" />
              もう一度引く
            </button>
            <p className="text-xs text-neutral-500">
              ぐっと刺さる番組と、ここで出会えますように
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
      className="animate-float-in group block overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
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
        {/* themeColor の薄いオーバーレイ（番組らしさを少しだけ）*/}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15 mix-blend-multiply"
          style={{ backgroundColor: themeColor }}
        />
      </div>
      <div className="space-y-2 p-3 sm:p-4">
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
