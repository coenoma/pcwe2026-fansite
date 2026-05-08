/**
 * マップ画面の Client Component（インタラクティブ部分の集約）。
 *
 * 主要状態:
 * - day（土/日）/ view（map/list）/ query / cat / pin / tent
 * - LocalStorage: お気に入り（pcwe-XXX 配列）, 会えた（position 別タイムスタンプ）
 *
 * 状態破綻対策（FB #5 エッジケース対応）:
 * - 日付切替で選択がその日に出展しない場合、自動で選択クリア
 * - URL `pin` が不正 / 未割当のテント → エフェクトで自動クリア
 * - 削除済み programId の LocalStorage 残骸 → 静かに無視
 * - external（スポンサー / キッチン）はお気に入り・会えた対象外
 *
 * シート遷移:
 * - single テント/スポンサー/キッチン → BoothBottomSheet
 * - quad テント → TentOverviewSheet → 区画選択 → BoothBottomSheet
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VenueMap } from '@/components/map/VenueMap';
import { BoothBottomSheet } from '@/components/map/BoothBottomSheet';
import { DayToggle } from '@/components/map/DayToggle';
import { OfficialMapDownload } from '@/components/map/OfficialMapDownload';
import { MapFilterChips } from '@/components/map/MapFilterChips';
import { MapSearchBar } from '@/components/map/MapSearchBar';
import { MapListView } from '@/components/map/MapListView';
import { ViewModeToggle, type ViewMode } from '@/components/map/ViewModeToggle';
import {
  TentOverviewSheet,
  type TentSlotInfo,
} from '@/components/map/TentOverviewSheet';
import {
  getSlotPlacementsForDay,
  type SlotPlacement,
} from '@/lib/booth-map';
import {
  loadMapFavorites,
  loadVisited,
  saveMapFavorites,
  saveVisited,
  toggleMapFavorite,
  toggleVisited,
} from '@/lib/booth-visit';
import type {
  BoothPositionsData,
  Day,
  MerchandiseTag,
  Program,
} from '@/lib/types';
import type { TweetMap } from '@/lib/tweet-cache';

interface Props {
  programs: Program[];
  boothPositions: BoothPositionsData;
  /** SSG 時に pre-fetch した tweet データ（ID → Tweet）*/
  tweets: TweetMap;
  eventDates: { sat: string; sun: string };
}

