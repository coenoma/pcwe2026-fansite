/**
 * 土日切替トグル。マップとリスト両方で使う共通 UI。
 *
 * - 土曜（5/9）/ 日曜（5/10）の 2 タブ
 * - 選択中はプライマリ色で塗り、非選択は枠のみ
 * - キーボード操作（左右矢印）にも対応
 */

import type { Day } from '@/lib/types';

interface Props {
  selectedDay: Day;
  onChange: (day: Day) => void;
}

export function DayToggle({ selectedDay, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="出展日の切替"
      className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedDay === 'sat'}
        onClick={() => onChange('sat')}
        className={
          selectedDay === 'sat'
            ? 'shrink-0 whitespace-nowrap rounded-full bg-primary-500 px-3 py-1.5 text-xs font-bold text-white transition-colors sm:px-4 sm:text-sm'
            : 'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:text-neutral-900 sm:px-4 sm:text-sm'
        }
      >
        5/9 土
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={selectedDay === 'sun'}
        onClick={() => onChange('sun')}
        className={
          selectedDay === 'sun'
            ? 'shrink-0 whitespace-nowrap rounded-full bg-primary-500 px-3 py-1.5 text-xs font-bold text-white transition-colors sm:px-4 sm:text-sm'
            : 'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:text-neutral-900 sm:px-4 sm:text-sm'
        }
      >
        5/10 日
      </button>
    </div>
  );
}
