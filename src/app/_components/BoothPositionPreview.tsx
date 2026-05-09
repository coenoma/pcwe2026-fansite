/**
 * 番組詳細ページの「ブース位置」セクションに表示する、静的マップ SVG プレビュー。
 *
 * 機能:
 * 1. VenueMap.tsx の SVG レイアウト計算を簡素再利用（操作機能なし）
 * 2. 全テントを薄塗りで簡素表示、該当 slot のみ強調:
 *    - 番組サムネで塗り
 *    - パルスアニメーション（accent-cyan）
 *    - 「ここ！」吹き出し
 *    - quad テントは A/B/C/D 分割で該当 slot のみ
 * 3. 「📥 画像として開く」ボタンで Canvas → PNG → 新タブ表示
 *    - PC: 右クリックで「名前を付けて保存」
 *    - SP: 長押しで「画像を保存」
 *    - リスナーへの SNS 投稿などに即使えるよう、サムネ + 「ここ！」吹き出しが入った
 *      「ブース案内画像」を 1 タップで取得できる
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
  /** 該当の出展日（土 or 日）*/
  day: Day;
  /** 親 Server Component で計算済みの SVG レイアウトデータ */
  preview: PreviewSlotData;
}

export function BoothPositionPreview({
  program,
  positionLabel,
  day,
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
  const dayLabel = day === 'sat' ? '5/9 土' : '5/10 日';
  const programName = program.shortName ?? program.name;

  // テントの中心座標 + 大型サムネ配置ロジック
  // テントが画面左半分なら右に、右半分なら左に、上下端は上下を選んで配置
  const tentCx = focusX + focusW / 2;
  const tentCy = focusY + focusH / 2;
  const isLeft = tentCx < imgW * 0.45;
  const isRight = tentCx > imgW * 0.55;
  const isTop = tentCy < imgH * 0.45;
  // 大型サムネサイズ（元 SVG 座標系）。imgW/H が 932x808 なので 180 は約 19%
  const bigThumbSize = Math.round(Math.min(imgW, imgH) * 0.22);
  const labelHeight = Math.round(bigThumbSize * 0.22);
  // 配置: 左にテントなら右側、右にテントなら左側、中央なら上下空きの広い方
  let bigThumbX: number;
  let bigThumbY: number;
  const margin = 24;
  if (isLeft) {
    bigThumbX = focusX + focusW + margin + 18;
    bigThumbY = tentCy - bigThumbSize / 2;
  } else if (isRight) {
    bigThumbX = focusX - bigThumbSize - margin - 18;
    bigThumbY = tentCy - bigThumbSize / 2;
  } else if (isTop) {
    bigThumbX = tentCx - bigThumbSize / 2;
    bigThumbY = focusY + focusH + margin + 30;
  } else {
    bigThumbX = tentCx - bigThumbSize / 2;
    bigThumbY = focusY - bigThumbSize - margin - labelHeight - 30;
  }
  // 範囲外クランプ（ラベル分の余白も考慮）
  bigThumbX = Math.max(8, Math.min(bigThumbX, imgW - bigThumbSize - 8));
  bigThumbY = Math.max(8, Math.min(bigThumbY, imgH - bigThumbSize - labelHeight - 8));
  const bigThumbCx = bigThumbX + bigThumbSize / 2;
  const bigThumbCy = bigThumbY + bigThumbSize / 2;
  // 「ここ！」吹き出し: focus の 3 倍幅・1.2 倍高で巨大に + 三角ポインタが focus に
  // めり込まないよう十分な距離をとる（パルス枠 8px + 余白 16px = 24px 離す）
  const hereLabelW = Math.round(Math.max(focusW * 3, 96));
  const hereLabelH = Math.round(Math.max(focusH * 1.2, 42));
  const hereLabelX = tentCx - hereLabelW / 2;
  const hereTriangleH = Math.round(hereLabelH * 0.45);
  // hereLabelY + hereLabelH + hereTriangleH + 余白 ≤ focusY - パルス枠 8px
  // → hereLabelY = focusY - hereLabelH - hereTriangleH - 16
  const hereLabelY = focusY - hereLabelH - hereTriangleH - 16;
  const hereLabelFontSize = Math.round(hereLabelH * 0.65);
  // ブース番号バッジ（サムネ右上、ピル型）。「11-C」3 文字を綺麗に収める
  const badgeFontSize = Math.round(bigThumbSize * 0.16);
  const badgeH = Math.round(bigThumbSize * 0.28);
  const badgeW = Math.round(badgeFontSize * Math.max(positionLabel.length * 0.85, 2.4) + 18);
  const badgeX = bigThumbX + bigThumbSize - badgeW + 8;
  const badgeY = bigThumbY - badgeH / 2;

  const focusClipId = `booth-preview-clip-${program.id}-${day}`;
  const bigThumbClipId = `booth-preview-bigthumb-${program.id}-${day}`;

  // SVG → Canvas → PNG 化 → 新タブで開く
  const handleOpenAsImage = useCallback(async () => {
    if (svgRef.current === null) return;
    setIsProcessing(true);
    try {
      const svgEl = svgRef.current;
      // SVG をシリアライズ（XML 宣言付き）
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob(
        ['<?xml version="1.0" encoding="UTF-8"?>\n', xml],
        { type: 'image/svg+xml;charset=utf-8' },
      );
      const svgUrl = URL.createObjectURL(svgBlob);

      // 高解像度（2x）で PNG 化
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = imgW * scale;
      canvas.height = imgH * scale;
      const ctx = canvas.getContext('2d');
      if (ctx === null) throw new Error('2D context 取得失敗');

      // 背景（透明だと SNS 投稿時に映えないので白背景）
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
      // 新タブで開く（PC は右クリック保存、SP は長押し保存に対応）
      window.open(pngUrl, '_blank', 'noopener,noreferrer');
      // 1 分後に URL を解放（タブで開いた直後の retain を保証）
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
      // selector で特定するための識別子。両日出展時は figure が 2 つ並ぶため day で絞る。
      data-booth-preview-day={day}
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
          <clipPath id={focusClipId}>
            <rect
              x={focusX}
              y={focusY}
              width={focusW}
              height={focusH}
              rx={6}
            />
          </clipPath>
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

        {/* 全テント（非該当: 薄塗り + テント番号、該当: primary オレンジで強調）*/}
        {tents.map((t) => {
          const isTarget = t.id === targetTentId;
          const fontSize = Math.min(t.w, t.h) * 0.5;
          return (
            <g key={t.id}>
              <rect
                x={t.x}
                y={t.y}
                width={t.w}
                height={t.h}
                fill={
                  isTarget
                    ? 'var(--color-primary-500, #dc725a)'
                    : 'var(--color-neutral-200, #e5e5e5)'
                }
                rx={4}
              />
              <text
                x={t.x + t.w / 2}
                y={t.y + t.h / 2 + fontSize * 0.34}
                fill={isTarget ? '#fff' : 'var(--color-neutral-500, #737373)'}
                fontSize={fontSize}
                fontWeight={isTarget ? 900 : 800}
                textAnchor="middle"
              >
                {t.id}
              </text>
            </g>
          );
        })}

        {/* 該当 slot 強調: 目立つ accent-cyan で塗り + パルス波紋 */}
        <g>
          {/* 該当 slot 塗り（accent-cyan、目立つ）*/}
          <rect
            x={focusX}
            y={focusY}
            width={focusW}
            height={focusH}
            fill="var(--color-accent-cyan-500, #00b3d4)"
            rx={6}
          />

          {/* 外側パルス（太く、目立つ） */}
          <rect
            x={focusX - 8}
            y={focusY - 8}
            width={focusW + 16}
            height={focusH + 16}
            rx={10}
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

          {/* 「ここ！」巨大吹き出し（focus 真上、focusW の 3 倍幅）*/}
          <rect
            x={hereLabelX}
            y={hereLabelY}
            width={hereLabelW}
            height={hereLabelH}
            rx={hereLabelH / 2}
            fill="var(--color-accent-cyan-500, #00b3d4)"
          />
          {/* 三角ポインタ（吹き出し下端から focus 手前まで） */}
          <polygon
            points={`${tentCx - hereLabelH / 3},${hereLabelY + hereLabelH} ${tentCx + hereLabelH / 3},${hereLabelY + hereLabelH} ${tentCx},${hereLabelY + hereLabelH + hereTriangleH}`}
            fill="var(--color-accent-cyan-500, #00b3d4)"
          />
          <text
            x={tentCx}
            y={hereLabelY + hereLabelH / 2 + hereLabelFontSize * 0.36}
            fill="#fff"
            fontSize={hereLabelFontSize}
            fontWeight={900}
            textAnchor="middle"
          >
            ここ！
          </text>
        </g>

        {/* マップ余白に大型サムネ + 番組名 + ブース番号 + テントへの接続線 */}
        <g>
          {/* 接続線（サムネ中心 → テント中心、破線で視線誘導）*/}
          <line
            x1={bigThumbCx}
            y1={bigThumbCy}
            x2={tentCx}
            y2={tentCy}
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

          {/* サムネ下のラベルバー（番組名 + ブース番号）*/}
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

