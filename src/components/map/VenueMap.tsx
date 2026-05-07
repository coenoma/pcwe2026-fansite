/**
 * 会場マップの SVG コンポーネント（公式画像背景方式 + ピンチズーム）。
 *
 * 戦略:
 * - 背景に公式 webp 画像を SVG <image> で配置（pixel 完全一致）
 * - 各テントの polygon にクリッカブル透明矩形を重ねる
 * - quad テント（A/B/C/D 4 区画）は **テント全体を 1 つのタップ領域** として扱う
 *   → タップで TentOverviewSheet に遷移して 4 区画を選ばせる
 *   → 小さい A/B/C/D を SP で正確タップする困難を回避
 * - single テント / スポンサー / キッチン → 直接 BoothBottomSheet
 * - react-zoom-pan-pinch でピンチズーム + パン
 *
 * テイスト:
 * - 公式画像をそのまま尊重、コエノマアクセントは選択波紋・ホバー強調のみ
 *
 * アクセシビリティ:
 * - <svg role="application">、各タップ領域は <g role="button" tabindex="0">
 * - キーボード Tab → Enter で選択、Esc でシート閉じる（親で対応）
 */

'use client';

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { SlotPlacement } from '@/lib/booth-map';
import type { BoothPositionsData, Day, Tent } from '@/lib/types';

interface Props {
  /** その日の slot 配置 */
  placements: SlotPlacement[];
  /** booth-positions.json 全体 */
  data: BoothPositionsData;
  /** 表示中の日付 */
  day: Day;
  /** single テント or スポンサー or キッチン → 直接 placement 選択 */
  onSelectSlot: (placement: SlotPlacement) => void;
  /** quad テント全体タップ → テント概要シート（4 区画選択） */
  onSelectTent: (tentId: number) => void;
  /** 選択中の position（"14-A" 等）。波紋表示用 */
  selectedPosition?: string;
  /** 選択中のテント ID（テント全体ハイライト用） */
  selectedTentId?: number;
  /** フィルタヒット position 集合（含まれないものは半透明）*/
  highlightedPositions?: Set<string>;
}

const FALLBACK_IMAGE_SIZE = { width: 932, height: 808 };

export function VenueMap({
  placements,
  data,
  day,
  onSelectSlot,
  onSelectTent,
  selectedPosition,
  selectedTentId,
  highlightedPositions,
}: Props) {
  const imageSize = data.imageSize ?? FALLBACK_IMAGE_SIZE;
  const placementByPosition = new Map<string, SlotPlacement>();
  for (const p of placements) {
    placementByPosition.set(p.position, p);
  }

  const dayLabel = day === 'sat' ? '5月9日 土曜日' : '5月10日 日曜日';
  const imageHref = day === 'sat'
    ? '/images/map/pcwe2026-day1.webp'
    : '/images/map/pcwe2026-day2.webp';

  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.8}
      maxScale={3}
      centerOnInit
      doubleClick={{ mode: 'toggle', step: 1.5 }}
      panning={{ velocityDisabled: true }}
      wheel={{ step: 0.2 }}
    >
      {() => (
        <TransformComponent
          wrapperClass="!w-full !h-auto"
          contentClass="!w-full !h-auto"
        >
          <svg
            role="application"
            aria-label={`PCWE2026 会場マップ（${dayLabel}）`}
            viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
            className="h-auto w-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <title>{`PCWE2026 会場マップ（${dayLabel}）`}</title>
            <desc>
              HOME/WORK VILLAGE のブース配置。テント 1〜31 が番組ブース、32 はキッチンブース。
              ピンチで拡大・ドラッグで移動。テントタップで詳細表示。
            </desc>

            {/* 公式画像背景 */}
            <image
              href={imageHref}
              x={0}
              y={0}
              width={imageSize.width}
              height={imageSize.height}
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            />

            {/* クリッカブルレイヤー */}
            {data.tents.map((tent) => (
              <TentClickArea
                key={`${tent.id}-${day}`}
                tent={tent}
                placementByPosition={placementByPosition}
                onSelectSlot={onSelectSlot}
                onSelectTent={onSelectTent}
                selectedPosition={selectedPosition}
                selectedTentId={selectedTentId}
                highlightedPositions={highlightedPositions}
              />
            ))}
          </svg>
        </TransformComponent>
      )}
    </TransformWrapper>
  );
}

interface TentClickAreaProps {
  tent: Tent;
  placementByPosition: Map<string, SlotPlacement>;
  onSelectSlot: (placement: SlotPlacement) => void;
  onSelectTent: (tentId: number) => void;
  selectedPosition?: string;
  selectedTentId?: number;
  highlightedPositions?: Set<string>;
}

