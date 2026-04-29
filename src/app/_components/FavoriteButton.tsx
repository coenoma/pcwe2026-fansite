'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { loadFavorites, saveFavorites, toggleFavorite } from '@/lib/favorites';

interface Props {
  programId: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 「気になる」トグルボタン
 *
 * - クリック時にハートが pulse（scale: 1 → 1.4 → 1）
 * - localStorage に保存
 * - SSR 中は常に未お気に入り状態
 * - 「気になる N 件」を window event で他コンポーネントに通知（Header バッジ用）
 */
export function FavoriteButton({ programId, size = 'sm' }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pulseTimer = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setIsFavorite(loadFavorites().includes(programId));
  }, [programId]);

  useEffect(() => {
    return () => {
      if (pulseTimer.current !== null) {
        window.clearTimeout(pulseTimer.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(loadFavorites(), programId);
    saveFavorites(next);
    const nextIsFav = next.includes(programId);
    setIsFavorite(nextIsFav);

    // 追加時のみパルスアニメーション
    if (nextIsFav) {
      setPulse(true);
      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
      pulseTimer.current = window.setTimeout(() => setPulse(false), 400);
    }

    // 他コンポーネントに通知（Header の件数バッジ用）
    window.dispatchEvent(new CustomEvent('pcwe-favorites-changed', { detail: { count: next.length } }));
  };

  const iconSize = size === 'lg' ? 24 : size === 'md' ? 20 : 16;
  const buttonSize = size === 'lg' ? 'h-10 w-10' : size === 'md' ? 'h-9 w-9' : 'h-7 w-7';

  const tooltipText = isFavorite ? '気になるから外す' : '気になるに追加';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={tooltipText}
      title={`${tooltipText}（気になるリスト /plan で当日の動線をまとめられます）`}
      className={`group/fav relative flex ${buttonSize} items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${
        isFavorite
          ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-primary-600'
      }`}
    >
      <Heart
        size={iconSize}
        className={`transition-transform duration-200 ${
          pulse ? 'scale-150' : 'scale-100'
        } ${isFavorite ? 'fill-primary-600' : ''}`}
        aria-hidden="true"
      />

      {/* ホバー時のラベル（PC のみ）*/}
      <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-bold text-white opacity-0 transition-opacity group-hover/fav:opacity-100 lg:block">
        {tooltipText}
      </span>
      {!mounted && <span className="sr-only">読み込み中</span>}
    </button>
  );
}
