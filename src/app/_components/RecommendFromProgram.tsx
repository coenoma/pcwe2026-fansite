'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Compass, X, Sparkles, ArrowDown, Check } from 'lucide-react';
import type { Program } from '@/lib/types';
import { vibeStyle } from '@/lib/vibe-style';
import {
  recommendFromProgram,
  searchProgramNames,
  type RecommendItem,
} from '@/lib/recommend';
import { dayLabel } from '@/lib/format';

interface Props {
  programs: Program[];
}

/** vibe → 日本語ラベル（バッジ表示用、自然な日本語に）*/
const VIBE_JP_LABEL: Record<string, string> = {
  earnest: '誠実な対話',
  contemplative: '内省・静けさ',
  energetic: '熱量・テンポ',
  conversational: '共感・掛け合い',
  intellectual: '知的・解像度',
  humorous: '軽妙・遊び',
  'laid-back': 'ゆるさ・くつろぎ',
};

/**
 * 番組ベースレコメンド（v1.7 演出強化 + マッチ点可視化版）
 *
 * フロー:
 *   1. 番組名のインクリメンタル検索 → 1 番組を選択
 *   2. **結果ブロックに自動スクロール**（誘導の明示）
 *   3. 起点番組カードがふわっと現れる、サムネ周りに波紋
 *   4. 「波紋を広げています…」のロード演出（450ms）
 *   5. 3 軸のレコメンドが順番に湧き出る（stagger）
 *   6. **各カードに「✓ 何が一致しているか」を可視化**
 *      - vibe / ジャンル / 共通タグをバッジ表示で「なぜおすすめか」を伝える
 */
