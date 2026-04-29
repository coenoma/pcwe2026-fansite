'use client';

import { useMemo, useState } from 'react';
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
 * SSG で渡された全番組を、クライアント側で絞り込む。
 */
export function ProgramListClient({ programs }: Props) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | ''>('');
  const [day, setDay] = useState<Day | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => extractAllTags(programs), [programs]);

  const visiblePrograms = useMemo(() => {
    const filtered = filterPrograms(programs, {
      genre: genre === '' ? undefined : genre,
      day: day === '' ? undefined : day,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    return searchPrograms(filtered, query);
  }, [programs, query, genre, day, selectedTags]);

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
      {/* 検索 + フィルタ */}
      <div className="mb-8 space-y-4">
        <input
          type="search"
          placeholder="番組名・キーワード・タグで検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="番組を検索"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:outline-none"
        />

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
                  ? 'rounded-full bg-primary-600 px-3 py-1 text-sm font-bold text-white'
                  : 'rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm font-bold text-neutral-700 hover:border-primary-400'
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
            className="text-sm font-bold text-primary-600 hover:opacity-70"
          >
            条件をリセット →
          </button>
        )}
      </div>

      {/* 結果 */}
      <p className="mb-4 text-sm text-neutral-600">
        <span className="font-bold text-neutral-900">{visiblePrograms.length}</span> 番組
        {hasFilter ? '（絞り込み中）' : ''}
      </p>

      {visiblePrograms.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-600">
          条件に合う番組が見つかりませんでした。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePrograms.map((p) => (
            <ProgramCard key={p.id} program={p} />
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
          ? 'rounded-full bg-primary-600 px-4 py-1.5 text-sm font-bold text-white'
          : 'rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-neutral-700 hover:border-primary-400'
      }
    >
      {children}
    </button>
  );
}
