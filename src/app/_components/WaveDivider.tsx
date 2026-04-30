/**
 * 波型セクション区切り
 *
 * Podmate ブランディング DNA1 流用。
 * fillClass を次セクションの背景色と一致させて、境界を消す。
 *
 * 「前セクションに乗せる」ように使う場合は className に `-mt-12 sm:-mt-16`
 * のような負マージンを渡す（前セクションの末尾に波々が侵食する形になり、
 * 直前セクション → 次セクションへの自然な「波の橋渡し」を演出できる）。
 */

interface Props {
  /** 次セクションの背景色クラス（fill-amber-50 / fill-white 等）*/
  fillClass: string;
  /** SVG の高さ（デフォルト 60px） */
  height?: number;
  /** ラッパー div 用の追加クラス（負マージンで前セクションに被せる用途）*/
  className?: string;
}

export function WaveDivider({ fillClass, height = 60, className }: Props) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className ?? ''}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: `${height}px` }}
      >
        <path
          d="M0,32 C240,80 480,0 720,32 C960,64 1200,16 1440,40 L1440,80 L0,80 Z"
          className={fillClass}
        />
      </svg>
    </div>
  );
}
