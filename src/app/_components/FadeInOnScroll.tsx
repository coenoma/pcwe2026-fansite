'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * スクロールフェードアップ（Podmate DNA5 流用）
 *
 * IntersectionObserver で 1 回のみフェードイン。
 * prefers-reduced-motion 時は即時表示（globals.css 側で transition 0 化）。
 */

interface Props {
  children: ReactNode;
  /** ルートマージン（デフォルト '-10%'）*/
  rootMargin?: string;
  className?: string;
}

export function FadeInOnScroll({ children, rootMargin = '-10%', className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (node === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      // threshold は 0 にして「target が 1px でも viewport に入ったら発火」とする。
      // 旧設定の 0.15 だと、X 埋め込み等で section 高さが 3000px+ に膨らむケースで
      // 「section の 15% が常に画面外」となり永久に fade-in しない不具合が出た。
      // rootMargin で viewport の有効範囲を絞っているので、これで十分に
      // 「中央寄りで自然に fade-in」する体験を保てる。
      { threshold: 0, rootMargin }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className ?? ''}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}
