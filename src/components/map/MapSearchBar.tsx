/**
 * マップ検索バー。
 *
 * - 番組名（部分一致）/ ブース番号（"14-A" や "14a" 正規化）
 * - 入力中はサジェストを表示、選択でジャンプ
 * - グッズキーワード（「占い」「コーヒー」等）は merchandiseTags ラベルマッチでヒット
 */

import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Day, Program, MerchandiseTag } from '@/lib/types';
import { getPositionLabel } from '@/lib/booth-map';

interface SearchHit {
  type: 'program' | 'position';
  programId?: string;
  position?: string;
  label: string;
  sublabel?: string;
}

interface Props {
  programs: Program[];
  day: Day;
  onSelectHit: (hit: SearchHit) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

export function MapSearchBar({
  programs,
  day,
  onSelectHit,
  query,
  onQueryChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchAll(programs, day, query), [programs, day, query]);

  // 外部クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true);
          }}
          placeholder="番組名・ブース番号・キーワード"
          aria-label="番組名・ブース番号・グッズキーワード検索"
          className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {query.length > 0 ? (
          <button
            type="button"
            aria-label="検索クエリをクリア"
            onClick={() => {
              onQueryChange('');
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {open && hits.length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {hits.slice(0, 8).map((hit, i) => (
            <li key={`${hit.type}-${hit.programId ?? hit.position}-${i}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelectHit(hit);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-neutral-50"
              >
                <span className="text-xs font-bold text-primary-600 shrink-0 mt-0.5">
                  {hit.type === 'position' ? '📍' : '🎙'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-neutral-900">
                    {hit.label}
                  </span>
                  {hit.sublabel ? (
                    <span className="block truncate text-xs text-neutral-500">
                      {hit.sublabel}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
          {hits.length > 8 ? (
            <li className="px-3 py-1.5 text-xs text-neutral-500">
              ＋ あと {hits.length - 8} 件
            </li>
          ) : null}
        </ul>
      ) : null}

      {open && query.trim().length > 0 && hits.length === 0 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-xs text-neutral-500 shadow-lg">
          ヒットなし。番組名・ブース番号・グッズキーワードで再検索してみて。
        </div>
      ) : null}
    </div>
  );
}

/** ブース番号の正規化（"14a", "14A", "014-A" → "14-A"）*/
function normalizePosition(input: string): string {
  const match = input.match(/^0*(\d+)\s*-?\s*([abcd]?)$/i);
  if (!match) return input.toUpperCase();
  const tent = match[1];
  const slot = match[2]?.toUpperCase();
  return slot ? `${tent}-${slot}` : tent;
}

function searchAll(
  programs: Program[],
  day: Day,
  rawQuery: string,
): SearchHit[] {
  const q = rawQuery.trim();
  if (q.length === 0) return [];

  const lower = q.toLowerCase();
  const normalizedPos = normalizePosition(q);
  const hits: SearchHit[] = [];

  // ブース番号一致
  for (const program of programs) {
    const label = getPositionLabel(program, day);
    if (label !== undefined && label === normalizedPos) {
      hits.push({
        type: 'position',
        programId: program.id,
        position: label,
        label: `ブース ${label}: ${program.name}`,
        sublabel: program.fanGuide.subCatch,
      });
    }
  }

  // 番組名 / shortName 部分一致
  for (const program of programs) {
    if (
      program.name.toLowerCase().includes(lower) ||
      (program.shortName?.toLowerCase().includes(lower) ?? false)
    ) {
      const label = getPositionLabel(program, day);
      if (hits.some((h) => h.programId === program.id)) continue;
      hits.push({
        type: 'program',
        programId: program.id,
        position: label,
        label: program.name,
        sublabel: label ? `ブース ${label}` : '位置情報なし',
      });
    }
  }

  // グッズタグラベル / グッズ名 部分一致
  for (const program of programs) {
    if (hits.some((h) => h.programId === program.id)) continue;
    const tagLabels: Partial<Record<MerchandiseTag, string[]>> = {
      'food-drink': ['食', '飲み物', 'コーヒー', 'お茶'],
      experience: ['体験', '占い', 'タロット', 'ガチャ'],
      'rare-curious': ['珍しい', '占い', '肌測定'],
      'free-distribution': ['無料', '配布', '無料配布'],
      'limited-new': ['新作', '限定', 'NEW'],
      'zine-book': ['ZINE', '本', '読み物'],
    };
    let matched = false;
    for (const tag of program.official.merchandiseTags ?? []) {
      const labels = tagLabels[tag] ?? [];
      if (labels.some((l) => l.toLowerCase().includes(lower) || lower.includes(l.toLowerCase()))) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      // 物販個別名で部分一致
      const merchHit =
        (program.official.merchandise ?? []).some((m) =>
          m.toLowerCase().includes(lower),
        ) ||
        (program.official.merchandiseDetails ?? []).some((d) =>
          d.name.toLowerCase().includes(lower),
        );
      if (!merchHit) continue;
    }
    const label = getPositionLabel(program, day);
    hits.push({
      type: 'program',
      programId: program.id,
      position: label,
      label: program.name,
      sublabel: `グッズ: ${(program.official.merchandiseTags ?? []).join(', ')}`,
    });
  }

  return hits;
}
