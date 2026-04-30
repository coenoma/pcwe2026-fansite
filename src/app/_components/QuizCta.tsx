'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Program } from '@/lib/types';
import { QuizModal } from './QuizModal';

interface Props {
  programs: Program[];
}

/**
 * 番組診断の入口ボタン（Hero CTA）
 *
 * クリックで 5 問のクイズモーダルを開く。診断結果は上位 3 番組。
 * 心情訴求: 「全部は見きれない、でも自分にハマるのは見つけたい」を最短で。
 */
export function QuizCta({ programs }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="30 秒の診断で、自分に刺さりそうな番組を見つける"
          className="group inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-base font-bold text-white shadow-lg transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-xl"
        >
          <Sparkles
            size={22}
            className="transition-transform group-hover:rotate-12"
            aria-hidden="true"
          />
          30 秒で、AI の番組診断
        </button>
        <p className="text-xs text-neutral-500">
          5 問でわかる、あなたに刺さる 3 本。マッチ率と理由つきで提案します
        </p>
      </div>

      <QuizModal
        programs={programs}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
