'use client';

import { useEffect, useState } from 'react';
import { EVENT } from '@/lib/constants';

/**
 * イベント開幕までのカウントダウン
 *
 * - 5/9 朝 10:30 までは「あと N 日 H 時間」
 * - 5/9 当日（10:30 以降）は「今日が初日です 🎙️」
 * - 5/10 は「最終日です」
 * - 5/11 以降は「ありがとうございました」
 */
export function CountdownBadge() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setLabel(buildLabel());
    };
    update();
    const interval = window.setInterval(update, 60_000); // 1 分ごと更新
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (label === null) {
    return (
      <p className="mt-6 text-sm text-neutral-500">{EVENT.startDate.replace(/-/g, '/')} 開幕</p>
    );
  }

  return (
    <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-900">
      <span aria-hidden="true">⏳</span>
      {label}
    </p>
  );
}

function buildLabel(): string {
  const now = new Date();
  const start = new Date(`${EVENT.startDate}T10:30:00+09:00`);
  const endLast = new Date(`${EVENT.endDate}T19:00:00+09:00`);

  if (now < start) {
    const diffMs = start.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days >= 1) return `開幕まで、あと ${days} 日 ${hours} 時間`;
    return `開幕まで、あと ${hours} 時間`;
  }

  // 開幕後
  const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (today === EVENT.startDate) return '今日が初日です 🎙️';
  if (today === EVENT.endDate) return '最終日です';
  if (now > endLast) return 'ありがとうございました';
  return '開催中です 🎙️';
}
