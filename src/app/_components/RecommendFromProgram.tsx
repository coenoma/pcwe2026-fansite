'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Compass, X } from 'lucide-react';
import type { Program } from '@/lib/types';
import { recommendFromProgram, searchProgramNames } from '@/lib/recommend';
import { dayLabel } from '@/lib/format';
import { vibeStyle } from '@/lib/vibe-style';

interface Props {
  programs: Program[];
}

/**
 * 番組ベースレコメンド（v1.7 新機能）
 *
 * - 番組名のインクリメンタル検索 → 1 番組を選択
 * - 起点番組から 3 軸でレコメンド表示:
 *     🎯 ど真ん中で似てる
 *     🌐 ジャンル広げるなら
 *     💫 意外な共通点
 *
 * UI は 1 つの「探す → 結果」フローでまとめ、ガチャ / 診断と差別化。
 */
export function RecommendFromProgram({ programs }: Props) {
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<Program | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 部分一致 candidate 一覧
  const suggestions = useMemo(
    () => searchProgramNames(query, programs, 8),
    [query, programs],
  );

  // レコメンド結果
  const buckets = useMemo(
    () => (origin === null ? null : recommendFromProgram(origin, programs, 3)),
    [origin, programs],
  );

  // 外側クリックで suggestions を閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current !== null &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (program: Program) => {
    setOrigin(program);
    setQuery(program.shortName ?? program.name);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setOrigin(null);
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef}>
      {/*
        番組名 combobox
        WAI-ARIA Combobox pattern 準拠:
        - input に role="combobox" / aria-expanded / aria-controls / aria-autocomplete="list"
        - 候補 ul に id（aria-controls 参照用）/ role="listbox"
        - 候補 li に role="option" を付与
        キーボード: Esc でサジェスト閉じる（active descendant のキーボードナビは v1.7 では未対応）
      */}
      <div className="relative mx-auto max-w-xl">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={showSuggestions && (suggestions.length > 0 || query.trim() !== '')}
          aria-controls="recommend-suggestions"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            // 選択済みの origin と入力が一致しなくなったら、選択を解除
            if (origin !== null && e.target.value !== (origin.shortName ?? origin.name)) {
              setOrigin(null);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          placeholder="好きな番組名を入力（部分一致でもOK）"
          aria-label="番組名で検索してレコメンド起点にする"
          className="w-full rounded-full border-2 border-neutral-200 bg-white py-3 pl-11 pr-12 text-base shadow-sm focus:border-primary-500 focus:outline-none"
        />
        {query !== '' && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="クリア"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={16} />
          </button>
        )}

        {/* 候補リスト */}
        {showSuggestions && suggestions.length > 0 && (
          <ul
            id="recommend-suggestions"
            role="listbox"
            aria-label="番組名の候補"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-xl"
          >
            {suggestions.map((p) => {
              const vibe = vibeStyle(p.fanGuide.vibe);
              const themeColor = p.fanGuide.themeColor ?? vibe.defaultThemeColor;
              return (
                <li key={p.id} role="option" aria-selected={origin?.id === p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-primary-50"
                  >
                    <span
                      aria-hidden="true"
                      className="relative h-10 w-10 flex-none overflow-hidden rounded-md bg-neutral-100"
                    >
                      <Image
                        src={p.thumbnail}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-neutral-900">
                        {p.shortName ?? p.name}
                      </span>
                      <span className="block truncate text-[11px] text-neutral-500">
                        <span style={{ color: themeColor }}>●</span> {p.fanGuide.genre} ／ {dayLabel(p.exhibition.days)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* 候補なし */}
        {showSuggestions && query.trim() !== '' && suggestions.length === 0 && (
          <p className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-xl">
            その名前で見つかりませんでした。番組名の一部だけでも試してみてください。
          </p>
        )}
      </div>

      {/* レコメンド結果 */}
      {buckets !== null && (
        <div className="mt-10 space-y-8">
          <BucketLane
            title="🎯 ど真ん中で似てる"
            subtitle="同じ vibe / 同じジャンル。ハマる確率がいちばん高いやつ。"
            programs={buckets.sameVibeAndGenre}
            accent="#DC725A"
          />
          <BucketLane
            title="🌐 ジャンル、広げるなら"
            subtitle="同じ vibe で、別ジャンル。「次はこっち」の入口。"
            programs={buckets.sameVibeOtherGenre}
            accent="#3B82F6"
          />
          <BucketLane
            title="💫 意外な共通点"
            subtitle="ジャンルも雰囲気も違うのに、タグの隅で繋がってる番組。"
            programs={buckets.serendipity}
            accent="#8B5CF6"
          />
        </div>
      )}

      {/* 何も入力していない時のヒント */}
      {origin === null && query.trim() === '' && (
        <div className="mt-8 flex flex-col items-center gap-2 text-center text-sm text-neutral-500">
          <Compass size={28} aria-hidden="true" className="text-primary-400" />
          <p>あなたが好きな番組を、起点に。</p>
          <p className="text-xs text-neutral-400">
            似てる番組・広げる番組・意外な共通点で、PCWE のなかを旅します
          </p>
        </div>
      )}
    </div>
  );
}

/** 1 つの軸の番組カード列 */
function BucketLane({
  title,
  subtitle,
  programs,
  accent,
}: {
  title: string;
  subtitle: string;
  programs: Program[];
  accent: string;
}) {
  return (
    <section>
      <header className="mb-3">
        <h3 className="text-base font-extrabold text-neutral-900 sm:text-lg">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-neutral-600 sm:text-sm">{subtitle}</p>
      </header>
      {programs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-center text-xs text-neutral-500">
          この軸でハマる番組は見つかりませんでした。別の起点を試してみてください。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {programs.map((p) => (
            <li key={p.id}>
              <RecommendCard program={p} accent={accent} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecommendCard({ program, accent }: { program: Program; accent: string }) {
  const vibe = vibeStyle(program.fanGuide.vibe);
  const themeColor = program.fanGuide.themeColor ?? vibe.defaultThemeColor;

  return (
    <Link
      href={`/booth/${program.id}`}
      className="group flex h-full gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg active:scale-[0.99]"
      style={{ boxShadow: `inset 4px 0 0 ${accent}40` }}
    >
      <span className="relative h-16 w-16 flex-none overflow-hidden rounded-md bg-neutral-100 sm:h-20 sm:w-20">
        <Image
          src={program.thumbnail}
          alt={`${program.name} のロゴ`}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap gap-1 text-[10px]">
          <span
            className="rounded-full px-1.5 py-0.5 font-bold"
            style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}
          >
            {program.fanGuide.genre}
          </span>
        </div>
        <h4 className="line-clamp-1 text-sm font-extrabold text-neutral-900 group-hover:text-primary-700">
          {program.shortName ?? program.name}
        </h4>
        <p className="line-clamp-2 text-xs leading-relaxed text-neutral-700">
          {program.fanGuide.catchphrase}
        </p>
      </div>
    </Link>
  );
}
