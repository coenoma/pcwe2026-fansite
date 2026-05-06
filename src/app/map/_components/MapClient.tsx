/**
 * マップ画面の Client Component（インタラクティブ部分の集約）。
 *
 * 責務:
 * - 日付（土/日）の状態管理
 * - 選択中ピンの状態管理
 * - VenueMap → タップ → BoothBottomSheet 起動
 * - URL 状態同期（?day=sat&pin=14-A）
 *
 * Phase 2a 最小実装。検索・フィルタ・リスト切替は Phase 2b で。
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VenueMap } from '@/components/map/VenueMap';
import { BoothBottomSheet } from '@/components/map/BoothBottomSheet';
import { DayToggle } from '@/components/map/DayToggle';
import { OfficialMapDownload } from '@/components/map/OfficialMapDownload';
import {
  getSlotPlacementsForDay,
  type SlotPlacement,
} from '@/lib/booth-map';
import type {
  BoothPositionsData,
  Day,
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

  // URL から初期状態を取得（?day=sun, ?pin=14-A）
  const dayParam = searchParams.get('day');
  const pinParam = searchParams.get('pin');
  const initialDay: Day =
    dayParam === 'sun' ? 'sun' : dayParam === 'sat' ? 'sat' : pickDefaultDay(eventDates);

  const [day, setDay] = useState<Day>(initialDay);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(
    pinParam,
  );

  // 番組 ID → Program マップ
  const programsById = useMemo(() => {
    const m = new Map<string, Program>();
    for (const p of programs) m.set(p.id, p);
    return m;
  }, [programs]);

  // その日の slot 配置
  const placements = useMemo(
    () => getSlotPlacementsForDay(boothPositions, day),
    [boothPositions, day],
  );

  // 土/日それぞれの番組数（DayToggle に渡す）
  const counts = useMemo(() => {
    const sat = getSlotPlacementsForDay(boothPositions, 'sat').filter(
      (p) => p.programId !== undefined || p.externalName !== undefined,
    ).length;
    const sun = getSlotPlacementsForDay(boothPositions, 'sun').filter(
      (p) => p.programId !== undefined || p.externalName !== undefined,
    ).length;
    return { sat, sun };
  }, [boothPositions]);

  // 選択中 placement
  const selectedPlacement: SlotPlacement | null = useMemo(() => {
    if (!selectedPosition) return null;
    return placements.find((p) => p.position === selectedPosition) ?? null;
  }, [selectedPosition, placements]);

  // URL 状態同期
  const updateUrl = useCallback(
    (nextDay: Day, nextPosition: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('day', nextDay);
      if (nextPosition) {
        params.set('pin', nextPosition);
      } else {
        params.delete('pin');
      }
      router.replace(`/map?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleSelect = useCallback(
    (placement: SlotPlacement) => {
      setSelectedPosition(placement.position);
      updateUrl(day, placement.position);
    },
    [day, updateUrl],
  );

  const handleClose = useCallback(() => {
    setSelectedPosition(null);
    updateUrl(day, null);
  }, [day, updateUrl]);

  const handleDayChange = useCallback(
    (nextDay: Day) => {
      setDay(nextDay);
      // 日付変更時に選択もリセット（位置は同じでも別番組になる可能性のため）
      setSelectedPosition(null);
      updateUrl(nextDay, null);
    },
    [updateUrl],
  );

  // 選択された placement の program を解決
  const selectedProgram: Program | undefined = useMemo(() => {
    if (!selectedPlacement?.programId) return undefined;
    return programsById.get(selectedPlacement.programId);
  }, [selectedPlacement, programsById]);

  return (
    <>
      {/* ヘッダー: タイトル + 日付トグル */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-neutral-900 sm:text-lg">
              🗺 会場マップ
            </h1>
            <p className="text-xs text-neutral-500">
              非公式ファンガイド · 142 番組のブースを土日切替で
            </p>
          </div>
          <DayToggle
            selectedDay={day}
            onChange={handleDayChange}
            counts={counts}
          />
        </div>
      </header>

      {/* SVG マップ */}
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <VenueMap
            placements={placements}
            tents={boothPositions.tents}
            day={day}
            onSelect={handleSelect}
            selectedPosition={selectedPosition ?? undefined}
          />
        </div>
        <p className="mt-2 text-center text-xs text-neutral-500">
          ピンクのテントをタップで番組情報。土日で違う番組が同じ位置に出展する場合あり。
        </p>
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
      />
    </>
  );
}

/**
 * 当日アクセスなら自動的にその日を選択。それ以外は土曜デフォルト。
 */
function pickDefaultDay(eventDates: { sat: string; sun: string }): Day {
  if (typeof window === 'undefined') return 'sat';
  const today = new Date().toISOString().slice(0, 10);
  if (today === eventDates.sun) return 'sun';
  return 'sat';
}
