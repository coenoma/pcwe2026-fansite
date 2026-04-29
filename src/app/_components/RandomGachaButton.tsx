'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dices } from 'lucide-react';

interface Props {
  programIds: string[];
}

/**
 * ランダムガチャボタン
 *
 * 心情訴求: 「決めきれない」「新しい出会いがほしい」「気軽に触ってみたい」人向け。
 * クリックで全番組から 1 つランダム選択 → 詳細ページへ。
 */
export function RandomGachaButton({ programIds }: Props) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    if (programIds.length === 0) return;
    setSpinning(true);
    const idx = Math.floor(Math.random() * programIds.length);
    const target = programIds[idx];
    window.setTimeout(() => {
      setSpinning(false);
      router.push(`/booth/${target}`);
    }, 350);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        aria-label="ランダムに 1 番組の詳細ページへ移動"
        className="inline-flex items-center gap-2 rounded-full border-2 border-primary-600 bg-white px-6 py-3 text-base font-bold text-primary-700 transition-all active:scale-95 hover:bg-primary-50 hover:shadow-md"
      >
        <Dices
          size={22}
          className={`transition-transform duration-300 ${spinning ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
        />
        知らない番組と、運命の出会い
      </button>
      <p className="text-xs text-neutral-500">
        決めきれないとき / 新しい番組と出会いたいとき
      </p>
    </div>
  );
}
