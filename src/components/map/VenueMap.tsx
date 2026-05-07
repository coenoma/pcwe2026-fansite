/**
 * 会場マップの SVG コンポーネント（公式画像背景方式）。
 *
 * 戦略:
 * - 背景に公式 webp 画像を SVG <image> で配置（pixel 完全一致）
 * - 各テントの polygon に透明クリッカブル矩形を重ねる
 * - quad テントは A/B/C/D で 2x2 分割
 * - 選択中ピンは accent-cyan の波紋アニメ、フィルタ非対象は半透明
 *
 * テイスト方針:
 * - マップ自体は公式画像をリスペクトしてそのまま表示（菊池さん指示）
 * - 周辺 UI（ヘッダー・ボトムシート・公式DLセクション）はコエノマブランド色
 *
 * アクセシビリティ:
 * - <svg role="application">、各 slot は <a tabindex="0" role="button">
 * - キーボード Tab で次のブースにフォーカス、Enter/Space で onSelect
 */

import type { SlotPlacement } from '@/lib/booth-map';
import type { BoothPositionsData, Day, Tent } from '@/lib/types';

interface Props {
  /** その日の slot 配置（getSlotPlacementsForDay の結果）*/
  placements: SlotPlacement[];
  /** booth-positions.json 全体（imageSize 取得用）*/
  data: BoothPositionsData;
  /** 表示中の日付 */
  day: Day;
  /** タップ時のコールバック */
  onSelect: (placement: SlotPlacement) => void;
  /** 選択中の position（"14-A" 等）。波紋表示用 */
  selectedPosition?: string;
  /** フィルタ ヒット position 集合（含まれないものは半透明）*/
  highlightedPositions?: Set<string>;
}

const FALLBACK_IMAGE_SIZE = { width: 932, height: 808 };

export function VenueMap({
  placements,
  data,
  day,
  onSelect,
  selectedPosition,
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
    <svg
      role="application"
      aria-label={`PCWE2026 会場マップ（${dayLabel}）`}
      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{`PCWE2026 会場マップ（${dayLabel}）`}</title>
      <desc>
        HOME/WORK VILLAGE のブース配置（公式画像をもとに描画）。テント 1〜31 が番組ブース、32 はキッチンブース。タップで番組情報を表示。
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
          onSelect={onSelect}
          selectedPosition={selectedPosition}
          highlightedPositions={highlightedPositions}
        />
      ))}
    </svg>
  );
}

interface TentClickAreaProps {
  tent: Tent;
  placementByPosition: Map<string, SlotPlacement>;
  onSelect: (placement: SlotPlacement) => void;
  selectedPosition?: string;
  highlightedPositions?: Set<string>;
}

function TentClickArea({
  tent,
  placementByPosition,
  onSelect,
  selectedPosition,
  highlightedPositions,
}: TentClickAreaProps) {
  if (!tent.polygon) return null;
  const [[x0, y0], [x1, y1]] = tent.polygon;
  const width = x1 - x0;
  const height = y1 - y0;

  const isKitchen = tent.shape === 'kitchen-booth';
  const isQuad = tent.shape === 'quad';
  const isUnassigned = tent.slots.length === 0 && !isKitchen;

  // single テント or キッチン or 未割当 → 1 つのクリックエリア
  if (!isQuad || isUnassigned) {
    const slot = tent.slots[0];
    const positionLabel = slot?.position ?? `${tent.id}`;
    const placement = placementByPosition.get(positionLabel);
    return (
      <SlotOverlay
        x={x0}
        y={y0}
        width={width}
        height={height}
        placement={placement}
        position={positionLabel}
        kind={isKitchen ? 'kitchen' : isUnassigned ? 'unassigned' : 'single'}
        onSelect={onSelect}
        selectedPosition={selectedPosition}
        highlightedPositions={highlightedPositions}
      />
    );
  }

  // quad テント: 2x2 で A/B/C/D に分割
  // A 左上 / B 右上 / C 左下 / D 右下
  const halfW = width / 2;
  const halfH = height / 2;
  const quadrants = [
    { slot: 'A' as const, x: x0,         y: y0 },
    { slot: 'B' as const, x: x0 + halfW, y: y0 },
    { slot: 'C' as const, x: x0,         y: y0 + halfH },
    { slot: 'D' as const, x: x0 + halfW, y: y0 + halfH },
  ];

  return (
    <g aria-label={`テント ${tent.id}`}>
      {quadrants.map(({ slot, x, y }) => {
        const positionLabel = `${tent.id}-${slot}`;
        const placement = placementByPosition.get(positionLabel);
        return (
          <SlotOverlay
            key={slot}
            x={x}
            y={y}
            width={halfW}
            height={halfH}
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

interface SlotOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
  placement?: SlotPlacement;
  position: string;
  kind: 'single' | 'quad' | 'kitchen' | 'unassigned';
  onSelect: (placement: SlotPlacement) => void;
  selectedPosition?: string;
  highlightedPositions?: Set<string>;
}

function SlotOverlay({
  x,
  y,
  width,
  height,
  placement,
  position,
  kind,
  onSelect,
  selectedPosition,
  highlightedPositions,
}: SlotOverlayProps) {
  const isSelected = selectedPosition === position;
  const isFiltered =
    highlightedPositions !== undefined && !highlightedPositions.has(position);

  const isKitchen = kind === 'kitchen';
  const isUnassigned = kind === 'unassigned';
  const hasContent =
    placement !== undefined &&
    (placement.programId !== undefined || placement.externalName !== undefined);

  const ariaLabel = isKitchen
    ? `テント ${position} キッチンブース`
    : isUnassigned
      ? `テント ${position} 未割当`
      : placement?.programId
        ? `ブース ${position}（タップで番組情報）`
        : placement?.externalName
          ? `ブース ${position} ${placement.externalName}（外部参照）`
          : `ブース ${position}`;

  const handleClick = () => {
    if (placement && hasContent) {
      onSelect(placement);
    }
  };

  // フィルタ半透明のオーバーレイ（白で 70% 半透明 = 元画像が薄く見える）
  // ヒット中は透明、外れは半透明白で覆う
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

      {/* ホバー / 選択時の強調枠 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isSelected ? 'var(--color-accent-cyan-500)' : 'transparent'}
        fillOpacity={isSelected ? 0.15 : 0}
        stroke={isSelected ? 'var(--color-accent-cyan-600)' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        rx={4}
        className={
          hasContent
            ? 'transition-all hover:fill-accent-cyan-500/20 hover:stroke-accent-cyan-500 hover:[stroke-width:2px]'
            : ''
        }
      />
    </g>
  );
}
