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
 * クリックで全番組から 1 つランダム選択 → 詳細ページへ遷移。
 * クリック時にアイコンが 1 回スピン演出。
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
    <button
      type="button"
      onClick={handleClick}
      aria-label="ランダムに 1 番組を表示"
      className="inline-flex items-center gap-2 rounded-full border-2 border-primary-600 bg-white px-5 py-2.5 text-sm font-bold text-primary-700 transition-all active:scale-95 hover:bg-primary-50 hover:shadow-md"
    >
      <Dices
        size={20}
        className={`transition-transform duration-300 ${spinning ? 'rotate-180' : 'rotate-0'}`}
        aria-hidden="true"
      />
      ランダムに 1 番組
    </button>
  );
}
