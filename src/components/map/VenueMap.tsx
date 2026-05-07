/**
 * 会場マップの SVG コンポーネント（独自描画版）。
 *
 * 戦略:
 * - 公式画像は **使わない**（リスペクト = 配置と形状の踏襲、ビジュアルはコエノマブランド）
 * - 会場の輪郭（venuePolygon）を SVG path で描く（公式画像から抽出した点列）
 * - 各テントの正方形を独自描画（コエノマ primary オレンジ）
 * - quad テントは A/B/C/D ラベル付き
 * - 装飾文字「PODCAST WEEKEND 2026」「↑ MAIN GATE」「※ キッチンブース」も SVG <text>
 *
 * 公式リスペクトの精神:
 * - テント 12, 13 が近く 14 がやや離れる、20/24 と 12 の階段配置などの位置関係
 * - メインゲートが左下寄り、キッチンブースが右下に飛び出している形状
 * - これらは booth-positions.json の polygon と venuePolygon で 100% 維持
 *
 * テイスト:
 * - 背景: コエノマ secondary-50 + amber-50 のソフトグラデ
 * - 会場枠: コエノマ primary-300 の細線
 * - テント: primary-500 塗り + 白文字
 * - 選択中: accent-cyan-500 波紋 + 強調枠
 */

'use client';

import type { SlotPlacement } from '@/lib/booth-map';
import type { BoothPositionsData, Day, Tent } from '@/lib/types';

interface Props {
  placements: SlotPlacement[];
  data: BoothPositionsData;
  day: Day;
  onSelectSlot: (placement: SlotPlacement) => void;
  onSelectTent: (tentId: number) => void;
  selectedPosition?: string;
  selectedTentId?: number;
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
  const dayShort = day === 'sat' ? '5.9' : '5.10';
  const daySub = day === 'sat' ? 'SAT / DAY1' : 'SUN / DAY2';

  // 会場輪郭の SVG path（venuePolygon → "M x y L x y L x y ... Z"）
  const venuePath = data.venuePolygon
    ? toSvgPath(data.venuePolygon)
    : null;

  return (
    <svg
      role="application"
      aria-label={`PCWE2026 会場マップ（${dayLabel}）`}
      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
      className="block h-auto w-full select-none"
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: 'manipulation' }}
    >
      <title>{`PCWE2026 会場マップ（${dayLabel}）`}</title>
      <desc>
        HOME/WORK VILLAGE のブース配置を独自描画したマップ。テント 1〜31 が番組ブース、32 はキッチンブース。
        公式マップの配置・形状を尊重しつつ、コエノマブランドカラーで再構成。
      </desc>

      <defs>
        {/* 背景グラデーション（コエノマ系）*/}
        <linearGradient id="venue-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-secondary-50)" />
          <stop offset="60%" stopColor="#fdf6f0" />
          <stop offset="100%" stopColor="var(--color-amber-50, #fef3c7)" />
        </linearGradient>
        <linearGradient id="venue-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fdfaf7" />
        </linearGradient>
      </defs>

      {/* 全体背景 */}
      <rect
        x={0}
        y={0}
        width={imageSize.width}
        height={imageSize.height}
        fill="url(#venue-bg)"
      />

      {/* 会場の輪郭（公式の形を独自に再描画）*/}
      {venuePath ? (
        <path
          d={venuePath}
          fill="url(#venue-fill)"
          stroke="var(--color-primary-300)"
          strokeWidth={2}
          strokeLinejoin="round"
          aria-hidden="true"
        />
      ) : (
        // フォールバック: 角丸矩形
        <rect
          x={20}
          y={20}
          width={imageSize.width - 40}
          height={imageSize.height - 40}
          fill="url(#venue-fill)"
          stroke="var(--color-primary-300)"
          strokeWidth={2}
          rx={20}
          aria-hidden="true"
        />
      )}

      {/* 装飾文字: 5.9/5.10 SAT/SUN（公式マップの右上配置を踏襲、薄く）*/}
      <text
        x={imageSize.width - 60}
        y={120}
        fill="var(--color-neutral-900)"
        fontSize={72}
        fontWeight={900}
        textAnchor="end"
        opacity={0.85}
        aria-hidden="true"
      >
        {dayShort}
      </text>
      <text
        x={imageSize.width - 60}
        y={170}
        fill="var(--color-neutral-900)"
        fontSize={20}
        fontWeight={800}
        textAnchor="end"
        opacity={0.7}
        aria-hidden="true"
      >
        {daySub}
      </text>

      {/* 装飾文字: PODCAST WEEKEND 2026（公式マップの中央配置を踏襲）*/}
      <text
        x={250}
        y={420}
        fill="var(--color-primary-200)"
        fontSize={56}
        fontWeight={900}
        opacity={0.55}
        aria-hidden="true"
      >
        PODCAST
      </text>
      <text
        x={250}
        y={485}
        fill="var(--color-primary-200)"
        fontSize={56}
        fontWeight={900}
        opacity={0.55}
        aria-hidden="true"
      >
        WEEKEND
      </text>
      <text
        x={250}
        y={555}
        fill="var(--color-primary-200)"
        fontSize={64}
        fontWeight={900}
        opacity={0.55}
        aria-hidden="true"
      >
        2026
      </text>

      {/* メインゲート（左下寄り、公式踏襲）*/}
      <text
        x={285}
        y={770}
        fill="var(--color-neutral-700)"
        fontSize={14}
        fontWeight={800}
        textAnchor="middle"
        aria-hidden="true"
      >
        ↑ MAIN GATE
      </text>

      {/* 各テント */}
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
  );
}