export function RecommendFromProgram({ programs }: Props) {
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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

  // 起点が変わったら、波紋演出のためにロード状態を 450ms キープ + 結果ブロックへスクロール
  useEffect(() => {
    if (origin === null) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    // スクロール: 結果ブロックの先頭へ（少し上に余白を残すため block: 'start'）
    const scrollTimer = setTimeout(() => {
      if (resultRef.current !== null) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);

    const loadingTimer = setTimeout(() => setIsLoading(false), 450);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(loadingTimer);
    };
  }, [origin]);

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
      {/* 番組名 combobox（WAI-ARIA Combobox pattern 準拠）*/}
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
            if (origin !== null && e.target.value !== (origin.shortName ?? origin.name)) {
              setOrigin(null);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowSuggestions(false);
          }}
          placeholder="好きな番組名を入力（部分一致でもOK）"
          aria-label="番組名で検索してレコメンド起点にする"
          className="w-full rounded-full border-2 border-neutral-200 bg-white py-3 pl-11 pr-12 text-base shadow-sm transition-all focus:border-primary-500 focus:shadow-md focus:outline-none"
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

      {/* 起点番組が選ばれたら、起点カード + 波紋ロード or 結果バケットを表示 */}
      {origin !== null && (
        <div ref={resultRef} className="mt-10 scroll-mt-20">
          <OriginShowcase origin={origin} loading={isLoading} />

          {isLoading ? (
            <LoadingBuckets />
          ) : (
            buckets !== null && (
              <div className="mt-10 space-y-10">
                <BucketLane
                  badge="🎯 ど真ん中で似てる"
                  subtitle="温度感もテーマも、起点と地続き。たぶん、そのまま好きが続きます。"
                  expectation="→ あれが好きなら、これも絶対好き。"
                  origin={origin}
                  items={buckets.sameVibeAndGenre}
                  accent="#DC725A"
                  delayMs={0}
                />
                <BucketLane
                  badge="🌐 ジャンルを広げるなら"
                  subtitle="同じ温度感のまま、ちがうテーマへ。次の入口になりそう。"
                  expectation="→ 雰囲気そのままで、世界が一つ広がる。"
                  origin={origin}
                  items={buckets.sameVibeOtherGenre}
                  accent="#3B82F6"
                  delayMs={200}
                />
                <BucketLane
                  badge="💫 意外な共通点"
                  subtitle="ジャンルも温度感も別物。でも、タグの隅でたしかに繋がってる。"
                  expectation="→ こっちも聴いてみる、ありかも。"
                  origin={origin}
                  items={buckets.serendipity}
                  accent="#8B5CF6"
                  delayMs={400}
                />
              </div>
            )
          )}
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

/** 起点番組のショーケース表示（波紋アニメ + 結果への誘導矢印付き）*/
function OriginShowcase({ origin, loading }: { origin: Program; loading: boolean }) {
  const vibe = vibeStyle(origin.fanGuide.vibe);
  const themeColor = origin.fanGuide.themeColor ?? vibe.defaultThemeColor;

  return (
    <div className="flex flex-col items-center text-center" key={origin.id}>
      <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
        <Sparkles size={12} aria-hidden="true" style={{ color: themeColor }} />
        起点に選んだのは
      </p>

      {/* 起点番組サムネ + 波紋（loading 中は無限ループ）*/}
      <div className="relative">
        {loading && (
          <>
            <span
              aria-hidden="true"
              className="animate-ripple absolute inset-0 rounded-full border-2"
              style={{ borderColor: themeColor }}
            />
            <span
              aria-hidden="true"
              className="animate-ripple-slow absolute inset-0 rounded-full border-2"
              style={{ borderColor: themeColor }}
            />
          </>
        )}
        <Link
          href={`/booth/${origin.id}`}
          className="group relative block"
          aria-label={`${origin.name} の詳細ページ`}
        >
          <span
            className="relative block h-24 w-24 overflow-hidden rounded-full border-4 bg-white shadow-lg transition-transform group-hover:scale-105 sm:h-28 sm:w-28"
            style={{ borderColor: themeColor }}
          >
            <Image
              src={origin.thumbnail}
              alt={`${origin.name} のロゴ`}
              fill
              sizes="112px"
              className="object-cover"
              priority
            />
          </span>
        </Link>
      </div>

      <p className="mt-4 text-base font-extrabold text-neutral-900 sm:text-lg">
        {origin.shortName ?? origin.name}
      </p>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-neutral-600 sm:text-sm">
        {origin.fanGuide.catchphrase}
      </p>

      {loading ? (
        <p
          aria-live="polite"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500"
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" />
          波紋を広げています…
        </p>
      ) : (
        // 結果へ誘導する下向き矢印 + ラベル（結果が下に出ている明示）
        <div className="animate-bucket mt-6 flex flex-col items-center gap-1 text-xs font-bold text-neutral-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-neutral-200">
            <Sparkles size={12} className="text-primary-500" aria-hidden="true" />
            この下に、3 つの軸でおすすめが出てるよ
          </span>
          <ArrowDown
            size={20}
            className="animate-bounce text-primary-500"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

/** ローディング中のスケルトン（3 バケット分のシマー）*/
function LoadingBuckets() {
  return (
    <div aria-hidden="true" className="mt-10 space-y-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-bucket" style={{ animationDelay: `${i * 150}ms` }}>
          <div className="mb-3 h-4 w-48 rounded animate-shimmer" />
          <div className="mb-3 h-3 w-72 max-w-full rounded animate-shimmer opacity-60" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[0, 1, 2].map((j) => (
              <li
                key={j}
                className="h-24 animate-shimmer rounded-xl border border-neutral-200 sm:h-28"
                style={{ animationDelay: `${j * 100}ms` }}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** 1 つの軸の番組カード列 */
function BucketLane({
  badge,
  subtitle,
  expectation,
  origin,
  items,
  accent,
  delayMs,
}: {
  badge: string;
  subtitle: string;
  expectation: string;
  origin: Program;
  items: RecommendItem[];
  accent: string;
  delayMs: number;
}) {
  return (
    <section
      className="animate-bucket"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <header className="mb-3">
        <h3 className="text-base font-extrabold text-neutral-900 sm:text-lg">
          {badge}
        </h3>
        <p className="mt-0.5 text-xs text-neutral-600 sm:text-sm">{subtitle}</p>
        <p
          className="mt-1 text-xs font-bold sm:text-sm"
          style={{ color: accent }}
        >
          {expectation}
        </p>
      </header>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-center text-xs text-neutral-500">
          この軸でハマる番組は見つかりませんでした。別の起点を試してみてください。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {items.map((item, idx) => (
            <li
              key={item.program.id}
              className="animate-bucket"
              style={{ animationDelay: `${delayMs + 120 + idx * 100}ms` }}
            >
              <RecommendCard item={item} origin={origin} accent={accent} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecommendCard({
  item,
  origin,
  accent,
}: {
  item: RecommendItem;
  origin: Program;
  accent: string;
}) {
  const program = item.program;
  const vibe = vibeStyle(program.fanGuide.vibe);
  const themeColor = program.fanGuide.themeColor ?? vibe.defaultThemeColor;
  const originVibeLabel = VIBE_JP_LABEL[origin.fanGuide.vibe] ?? origin.fanGuide.vibe;

  return (
    <Link
      href={`/booth/${program.id}`}
      className="group relative flex h-full flex-col gap-2.5 overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg active:scale-[0.99]"
    >
      {/*
        左側の縦アクセント線。
        ⚠️ 角丸 UI に inset shadow で線を入れると border-radius に追従してアーチ化するため、
        絶対配置 span + 上下に角丸ぶん（top-3 / bottom-3 = 12px、rounded-xl と一致）の
        余白を取り、直線部分のみに線を引く。AGENTS.md ブランディング §「カードアクセント線
        の実装ルール」参照。
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-0 top-3 w-1 rounded-full"
        style={{ backgroundColor: `${accent}55` }}
      />

      {/* 上段: サムネ + タイトル/キャッチ */}
      <div className="flex gap-3">
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
      </div>

      {/*
        下段: 「好きな番組と何が一致しているか」を可視化
        - ラベル「好きな番組と…」を 1 行で表示し、その下にチェックバッジ群を改行表示
        - 「あ、ここが似てるんだ」が一目で分かり、次に聴く理由になる
      */}
      <div
        className="border-t border-neutral-100 pt-2 text-[10px] sm:text-[11px]"
        aria-label="好きな番組との共通点"
      >
        <span className="block text-neutral-500">好きな番組と…</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {item.sameVibe && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              <Check size={10} aria-hidden="true" />
              温度感（{originVibeLabel}）
            </span>
          )}
          {item.sameGenre && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              <Check size={10} aria-hidden="true" />
              ジャンル
            </span>
          )}
          {item.sharedTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 px-1.5 py-0.5 font-bold text-neutral-700"
            >
              <Check size={10} aria-hidden="true" />
              {tag}
            </span>
          ))}
          {!item.sameVibe && !item.sameGenre && item.sharedTags.length === 0 && (
            // ありえないケース（serendipity は tag 重複 ≥1 を要求）だが念のためフォールバック
            <span className="text-neutral-400">タグの隅で繋がる関係</span>
          )}
        </div>
      </div>
    </Link>
  );
}
