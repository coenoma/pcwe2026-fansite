'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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
 * v1.7 改修: 検索 UI のスリム化
 * - 検索バー + 出展日ピル + 「絞り込み」ボタン を **同じ行** にまとめ、縦に圧迫しない
 * - タグピル群は <details> で **デフォルト折り畳み**（19 個ズラリ並ぶ問題を解消）
 * - 選択中のタグは展開閉じても **チップ表示** されたまま、何で絞ってるかが常時可視
 * - リセットも 1 タップ
 *
 * - useDeferredValue で検索体感速度向上
 * - スティッキー検索バー（スクロール中も使える）
 */
export function ProgramListClient({ programs }: Props) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const [genre, setGenre] = useState<Genre | ''>('');
  const [day, setDay] = useState<Day | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPanel, setShowTagPanel] = useState(false);

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
  const tagCount = selectedTags.length;

  return (
    <div>
      {/* スティッキー検索 + フィルタ（コンパクト 1 段構成）*/}
      <div className="sticky top-[64px] z-30 -mx-4 mb-6 bg-white/95 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        {/* 検索バー + 絞り込みボタン: モバイル 2 段、PC 1 段 */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              placeholder="番組名・キーワード・タグで探す"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="番組を検索"
              className="w-full rounded-full border border-neutral-300 bg-white py-2 pl-9 pr-12 text-sm shadow-sm focus:border-primary-500 focus:outline-none sm:text-base"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-xs font-bold text-neutral-500 sm:block">
              /
            </kbd>
          </div>

          {/* 出展日ピル（短縮ラベル）+ 絞り込みボタン */}
          <div className="flex items-center gap-2">
            <DayPill active={day === ''} onClick={() => setDay('')}>
              両日
            </DayPill>
            <DayPill active={day === 'sat'} onClick={() => setDay('sat')}>
              土
            </DayPill>
            <DayPill active={day === 'sun'} onClick={() => setDay('sun')}>
              日
            </DayPill>
            <button
              type="button"
              onClick={() => setShowTagPanel((v) => !v)}
              aria-expanded={showTagPanel}
              aria-label="タグで絞り込む"
              className={
                tagCount > 0
                  ? 'inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-95 hover:bg-primary-700 sm:text-sm'
                  : 'inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 transition-all active:scale-95 hover:border-primary-400 hover:text-primary-700 sm:text-sm'
              }
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              タグ
              {tagCount > 0 && <span className="rounded-full bg-white/30 px-1.5 text-[10px]">{tagCount}</span>}
            </button>
          </div>
        </div>

        {/* 選択中タグのチップ（展開閉じても常時可視）*/}
        {tagCount > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-label={`${tag} を解除`}
                className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-800 transition-colors hover:bg-primary-200"
              >
                {tag}
                <X size={11} aria-hidden="true" />
              </button>
            ))}
            {hasFilter && (
              <button
                type="button"
                onClick={reset}
                className="ml-1 text-xs font-bold text-neutral-500 underline decoration-transparent transition-colors hover:text-primary-600 hover:decoration-primary-600"
              >
                条件をリセット
              </button>
            )}
          </div>
        )}

        {/* タグパネル（折り畳み、デフォルト閉じ） */}
        {showTagPanel && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className={
                      active
                        ? 'rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-bold text-white transition-all active:scale-95 hover:bg-primary-700'
                        : 'rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-xs font-bold text-neutral-700 transition-all active:scale-95 hover:border-primary-400 hover:text-primary-700'
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* リセットボタン（タグ未選択でも他フィルタがある場合用）*/}
        {hasFilter && tagCount === 0 && (
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs font-bold text-neutral-500 underline decoration-transparent transition-colors hover:text-primary-600 hover:decoration-primary-600"
          >
            条件をリセット
          </button>
        )}
      </div>

      {/* 結果数 */}
      <p className="mb-4 text-sm text-neutral-600">
        <span
          className={`inline-block font-bold text-neutral-900 transition-all duration-300 ${
            isStale ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {visiblePrograms.length}
        </span>{' '}
        番組{hasFilter ? '、ピックアップ中' : 'を、AI のセンスで並べてます'}
      </p>

      {/* 結果カード */}
      {visiblePrograms.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-12 text-center">
          <p className="text-base font-bold text-neutral-700">あれ、条件にハマる番組が見当たらない…</p>
          <p className="mt-2 text-sm text-neutral-500">タグや出展日をゆるめてみると、出会えるかもしれません。</p>
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
          ? 'rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-95 hover:bg-primary-700 sm:text-sm'
          : 'rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 transition-all active:scale-95 hover:border-primary-400 hover:text-primary-700 sm:text-sm'
      }
    >
      {children}
    </button>
  );
}