function TentClickArea({
  tent,
  placementByPosition,
  onSelectSlot,
  onSelectTent,
  selectedPosition,
  selectedTentId,
  highlightedPositions,
}: TentClickAreaProps) {
  if (!tent.polygon) return null;
  const [[x0, y0], [x1, y1]] = tent.polygon;
  const width = x1 - x0;
  const height = y1 - y0;

  const isQuad = tent.shape === 'quad';
  const isTentSelected = selectedTentId === tent.id;

  // quad テント: 全体を 1 つのタップ領域に
  if (isQuad) {
    // フィルタ：テント内のいずれかの slot が highlightedPositions に含まれていれば全体ヒット
    let isFiltered = false;
    if (highlightedPositions) {
      const anyHit = tent.slots.some((s) =>
        highlightedPositions.has(s.position),
      );
      isFiltered = !anyHit;
    }
    // テント内の slot のうち、その日に何らかの占有がある区画が 1 つでもあれば「コンテンツあり」
    const hasAnyContent = tent.slots.some((s) => {
      const pl = placementByPosition.get(s.position);
      return pl && (pl.programId || pl.externalName);
    });

    return (
      <SlotOverlay
        x={x0}
        y={y0}
        width={width}
        height={height}
        ariaLabel={`テント ${tent.id}（タップで 4 区画から選択）`}
        hasContent={hasAnyContent}
        isSelected={isTentSelected || tent.slots.some((s) => s.position === selectedPosition)}
        isFiltered={isFiltered}
        onClick={() => onSelectTent(tent.id)}
      />
    );
  }

  // single テント or キッチン or 未割当
  const slot = tent.slots[0];
  const positionLabel = slot?.position ?? `${tent.id}`;
  const placement = placementByPosition.get(positionLabel);
  const hasContent =
    placement !== undefined &&
    (placement.programId !== undefined || placement.externalName !== undefined);
  const isFiltered =
    highlightedPositions !== undefined &&
    !highlightedPositions.has(positionLabel);
  const isSelected = selectedPosition === positionLabel;

  const ariaLabel = !hasContent
    ? `テント ${positionLabel}（情報なし）`
    : placement?.programId
      ? `ブース ${positionLabel}（タップで番組情報）`
      : placement?.externalKind === 'sponsor'
        ? `テント ${positionLabel} ${placement.externalName}（スポンサー）`
        : placement?.externalKind === 'kitchen-only'
          ? `テント ${positionLabel} 飲食ブース`
          : `テント ${positionLabel}`;

  return (
    <SlotOverlay
      x={x0}
      y={y0}
      width={width}
      height={height}
      ariaLabel={ariaLabel}
      hasContent={hasContent}
      isSelected={isSelected}
      isFiltered={isFiltered}
      onClick={() => {
        if (hasContent && placement) onSelectSlot(placement);
      }}
    />
  );
}

interface SlotOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
  ariaLabel: string;
  hasContent: boolean;
  isSelected: boolean;
  isFiltered: boolean;
  onClick: () => void;
}

function SlotOverlay({
  x,
  y,
  width,
  height,
  ariaLabel,
  hasContent,
  isSelected,
  isFiltered,
  onClick,
}: SlotOverlayProps) {
  return (
    <g
      role={hasContent ? 'button' : 'group'}
      tabIndex={hasContent ? 0 : -1}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (hasContent && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        cursor: hasContent ? 'pointer' : 'default',
        outline: 'none',
      }}
      className="focus-visible:[outline:2px_solid_var(--color-primary-700)] focus-visible:[outline-offset:1px]"
    >
      {/* フィルタ非対象は白の半透明で覆う */}
      {isFiltered ? (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="white"
          opacity={0.7}
          aria-hidden="true"
          rx={6}
        />
      ) : null}

      {/* 選択中の波紋 */}
      {isSelected ? (
        <rect
          x={x - 3}
          y={y - 3}
          width={width + 6}
          height={height + 6}
          fill="none"
          stroke="var(--color-accent-cyan-500)"
          strokeWidth={3}
          rx={8}
          aria-hidden="true"
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.3;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
      ) : null}

      {/* ホバー / 選択時の強調枠（クリック領域として透明矩形を確保）*/}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isSelected ? 'var(--color-accent-cyan-500)' : 'transparent'}
        fillOpacity={isSelected ? 0.18 : 0}
        stroke={isSelected ? 'var(--color-accent-cyan-600)' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        rx={6}
        className={
          hasContent
            ? 'transition-all hover:fill-accent-cyan-500/15 hover:stroke-accent-cyan-500 hover:[stroke-width:2px]'
            : ''
        }
      />
    </g>
  );
}
