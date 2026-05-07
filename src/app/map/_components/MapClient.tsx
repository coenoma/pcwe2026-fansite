/**
 * マップ画面の Client Component（インタラクティブ部分の集約）。
 *
 * 責務:
 * - 日付（土/日）/ 検索 / フィルタ / 表示モード（マップ・リスト）/ 選択ピン の状態管理
 * - URL 状態同期（?day=sat&pin=14-A&cat=food-drink&q=...&view=map）
 * - VenueMap / MapListView / BoothBottomSheet の統合
 * - LocalStorage（お気に入り / 「会えた」）
 *
 * Phase 2b: 検索 / フィルタ / リスト切替 / お気に入り / 会えた を追加
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

  // ====================
  // URL からの初期状態
  // ====================
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
  const [view, setView] = useState<ViewMode>(initialView);
  const [selectedCats, setSelectedCats] = useState<Set<MerchandiseTag>>(initialCats);
  const [query, setQuery] = useState<string>(qParam ?? '');

  // LocalStorage 初期化（クライアントマウント後に読み込み）
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visited, setVisitedState] = useState<Record<string, string>>({});
  useEffect(() => {
    setFavorites(loadMapFavorites());
    setVisitedState(loadVisited());
  }, []);

  // ====================
  // 派生データ
  // ====================
  const programsById = useMemo(() => {
    const m = new Map<string, Program>();
    for (const p of programs) m.set(p.id, p);
    return m;
  }, [programs]);

  const placementsAll = useMemo(
    () => getSlotPlacementsForDay(boothPositions, day),
    [boothPositions, day],
  );

  // フィルタ + 検索を適用した placement
  const placementsFiltered = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return placementsAll.filter((pl) => {
      // 番組情報がない slot はフィルタ対象外（表示は維持）
      if (pl.programId === undefined) return true;
      const program = programsById.get(pl.programId);
      if (!program) return true;

      // カテゴリフィルタ
      if (selectedCats.size > 0) {
        const tags = new Set(program.official.merchandiseTags ?? []);
        const hit = [...selectedCats].some((c) => tags.has(c));
        if (!hit) return false;
      }

      // 検索
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

  // フィルタ・検索が効いているかどうか（マップでハイライト処理に使う）
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

  // 各カテゴリのヒット数
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

  // 選択中 placement
  const selectedPlacement: SlotPlacement | null = useMemo(() => {
    if (!selectedPosition) return null;
    return placementsAll.find((p) => p.position === selectedPosition) ?? null;
  }, [selectedPosition, placementsAll]);

  const selectedProgram: Program | undefined = useMemo(() => {
    if (!selectedPlacement?.programId) return undefined;
    return programsById.get(selectedPlacement.programId);
  }, [selectedPlacement, programsById]);

  // ====================
  // URL 状態同期
  // ====================
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

  // ====================
  // ハンドラ
  // ====================
  const handleSelect = useCallback(
    (placement: SlotPlacement) => {
      setSelectedPosition(placement.position);
      // リストから選んだら自動的にマップビューに戻る
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

  const handleClose = useCallback(() => {
    setSelectedPosition(null);
    updateUrl({ day, pin: null, cat: selectedCats, q: query, view });
  }, [day, selectedCats, query, view, updateUrl]);

  const handleDayChange = useCallback(
    (nextDay: Day) => {
      setDay(nextDay);
      setSelectedPosition(null);
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
        handleSelect(placement);
      }
    },
    [placementsAll, handleSelect],
  );

  // お気に入り・「会えた」トグル
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

  // ====================
  // レンダリング
  // ====================
  return (
    <>
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-base font-bold text-neutral-900 sm:text-lg">
              🗺 会場マップ
            </h1>
            <div className="flex items-center gap-2">
              <ViewModeToggle mode={view} onChange={handleViewChange} />
              <DayToggle
                selectedDay={day}
                onChange={handleDayChange}
                counts={counts}
              />
            </div>
          </div>
          <MapSearchBar
            programs={programs}
            day={day}
            onSelectHit={handleSearchHit}
            query={query}
            onQueryChange={handleQueryChange}
          />
          <MapFilterChips
            selected={selectedCats}
            onToggle={handleCatToggle}
            onClear={handleCatClear}
            counts={categoryCounts}
          />
          {(visited && Object.keys(visited).length > 0) || favorites.length > 0 ? (
            <p className="text-[11px] text-neutral-500">
              {favorites.length > 0 ? `⭐️ お気に入り ${favorites.length} 件` : null}
              {favorites.length > 0 && Object.keys(visited).length > 0 ? ' · ' : null}
              {Object.keys(visited).length > 0
                ? `✅ 会えた ${Object.keys(visited).length} 件`
                : null}
            </p>
          ) : null}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6">
        {view === 'map' ? (
          <>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <VenueMap
                placements={placementsAll}
                data={boothPositions}
                day={day}
                onSelect={handleSelect}
                selectedPosition={selectedPosition ?? undefined}
                highlightedPositions={highlightedPositions}
              />
            </div>
            <p className="mt-2 text-center text-xs text-neutral-500">
              {isFiltering
                ? `フィルタヒット: ${highlightedPositions?.size ?? 0} ブース（その他は半透明）`
                : 'ピンクのテントをタップで番組情報。土日で違う番組が出展する場合あり。'}
            </p>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs text-neutral-500">
              {isFiltering
                ? `${placementsFiltered.length} 件 / 全 ${placementsAll.length} 件`
                : `全 ${placementsAll.length} 件`}
            </p>
            <MapListView
              programs={programs}
              placements={placementsFiltered}
              day={day}
              onSelect={handleSelect}
            />
          </>
        )}
      </div>

      {/* 公式画像 DL */}
      <div className="px-3 pb-12 sm:px-6">
        <OfficialMapDownload />
      </div>

      {/* ボトムシート */}
      <BoothBottomSheet
        placement={selectedPlacement}
        program={selectedProgram}
        day={day}
        onClose={handleClose}
        isFavorite={selectedPlacement?.programId ? favorites.includes(selectedPlacement.programId) : false}
        isVisited={selectedPlacement ? selectedPlacement.position in visited : false}
        onToggleFavorite={
          selectedPlacement?.programId
            ? () => handleToggleFavorite(selectedPlacement.programId as string)
            : undefined
        }
        onToggleVisited={
          selectedPlacement
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