/** Polygon points → SVG path d 属性 */
function toSvgPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d + ' Z';
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
  const cx = x0 + width / 2;

  const isQuad = tent.shape === 'quad';
  const isKitchen = tent.shape === 'kitchen-booth';
  const isTentSelected = selectedTentId === tent.id;

  if (isQuad) {
    let isFiltered = false;
    if (highlightedPositions) {
      const anyHit = tent.slots.some((s) =>
        highlightedPositions.has(s.position),
      );
      isFiltered = !anyHit;
    }
    const hasAnyContent = tent.slots.some((s) => {
      const pl = placementByPosition.get(s.position);
      return pl && (pl.programId || pl.externalName);
    });
    const isSelectedAny =
      isTentSelected || tent.slots.some((s) => s.position === selectedPosition);

    return (
      <g aria-label={`テント ${tent.id}（4 区画）`}>
        <TentRect
          x={x0}
          y={y0}
          width={width}
          height={height}
          label={`${tent.id}`}
          showQuadHints
          isSelected={isSelectedAny}
          isFiltered={isFiltered}
          hasContent={hasAnyContent}
          ariaLabel={`テント ${tent.id}（タップで 4 区画から選択）`}
          onClick={() => onSelectTent(tent.id)}
        />
      </g>
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
    <g>
      <TentRect
        x={x0}
        y={y0}
        width={width}
        height={height}
        label={`${tent.id}`}
        isKitchen={isKitchen}
        isSelected={isSelected}
        isFiltered={isFiltered}
        hasContent={hasContent}
        ariaLabel={ariaLabel}
        onClick={() => {
          if (hasContent && placement) onSelectSlot(placement);
        }}
      />
      {/* キッチンブース注釈 */}
      {isKitchen ? (
        <text
          x={cx}
          y={y1 + 12}
          fill="var(--color-neutral-500)"
          fontSize={10}
          textAnchor="middle"
          aria-hidden="true"
        >
          ※キッチンブース
        </text>
      ) : null}
    </g>
  );
}

interface TentRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  showQuadHints?: boolean;
  isKitchen?: boolean;
  hasContent: boolean;
  isSelected: boolean;
  isFiltered: boolean;
  ariaLabel: string;
  onClick: () => void;
}

function TentRect({
  x,
  y,
  width,
  height,
  label,
  showQuadHints = false,
  isKitchen = false,
  hasContent,
  isSelected,
  isFiltered,
  ariaLabel,
  onClick,
}: TentRectProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const fontSize = Math.min(width, height) * 0.45;

  // テント色: 通常はコエノマ primary、キッチンは neutral
  const fillColor = isKitchen
    ? 'var(--color-neutral-300)'
    : !hasContent
      ? 'var(--color-neutral-200)'
      : 'var(--color-primary-500)';
  const labelColor = !isKitchen && hasContent ? '#fff' : 'var(--color-neutral-700)';

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
        opacity: isFiltered ? 0.3 : 1,
        transition: 'opacity 0.2s',
      }}
      className="focus-visible:[outline:2px_solid_var(--color-accent-cyan-500)] focus-visible:[outline-offset:2px]"
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

      {/* テント本体 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        stroke={isSelected ? 'var(--color-accent-cyan-600)' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        rx={4}
        className={
          hasContent
            ? 'transition-colors hover:[fill:var(--color-primary-600)]'
            : ''
        }
      />

      {/* テント番号 */}
      <text
        x={cx}
        y={cy + fontSize * 0.34}
        fill={labelColor}
        fontSize={fontSize}
        fontWeight={900}
        textAnchor="middle"
        aria-hidden="true"
      >
        {label}
      </text>

      {/* quad テントの A/B/C/D ヒント（4 隅に小さく）*/}
      {showQuadHints ? (
        <>
          <text x={x + 4} y={y + 12} fill={labelColor} fontSize={11} fontWeight={700} aria-hidden="true">A</text>
          <text x={x + width - 4} y={y + 12} fill={labelColor} fontSize={11} fontWeight={700} textAnchor="end" aria-hidden="true">B</text>
          <text x={x + 4} y={y + height - 4} fill={labelColor} fontSize={11} fontWeight={700} aria-hidden="true">C</text>
          <text x={x + width - 4} y={y + height - 4} fill={labelColor} fontSize={11} fontWeight={700} textAnchor="end" aria-hidden="true">D</text>
        </>
      ) : null}

      {/* フィルタヒント（半透明オーバーレイ）*/}
      {isFiltered ? (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="white"
          opacity={0.6}
          rx={4}
          aria-hidden="true"
        />
      ) : null}
    </g>
  );
}
