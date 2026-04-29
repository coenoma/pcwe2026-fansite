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
      { threshold: 0.15, rootMargin }
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
