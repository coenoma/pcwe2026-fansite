/**
 * 蛍光ペン風ハイライト下線（Podmate DNA3 流用）
 *
 * 1 ページ 3 箇所以内で使う（ガイドライン）。
 */

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 下線の色（Tailwind カラー）*/
  color?: 'amber' | 'primary' | 'sky' | 'emerald';
}

const COLOR_MAP: Record<NonNullable<Props['color']>, string> = {
  amber: 'bg-amber-200/70',
  primary: 'bg-primary-200/60',
  sky: 'bg-sky-200/60',
  emerald: 'bg-emerald-200/60',
};

export function Highlight({ children, color = 'amber' }: Props) {
  return (
    <span className="relative inline">
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 -z-0 h-[0.4em] ${COLOR_MAP[color]}`}
      />
    </span>
  );
}
