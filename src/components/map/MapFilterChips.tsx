/**
 * グッズカテゴリフィルタチップ（散策型 6 カテゴリ）。
 *
 * - 複数選択 OR 結合
 * - 全部解除で「全部」に戻る
 * - URL 同期は親側（MapClient）で
 */

import type { MerchandiseTag } from '@/lib/types';

const CATEGORIES: ReadonlyArray<{
  tag: MerchandiseTag;
  label: string;
  emoji: string;
}> = [
  { tag: 'food-drink', label: '食・飲み物', emoji: '🍴' },
  { tag: 'experience', label: '体験', emoji: '🎟' },
  { tag: 'rare-curious', label: '珍しい', emoji: '🔮' },
  { tag: 'free-distribution', label: '無料配布', emoji: '🎁' },
  { tag: 'limited-new', label: '新作・限定', emoji: '✨' },
  { tag: 'zine-book', label: 'ZINE・読み物', emoji: '📕' },
];

interface Props {
  selected: ReadonlySet<MerchandiseTag>;
  onToggle: (tag: MerchandiseTag) => void;
  onClear: () => void;
  /** 各カテゴリのヒット数（任意）*/
  counts?: Partial<Record<MerchandiseTag, number>>;
}

export function MapFilterChips({ selected, onToggle, onClear, counts }: Props) {
  return (
    <div
      role="group"
      aria-label="グッズカテゴリフィルタ"
      className="flex flex-wrap gap-1.5"
    >
      <button
        type="button"
        aria-pressed={selected.size === 0}
        onClick={onClear}
        className={
          selected.size === 0
            ? 'inline-flex items-center rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white transition-colors'
            : 'inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:border-neutral-400'
        }
      >
        全部
      </button>
      {CATEGORIES.map(({ tag, label, emoji }) => {
        const isSelected = selected.has(tag);
        const count = counts?.[tag];
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(tag)}
            className={
              isSelected
                ? 'inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1.5 text-xs font-bold text-white transition-colors'
                : 'inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:border-primary-300 hover:text-primary-700'
            }
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{label}</span>
            {count !== undefined && count > 0 ? (
              <span
                className={
                  isSelected
                    ? 'ml-1 rounded-full bg-white/30 px-1.5 text-[10px]'
                    : 'ml-1 rounded-full bg-neutral-100 px-1.5 text-[10px] text-neutral-500'
                }
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
