/**
 * 会場マップの SVG コンポーネント。
 *
 * - 32 テントを矩形で描画
 * - quad テントは A/B/C/D の 4 区画に分割
 * - テント / 区画タップで onSelect を呼ぶ
 * - 選択中ピンは波紋アニメーション、フィルタ非対象は半透明
 *
 * 座標は src/lib/booth-map.ts の TENT_LAYOUTS から取得（最小実装版）。
 * Phase 1.5 で Figma から正確な座標起こしに差し替える。
 *
 * アクセシビリティ:
 * - <svg role="application">、各 slot は <a tabindex="0" role="button">
 * - キーボード Tab で次のブースにフォーカス、Enter/Space で onSelect
 */

import {
  getQuadrantLayout,
  getTentLayout,
  type SlotPlacement,
} from '@/lib/booth-map';
import type { Day, Tent } from '@/lib/types';

interface Props {
  /** その日の slot 配置（getSlotPlacementsForDay の結果）*/
  placements: SlotPlacement[];
  /** booth-positions.json の tents 配列 */
  tents: Tent[];
  /** 表示中の日付 */
  day: Day;
  /** タップ時のコールバック */
  onSelect: (placement: SlotPlacement) => void;
  /** 選択中の position（"14-A" 等）。波紋表示用 */
  selectedPosition?: string;
  /** フィルタ ヒット position 集合（含まれないものは半透明）*/
  highlightedPositions?: Set<string>;
}

export function VenueMap({
  placements,
  tents,
  day,
  onSelect,
  selectedPosition,
  highlightedPositions,
}: Props) {
  const placementByPosition = new Map<string, SlotPlacement>();
  for (const p of placements) {
    placementByPosition.set(p.position, p);
  }

  const dayLabel = day === 'sat' ? '5月9日 土曜日' : '5月10日 日曜日';

  return (
    <svg
      role="application"
      aria-label={`PCWE2026 会場マップ（${dayLabel}）`}
      viewBox="0 0 1000 850"
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{`PCWE2026 会場マップ（${dayLabel}）`}</title>
      <desc>
        HOME/WORK VILLAGE のブース配置。テント 1〜31 が番組ブース、32 はキッチンブース。タップで番組情報を表示。
      </desc>

      {/* 背景 */}
      <rect
        x={0}
        y={0}
        width={1000}
        height={850}
        fill="var(--color-secondary-50)"
        rx={16}
      />

      {/* 装飾文字: PODCAST WEEKEND 2026 */}
      <text
        x={250}
        y={500}
        fill="var(--color-primary-200)"
        fontSize={56}
        fontWeight={700}
        opacity={0.5}
        aria-hidden="true"
      >
        PODCAST
      </text>
      <text
        x={250}
        y={570}
        fill="var(--color-primary-200)"
        fontSize={56}
        fontWeight={700}
        opacity={0.5}
        aria-hidden="true"
      >
        WEEKEND
      </text>
      <text
        x={250}
        y={650}
        fill="var(--color-primary-200)"
        fontSize={64}
        fontWeight={700}
        opacity={0.5}
        aria-hidden="true"
      >
        2026
      </text>

      {/* メインゲート */}
      <text
        x={460}
        y={830}
        fill="var(--color-neutral-700)"
        fontSize={14}
        fontWeight={700}
        textAnchor="middle"
        aria-hidden="true"
      >
        ↑ MAIN GATE
      </text>

      {/* 各テント */}
      {tents.map((tent) => {
        const layout = getTentLayout(tent.id);
        if (!layout) return null;
        return (
          <TentGroup
            key={tent.id}
            tent={tent}
            layout={layout}
            placementByPosition={placementByPosition}
            day={day}
            onSelect={onSelect}
            selectedPosition={selectedPosition}
            highlightedPositions={highlightedPositions}
          />
        );
      })}
    </svg>
  );
}

interface TentGroupProps {
  tent: Tent;
  layout: ReturnType<typeof getTentLayout>;
  placementByPosition: Map<string, SlotPlacement>;
  day: Day;
  onSelect: (placement: SlotPlacement) => void;
  selectedPosition?: string;
  highlightedPositions?: Set<string>;
}

