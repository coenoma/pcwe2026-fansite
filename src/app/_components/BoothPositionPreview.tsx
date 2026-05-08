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

  // 「ここ！」吹き出しのアンカー位置（focus 上端から 28px 上）
  const balloonCx = focusX + focusW / 2;
  const balloonCy = focusY - 28;

  const focusClipId = `booth-preview-clip-${program.id}-${day}`;

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
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${imgW} ${imgH}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={focusClipId}>
            <rect
              x={focusX}
              y={focusY}
              width={focusW}
              height={focusH}
              rx={4}
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

        {/* 全テント（簡素・薄塗り）*/}
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
                    ? 'var(--color-primary-200, #fbcfc1)'
                    : 'var(--color-neutral-200, #e5e5e5)'
                }
                rx={4}
              />
              <text
                x={t.x + t.w / 2}
                y={t.y + t.h / 2 + fontSize * 0.34}
                fill={
                  isTarget
                    ? 'var(--color-primary-700, #cc4f2c)'
                    : 'var(--color-neutral-500, #737373)'
                }
                fontSize={fontSize}
                fontWeight={800}
                textAnchor="middle"
              >
                {t.id}
              </text>
            </g>
          );
        })}

        {/* 該当 slot 強調: パルス波紋 + サムネ + ラベル */}
        <g>
          {/* 外側パルス */}
          <rect
            x={focusX - 6}
            y={focusY - 6}
            width={focusW + 12}
            height={focusH + 12}
            rx={8}
            fill="none"
            stroke="var(--color-accent-cyan-500, #00b3d4)"
            strokeWidth={3}
          >
            <animate
              attributeName="stroke-opacity"
              values="1;0.3;1"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="3;5;3"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </rect>

          {/* サムネ画像（クリップ） */}
          <rect
            x={focusX}
            y={focusY}
            width={focusW}
            height={focusH}
            fill="#fff"
            rx={4}
          />
          <image
            href={thumbnailUrl}
            x={focusX}
            y={focusY}
            width={focusW}
            height={focusH}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${focusClipId})`}
          />

          {/* 下端ラベル（半透明黒 + 白文字、position label） */}
          <rect
            x={focusX}
            y={focusY + focusH - Math.max(12, focusH * 0.28)}
            width={focusW}
            height={Math.max(12, focusH * 0.28)}
            fill="rgba(0,0,0,0.65)"
            clipPath={`url(#${focusClipId})`}
          />
          <text
            x={focusX + focusW / 2}
            y={focusY + focusH - Math.max(4, focusH * 0.08)}
            fill="#fff"
            fontSize={Math.max(8, focusW * 0.22)}
            fontWeight={800}
            textAnchor="middle"
          >
            {positionLabel}
          </text>

          {/* 「ここ！」吹き出し */}
          <g>
            <rect
              x={balloonCx - 28}
              y={balloonCy - 14}
              width={56}
              height={22}
              rx={11}
              fill="var(--color-accent-cyan-500, #00b3d4)"
            />
            <polygon
              points={`${balloonCx - 5},${balloonCy + 8} ${balloonCx + 5},${balloonCy + 8} ${balloonCx},${balloonCy + 14}`}
              fill="var(--color-accent-cyan-500, #00b3d4)"
            />
            <text
              x={balloonCx}
              y={balloonCy + 1}
              fill="#fff"
              fontSize={12}
              fontWeight={900}
              textAnchor="middle"
            >
              ここ！
            </text>
          </g>
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

