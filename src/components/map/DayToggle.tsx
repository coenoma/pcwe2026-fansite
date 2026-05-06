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
  /** 土・日それぞれの該当ブース数を表示（任意）*/
  counts?: { sat: number; sun: number };
}

export function DayToggle({ selectedDay, onChange, counts }: Props) {
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
            ? 'rounded-full bg-primary-500 px-4 py-1.5 text-sm font-bold text-white transition-colors'
            : 'rounded-full px-4 py-1.5 text-sm font-bold text-neutral-600 transition-colors hover:text-neutral-900'
        }
      >
        5/9 土{counts ? `（${counts.sat}）` : ''}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={selectedDay === 'sun'}
        onClick={() => onChange('sun')}
        className={
          selectedDay === 'sun'
            ? 'rounded-full bg-primary-500 px-4 py-1.5 text-sm font-bold text-white transition-colors'
            : 'rounded-full px-4 py-1.5 text-sm font-bold text-neutral-600 transition-colors hover:text-neutral-900'
        }
      >
        5/10 日{counts ? `（${counts.sun}）` : ''}
      </button>
    </div>
  );
}
