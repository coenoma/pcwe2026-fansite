/**
 * 番組詳細ページの「ブース位置」セクションに表示する、静的マップ SVG プレビュー。
 *
 * v2 仕様（リスナー案内画像としての使い勝手を優先）:
 * 1. focus 枠 = テント全体（A/B/C/D の小区画ではない）。
 *    - 白塗り + 青系角丸四角枠（パルス）
 *    - テント番号をオレンジ大文字で強調 → どのテントが該当か一目で分かる
 * 2. 大型サムネ + 番組名 + ブース番号バッジは SVG 左中央に固定配置。
 *    - VenueMap の「PODCAST WEEKEND」ロゴ位置を参考に、テント群と被らない
 *      安全圏（左端テント 1-7 の右隣、中央のひらけた領域）を使用。
 *    - テント位置によって左右にぶれない一貫レイアウト → 量産画像でも統一感。
 * 3. 点線でサムネ → focus テントを接続。「これがその番組」を視覚的に示す。
 * 4. 「画像で保存」ボタン: Canvas → PNG → 新タブ表示
 *    - PC: 右クリックで「名前を付けて保存」、SP: 長押しで「画像を保存」
 *    - 量産用途では scripts/generate-booth-position-image.ts が SVG 自体を screenshot
 *
 * Client Component（useRef で svg を取得 + Canvas 変換のため）。
 * 描画データは親 Server Component から props で受け取り、bundle 増加を抑える。
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { Day, Program } from '@/lib/types';
import type { PreviewSlotData } from '@/lib/booth-position-preview';

interface Props {
  program: Program;
  /** position label（例: "11-C" / "1" / "32"）*/
  positionLabel: string;
  /**
   * このブース位置で出る日のセット。両日同位置なら ['sat', 'sun']、
   * 単日なら ['sat'] / ['sun']。両日異位置の番組はそれぞれ別 props で
   * 2 つの BoothPositionPreview をレンダリングする想定（実データではゼロ件）。
   */
  days: Day[];
  /** 親 Server Component で計算済みの SVG レイアウトデータ */
  preview: PreviewSlotData;
}

