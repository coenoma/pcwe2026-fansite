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
      // threshold は 0、発火タイミングは rootMargin（デフォルト '-10%'）で調整する。
      // 旧設定の threshold:0.15 だと、X 埋め込み等で section 高さが 3000px+ に
      // 膨らむケースで「section の 15% が常に画面外」となり永久に fade-in しない
      // 不具合があった。target に依存しない rootMargin（viewport ベース）で
      // 制御する方が、巨大セクションでも安定する。
      // - rootMargin '-10%': viewport の上下左右 10% を除外した内側で発火
      // - threshold 0: 「target が 1px でも上記の縮小 viewport に入ったら発火」
      // 結果、画面端ぎりぎりで section が顔を出した瞬間ではなく、画面の中央付近
      // まで進入したタイミングで自然に fade-in する。
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
