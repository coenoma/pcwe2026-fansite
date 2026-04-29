'use client';

import { useEffect, useState } from 'react';
import { loadFavorites } from '@/lib/favorites';

/**
 * 「気になる N 件」バッジ
 *
 * - 初期マウント時に localStorage から件数取得
 * - FavoriteButton から発火される CustomEvent を購読して更新
 */
export function FavoriteCountBadge() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(loadFavorites().length);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      if (typeof detail?.count === 'number') {
        setCount(detail.count);
      }
    };
    window.addEventListener('pcwe-favorites-changed', handler);
    return () => {
      window.removeEventListener('pcwe-favorites-changed', handler);
    };
  }, []);

  if (!mounted || count === 0) return null;

  return (
    <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
