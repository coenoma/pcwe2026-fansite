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

interface Props {
  programs: Program[];
  boothPositions: BoothPositionsData;
  eventDates: { sat: string; sun: string };
}

export function MapClient({ programs, boothPositions, eventDates }: Props) {
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

  // フィルタ + 検索を適用
  const placementsFiltered = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return placementsAll.filter((pl) => {
      // external（スポンサー / キッチン）はフィルタ・検索の対象外（残す）
      if (pl.programId === undefined) return true;
      const program = programsById.get(pl.programId);
      if (!program) return true;

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
  }, [placementsAll, selectedCats, query, programsById]);

  const isFiltering = selectedCats.size > 0 || query.trim().length > 0;
  const highlightedPositions: Set<string> | undefined = isFiltering
    ? new Set(placementsFiltered.map((p) => p.position))
    : undefined;

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
  const tentSlotsInfo: TentSlotInfo[] = useMemo(() => {
    if (selectedTentId === null) return [];
    const tent = boothPositions.tents.find((t) => t.id === selectedTentId);
    if (!tent) return [];
    return tent.slots.map((slot) => {
      const pl = placementsAll.find((p) => p.position === slot.position);
      return {
        position: slot.position,
        slot: slot.slot,
        program: pl?.programId ? programsById.get(pl.programId) : undefined,
        externalKind: pl?.externalKind,
        externalName: pl?.externalName,
      };
    });
  }, [selectedTentId, boothPositions, placementsAll, programsById]);

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
      const nextView: ViewMode = view === 'list' ? 'map' : view;
      setView(nextView);
      updateUrl({
        day,
        pin: placement.position,
        cat: selectedCats,
        q: query,
        view: nextView,
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
      setDay(nextDay);
      // 日付切替で選択クリア（その位置に別番組がいる可能性、混乱回避）
      setSelectedPosition(null);
      setSelectedTentId(null);
      updateUrl({ day: nextDay, pin: null, cat: selectedCats, q: query, view });
    },
    [selectedCats, query, view, updateUrl],
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
    },
    [favorites],
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
                counts={counts}
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

          {/* 3 段目: フィルタチップ（横スクロール対応で SP でも崩れない）*/}
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="flex items-center gap-1.5 [&>*]:shrink-0">
              <MapFilterChips
                selected={selectedCats}
                onToggle={handleCatToggle}
                onClear={handleCatClear}
                counts={categoryCounts}
              />
            </div>
          </div>

          {/* 4 段目: お気に入り / 会えた サマリ（あれば）*/}
          {favCount > 0 || visitedCount > 0 ? (
            <p className="text-[11px] text-neutral-500">
              {favCount > 0 ? `⭐️ お気に入り ${favCount} 件` : null}
              {favCount > 0 && visitedCount > 0 ? ' · ' : null}
              {visitedCount > 0 ? `✅ 会えた ${visitedCount} 件` : null}
            </p>
          ) : null}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">
        {view === 'map' ? (
          <>
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
              />
            </div>
            <p className="mt-2 text-center text-xs leading-relaxed text-neutral-500">
              {isFiltering
                ? `フィルタヒット: ${highlightedPositions?.size ?? 0} ブース（その他は半透明）`
                : 'テントをタップで番組情報。土日で違う番組が出展する場合あり。'}
            </p>
          </>
        ) : (
          <>
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
            />
          </>
        )}
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
