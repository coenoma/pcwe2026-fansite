/**
 * マップ機能の純粋関数群。
 *
 * - booth-positions.json を zod で読み込んで型安全に提供
 * - 番組ID ↔ 物理位置の双方向参照
 * - SVG レイアウトのベース座標（テント 32 個分）
 *
 * 設計詳細: docs/plans/v2-interactive-map/02-data-and-svg.md
 */

import boothPositionsJson from '../../data/booth-positions.json';
import { BoothPositionsDataSchema } from './types';
import type {
  BoothPositionsData,
  Day,
  Program,
} from './types';

/** booth-positions.json を zod 検証して返す（純粋関数）*/
export function getBoothPositions(): BoothPositionsData {
  const parsed = BoothPositionsDataSchema.safeParse(boothPositionsJson);
  if (!parsed.success) {
    console.error('❌ booth-positions.json の検証に失敗しました');
    console.error(parsed.error.format());
    throw new Error('booth-positions.json validation failed');
  }
  return parsed.data;
}

/**
 * 指定日の各 slot に居る番組を、テント順 + position 順で配列化する。
 *
 * 結果: [{ tent: 1, slot: '1', programId: 'pcwe-074' }, ...]
 * external 番組（programs.json 未登録）も別配列で返す。
 */
export interface SlotPlacement {
  tent: number;
  shape: 'single' | 'quad' | 'kitchen-booth';
  position: string;
  slot?: 'A' | 'B' | 'C' | 'D';
  programId?: string;
  externalName?: string;
  externalNote?: string;
}

export function getSlotPlacementsForDay(
  data: BoothPositionsData,
  day: Day,
): SlotPlacement[] {
  const result: SlotPlacement[] = [];
  for (const tent of data.tents) {
    for (const slot of tent.slots) {
      const programId = slot[day] ?? undefined;
      const ext = day === 'sat' ? slot.satExternal : slot.sunExternal;
      if (programId === null || programId === undefined) {
        if (ext) {
          result.push({
            tent: tent.id,
            shape: tent.shape,
            position: slot.position,
            slot: slot.slot,
            externalName: ext.name,
            externalNote: ext.note,
          });
        }
        continue;
      }
      result.push({
        tent: tent.id,
        shape: tent.shape,
        position: slot.position,
        slot: slot.slot,
        programId,
      });
    }
  }
  return result;
}

/**
 * 番組から「その日の」物理位置 label を取得。
 * exhibition.position があればそれ、なければ positionBySatSun から day で取得。
 */
export function getPositionLabel(program: Program, day: Day): string | undefined {
  const pos = program.exhibition.position;
  if (pos) return pos.label;
  const split = program.exhibition.positionBySatSun;
  return split?.[day]?.label;
}

/**
 * 「テント番号 + 区画」から番組を逆引き（その日の）。
 * 見つからなければ undefined。
 */
export function findProgramAtPosition(
  programs: Program[],
  positionLabel: string,
  day: Day,
): Program | undefined {
  return programs.find((p) => getPositionLabel(p, day) === positionLabel);
}

// ====================
// SVG レイアウト座標（公式画像準拠版）
//
// 各テントの polygon 座標は data/booth-positions.json で管理（公式 webp から自動抽出）。
// 旧 TENT_LAYOUTS 暫定座標は廃止し、Tent.polygon を直接参照する。
// quad テントの A/B/C/D 分割は VenueMap 内でプログラマティックに 2x2 分割。
// ====================