export function BoothPositionPreview({
  program,
  positionLabel,
  days,
  preview,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    focusX,
    focusY,
    focusW,
    focusH,
    tents,
    venuePath,
    imgW,
    imgH,
    targetTentId,
  } = preview;

  // 該当番組のサムネ URL（pcwe-XXX → /thumbnails/XXX.jpeg）
  const thumbnailUrl = `/thumbnails/${program.id.replace('pcwe-', '')}.jpeg`;
  // 両日同位置 → "両日"、単日 → "5/9 土" / "5/10 日"
  const dayLabel =
    days.length === 2
      ? '両日'
      : days[0] === 'sat'
        ? '5/9 土'
        : '5/10 日';
  // data attribute / clip ID 用の day 識別子（"sat" / "sun" / "sat-sun"）
  const dayId = days.join('-');
  const programName = program.shortName ?? program.name;

  // ─────────────────────────────────────────────────────────────
  // サムネ + 番組名は SVG の中央左寄り（テント 1-7 と テント 10-15 の間の
  // 中央列）に固定配置。テント位置（focus が右上 / 左下 / どこでも）に
  // 依らない一貫レイアウト。
  //
  // 配置数値（imgW=932, imgH=808 前提、ユーザー指示で微調整済み）:
  //   - 左端テント 1-7 の右端: x=135
  //   - 右側テント 10 の左端: x=368
  //   - サムネ 200px 幅。完全中央寄せ（x=152）だと左寄りすぎたので、
  //     0.6 テント幅（≈ 36px）右にズラして x=188 に配置。
  //     左余白 53px / 右余白 -20px（テント 10 と 4px 重なるが視覚的に許容範囲）
  // ─────────────────────────────────────────────────────────────
  const bigThumbSize = Math.round(imgW * 0.215); // ~200
  const bigThumbX = Math.round(imgW * 0.202); // ~188（中央寄せ +0.6 テント幅）
  const bigThumbY = Math.round(imgH * 0.35); // ~283
  const labelHeight = Math.round(bigThumbSize * 0.22);
  const bigThumbCx = bigThumbX + bigThumbSize / 2;
  const bigThumbCy = bigThumbY + bigThumbSize / 2;

  // ブース番号バッジ（サムネ右上、ピル型）。「11-C」3 文字を綺麗に収める
  const badgeFontSize = Math.round(bigThumbSize * 0.16);
  const badgeH = Math.round(bigThumbSize * 0.28);
  const badgeW = Math.round(
    badgeFontSize * Math.max(positionLabel.length * 0.85, 2.4) + 18,
  );
  const badgeX = bigThumbX + bigThumbSize - badgeW + 8;
  const badgeY = bigThumbY - badgeH / 2;

  // focus テントの中心（テント番号テキスト位置）
  const focusCx = focusX + focusW / 2;
  const focusCy = focusY + focusH / 2;
  const focusFontSize = Math.round(Math.min(focusW, focusH) * 0.55);

  // ─────────────────────────────────────────────────────────────
  // 点線（サムネ → focus テント）の終端を、focus 外側のパルス枠の境界で止める。
  // テント内部に線が突っ切らないよう、矩形と線分の交点を計算する。
  // ─────────────────────────────────────────────────────────────
  const PULSE_PAD = 8; // パルス枠と focus テントの隙間
  const focusBoxMinX = focusX - PULSE_PAD;
  const focusBoxMaxX = focusX + focusW + PULSE_PAD;
  const focusBoxMinY = focusY - PULSE_PAD;
  const focusBoxMaxY = focusY + focusH + PULSE_PAD;

  const lineDx = focusCx - bigThumbCx;
  const lineDy = focusCy - bigThumbCy;
  // 線分パラメータ t（0=始点, 1=focus 中心）について、矩形境界に達する最小の正の t を求める
  let lineT = 1.0;
  const tryEdge = (t: number) => {
    if (t > 0 && t < lineT) lineT = t;
  };
  if (lineDx !== 0) {
    const tLeft = (focusBoxMinX - bigThumbCx) / lineDx;
    const yAtLeft = bigThumbCy + tLeft * lineDy;
    if (yAtLeft >= focusBoxMinY && yAtLeft <= focusBoxMaxY) tryEdge(tLeft);
    const tRight = (focusBoxMaxX - bigThumbCx) / lineDx;
    const yAtRight = bigThumbCy + tRight * lineDy;
    if (yAtRight >= focusBoxMinY && yAtRight <= focusBoxMaxY) tryEdge(tRight);
  }
  if (lineDy !== 0) {
    const tTop = (focusBoxMinY - bigThumbCy) / lineDy;
    const xAtTop = bigThumbCx + tTop * lineDx;
    if (xAtTop >= focusBoxMinX && xAtTop <= focusBoxMaxX) tryEdge(tTop);
    const tBottom = (focusBoxMaxY - bigThumbCy) / lineDy;
    const xAtBottom = bigThumbCx + tBottom * lineDx;
    if (xAtBottom >= focusBoxMinX && xAtBottom <= focusBoxMaxX) tryEdge(tBottom);
  }
  const lineEndX = bigThumbCx + lineT * lineDx;
  const lineEndY = bigThumbCy + lineT * lineDy;

  const bigThumbClipId = `booth-preview-bigthumb-${program.id}-${dayId}`;

  // SVG → Canvas → PNG 化 → 新タブで開く
  const handleOpenAsImage = useCallback(async () => {
    if (svgRef.current === null) return;
    setIsProcessing(true);
    try {
      const svgEl = svgRef.current;
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob(
        ['<?xml version="1.0" encoding="UTF-8"?>\n', xml],
        { type: 'image/svg+xml;charset=utf-8' },
      );
      const svgUrl = URL.createObjectURL(svgBlob);

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = imgW * scale;
      canvas.height = imgH * scale;
      const ctx = canvas.getContext('2d');
      if (ctx === null) throw new Error('2D context 取得失敗');

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG 画像の読み込み失敗'));
      });
      img.src = svgUrl;
      await loaded;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);

      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (pngBlob === null) throw new Error('PNG 変換失敗');

      const pngUrl = URL.createObjectURL(pngBlob);
      window.open(pngUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(pngUrl), 60_000);
    } catch (error) {
      console.warn('⚠️ ブース位置プレビューの画像化に失敗しました', error);
    } finally {
      setIsProcessing(false);
    }
  }, [imgW, imgH]);

  return (
    <figure
      className="relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-secondary-50 to-amber-50"
      aria-label={`${program.name} のブース位置（${dayLabel} ${positionLabel}）`}
      // 量産スクリプト（scripts/generate-booth-position-image.ts）が SVG 要素を
      // selector で特定するための識別子。両日異位置で figure が 2 つ並ぶ場合は
      // days セット（"sat" / "sun" / "sat-sun"）で絞る。
      data-booth-preview-day={dayId}
      data-booth-preview-position={positionLabel}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${imgW} ${imgH}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full"
        role="img"
        aria-hidden="true"
        // SVG <text> はブラウザデフォルトで serif（明朝）が当たるので、
        // 全 text 要素に sans-serif を継承させる。Canvas → PNG 変換でも維持される
        // よう、Tailwind class ではなく style で直接指定。
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif",
        }}
      >
        <defs>
          <clipPath id={bigThumbClipId}>
            <rect
              x={bigThumbX}
              y={bigThumbY}
              width={bigThumbSize}
              height={bigThumbSize}
              rx={12}
            />
          </clipPath>
        </defs>

        {/* 背景: 描画範囲の白塗り（PNG 変換時の透明回避）*/}
        <rect x={0} y={0} width={imgW} height={imgH} fill="#fff" />

        {/* 会場輪郭 */}
        {venuePath !== null ? (
          <path
            d={venuePath}
            fill="rgba(255,255,255,0.7)"
            stroke="var(--color-primary-300, #f9a08a)"
            strokeWidth={1.5}
          />
        ) : null}

        {/* MAIN GATE（マップの向き / 入口を示す表示。VenueMap と同じ位置）*/}
        <text
          x={285}
          y={770}
          fill="var(--color-neutral-600, #525252)"
          fontSize={22}
          fontWeight={800}
          textAnchor="middle"
        >
          ↑ MAIN GATE
        </text>

        {/* 全テント（focus テント以外、薄塗り + テント番号）*/}
        {tents
          .filter((t) => t.id !== targetTentId)
          .map((t) => {
            const fontSize = Math.min(t.w, t.h) * 0.5;
            return (
              <g key={t.id}>
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill="var(--color-neutral-200, #e5e5e5)"
                  rx={4}
                />
                <text
                  x={t.x + t.w / 2}
                  y={t.y + t.h / 2 + fontSize * 0.34}
                  fill="var(--color-neutral-500, #737373)"
                  fontSize={fontSize}
                  fontWeight={800}
                  textAnchor="middle"
                >
                  {t.id}
                </text>
              </g>
            );
          })}

        {/* focus テント全体（オレンジ塗り + 白文字 + 外側に青パルス枠）*/}
        <g>
          {/* テント本体: オレンジ塗り（他テントの薄塗りグレーから際立つ）*/}
          <rect
            x={focusX}
            y={focusY}
            width={focusW}
            height={focusH}
            fill="var(--color-accent-orange-500, #f97316)"
            rx={6}
          />
          {/* テント番号（白文字で強調）*/}
          <text
            x={focusCx}
            y={focusCy + focusFontSize * 0.34}
            fill="#fff"
            fontSize={focusFontSize}
            fontWeight={900}
            textAnchor="middle"
          >
            {targetTentId}
          </text>
          {/* 外側に青のパルス角丸枠（「ここだよ」の視線誘導）*/}
          <rect
            x={focusX - PULSE_PAD}
            y={focusY - PULSE_PAD}
            width={focusW + PULSE_PAD * 2}
            height={focusH + PULSE_PAD * 2}
            rx={12}
            fill="none"
            stroke="var(--color-accent-cyan-500, #00b3d4)"
            strokeWidth={5}
          >
            <animate
              attributeName="stroke-opacity"
              values="1;0.3;1"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="5;9;5"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        {/* マップ余白に大型サムネ + 番組名 + ブース番号バッジ + 接続線 */}
        <g>
          {/* 接続線（サムネ中心 → focus テント外側のパルス枠、破線で視線誘導）
              テント内部に線が突っ切らないよう、矩形交差で計算した境界点で止める */}
          <line
            x1={bigThumbCx}
            y1={bigThumbCy}
            x2={lineEndX}
            y2={lineEndY}
            stroke="var(--color-accent-cyan-500, #00b3d4)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            opacity={0.7}
          />

          {/* サムネ枠（白背景＋ accent-cyan 縁）*/}
          <rect
            x={bigThumbX - 4}
            y={bigThumbY - 4}
            width={bigThumbSize + 8}
            height={bigThumbSize + 8}
            rx={14}
            fill="#fff"
            stroke="var(--color-accent-cyan-500, #00b3d4)"
            strokeWidth={3}
          />
          <image
            href={thumbnailUrl}
            x={bigThumbX}
            y={bigThumbY}
            width={bigThumbSize}
            height={bigThumbSize}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${bigThumbClipId})`}
          />

          {/* ブース番号バッジ（サムネ右上、ピル型で複数文字対応）*/}
          <g>
            <rect
              x={badgeX}
              y={badgeY}
              width={badgeW}
              height={badgeH}
              rx={badgeH / 2}
              fill="var(--color-accent-cyan-500, #00b3d4)"
              stroke="#fff"
              strokeWidth={3}
            />
            <text
              x={badgeX + badgeW / 2}
              y={badgeY + badgeH / 2 + badgeFontSize * 0.36}
              fill="#fff"
              fontSize={badgeFontSize}
              fontWeight={900}
              textAnchor="middle"
            >
              {positionLabel}
            </text>
          </g>

          {/* サムネ下のラベルバー（番組名）*/}
          <rect
            x={bigThumbX - 4}
            y={bigThumbY + bigThumbSize + 4}
            width={bigThumbSize + 8}
            height={labelHeight}
            rx={6}
            fill="var(--color-neutral-900, #171717)"
          />
          <text
            x={bigThumbX + bigThumbSize / 2}
            y={bigThumbY + bigThumbSize + 4 + labelHeight / 2 + labelHeight * 0.18}
            fill="#fff"
            fontSize={Math.round(labelHeight * 0.5)}
            fontWeight={800}
            textAnchor="middle"
          >
            {programName.length > 14
              ? `${programName.slice(0, 13)}…`
              : programName}
          </text>
        </g>
      </svg>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 bg-white/90 px-3 py-2 backdrop-blur">
        <span className="text-xs text-neutral-600">
          <span className="font-bold text-neutral-900">
            ブース {positionLabel}
          </span>
          <span className="ml-2 text-neutral-500">（{dayLabel}）</span>
        </span>
        <button
          type="button"
          onClick={handleOpenAsImage}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 rounded-full bg-accent-cyan-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-accent-cyan-600 disabled:opacity-60"
          aria-label="このブース位置案内を画像として新しいタブで開く（保存して SNS で使えます）"
        >
          <Download size={12} aria-hidden="true" />
          {isProcessing ? '生成中...' : '画像で保存（SNS 用）'}
        </button>
      </figcaption>
    </figure>
  );
}
