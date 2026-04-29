/**
 * 波型セクション区切り
 *
 * Podmate ブランディング DNA1 流用。
 * fillClass を次セクションの背景色と一致させて、境界を消す。
 */

interface Props {
  /** 次セクションの背景色クラス（fill-amber-50 / fill-white 等）*/
  fillClass: string;
  /** SVG の高さ（デフォルト 60px） */
  height?: number;
}

export function WaveDivider({ fillClass, height = 60 }: Props) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <path
        d="M0,32 C240,80 480,0 720,32 C960,64 1200,16 1440,40 L1440,80 L0,80 Z"
        className={fillClass}
      />
    </svg>
  );
}
