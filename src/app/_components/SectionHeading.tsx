/**
 * セクション見出し（Podmate DNA4 流用）
 */

import type { ReactNode } from 'react';

interface Props {
  /** メイン見出し（強調キーワードは <span className="text-amber-600"> 等で）*/
  children: ReactNode;
  /** サブテキスト（任意）*/
  sub?: string;
  className?: string;
}

export function SectionHeading({ children, sub, className }: Props) {
  return (
    <div className={`text-center ${className ?? ''}`}>
      {sub !== undefined && sub !== '' && (
        <p className="text-sm font-bold text-neutral-400 sm:text-base md:text-lg">{sub}</p>
      )}
      <h2 className="mt-2 text-2xl font-extrabold leading-relaxed tracking-tight text-neutral-900 sm:text-3xl md:text-4xl lg:text-5xl">
        {children}
      </h2>
    </div>
  );
}
