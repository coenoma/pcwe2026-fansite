'use client';

import { useState } from 'react';
import { Dices, Sparkles, Compass, ArrowRight } from 'lucide-react';
import type { Program } from '@/lib/types';
import { GachaModal } from './GachaModal';
import { QuizModal } from './QuizModal';

interface Props {
  programs: Program[];
}

/**
 * 「3 つの探し方」ハブセクション（v1.7+）
 *
 * Hero 直下に配置し、AI レコメンドの 3 機能を **横並びカード** で提示する。
 * - 🎲 知らない番組と運命の出会い（ガチャ）→ モーダル起動
 * - ✨ 30 秒で AI の番組診断（クイズ）→ モーダル起動
 * - 🎯 好きを起点に、波紋を広げる（番組ベースレコメンド）→ FROM A PROGRAM セクションへスクロール
 *
 * 各カードは同じレイアウト・サイズで「3 つの探し方」が一目で並んで見えることを
 * 優先する。それぞれの体験はクリック後に展開（モーダル or スクロール）。
 */
export function DiscoverHub({ programs }: Props) {
  const [gachaOpen, setGachaOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const scrollToRecommend = () => {
    const el = document.getElementById('from-a-program');
    if (el !== null) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <li>
          <DiscoverCard
            icon={<Dices size={28} aria-hidden="true" />}
            badge="ガチャ"
            title="知らない番組と、運命の出会い"
            description="AI のおすすめ 3 本を、ふわっと引く。何も決めずに、ただ巡り会いたい時に。"
            cta="引いてみる"
            accent="#DC725A"
            onClick={() => setGachaOpen(true)}
          />
        </li>
        <li>
          <DiscoverCard
            icon={<Sparkles size={28} aria-hidden="true" />}
            badge="診断"
            title="30 秒の質問で、刺さる 3 本がわかる"
            description="気分・シーン・話し方を 5 問選ぶだけ。マッチ率と理由つきで、AI があなたに 3 本おすすめ。"
            cta="答えてみる"
            accent="#3B82F6"
            onClick={() => setQuizOpen(true)}
          />
        </li>
        <li>
          <DiscoverCard
            icon={<Compass size={28} aria-hidden="true" />}
            badge="番組から探す"
            title="好きな番組から、次に聴く 1 本"
            description="番組名を入れるだけ。「似てる／広げる／意外」の 3 つの切り口で、次に刺さりそうな番組を提案。"
            cta="番組を選ぶ"
            accent="#8B5CF6"
            onClick={scrollToRecommend}
          />
        </li>
      </ul>

      {/* ガチャ・診断モーダル（ハブから直接起動）*/}
      <GachaModal
        programs={programs}
        isOpen={gachaOpen}
        onClose={() => setGachaOpen(false)}
      />
      <QuizModal
        programs={programs}
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
      />
    </>
  );
}

/** 1 枚の探し方カード（共通レイアウト）*/
function DiscoverCard({
  icon,
  badge,
  title,
  description,
  cta,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  cta: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.99] sm:p-6"
      style={{ borderColor: `${accent}40` }}
    >
      {/* 背景の柔らかいハイライト（accent 色のグラデ）*/}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-20 transition-opacity group-hover:opacity-40"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${accent}55 0%, transparent 70%)`,
        }}
      />

      <span
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
        style={{ backgroundColor: `${accent}1f`, color: accent }}
      >
        {icon}
      </span>

      <p
        className="relative text-xs font-bold tracking-tight"
        style={{ color: accent }}
      >
        {badge}
      </p>

      <h3 className="relative text-base font-extrabold leading-snug text-neutral-900 sm:text-lg">
        {title}
      </h3>

      <p className="relative text-xs leading-relaxed text-neutral-600 sm:text-sm">
        {description}
      </p>

      <span
        className="relative mt-auto inline-flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-0.5"
        style={{ color: accent }}
      >
        {cta}
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </button>
  );
}
