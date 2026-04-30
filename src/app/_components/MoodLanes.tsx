import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Mood } from '@/lib/types';

interface Props {
  moods: Mood[];
  /** 各 mood にマッチする番組数 */
  countsBySlug: Record<string, number>;
}

/**
 * 気分・シーン入口セクション
 *
 * 「いまの自分は？」を選んでフィルタ済み一覧へ最短遷移させる入口。
 * 既存タグを matchTags にマッピングしている（裏でタグ OR フィルタ）。
 */
export function MoodLanes({ moods, countsBySlug }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {moods.map((mood) => {
        const count = countsBySlug[mood.slug] ?? 0;
        return (
          <li key={mood.slug}>
            <Link
              href={`/mood/${mood.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:p-5"
              style={{ borderColor: `${mood.themeColor}40` }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-30 transition-opacity group-hover:opacity-50"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${mood.themeColor}55 0%, transparent 70%)`,
                }}
              />
              <span
                aria-hidden="true"
                className="relative text-3xl sm:text-4xl"
              >
                {mood.emoji}
              </span>
              <p
                className="relative mt-3 text-sm font-extrabold leading-snug text-neutral-900 sm:text-base"
              >
                {mood.label}
              </p>
              <p className="relative mt-auto flex flex-col gap-1 pt-2 text-[10px] font-bold text-neutral-500 sm:text-xs">
                <span
                  className="inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: `${mood.themeColor}1a`,
                    color: mood.themeColor,
                  }}
                >
                  {count} 番組から絞り込む
                  <ArrowRight size={10} aria-hidden="true" />
                </span>
                <span className="text-[10px] text-neutral-400 sm:text-[11px]">
                  検索 / タグ / 出展日でさらに
                </span>
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
