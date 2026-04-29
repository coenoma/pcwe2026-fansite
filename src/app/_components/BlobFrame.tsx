/**
 * ブロブフレーム（画像装飾）
 *
 * Podmate ブランディング DNA2 流用。
 * 画像の背後に有機的な形状のカラー背景 + ドットパターン。
 */

import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  /** Tailwind 任意のカラー（例: 'amber-200' / 'sky-200'）*/
  blobColor?: string;
  /** 画像サイズ（正方形）*/
  size?: number;
  priority?: boolean;
}

export function BlobFrame({
  src,
  alt,
  blobColor = 'amber-200',
  size = 280,
  priority = false,
}: Props) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* 有機形状の背景 */}
      <div
        aria-hidden="true"
        className={`absolute -inset-4 sm:-inset-6 bg-${blobColor}/20`}
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
