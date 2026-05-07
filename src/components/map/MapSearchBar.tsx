/**
 * マップ検索バー（番組 + 物販 + ブース番号 + スポンサー枠）。
 *
 * 検索対象（その日のすべての placement に対して走査、重複位置はそれぞれ別ヒット）:
 * - 番組名 / shortName 部分一致
 * - ブース番号（"14-A" or "14a" → "14-A" 自動正規化）
 * - グッズキーワード（merchandise[].name / merchandiseSpotlight / merchandiseTags ラベル）
 * - 外部参照（スポンサー / キッチンブース）も "Youtrust（スポンサー）" のように出す
 */

'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Day, MerchandiseTag, Program } from '@/lib/types';
import type { SlotPlacement } from '@/lib/booth-map';

interface SearchHit {
  type: 'program' | 'external' | 'position';
  /** ジャンプ先ブース position */
  position: string;
  programId?: string;
  label: string;
  sublabel?: string;
}

interface Props {
  programs: Program[];
  placements: SlotPlacement[];
  /** 表示中の日付（将来 day 別の挙動が必要なら使用、現状は placements に含まれているため未使用）*/
  day: Day;
  onSelectHit: (hit: SearchHit) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

export function MapSearchBar({
  programs,
  placements,
  day: _day,
  onSelectHit,
  query,
  onQueryChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const programsById = useMemo(() => {
    const m = new Map<string, Program>();
    for (const p of programs) m.set(p.id, p);
    return m;
  }, [programs]);

  const hits = useMemo(
    () => searchAll(placements, programsById, query),
    [placements, programsById, query],
  );

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
          aria-label="検索候補"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {hits.slice(0, 12).map((hit, i) => (
            <li key={`${hit.type}-${hit.position}-${i}`}>
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
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-xs font-bold text-primary-600"
                >
                  {hit.type === 'position'
                    ? '📍'
                    : hit.type === 'external'
                      ? '🤝'
                      : '🎙'}
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
          {hits.length > 12 ? (
            <li className="px-3 py-1.5 text-xs text-neutral-500">
              ＋ あと {hits.length - 12} 件（条件を絞ってね）
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

/** ブース番号正規化（"14a" / "014-A" → "14-A"、"30" → "30"）*/
function normalizePosition(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/^0*(\d+)\s*-?\s*([abcd]?)$/i);
  if (!match) return trimmed.toUpperCase();
  const tent = match[1];
  const slot = match[2]?.toUpperCase();
  return slot ? `${tent}-${slot}` : tent;
}

const TAG_LABELS: Record<MerchandiseTag, string[]> = {
  'food-drink': ['食', '飲み物', 'コーヒー', 'お茶', '飲料'],
  experience: ['体験', '占い', 'タロット', 'ガチャ', 'ワークショップ'],
  'rare-curious': ['珍しい', '占い', '肌測定', 'AI 診断', '希少'],
  'free-distribution': ['無料', '配布', 'フリー', 'ノベルティ'],
  'limited-new': ['新作', '限定', 'NEW', '初販', '記念'],
  'zine-book': ['ZINE', '本', '読み物', '冊子'],
};

function searchAll(
  placements: ReadonlyArray<SlotPlacement>,
  programsById: ReadonlyMap<string, Program>,
  rawQuery: string,
): SearchHit[] {
  const q = rawQuery.trim();
  if (q.length === 0) return [];
  const lower = q.toLowerCase();
  const normalizedPos = normalizePosition(q);
  const hits: SearchHit[] = [];

  for (const pl of placements) {
    // 1. ブース番号完全一致 → 最優先
    if (pl.position === normalizedPos) {
      const program = pl.programId ? programsById.get(pl.programId) : undefined;
      hits.push({
        type: 'position',
        position: pl.position,
        programId: pl.programId,
        label: program
          ? `ブース ${pl.position}: ${program.name}`
          : pl.externalName
            ? `ブース ${pl.position}: ${pl.externalName}（${externalLabel(pl.externalKind)}）`
            : `ブース ${pl.position}`,
        sublabel: program?.fanGuide.subCatch,
      });
      continue; // この placement は確定ヒット、別の理由でも追加しない
    }

    // 2. 番組情報マッチ
    const program = pl.programId ? programsById.get(pl.programId) : undefined;
    if (program) {
      // 番組名 / shortName 部分一致
      const nameMatch =
        program.name.toLowerCase().includes(lower) ||
        (program.shortName?.toLowerCase().includes(lower) ?? false);

      // 物販キーワード一致
      const merchMatch =
        (program.official.merchandise ?? []).some((m) =>
          m.toLowerCase().includes(lower),
        ) ||
        (program.official.merchandiseDetails ?? []).some((d) =>
          d.name.toLowerCase().includes(lower),
        ) ||
        (program.official.merchandiseSpotlight ?? '')
          .toLowerCase()
          .includes(lower);

      // タグラベル一致
      const tagMatch = (program.official.merchandiseTags ?? []).some((tag) => {
        const labels = TAG_LABELS[tag] ?? [];
        return labels.some(
          (l) =>
            l.toLowerCase().includes(lower) ||
            lower.includes(l.toLowerCase()),
        );
      });

      if (nameMatch || merchMatch || tagMatch) {
        hits.push({
          type: 'program',
          position: pl.position,
          programId: program.id,
          label: program.name,
          sublabel: `ブース ${pl.position}` +
            (program.official.merchandiseTags?.length
              ? ` · ${program.official.merchandiseTags.length} カテゴリ`
              : ''),
        });
      }
      continue;
    }

    // 3. 外部参照（スポンサー / キッチン）マッチ
    if (pl.externalName) {
      const extMatch = pl.externalName.toLowerCase().includes(lower);
      if (extMatch) {
        hits.push({
          type: 'external',
          position: pl.position,
          label: `${pl.externalName}（${externalLabel(pl.externalKind)}）`,
          sublabel: `ブース ${pl.position}`,
        });
      }
    }
  }

  return hits;
}

function externalLabel(kind: SlotPlacement['externalKind']): string {
  switch (kind) {
    case 'sponsor':
      return 'スポンサー';
    case 'kitchen-only':
      return 'キッチンブース';
    case 'external-program':
      return '外部参照';
    default:
      return '出展';
  }
}