function TentGroup({
  tent,
  layout,
  placementByPosition,
  onSelect,
  selectedPosition,
  highlightedPositions,
}: TentGroupProps) {
  if (!layout) return null;
  const isKitchen = tent.shape === 'kitchen-booth';
  const isUnassigned = tent.slots.length === 0 && !isKitchen;

  // single テント or キッチン or 未割当: テント矩形 1 つ
  if (tent.shape === 'single' || isKitchen || isUnassigned) {
    const slot = tent.slots[0];
    const positionLabel = slot?.position ?? `${tent.id}`;
    const placement = placementByPosition.get(positionLabel);
    return (
      <SlotCell
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={layout.height}
        label={`${tent.id}`}
        sublabel={undefined}
        placement={placement}
        position={positionLabel}
        kind={isKitchen ? 'kitchen' : isUnassigned ? 'unassigned' : 'single'}
        onSelect={onSelect}
        selectedPosition={selectedPosition}
        highlightedPositions={highlightedPositions}
      />
    );
  }

  // quad テント: 4 区画 + テント番号ラベル
  return (
    <g aria-label={`テント ${tent.id}`}>
      {/* テント全体の枠 */}
      <rect
        x={layout.x - 1}
        y={layout.y - 1}
        width={layout.width + 2}
        height={layout.height + 2}
        fill="none"
        stroke="var(--color-neutral-300)"
        strokeWidth={1}
        rx={4}
        aria-hidden="true"
      />
      {(['A', 'B', 'C', 'D'] as const).map((slotLabel) => {
        const q = getQuadrantLayout(layout, slotLabel);
        const positionLabel = `${tent.id}-${slotLabel}`;
        const placement = placementByPosition.get(positionLabel);
        return (
          <SlotCell
            key={slotLabel}
            x={q.x}
            y={q.y}
            width={q.width}
            height={q.height}
            label={`${tent.id}`}
            sublabel={slotLabel}
            placement={placement}
            position={positionLabel}
            kind="quad"
            onSelect={onSelect}
            selectedPosition={selectedPosition}
            highlightedPositions={highlightedPositions}
          />
        );
      })}
    </g>
  );
}

interface SlotCellProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  sublabel?: string;
  placement?: SlotPlacement;
  position: string;
  kind: 'single' | 'quad' | 'kitchen' | 'unassigned';
  onSelect: (placement: SlotPlacement) => void;
  selectedPosition?: string;
  highlightedPositions?: Set<string>;
}

function SlotCell({
  x,
  y,
  width,
  height,
  label,
  sublabel,
  placement,
  position,
  kind,
  onSelect,
  selectedPosition,
  highlightedPositions,
}: SlotCellProps) {
  const isSelected = selectedPosition === position;
  const isFiltered =
    highlightedPositions !== undefined && !highlightedPositions.has(position);

  const isKitchen = kind === 'kitchen';
  const isUnassigned = kind === 'unassigned';
  const hasContent =
    placement !== undefined &&
    (placement.programId !== undefined || placement.externalName !== undefined);

  // 配色決定
  const fillColor = isKitchen
    ? 'var(--color-neutral-200)'
    : isUnassigned
      ? 'var(--color-neutral-100)'
      : hasContent
        ? 'var(--color-primary-500)'
        : 'var(--color-neutral-200)';
  const labelColor = hasContent || isKitchen ? '#fff' : 'var(--color-neutral-500)';

  const ariaLabel = isKitchen
    ? `テント ${label} キッチンブース`
    : isUnassigned
      ? `テント ${label} 未割当`
      : placement?.programId
        ? `ブース ${position} （タップで番組情報）`
        : placement?.externalName
          ? `ブース ${position} ${placement.externalName}（外部参照）`
          : `ブース ${position}`;

  const handleClick = () => {
    if (placement && hasContent) {
      onSelect(placement);
    } else if (isKitchen || isUnassigned) {
      // 情報がないものはクリックしても何もしない（デザイン的にフォーカス可だが選択は無効）
    }
  };

  return (
    <g
      role={hasContent ? 'button' : 'group'}
      tabIndex={hasContent ? 0 : -1}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (hasContent && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{
        cursor: hasContent ? 'pointer' : 'default',
        opacity: isFiltered ? 0.3 : 1,
        transition: 'opacity 0.2s, transform 0.15s',
        outline: 'none',
      }}
      className="focus-visible:[outline:2px_solid_var(--color-primary-700)] focus-visible:[outline-offset:2px]"
    >
      {/* 選択中の波紋 */}
      {isSelected ? (
        <rect
          x={x - 4}
          y={y - 4}
          width={width + 8}
          height={height + 8}
          fill="none"
          stroke="var(--color-accent-cyan-500)"
          strokeWidth={2}
          rx={6}
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

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        rx={4}
        stroke={isSelected ? 'var(--color-primary-700)' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill={labelColor}
        fontSize={Math.min(width, height) > 40 ? 16 : 12}
        fontWeight={700}
        textAnchor="middle"
        aria-hidden="true"
      >
        {sublabel ? `${label}-${sublabel}` : label}
      </text>
      {isKitchen ? (
        <text
          x={x + width / 2}
          y={y + height + 12}
          fill="var(--color-neutral-500)"
          fontSize={9}
          textAnchor="middle"
          aria-hidden="true"
        >
          キッチン
        </text>
      ) : null}
    </g>
  );
}
