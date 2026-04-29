/**
 * ブロブフレーム（画像装飾）
 *
 * Podmate ブランディング DNA2 流用。
 * 画像の背後に有機的な形状のカラー背景 + ドットパターン。
 *
 * Tailwind v4 JIT で動的クラス名は検出されないため、blobColor は
 * リテラル型に限定し、完全クラス文字列をマップで解決する。
 */

import Image from 'next/image';

export type BlobColor = 'primary' | 'amber' | 'sky' | 'emerald' | 'neutral';

const BLOB_BG_CLASS: Record<BlobColor, string> = {
  primary: 'bg-primary-200/30',
  amber: 'bg-amber-200/30',
  sky: 'bg-sky-200/30',
  emerald: 'bg-emerald-200/30',
  neutral: 'bg-neutral-200/30',
};

interface Props {
  src: string;
  alt: string;
  blobColor?: BlobColor;
  /** 画像サイズ（正方形、px）*/
  size?: number;
  priority?: boolean;
}

export function BlobFrame({
  src,
  alt,
  blobColor = 'amber',
  size = 280,
  priority = false,
}: Props) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* 有機形状の背景 */}
      <div
        aria-hidden="true"
        className={`absolute -inset-4 sm:-inset-6 ${BLOB_BG_CLASS[blobColor]}`}
        style={{
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      {/* 画像本体 */}
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-sm">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority={priority}
        />
      </div>
    </div>
  );
}
