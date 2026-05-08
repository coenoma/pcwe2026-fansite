/**
 * BoothPositionPreview の SVG レイアウト計算用純粋関数。
 *
 * BoothPositionPreview は Client Component（useRef + Canvas 変換）のため、
 * ファイル全体が 'use client' になる。Server Component から関数を直接 import
 * できないため、純粋計算ロジックはこのファイルに分離。
 */

import type { BoothPositionsData } from './types';

export interface PreviewSlotData {
  /** 該当 slot の SVG 内座標（quad 場合は分割後）*/
  focusX: number;
  focusY: number;
  focusW: number;
  focusH: number;
  /** 全テントの簡素描画用データ */
  tents: ReadonlyArray<{
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  /** 会場輪郭の SVG path */
  venuePath: string | null;
  /** SVG の viewBox 寸法 */
  imgW: number;
  imgH: number;
  /** 該当テント ID（強調用）*/
  targetTentId: number;
}

/**
 * positionLabel + booth-positions.json から SVG プレビューに必要な計算済みデータを返す。
 * 該当テントが見つからない / position パース失敗の場合は null。
 */
export function buildBoothPreviewData(
  positionLabel: string,
  data: BoothPositionsData,
): PreviewSlotData | null {
  const m = positionLabel.match(/^(\d+)(?:-([A-D]))?$/);
  if (m === null) return null;
  const tentId = parseInt(m[1], 10);
  const slotLabel = m[2] as 'A' | 'B' | 'C' | 'D' | undefined;

  const targetTent = data.tents.find((t) => t.id === tentId);
  if (targetTent?.polygon === undefined) return null;
  const [[x0, y0], [x1, y1]] = targetTent.polygon;
  const tentW = x1 - x0;
  const tentH = y1 - y0;
  const isQuad = targetTent.shape === 'quad';

  // quad の slot 座標（VenueMap.tsx と同じロジック）
  const isRightAlignedAB = tentId >= 12 && tentId <= 27;
  const slotOffset =
    isQuad && slotLabel !== undefined
      ? (() => {
          const halfW = tentW / 2;
          const halfH = tentH / 2;
          const offsets = isRightAlignedAB
            ? {
                A: { dx: halfW, dy: 0 },
                B: { dx: halfW, dy: halfH },
                C: { dx: 0, dy: 0 },
                D: { dx: 0, dy: halfH },
              }
            : {
                A: { dx: 0, dy: 0 },
                B: { dx: halfW, dy: 0 },
                C: { dx: 0, dy: halfH },
                D: { dx: halfW, dy: halfH },
              };
          return { ...offsets[slotLabel], w: halfW, h: halfH };
        })()
      : { dx: 0, dy: 0, w: tentW, h: tentH };

  const FALLBACK = { width: 932, height: 808 };
  const { width: imgW, height: imgH } = data.imageSize ?? FALLBACK;

  const tents = data.tents
    .filter((t) => t.polygon !== undefined)
    .map((t) => {
      const polygon = t.polygon!;
      const [[tx0, ty0], [tx1, ty1]] = polygon;
      return {
        id: t.id,
        x: tx0,
        y: ty0,
        w: tx1 - tx0,
        h: ty1 - ty0,
      };
    });

  const venuePath = data.venuePolygon ? toSvgPath(data.venuePolygon) : null;

  return {
    focusX: x0 + slotOffset.dx,
    focusY: y0 + slotOffset.dy,
    focusW: slotOffset.w,
    focusH: slotOffset.h,
    tents,
    venuePath,
    imgW,
    imgH,
    targetTentId: tentId,
  };
}

function toSvgPath(
  points: ReadonlyArray<readonly [number, number]>,
): string {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d + ' Z';
}
