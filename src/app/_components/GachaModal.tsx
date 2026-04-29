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
 * - ジャンル違いの 3 番組をふわんふわんと表示
 * - 「もう一度引く」で何度でも引き直せる（直前の 3 件は除外）
 * - <dialog> 要素 + showModal() でアクセシブル + Escape キー対応
 */
export function GachaModal({ programs, isOpen, onClose }: Props) {
  const [picks, setPicks] = useState<Program[]>([]);
  // animation 再描画のための key（reroll で増える）
  const [rerollKey, setRerollKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // 開く瞬間に最初の 3 番組を抽選
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

  // 背景クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-0 max-h-screen max-w-full bg-transparent p-0 backdrop:bg-black/50"
      aria-label="運命の 3 番組"
    >
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-4 sm:p-6">
        <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-neutral-700">
              <Dices size={18} className="text-primary-600" aria-hidden="true" />
              ぼくが選んだ、ジャンル違いの 3 本
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

          {/* 3 番組カード */}
          <div className="px-5 py-6 sm:px-6 sm:py-8">
            <div
              key={rerollKey}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
            >
              {picks.map((program, index) => (
                <GachaPick key={program.id} program={program} delay={index * 180} />
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
      className="group block overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
      style={{
        borderColor: `${themeColor}40`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="animate-float-in" style={{ animationDelay: `${delay}ms` }}>
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          <Image
            src={program.thumbnail}
            alt={`${program.name} のロゴ画像`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* themeColor の薄いオーバーレイで「個性」を演出 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-20"
            style={{ backgroundColor: themeColor }}
          />
        </div>
        <div className="space-y-2 p-4">
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
      </div>
    </Link>
  );
}
