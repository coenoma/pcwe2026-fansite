'use client';

import { useState } from 'react';
import { Dices, Sparkles, Compass, MessageSquare, ArrowRight } from 'lucide-react';
import type { Program } from '@/lib/types';
import { GachaModal } from './GachaModal';
import { QuizModal } from './QuizModal';
import { AIChatPromptModal } from './AIChatPromptModal';

interface Props {
  programs: Program[];
}

/**
 * 番組探索の 4 機能ハブセクション。
 *
 * Hero 直下に配置し、AI レコメンドの 4 機能を **横並びカード** で提示する。
 * - ガチャ → モーダル起動（GachaModal）
 * - 診断   → モーダル起動（QuizModal）
 * - 番組から探す → FROM A PROGRAM セクションへスクロール
 * - お手元の AI に聞く → モーダル起動（AIChatPromptModal）
 *   ChatGPT / Claude / Perplexity 等にコピペ用の完成プロンプトを渡す。
 *   サイトの /llms.txt /llms-full.txt を AI に取得させる構造で、
 *   外部 AI クライアントから本サイトのデータをもとにレコメンドさせる。
 *
 * 各カードは同じレイアウト・サイズで「探し方」が一目で並んで見えることを
 * 優先する。それぞれの体験はクリック後に展開（モーダル or スクロール）。
 */
export function DiscoverHub({ programs }: Props) {
  const [gachaOpen, setGachaOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);

  const scrollToRecommend = () => {
    const el = document.getElementById('from-a-program');
    if (el !== null) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
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
        <li>
          <DiscoverCard
            icon={<MessageSquare size={28} aria-hidden="true" />}
            badge="AI に相談"
            title="お手元の AI に聞いてみる"
            description="ChatGPT / Claude / Gemini に貼り付けるだけ。本サイトの 145 番組データをもとに、希望に合う 3 本を選んでもらえます。"
            cta="プロンプトを使う"
            accent="#10B981"
            onClick={() => setAiPromptOpen(true)}
          />
        </li>
      </ul>

      {/* 各機能のモーダル（ハブから直接起動）*/}
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
      <AIChatPromptModal
        isOpen={aiPromptOpen}
        onClose={() => setAiPromptOpen(false)}
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
