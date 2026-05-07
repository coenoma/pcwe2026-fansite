/**
 * マップ ⇄ リスト ビューモード切替。
 */

import { List, Map as MapIcon } from 'lucide-react';

export type ViewMode = 'map' | 'list';

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="マップ・リスト表示切替"
      className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'map'}
        onClick={() => onChange('map')}
        title="マップ表示"
        className={
          mode === 'map'
            ? 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-white transition-colors sm:px-3'
            : 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:text-neutral-900 sm:px-3'
        }
      >
        <MapIcon size={14} aria-hidden="true" />
        <span>マップ</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'list'}
        onClick={() => onChange('list')}
        title="リスト表示"
        className={
          mode === 'list'
            ? 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-white transition-colors sm:px-3'
            : 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:text-neutral-900 sm:px-3'
        }
      >
        <List size={14} aria-hidden="true" />
        <span>リスト</span>
      </button>
    </div>
  );
}
