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
import { useEffect, useState } from 'react';
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
  /** v1.13: 番組サムネ表示モード（single tent + detail zoom slot に番組アートワーク
   *  を SVG image で表示。quad テント全体表示・キッチン・スポンサーには適用しない）*/
  showThumbnails?: boolean;
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
  showThumbnails = false,
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
  // detail zoom ヒント: 初見ユーザーのみ表示。一度 detail zoom 状態を経験したら、
  // localStorage に既読フラグを保存して以降は表示しない。
  const [detailZoomHintSeen, setDetailZoomHintSeen] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDetailZoomHintSeen(
      localStorage.getItem('pcwe2026-detail-zoom-hint-seen') === '1',
    );
  }, []);
  useEffect(() => {
    if (!isDetailZoom || detailZoomHintSeen) return;
    // detail zoom に入って 4 秒後に「見た」とマーク（自動で消える + 二度と出ない）
    const timer = window.setTimeout(() => {
      setDetailZoomHintSeen(true);
      try {
        localStorage.setItem('pcwe2026-detail-zoom-hint-seen', '1');
      } catch (error) {
        console.warn('⚠️ detail zoom ヒント既読の保存に失敗しました', error);
      }
    }, 4_000);
    return () => window.clearTimeout(timer);
  }, [isDetailZoom, detailZoomHintSeen]);

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

                {/* PODCAST WEEKEND 2026（左端テント 1-7 と被らない位置に右シフト）*/}
                <text x={170} y={420} fill="var(--color-primary-200)" fontSize={48} fontWeight={900} opacity={0.45} aria-hidden="true">PODCAST</text>
                <text x={170} y={480} fill="var(--color-primary-200)" fontSize={48} fontWeight={900} opacity={0.45} aria-hidden="true">WEEKEND</text>
                <text x={170} y={550} fill="var(--color-primary-200)" fontSize={54} fontWeight={900} opacity={0.45} aria-hidden="true">2026</text>

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

                {/* 装飾的な建物（公式マップに描かれている小屋等）*/}
                {data.decorativeBuildings?.map((bldg) => (
                  <g key={bldg.id} aria-hidden="true">
                    {/* 上面（3D 感）*/}
                    {bldg.topPolygon ? (
                      <polygon
                        points={bldg.topPolygon.map((p) => p.join(',')).join(' ')}
                        fill="#f5f5f5"
                        stroke="#cbd5e0"
                        strokeWidth={1}
                      />
                    ) : null}
                    {/* 側面（右奥）*/}
                    {bldg.sidePolygon ? (
                      <polygon
                        points={bldg.sidePolygon.map((p) => p.join(',')).join(' ')}
                        fill="#d4d4d4"
                        stroke="#cbd5e0"
                        strokeWidth={1}
                      />
                    ) : null}
                    {/* 正面 */}
                    <rect
                      x={bldg.frontRect.x}
                      y={bldg.frontRect.y}
                      width={bldg.frontRect.width}
                      height={bldg.frontRect.height}
                      fill="#e5e7eb"
                      stroke="#9ca3af"
                      strokeWidth={1}
                      rx={1}
                    />
                  </g>
                ))}

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
                    showThumbnails={showThumbnails}
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

            {/* 拡大時のテント別表示ヒント（quad テントの個別タップ可能化）。
                v1.12.1: 初見ユーザーのみ表示、一度 detail zoom 状態に入ったら
                localStorage 既読フラグで以降は非表示。4 秒のフェード前提。 */}
            {isDetailZoom && !detailZoomHintSeen ? (
              <div
                className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-accent-cyan-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur transition-opacity duration-500 animate-[fadeIn_0.3s_ease-out]"
                aria-hidden="true"
              >
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
  /** v1.13: 各 slot 矩形を番組サムネで塗る */
  showThumbnails?: boolean;
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
  showThumbnails = false,
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
      // v1.11 修正: selectedPosition がテント内にいる場合はフィルタ条件外でも
      // 半透明にしない（選択中シートとマップ表示の矛盾解消）。
      const containsSelected = tent.slots.some(
        (s) => s.position === selectedPosition,
      );
      isFiltered = !anyHit && !containsSelected;
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
      // 公式マップの A/B/C/D 配置:
      //   テント 12-27: 右上=A、右下=B、左上=C、左下=D
      //   テント 8-11, 20-29 のうち 28-29 など他: 左上=A、右上=B、左下=C、右下=D
      // ※ 公式画像目視によるユーザー指摘に従う
      const isRightAlignedAB = tent.id >= 12 && tent.id <= 27;
      const quadrantOffsets: Record<'A' | 'B' | 'C' | 'D', { dx: number; dy: number }> = isRightAlignedAB
        ? {
            A: { dx: halfW, dy: 0 },     // 右上
            B: { dx: halfW, dy: halfH }, // 右下
            C: { dx: 0, dy: 0 },         // 左上
            D: { dx: 0, dy: halfH },     // 左下
          }
        : {
            A: { dx: 0, dy: 0 },         // 左上
            B: { dx: halfW, dy: 0 },     // 右上
            C: { dx: 0, dy: halfH },     // 左下
            D: { dx: halfW, dy: halfH }, // 右下
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
            // v1.11 修正: 選択中ピンはフィルタ条件外でも opacity を維持（半透明にしない）。
            // フィルタ変更時に開きっぱなしのシートと地図表示の矛盾を解消。
            const slotIsFiltered =
              highlightedPositions !== undefined &&
              !highlightedPositions.has(positionLabel) &&
              !slotIsSelected;
            const slotIsFavorite =
              placement?.programId !== undefined &&
              (favoriteProgramIds?.has(placement.programId) ?? false);
            const slotIsVisited =
              visitedPositions?.has(positionLabel) ?? false;
            // 番組サムネ URL（pcwe-XXX → /thumbnails/XXX.jpeg）。program なし or
            // external（スポンサー / キッチン）の場合は undefined のままにし、
            // TentRect 側で既存の色塗り表示にフォールバック。
            const slotThumbnailUrl =
              placement?.programId !== undefined
                ? `/thumbnails/${placement.programId.replace('pcwe-', '')}.jpeg`
                : undefined;

            return (
              <TentRect
                key={slotLabel}
                x={quadX}
                y={quadY}
                width={halfW}
                height={halfH}
                // 個別モード: ハイフン省略で「14A」「14B」のように圧縮（3 文字に詰める）
                label={`${tent.id}${slotLabel}`}
                // 3 文字なら halfW * 0.42 程度で収まる（下限 9px）
                fontSizeOverride={Math.max(9, Math.min(halfW * 0.42, 14))}
                kind="program"
                isSelected={slotIsSelected}
                isFiltered={slotIsFiltered}
                hasContent={slotHasContent}
                isFavorite={slotIsFavorite}
                isVisited={slotIsVisited}
                thumbnailUrl={slotThumbnailUrl}
                showThumbnail={showThumbnails}
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
          // 12-27 は公式マップで A/B が右、C/D が左（ユーザー指摘）
          quadHintsLayout={tent.id >= 12 && tent.id <= 27 ? 'right-ab' : 'left-ac'}
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
  const isSelected = selectedPosition === positionLabel;
  // v1.11 修正: 選択中ピンはフィルタ無視で opacity 維持
  const isFiltered =
    highlightedPositions !== undefined &&
    !highlightedPositions.has(positionLabel) &&
    !isSelected;

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
  // single tent 用の番組サムネ URL（program がない / external なら undefined）
  const singleThumbnailUrl =
    placement?.programId !== undefined
      ? `/thumbnails/${placement.programId.replace('pcwe-', '')}.jpeg`
      : undefined;

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
        thumbnailUrl={singleThumbnailUrl}
        showThumbnail={showThumbnails}
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
  /**
   * quad テントの A/B/C/D ヒント文字の配置。
   * - 'left-ac': A 左上 / B 右上 / C 左下 / D 右下（標準）
   * - 'right-ab': A 右上 / B 右下 / C 左上 / D 左下（テント 12-27 の公式配置）
   */
  quadHintsLayout?: 'left-ac' | 'right-ab';
  kind: TentRectKind;
  hasContent: boolean;
  isSelected: boolean;
  isFiltered: boolean;
  isFavorite?: boolean;
  isVisited?: boolean;
  ariaLabel: string;
  /** 明示的に fontSize を上書きしたい時（個別タップモードで小さい区画でラベルを収めるため）*/
  fontSizeOverride?: number;
  /** v1.13: 番組サムネ URL（ある時は SVG image で塗りつぶし、ラベルは下端タブ表示）*/
  thumbnailUrl?: string;
  /** v1.13: サムネ表示モード ON のとき thumbnailUrl が描画される。OFF or quad 全体表示なら従来通り */
  showThumbnail?: boolean;
  onClick: () => void;
}

function TentRect({
  x,
  y,
  width,
  height,
  label,
  showQuadHints = false,
  quadHintsLayout = 'left-ac',
  kind,
  hasContent,
  isSelected,
  isFiltered,
  isFavorite = false,
  isVisited = false,
  ariaLabel,
  fontSizeOverride,
  thumbnailUrl,
  showThumbnail = false,
  onClick,
}: TentRectProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  // 番号サイズ: 通常は領域の 0.55 倍。個別モード等で fontSizeOverride 指定時はそれを優先（下限 7px）
  const fontSize = fontSizeOverride !== undefined
    ? Math.max(7, fontSizeOverride)
    : Math.min(width, height) * 0.55;

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
      {/* 選択中の波紋（外側で 1 重のみ。テント本体には枠を付けない）*/}
      {isSelected ? (
        <rect
          x={x - 5}
          y={y - 5}
          width={width + 10}
          height={height + 10}
          fill="none"
          stroke="var(--color-accent-cyan-500)"
          strokeWidth={3}
          rx={8}
          aria-hidden="true"
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.4;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
      ) : null}

      {/* テント本体（選択中でも枠は付けず、外側の波紋だけで強調）。
          v1.13: showThumbnail + thumbnailUrl + hasContent + !showQuadHints のとき、
          色塗り → 番組サムネ画像表示に切り替える。ラベルは下端タブで保持。 */}
      {showThumbnail && thumbnailUrl !== undefined && hasContent && !showQuadHints ? (
        <ThumbnailRect
          x={x}
          y={y}
          width={width}
          height={height}
          thumbnailUrl={thumbnailUrl}
          label={label}
          fontSize={fontSize}
        />
      ) : (
        <>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fillColor}
            rx={4}
            className={
              hasContent
                ? 'transition-colors hover:[fill:var(--color-primary-600)]'
                : ''
            }
          />
          {/* テント番号（中央） */}
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
        </>
      )}

      {/* quad テントの A/B/C/D ヒント（4 隅に小さく、公式配置に従う）*/}
      {showQuadHints ? (
        quadHintsLayout === 'right-ab' ? (
          // テント 12-27 配置: A 右上 / B 右下 / C 左上 / D 左下
          <>
            <text x={x + width - 4} y={y + 12} fill={labelColor} fontSize={11} fontWeight={700} textAnchor="end" aria-hidden="true">A</text>
            <text x={x + width - 4} y={y + height - 4} fill={labelColor} fontSize={11} fontWeight={700} textAnchor="end" aria-hidden="true">B</text>
            <text x={x + 4} y={y + 12} fill={labelColor} fontSize={11} fontWeight={700} aria-hidden="true">C</text>
            <text x={x + 4} y={y + height - 4} fill={labelColor} fontSize={11} fontWeight={700} aria-hidden="true">D</text>
          </>
        ) : (
          // 標準配置: A 左上 / B 右上 / C 左下 / D 右下
          <>
            <text x={x + 4} y={y + 12} fill={labelColor} fontSize={11} fontWeight={700} aria-hidden="true">A</text>
            <text x={x + width - 4} y={y + 12} fill={labelColor} fontSize={11} fontWeight={700} textAnchor="end" aria-hidden="true">B</text>
            <text x={x + 4} y={y + height - 4} fill={labelColor} fontSize={11} fontWeight={700} aria-hidden="true">C</text>
            <text x={x + width - 4} y={y + height - 4} fill={labelColor} fontSize={11} fontWeight={700} textAnchor="end" aria-hidden="true">D</text>
          </>
        )
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

      {/* 状態バッジ（お気に入り / 会えた）
          - quad テント全体表示時（showQuadHints=true）は **非表示**:
            「10C のチェック」が 10B/10D にも乗って見えて誤解を生むため、
            個別 slot の状態は detail zoom（A/B/C/D 個別タップ）でのみ表示する。
          - single テント / detail モードの 1 quad では従来どおり表示。
          - サイズは小さめ・半透明気味にして主役のテント番号を邪魔しない。
       */}
      {!showQuadHints && (isFavorite || isVisited) ? (
        <g aria-hidden="true" opacity={0.85}>
          {isFavorite ? (
            <>
              <circle
                cx={x + width - 7}
                cy={y + 7}
                r={6}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={1}
              />
              <text
                x={x + width - 7}
                y={y + 10}
                fontSize={8}
                textAnchor="middle"
                fill="#fff"
              >
                ★
              </text>
            </>
          ) : null}
          {isVisited ? (
            <>
              <circle
                cx={x + 7}
                cy={y + height - 7}
                r={6}
                fill="var(--color-accent-cyan-500)"
                stroke="#fff"
                strokeWidth={1}
              />
              <text
                x={x + 7}
                y={y + height - 4}
                fontSize={8}
                textAnchor="middle"
                fill="#fff"
                fontWeight={900}
              >
                ✓
              </text>
            </>
          ) : null}
        </g>
      ) : null}
    </g>
  );
}

/**
 * v1.13: 番組サムネで矩形を塗りつつ、下端にラベルタブ（半透明黒 + 白文字）を
 * 重ねるサブコンポーネント。clipPath で角丸内に画像を切り抜く。
 */
function ThumbnailRect({
  x,
  y,
  width,
  height,
  thumbnailUrl,
  label,
  fontSize,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  label: string;
  fontSize: number;
}) {
  // SVG 内で一意な clipPath ID（座標ベース、整数化で衝突回避）
  const clipId = `thumb-clip-${Math.round(x)}-${Math.round(y)}`;
  // ラベルタブ高さ（fontSize の 1.4 倍程度）
  const tabHeight = Math.max(11, Math.round(fontSize * 0.5));
  const tabFontSize = Math.max(8, Math.round(fontSize * 0.36));

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={4} />
        </clipPath>
      </defs>
      {/* 背景の白 fill（画像読み込み中フォールバック）*/}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#fff"
        rx={4}
        aria-hidden="true"
      />
      {/* 番組サムネ画像 */}
      <image
        href={thumbnailUrl}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
        aria-hidden="true"
      />
      {/* 下端タブ（半透明黒）+ 白文字ラベル */}
      <rect
        x={x}
        y={y + height - tabHeight}
        width={width}
        height={tabHeight}
        fill="rgba(0,0,0,0.62)"
        clipPath={`url(#${clipId})`}
        aria-hidden="true"
      />
      <text
        x={x + width / 2}
        y={y + height - tabHeight / 2 + tabFontSize * 0.36}
        fill="#fff"
        fontSize={tabFontSize}
        fontWeight={800}
        textAnchor="middle"
        aria-hidden="true"
      >
        {label}
      </text>
    </g>
  );
}
