'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { loadFavorites, saveFavorites, toggleFavorite } from '@/lib/favorites';

interface Props {
  programId: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 「気になる」トグルボタン（Client Component）
 *
 * localStorage に保存。SSR 中は常に未お気に入り状態でレンダリングされる。
 */
export function FavoriteButton({ programId, size = 'sm' }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsFavorite(loadFavorites().includes(programId));
  }, [programId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(loadFavorites(), programId);
    saveFavorites(next);
    setIsFavorite(next.includes(programId));
  };

  const iconSize = size === 'lg' ? 24 : size === 'md' ? 20 : 16;
  const buttonSize = size === 'lg' ? 'h-10 w-10' : size === 'md' ? 'h-9 w-9' : 'h-7 w-7';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? '気になるから外す' : '気になるに追加'}
      className={`flex ${buttonSize} items-center justify-center rounded-full transition ${
        isFavorite
          ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
      }`}
    >
      <Heart
        size={iconSize}
        className={isFavorite ? 'fill-primary-600' : ''}
        aria-hidden="true"
      />
      {!mounted && <span className="sr-only">読み込み中</span>}
    </button>
  );
}
