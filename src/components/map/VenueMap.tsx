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

import { Minus, Move, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import {
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch';
import type { SlotPlacement } from '@/lib/booth-map';
import type { BoothPositionsData, Day, Tent } from '@/lib/types';

/** quad テントを A/B/C/D 個別タップに切替える scale 閾値 */
const QUAD_DETAIL_SCALE_THRESHOLD = 1.8;

interface Props {
  placements: SlotPlacement[];
  data: BoothPositionsData;
  day: Day;
  onSelectSlot: (placement: SlotPlacement) => void;
  onSelectTent: (tentId: number) => void;
  selectedPosition?: string;
  selectedTentId?: number;
  highlightedPositions?: Set<string>;
  /** お気に入り中の programId 集合（ピンに⭐️マーク）*/
  favoriteProgramIds?: Set<string>;
  /** 「会えた」済みの position 集合（ピンに✅マーク）*/
  visitedPositions?: Set<string>;
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
  favoriteProgramIds,
  visitedPositions,
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

  // 操作開始でヒント非表示（一度触ったら邪魔しない）
  const [hintVisible, setHintVisible] = useState(true);
  // 現在のズーム scale（quad テントの個別タップ切替用）
  const [scale, setScale] = useState(1);
  const isDetailZoom = scale >= QUAD_DETAIL_SCALE_THRESHOLD;

  // マップを単独でズーム + パン可能にする（react-zoom-pan-pinch）
  // 親に aspect-ratio を当てて TransformWrapper が画面全体に拡張されないように制御
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-white"
      style={{ aspectRatio: `${imageSize.width} / ${imageSize.height}` }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        doubleClick={{ mode: 'toggle', step: 1.5 }}
        wheel={{ step: 0.2 }}
        panning={{ velocityDisabled: true }}
        pinch={{ step: 5 }}
        onPanningStart={() => setHintVisible(false)}
        onPinchStart={() => setHintVisible(false)}
        onZoomStart={() => setHintVisible(false)}
        onTransform={(_ref, state) => setScale(state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              <svg
                role="application"
                aria-label={`PCWE2026 会場マップ（${dayLabel}）`}
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                className="block h-full w-full select-none"
                preserveAspectRatio="xMidYMid meet"
                style={{ touchAction: 'none' }}
              >
                <title>{`PCWE2026 会場マップ（${dayLabel}）`}</title>
                <desc>
                  HOME/WORK VILLAGE のブース配置を独自描画したマップ。テント 1〜31 が番組ブース、32 はキッチンブース。
                  公式マップの配置・形状を尊重しつつ、コエノマブランドカラーで再構成。ピンチ・マウスホイールで拡大可能。
                </desc>

                <defs>
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

                {/* 会場輪郭 */}
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

                {/* 装飾文字: 日付（右上）*/}
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

                {/* PODCAST WEEKEND 2026 */}
                <text x={250} y={420} fill="var(--color-primary-200)" fontSize={56} fontWeight={900} opacity={0.55} aria-hidden="true">PODCAST</text>
                <text x={250} y={485} fill="var(--color-primary-200)" fontSize={56} fontWeight={900} opacity={0.55} aria-hidden="true">WEEKEND</text>
                <text x={250} y={555} fill="var(--color-primary-200)" fontSize={64} fontWeight={900} opacity={0.55} aria-hidden="true">2026</text>

                {/* メインゲート */}
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
                    favoriteProgramIds={favoriteProgramIds}
                    visitedPositions={visitedPositions}
                    isDetailZoom={isDetailZoom}
                  />
                ))}
              </svg>
            </TransformComponent>

            {/* 操作ヒント（左上、操作開始でフェードアウト）*/}
            <div
              className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-neutral-900/70 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur transition-all duration-500"
              style={{
                opacity: hintVisible ? 1 : 0,
                transform: hintVisible ? 'translateY(0)' : 'translateY(-8px)',
              }}
              aria-hidden={!hintVisible}
            >
              <Move size={11} aria-hidden="true" />
              <span className="hidden sm:inline">ピンチ / ホイール / ボタンで拡大</span>
              <span className="sm:hidden">ピンチで拡大</span>
            </div>

            {/* 拡大時のテント別表示ヒント（quad テントの個別タップ可能化）*/}
            {isDetailZoom ? (
              <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-accent-cyan-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur">
                <span aria-hidden="true">🎯</span>
                <span>A・B・C・D 直接タップ可能</span>
              </div>
            ) : null}

            {/* ズームコントロール（右下に固定）*/}
            <div className="pointer-events-auto absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
              <button
                type="button"
                aria-label="拡大"
                onClick={() => zoomIn()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-md backdrop-blur transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="縮小"
                onClick={() => zoomOut()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-md backdrop-blur transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="ズームをリセット"
                onClick={() => resetTransform()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-md backdrop-blur transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                <RotateCcw size={14} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
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
  favoriteProgramIds?: Set<string>;
  visitedPositions?: Set<string>;
  /** scale が閾値以上なら quad テントは A/B/C/D を個別タップに切替 */
  isDetailZoom?: boolean;
}

function TentClickArea({
  tent,
  placementByPosition,
  onSelectSlot,
  onSelectTent,
  selectedPosition,
  selectedTentId,
  highlightedPositions,
  favoriteProgramIds,
  visitedPositions,
  isDetailZoom = false,
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

    const hasFavorite = tent.slots.some((s) => {
      const pl = placementByPosition.get(s.position);
      return pl?.programId !== undefined && favoriteProgramIds?.has(pl.programId);
    });
    const hasVisited = tent.slots.some((s) => visitedPositions?.has(s.position));

    // 拡大時: A/B/C/D の 4 区画それぞれを個別タップ可能に切替
    if (isDetailZoom) {
      // 4 区画を 2x2 グリッドで配置
      const halfW = width / 2;
      const halfH = height / 2;
      const quadrantOffsets: Record<'A' | 'B' | 'C' | 'D', { dx: number; dy: number }> = {
        A: { dx: 0, dy: 0 },
        B: { dx: halfW, dy: 0 },
        C: { dx: 0, dy: halfH },
        D: { dx: halfW, dy: halfH },
      };
      return (
        <g
          aria-label={`テント ${tent.id}（4 区画個別タップモード）`}
          style={{ transition: 'opacity 0.25s ease-out' }}
        >
          {(['A', 'B', 'C', 'D'] as const).map((slotLabel) => {
            const offset = quadrantOffsets[slotLabel];
            const quadX = x0 + offset.dx;
            const quadY = y0 + offset.dy;
            const positionLabel = `${tent.id}-${slotLabel}`;
            const placement = placementByPosition.get(positionLabel);
            const slotHasContent =
              placement !== undefined &&
              (placement.programId !== undefined ||
                placement.externalName !== undefined);
            const slotIsSelected = selectedPosition === positionLabel;
            const slotIsFiltered =
              highlightedPositions !== undefined &&
              !highlightedPositions.has(positionLabel);
            const slotIsFavorite =
              placement?.programId !== undefined &&
              (favoriteProgramIds?.has(placement.programId) ?? false);
            const slotIsVisited =
              visitedPositions?.has(positionLabel) ?? false;

            return (
              <TentRect
                key={slotLabel}
                x={quadX}
                y={quadY}
                width={halfW}
                height={halfH}
                label={`${tent.id}-${slotLabel}`}
                kind="program"
                isSelected={slotIsSelected}
                isFiltered={slotIsFiltered}
                hasContent={slotHasContent}
                isFavorite={slotIsFavorite}
                isVisited={slotIsVisited}
                ariaLabel={`ブース ${positionLabel}${
                  placement?.programId ? '（タップで番組情報）' : ''
                }`}
                onClick={() => {
                  if (slotHasContent && placement) onSelectSlot(placement);
                }}
              />
            );
          })}
        </g>
      );
    }

    // 通常表示: テント全体を 1 つのタップ領域に
    return (
      <g
        aria-label={`テント ${tent.id}（4 区画）`}
        className="animate-[fadeIn_0.25s_ease-out]"
      >
        <TentRect
          x={x0}
          y={y0}
          width={width}
          height={height}
          label={`${tent.id}`}
          showQuadHints
          kind="program"
          isSelected={isSelectedAny}
          isFiltered={isFiltered}
          hasContent={hasAnyContent}
          isFavorite={hasFavorite}
          isVisited={hasVisited}
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

  // kind 判定（色分け用）
  const kind: TentRectKind = isKitchen
    ? 'kitchen'
    : placement?.externalKind === 'kitchen-only'
      ? 'kitchen'
      : placement?.externalKind === 'sponsor'
        ? 'sponsor'
        : 'program';
  const isFavorite =
    placement?.programId !== undefined &&
    (favoriteProgramIds?.has(placement.programId) ?? false);
  const isVisited = visitedPositions?.has(positionLabel) ?? false;

  const ariaLabel = !hasContent
    ? `テント ${positionLabel}（情報なし）`
    : placement?.programId
      ? `ブース ${positionLabel}（タップで番組情報）${isFavorite ? '・お気に入り済' : ''}${isVisited ? '・会えた済' : ''}`
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
        kind={kind}
        isSelected={isSelected}
        isFiltered={isFiltered}
        hasContent={hasContent}
        isFavorite={isFavorite}
        isVisited={isVisited}
        ariaLabel={ariaLabel}
        onClick={() => {
          if (hasContent && placement) onSelectSlot(placement);
        }}
      />
      {/* キッチンブース注釈 */}
      {isKitchen ? (
        <text
          x={cx}
          y={y1 + 13}
          fill="var(--color-neutral-600)"
          fontSize={11}
          fontWeight={700}
          textAnchor="middle"
          aria-hidden="true"
        >
          🍳 キッチン
        </text>
      ) : null}
    </g>
  );
}

type TentRectKind = 'program' | 'sponsor' | 'kitchen';

interface TentRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  showQuadHints?: boolean;
  kind: TentRectKind;
  hasContent: boolean;
  isSelected: boolean;
  isFiltered: boolean;
  isFavorite?: boolean;
  isVisited?: boolean;
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
  kind,
  hasContent,
  isSelected,
  isFiltered,
  isFavorite = false,
  isVisited = false,
  ariaLabel,
  onClick,
}: TentRectProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  // 番号サイズ拡大（読みやすさ重視）
  const fontSize = Math.min(width, height) * 0.55;

  // kind 別の色分け
  // - program: 番組ブース → primary オレンジ（コエノマブランド）
  // - sponsor: スポンサー → secondary 青（落ち着き）
  // - kitchen: キッチンブース → amber 黄系（食感）
  // - 未割当: neutral グレー
  const fillColor = !hasContent
    ? 'var(--color-neutral-200)'
    : kind === 'sponsor'
      ? 'var(--color-secondary-500)'
      : kind === 'kitchen'
        ? '#f59e0b' // amber-500
        : 'var(--color-primary-500)';
  const labelColor = hasContent ? '#fff' : 'var(--color-neutral-600)';

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

      {/* お気に入りバッジ（右上、⭐️）*/}
      {isFavorite ? (
        <g aria-hidden="true">
          <circle
            cx={x + width - 6}
            cy={y + 6}
            r={9}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={1.5}
          />
          <text
            x={x + width - 6}
            y={y + 10}
            fontSize={11}
            textAnchor="middle"
            fill="#fff"
          >
            ★
          </text>
        </g>
      ) : null}

      {/* 「会えた」バッジ（左下、✓）*/}
      {isVisited ? (
        <g aria-hidden="true">
          <circle
            cx={x + 6}
            cy={y + height - 6}
            r={9}
            fill="var(--color-accent-cyan-500)"
            stroke="#fff"
            strokeWidth={1.5}
          />
          <text
            x={x + 6}
            y={y + height - 2}
            fontSize={11}
            textAnchor="middle"
            fill="#fff"
            fontWeight={900}
          >
            ✓
          </text>
        </g>
      ) : null}
    </g>
  );
}
