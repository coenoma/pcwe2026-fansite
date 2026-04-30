'use client';

import { useState } from 'react';
import { Dices } from 'lucide-react';
import type { Program } from '@/lib/types';
import { GachaModal } from './GachaModal';

interface Props {
  programs: Program[];
}

/**
 * ランダムガチャボタン
 *
 * 心情訴求: 「決めきれない / 新しい番組と出会いたい / 気軽に触ってみたい」人向け。
 * クリックでジャンル違いの 3 番組がふわっと登場するモーダルを開く。
 * 「もう一度引く」で何度でも引き直せるので、「掘り出し物探し」感を演出。
 */
export function RandomGachaButton({ programs }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="ジャンル違いの 3 番組をランダムに表示"
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary-600 bg-white px-6 py-3 text-base font-bold text-primary-700 transition-all active:scale-95 hover:bg-primary-50 hover:shadow-md"
        >
          <Dices size={22} className="transition-transform group-hover:rotate-12" aria-hidden="true" />
          知らない番組と、運命の出会い
        </button>
        <p className="text-xs text-neutral-500">
          AI のおすすめ 3 本を、ふわっとお届け
        </p>
      </div>

      <GachaModal
        programs={programs}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
