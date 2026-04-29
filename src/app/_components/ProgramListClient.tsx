'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Program, Genre, Day } from '@/lib/types';
import { searchPrograms } from '@/lib/search';
import { filterPrograms, extractAllTags } from '@/lib/filter';
import { ProgramCard } from './ProgramCard';

interface Props {
  programs: Program[];
}

/**
 * 番組一覧 + 検索 + フィルタ（Client Component）
 *
 * - useDeferredValue で検索体感速度向上（タイプ中の input は即座に反映、検索処理は次フレーム）
 * - 数値の "N 番組" にトランジション
 * - スティッキー検索バー（スクロール中も使える）
 */
export function ProgramListClient({ programs }: Props) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const [genre, setGenre] = useState<Genre | ''>('');
  const [day, setDay] = useState<Day | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => extractAllTags(programs), [programs]);

  const inputRef = useRef<HTMLInputElement>(null);

  // キーボードショートカット: '/' で検索にフォーカス、Esc でクリア
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputting =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true;

      if (e.key === '/' && !isInputting) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const visiblePrograms = useMemo(() => {
    const filtered = filterPrograms(programs, {
      genre: genre === '' ? undefined : genre,
      day: day === '' ? undefined : day,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    return searchPrograms(filtered, deferredQuery);
  }, [programs, deferredQuery, genre, day, selectedTags]);

  const isStale = query !== deferredQuery;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const reset = () => {
    setQuery('');
    setGenre('');
    setDay('');
    setSelectedTags([]);
  };

  const hasFilter =
    query !== '' || genre !== '' || day !== '' || selectedTags.length > 0;

  return (
    <div>
      {/* スティッキー検索 + フィルタ */}
      <div className="sticky top-[64px] z-30 -mx-4 mb-8 space-y-3 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            placeholder="「これ刺さる」を探す（番組名・キーワード・タグ）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="番組を検索"
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 pr-12 text-base shadow-sm focus:border-primary-500 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-xs font-bold text-neutral-500 sm:block">
            /
          </kbd>
        </div>

        <div className="flex flex-wrap gap-2">
          <DayPill active={day === ''} onClick={() => setDay('')}>
            両日
          </DayPill>
          <DayPill active={day === 'sat'} onClick={() => setDay('sat')}>
            5/9（土）
          </DayPill>
          <DayPill active={day === 'sun'} onClick={() => setDay('sun')}>
            5/10（日）
          </DayPill>
        </div>

        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={selectedTags.includes(tag)}
              className={
                selectedTags.includes(tag)
                  ? 'rounded-full bg-primary-600 px-3 py-1 text-sm font-bold text-white transition-all active:scale-95 hover:bg-primary-700'
                  : 'rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm font-bold text-neutral-700 transition-all active:scale-95 hover:border-primary-400 hover:text-primary-700'
              }
            >
              {tag}
            </button>
          ))}
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600 active:opacity-70"
          >
            条件をリセット →
          </button>
        )}
      </div>

      {/* 結果数 */}
      <p className="mb-6 text-sm text-neutral-600">
        <span
          className={`inline-block font-bold text-neutral-900 transition-all duration-300 ${
            isStale ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {visiblePrograms.length}
        </span>{' '}
        番組
        {hasFilter ? '（絞り込み中）' : ''}
      </p>

      {/* 結果カード */}
      {visiblePrograms.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-12 text-center">
          <p className="text-base font-bold text-neutral-700">条件に合う番組が見つかりませんでした。</p>
          <p className="mt-2 text-sm text-neutral-500">タグや出展日を見直してみてください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiblePrograms.map((p) => (
            <ProgramCard key={p.id} program={p} highlightQuery={deferredQuery} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full bg-primary-600 px-4 py-1.5 text-sm font-bold text-white transition-all active:scale-95 hover:bg-primary-700'
          : 'rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-neutral-700 transition-all active:scale-95 hover:border-primary-400 hover:text-primary-700'
      }
    >
      {children}
    </button>
  );
}
