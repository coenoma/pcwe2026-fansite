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
// SVG レイアウト座標（最小実装版）
// Figma で公式 webp を背景に矩形を起こすまでの暫定座標。
// viewBox: 0 0 1000 850
// 公式マップの構造を概算で再現:
//   - 左列（縦）: テント 30 (上)、7-1 (上から下、single)
//   - 上中: テント 8, 9 (quad、横並び) 隣接して 10, 11
//   - 上右: テント 18, 19 (single)
//   - 中央列: テント 12-17 (縦並び quad)
//   - 中右1: テント 20-23 (縦並び quad)
//   - 中右2: テント 24-27 (縦並び quad)
//   - 右側: テント 31 (single)
//   - 中下: テント 28, 29 (横並び quad)
//   - 右下: テント 32 (キッチンブース single)
// ====================

export interface TentLayout {
  id: number;
  /** SVG 左上 x */
  x: number;
  /** SVG 左上 y */
  y: number;
  /** SVG 幅 */
  width: number;
  /** SVG 高 */
  height: number;
}

const TENT_LAYOUTS: TentLayout[] = [
  // 左上: テント 30
  { id: 30, x: 50, y: 60, width: 50, height: 50 },
  // 左列: テント 7-1（上から下）
  { id: 7, x: 50, y: 130, width: 50, height: 50 },
  { id: 6, x: 50, y: 190, width: 50, height: 50 },
  { id: 5, x: 50, y: 250, width: 50, height: 50 },
  { id: 4, x: 50, y: 310, width: 50, height: 50 },
  { id: 3, x: 50, y: 370, width: 50, height: 50 },
  { id: 2, x: 50, y: 430, width: 50, height: 50 },
  { id: 1, x: 50, y: 490, width: 50, height: 50 },
  // 上中: テント 8, 9 (quad)
  { id: 8, x: 220, y: 70, width: 80, height: 80 },
  { id: 9, x: 320, y: 70, width: 80, height: 80 },
  // 上中右: テント 10, 11 (quad)
  { id: 10, x: 460, y: 130, width: 80, height: 80 },
  { id: 11, x: 560, y: 130, width: 80, height: 80 },
  // 上右: テント 18, 19 (single)
  { id: 18, x: 700, y: 70, width: 50, height: 50 },
  { id: 19, x: 760, y: 70, width: 50, height: 50 },
  // 中央列: テント 12-17 (quad)
  { id: 12, x: 460, y: 290, width: 80, height: 80 },
  { id: 13, x: 460, y: 380, width: 80, height: 80 },
  { id: 14, x: 460, y: 470, width: 80, height: 80 },
  { id: 15, x: 460, y: 560, width: 80, height: 80 },
  { id: 16, x: 460, y: 650, width: 80, height: 80 },
  { id: 17, x: 460, y: 740, width: 80, height: 80 },
  // 中右1: テント 20-23 (quad)
  { id: 20, x: 590, y: 290, width: 80, height: 80 },
  { id: 21, x: 590, y: 380, width: 80, height: 80 },
  { id: 22, x: 590, y: 470, width: 80, height: 80 },
  { id: 23, x: 590, y: 560, width: 80, height: 80 },
  // 中右2: テント 24-27 (quad)
  { id: 24, x: 720, y: 290, width: 80, height: 80 },
  { id: 25, x: 720, y: 380, width: 80, height: 80 },
  { id: 26, x: 720, y: 470, width: 80, height: 80 },
  { id: 27, x: 720, y: 560, width: 80, height: 80 },
  // 中下: テント 28, 29 (quad)
  { id: 28, x: 590, y: 660, width: 80, height: 80 },
  { id: 29, x: 690, y: 660, width: 80, height: 80 },
  // 右側: テント 31 (single)
  { id: 31, x: 870, y: 380, width: 50, height: 50 },
  // 右下: テント 32 (キッチンブース)
  { id: 32, x: 870, y: 720, width: 50, height: 50 },
];

export function getTentLayout(tentId: number): TentLayout | undefined {
  return TENT_LAYOUTS.find((l) => l.id === tentId);
}

export function getAllTentLayouts(): TentLayout[] {
  return TENT_LAYOUTS;
}

/**
 * quad テントの A/B/C/D 区画の SVG 座標（テント矩形を 2x2 で分割）。
 * 公式マップの並び:
 *   ┌───┬───┐
 *   │ A │ B │
 *   ├───┼───┤
 *   │ C │ D │
 *   └───┴───┘
 */
export function getQuadrantLayout(
  tent: TentLayout,
  slot: 'A' | 'B' | 'C' | 'D',
): { x: number; y: number; width: number; height: number } {
  const halfW = tent.width / 2;
  const halfH = tent.height / 2;
  const offsetX = slot === 'B' || slot === 'D' ? halfW : 0;
  const offsetY = slot === 'C' || slot === 'D' ? halfH : 0;
  return {
    x: tent.x + offsetX,
    y: tent.y + offsetY,
    width: halfW,
    height: halfH,
  };
}