export function MapClient({ programs, boothPositions, tweets, eventDates }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ====== URL 初期状態 ======
  const dayParam = searchParams.get('day');
  const pinParam = searchParams.get('pin');
  const catParam = searchParams.get('cat');
  const qParam = searchParams.get('q');
  const viewParam = searchParams.get('view');

  const initialDay: Day =
    dayParam === 'sun' ? 'sun' : dayParam === 'sat' ? 'sat' : pickDefaultDay(eventDates);
  const initialView: ViewMode = viewParam === 'list' ? 'list' : 'map';
  const initialCats = parseCats(catParam);

  const [day, setDay] = useState<Day>(initialDay);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(pinParam);
  const [selectedTentId, setSelectedTentId] = useState<number | null>(null);
  const [view, setView] = useState<ViewMode>(initialView);
  const [selectedCats, setSelectedCats] = useState<Set<MerchandiseTag>>(initialCats);
  const [query, setQuery] = useState<string>(qParam ?? '');

  // ====== LocalStorage ======
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visited, setVisitedState] = useState<Record<string, string>>({});
  useEffect(() => {
    setFavorites(loadMapFavorites());
    setVisitedState(loadVisited());
  }, []);

  // ====== 派生データ ======
  const programsById = useMemo(() => {
    const m = new Map<string, Program>();
    for (const p of programs) m.set(p.id, p);
    return m;
  }, [programs]);

  const placementsAll = useMemo(
    () => getSlotPlacementsForDay(boothPositions, day),
    [boothPositions, day],
  );

  // 「お気に入りだけ」モード（特殊フィルタ）
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // フィルタ + 検索 + お気に入りモードを適用
  const placementsFiltered = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return placementsAll.filter((pl) => {
      // external（スポンサー / キッチン）は通常フィルタの対象外
      if (pl.programId === undefined) {
        // ただし「お気に入りだけ」モードでは除外
        if (showFavoritesOnly) return false;
        return true;
      }
      const program = programsById.get(pl.programId);
      if (!program) return true;

      // お気に入りだけモード
      if (showFavoritesOnly && !favorites.includes(pl.programId)) {
        return false;
      }

      if (selectedCats.size > 0) {
        const tags = new Set(program.official.merchandiseTags ?? []);
        const hit = [...selectedCats].some((c) => tags.has(c));
        if (!hit) return false;
      }

      if (lowerQuery.length > 0) {
        const hay =
          program.name.toLowerCase() +
          ' ' +
          (program.shortName ?? '').toLowerCase() +
          ' ' +
          pl.position +
          ' ' +
          (program.official.merchandise ?? []).join(' ').toLowerCase() +
          ' ' +
          (program.official.merchandiseDetails ?? [])
            .map((d) => d.name)
            .join(' ')
            .toLowerCase() +
          ' ' +
          (program.official.merchandiseSpotlight ?? '').toLowerCase();
        if (!hay.includes(lowerQuery)) return false;
      }

      return true;
    });
  }, [placementsAll, selectedCats, query, programsById, showFavoritesOnly, favorites]);

  const isFiltering =
    selectedCats.size > 0 || query.trim().length > 0 || showFavoritesOnly;
  const highlightedPositions: Set<string> | undefined = isFiltering
    ? new Set(placementsFiltered.map((p) => p.position))
    : undefined;

  // VenueMap に渡す Set
  const favoriteProgramIdSet = useMemo(
    () => new Set(favorites),
    [favorites],
  );
  const visitedPositionSet = useMemo(
    () => new Set(Object.keys(visited)),
    [visited],
  );

  // 土/日の番組数
  const counts = useMemo(() => {
    const sat = getSlotPlacementsForDay(boothPositions, 'sat').filter(
      (p) => p.programId !== undefined || p.externalName !== undefined,
    ).length;
    const sun = getSlotPlacementsForDay(boothPositions, 'sun').filter(
      (p) => p.programId !== undefined || p.externalName !== undefined,
    ).length;
    return { sat, sun };
  }, [boothPositions]);

  const categoryCounts = useMemo(() => {
    const result: Partial<Record<MerchandiseTag, number>> = {};
    for (const pl of placementsAll) {
      if (!pl.programId) continue;
      const program = programsById.get(pl.programId);
      if (!program?.official.merchandiseTags) continue;
      for (const tag of program.official.merchandiseTags) {
        result[tag] = (result[tag] ?? 0) + 1;
      }
    }
    return result;
  }, [placementsAll, programsById]);

  const selectedPlacement: SlotPlacement | null = useMemo(() => {
    if (!selectedPosition) return null;
    return placementsAll.find((p) => p.position === selectedPosition) ?? null;
  }, [selectedPosition, placementsAll]);

  const selectedProgram: Program | undefined = useMemo(() => {
    if (!selectedPlacement?.programId) return undefined;
    return programsById.get(selectedPlacement.programId);
  }, [selectedPlacement, programsById]);

  // テント概要シート用：選択中テントの 4 区画情報
  // フィルタ・検索が効いている場合は **その条件にヒットした区画だけハイライト**、
  // それ以外は半透明扱いの情報を渡す（ユーザー FB: フィルタしたカテゴリの番組だけ強調）
  // v1.9: お気に入り/会えた状態も併せて注入（SlotCard の状態バッジ表示用）
  const tentSlotsInfo: TentSlotInfo[] = useMemo(() => {
    if (selectedTentId === null) return [];
    const tent = boothPositions.tents.find((t) => t.id === selectedTentId);
    if (!tent) return [];
    return tent.slots.map((slot) => {
      const pl = placementsAll.find((p) => p.position === slot.position);
      const matchesFilter = highlightedPositions
        ? highlightedPositions.has(slot.position)
        : true;
      const programId = pl?.programId;
      return {
        position: slot.position,
        slot: slot.slot,
        program: programId ? programsById.get(programId) : undefined,
        externalKind: pl?.externalKind,
        externalName: pl?.externalName,
        matchesFilter,
        isFavorite: programId !== undefined && favorites.includes(programId),
        isVisited: slot.position in visited,
      };
    });
  }, [
    selectedTentId,
    boothPositions,
    placementsAll,
    programsById,
    highlightedPositions,
    favorites,
    visited,
  ]);

  // ====== URL 同期 ======
  const updateUrl = useCallback(
    (state: {
      day: Day;
      pin: string | null;
      cat: Set<MerchandiseTag>;
      q: string;
      view: ViewMode;
    }) => {
      const params = new URLSearchParams();
      params.set('day', state.day);
      if (state.pin) params.set('pin', state.pin);
      if (state.cat.size > 0) params.set('cat', [...state.cat].join(','));
      if (state.q.trim().length > 0) params.set('q', state.q.trim());
      if (state.view !== 'map') params.set('view', state.view);
      router.replace(`/map?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  // E10/E12: 不正な pin が URL に来たら自動クリア
  useEffect(() => {
    if (!pinParam) return;
    const exists = placementsAll.some((p) => p.position === pinParam);
    if (!exists) {
      setSelectedPosition(null);
      updateUrl({ day, pin: null, cat: selectedCats, q: query, view });
    }
  }, [pinParam, placementsAll, day, selectedCats, query, view, updateUrl]);

  // ====== ハンドラ ======
  const handleSelectSlot = useCallback(
    (placement: SlotPlacement) => {
      setSelectedPosition(placement.position);
      setSelectedTentId(null);
      // v1.11 修正: view は変えない（リストならリスト中に、マップならマップ中に
      // シートが乗る形）。閉じた時にも元の view に戻る自然な体験になる。
      updateUrl({
        day,
        pin: placement.position,
        cat: selectedCats,
        q: query,
        view,
      });
    },
    [day, selectedCats, query, view, updateUrl],
  );

  // quad テント全体タップ → テント概要シート
  const handleSelectTent = useCallback((tentId: number) => {
    setSelectedTentId(tentId);
  }, []);

  // テント概要シートで区画選択 → ボトムシートへ
  const handleSelectSlotFromTent = useCallback(
    (position: string) => {
      const placement = placementsAll.find((p) => p.position === position);
      setSelectedTentId(null);
      if (placement) {
        setSelectedPosition(placement.position);
        updateUrl({
          day,
          pin: placement.position,
          cat: selectedCats,
          q: query,
          view,
        });
      }
    },
    [placementsAll, day, selectedCats, query, view, updateUrl],
  );

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedPosition(null);
    updateUrl({ day, pin: null, cat: selectedCats, q: query, view });
  }, [day, selectedCats, query, view, updateUrl]);

  const handleCloseTentSheet = useCallback(() => {
    setSelectedTentId(null);
  }, []);

  const handleDayChange = useCallback(
    (nextDay: Day) => {
      // v1.11 修正: 同 position に同じ番組（or 同じ external 出展）が両日いる場合は
      // selection を維持。両日通し出展のテントで日跨ぎの物販比較等の体験が成立する。
      // テント概要シート（quad）は基本的に「テントの 4 区画見比べ」UI のため、
      // 日付変更時は閉じる（4 区画の中身が日跨ぎで全部一致する保証はない）。
      let keepPosition: string | null = null;
      if (selectedPosition !== null) {
        const cur = placementsAll.find((p) => p.position === selectedPosition);
        const nextDayPlacements = getSlotPlacementsForDay(boothPositions, nextDay);
        const next = nextDayPlacements.find((p) => p.position === selectedPosition);
        if (cur !== undefined && next !== undefined) {
          const samePid =
            cur.programId !== undefined && next.programId === cur.programId;
          const sameExt =
            cur.externalKind !== undefined &&
            next.externalKind === cur.externalKind &&
            next.externalName === cur.externalName;
          if (samePid || sameExt) keepPosition = selectedPosition;
        }
      }
      setDay(nextDay);
      if (keepPosition === null) {
        setSelectedPosition(null);
      }
      setSelectedTentId(null);
      updateUrl({
        day: nextDay,
        pin: keepPosition,
        cat: selectedCats,
        q: query,
        view,
      });
    },
    [boothPositions, placementsAll, selectedPosition, selectedCats, query, view, updateUrl],
  );

  const handleCatToggle = useCallback(
    (tag: MerchandiseTag) => {
      const next = new Set(selectedCats);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      setSelectedCats(next);
      updateUrl({ day, pin: selectedPosition, cat: next, q: query, view });
    },
    [day, selectedPosition, selectedCats, query, view, updateUrl],
  );

  const handleCatClear = useCallback(() => {
    setSelectedCats(new Set());
    updateUrl({ day, pin: selectedPosition, cat: new Set(), q: query, view });
  }, [day, selectedPosition, query, view, updateUrl]);

  const handleQueryChange = useCallback(
    (q: string) => {
      setQuery(q);
      updateUrl({ day, pin: selectedPosition, cat: selectedCats, q, view });
    },
    [day, selectedPosition, selectedCats, view, updateUrl],
  );

  const handleViewChange = useCallback(
    (nextView: ViewMode) => {
      setView(nextView);
      updateUrl({ day, pin: selectedPosition, cat: selectedCats, q: query, view: nextView });
    },
    [day, selectedPosition, selectedCats, query, updateUrl],
  );

  const handleSearchHit = useCallback(
    (hit: { programId?: string; position?: string }) => {
      const position = hit.position;
      if (!position) return;
      const placement = placementsAll.find((p) => p.position === position);
      if (placement) {
        handleSelectSlot(placement);
      }
    },
    [placementsAll, handleSelectSlot],
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      const next = toggleMapFavorite(favorites, id);
      setFavorites(next);
      saveMapFavorites(next);
      // v1.11 修正: 「お気に入りだけ」モード ON の状態でお気に入り解除すると、
      // 開いているシートが対象外になり整合が崩れるため、シートも閉じる。
      if (showFavoritesOnly && !next.includes(id)) {
        setSelectedPosition(null);
        updateUrl({ day, pin: null, cat: selectedCats, q: query, view });
      }
    },
    [favorites, showFavoritesOnly, day, selectedCats, query, view, updateUrl],
  );

  const handleToggleVisited = useCallback(
    (key: string) => {
      const next = toggleVisited(visited, key);
      setVisitedState(next);
      saveVisited(next);
    },
    [visited],
  );

  // ====== レンダリング ======
  const visitedCount = Object.keys(visited).length;
  const favCount = favorites.length;
  // 「会えた」プログレス（その日の番組数を分母にして達成感）
  const visitedPercent = counts[day] > 0 ? Math.round((visitedCount / counts[day]) * 100) : 0;

  return (
    <>
      {/* ヘッダー（SP 最適化） */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          {/* 1 段目: タイトル + ビュー切替 + 日付 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="flex shrink-0 items-baseline gap-1.5 text-sm font-bold text-neutral-900 sm:text-base">
              <span aria-hidden="true">🗺</span>
              <span>会場マップ</span>
            </h1>
            <div className="ml-auto flex items-center gap-1.5">
              <ViewModeToggle mode={view} onChange={handleViewChange} />
              <DayToggle
                selectedDay={day}
                onChange={handleDayChange}
              />
            </div>
          </div>

          {/* 2 段目: 検索バー */}
          <MapSearchBar
            programs={programs}
            placements={placementsAll}
            day={day}
            onSelectHit={handleSearchHit}
            query={query}
            onQueryChange={handleQueryChange}
          />

          {/* 3 段目: フィルタチップ + お気に入りモードトグル（横スクロール）*/}
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="flex items-center gap-1.5 [&>*]:shrink-0">
              <MapFilterChips
                selected={selectedCats}
                onToggle={handleCatToggle}
                onClear={handleCatClear}
                counts={categoryCounts}
              />
              {/* お気に入りモード切替トグル（お気に入り 1 件以上で表示）*/}
              {favCount > 0 ? (
                <button
                  type="button"
                  aria-pressed={showFavoritesOnly}
                  onClick={() => setShowFavoritesOnly((v) => !v)}
                  className={
                    showFavoritesOnly
                      ? 'inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors'
                      : 'inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100'
                  }
                >
                  <span aria-hidden="true">⭐️</span>
                  <span>お気に入りだけ</span>
                  <span
                    className={
                      showFavoritesOnly
                        ? 'ml-1 rounded-full bg-white/30 px-1.5 text-[10px]'
                        : 'ml-1 rounded-full bg-white px-1.5 text-[10px] text-amber-700'
                    }
                  >
                    {favCount}
                  </span>
                </button>
              ) : null}
            </div>
            {/* v1.11 追加: お気に入りモード ON + フィルタチップ併用時の AND 結合を明示。
                ユーザーが「フィルタが効いていないように見える」と誤解する事を防ぐ。 */}
            {showFavoritesOnly && selectedCats.size > 0 ? (
              <p className="mt-1 px-1 text-[10px] text-neutral-500">
                ⭐️お気に入りの中から、選んだカテゴリで絞り込み中
              </p>
            ) : null}
          </div>

          {/* 4 段目: 「会えた」プログレスバー（5/9 or 5/10 の達成感）*/}
          {visitedCount > 0 ? (
            <div className="flex items-center gap-2 rounded-full bg-accent-cyan-500/10 px-3 py-1.5">
              <span aria-hidden="true" className="text-sm">✅</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-accent-cyan-700">
                    {visitedCount} 件 会えた！
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    （{day === 'sat' ? '5/9 土' : '5/10 日'} 全 {counts[day]} ブース中）
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-cyan-400 to-accent-cyan-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, visitedPercent)}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums text-accent-cyan-700">
                {visitedPercent}%
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {/* メインコンテンツ
          v1.11 修正: マップ / リストを両方 DOM に保持し、view で hidden 切替する。
          これにより VenueMap が unmount されず、ピンチズーム状態（scale）等が
          view 往復で保持される。 */}
      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">
        <div className={view === 'map' ? '' : 'hidden'}>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <VenueMap
              placements={placementsAll}
              data={boothPositions}
              day={day}
              onSelectSlot={handleSelectSlot}
              onSelectTent={handleSelectTent}
              selectedPosition={selectedPosition ?? undefined}
              selectedTentId={selectedTentId ?? undefined}
              highlightedPositions={highlightedPositions}
              favoriteProgramIds={favoriteProgramIdSet}
              visitedPositions={visitedPositionSet}
            />
          </div>
          <p className="mt-2 text-center text-xs leading-relaxed text-neutral-500">
            {showFavoritesOnly
              ? `⭐️ お気に入りだけ表示中（${highlightedPositions?.size ?? 0} ブース）`
              : isFiltering
                ? `条件にぴったりの ${highlightedPositions?.size ?? 0} ブースが浮かび上がってるよ ✨`
                : '気になるブースをタップ ✨ ピンチで拡大もできるよ'}
          </p>
        </div>
        <div className={view === 'list' ? '' : 'hidden'}>
          <p className="mb-3 text-xs text-neutral-500">
            {isFiltering
              ? `${placementsFiltered.filter((p) => p.programId || p.externalName).length} 件 / 全 ${placementsAll.filter((p) => p.programId || p.externalName).length} 件`
              : `全 ${placementsAll.filter((p) => p.programId || p.externalName).length} 件`}
          </p>
          <MapListView
            programs={programs}
            placements={placementsFiltered}
            day={day}
            onSelect={handleSelectSlot}
            favorites={favorites}
            visited={visited}
          />
        </div>
      </div>

      {/* 公式画像 DL */}
      <div className="px-3 pb-12 sm:px-6">
        <OfficialMapDownload />
      </div>

      {/* テント概要シート（quad テント全体タップ時）*/}
      <TentOverviewSheet
        tentId={selectedTentId}
        slots={tentSlotsInfo}
        day={day}
        onSelectSlot={handleSelectSlotFromTent}
        onClose={handleCloseTentSheet}
      />

      {/* ボトムシート（個別ブース選択時）*/}
      <BoothBottomSheet
        placement={selectedPlacement}
        program={selectedProgram}
        day={day}
        tweets={tweets}
        onClose={handleCloseBottomSheet}
        isFavorite={
          selectedPlacement?.programId
            ? favorites.includes(selectedPlacement.programId)
            : false
        }
        isVisited={selectedPlacement ? selectedPlacement.position in visited : false}
        onToggleFavorite={
          selectedPlacement?.programId
            ? () => handleToggleFavorite(selectedPlacement.programId as string)
            : undefined
        }
        onToggleVisited={
          selectedPlacement && !selectedPlacement.externalKind
            ? () => handleToggleVisited(selectedPlacement.position)
            : undefined
        }
      />
    </>
  );
}

function pickDefaultDay(eventDates: { sat: string; sun: string }): Day {
  if (typeof window === 'undefined') return 'sat';
  const today = new Date().toISOString().slice(0, 10);
  if (today === eventDates.sun) return 'sun';
  return 'sat';
}

function parseCats(raw: string | null): Set<MerchandiseTag> {
  if (!raw) return new Set();
  const valid: MerchandiseTag[] = [
    'food-drink',
    'experience',
    'rare-curious',
    'free-distribution',
    'limited-new',
    'zine-book',
  ];
  const set = new Set<MerchandiseTag>();
  for (const part of raw.split(',')) {
    const trimmed = part.trim() as MerchandiseTag;
    if (valid.includes(trimmed)) set.add(trimmed);
  }
  return set;
}
