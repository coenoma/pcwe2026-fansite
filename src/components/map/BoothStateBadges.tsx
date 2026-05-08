/**
 * ブースの状態（お気に入り・会えた）を視覚化する overlay バッジ。
 *
 * リストカード（MapListView）/ SlotCard（TentOverviewSheet）の
 * サムネ右上に絶対配置で重ねて、ボトムシートを開く前に状態を一目で確認できるようにする。
 *
 * 配置例:
 *   <div className="relative">
 *     <Image src={...} />
 *     <BoothStateBadges
 *       isFavorite={...}
 *       isVisited={...}
 *       className="absolute -top-1 -right-1"
 *     />
 *   </div>
 *
 * 配色:
 * - お気に入り: amber-400 + Star アイコン（既存ボトムシート CTA と同色系統）
 * - 会えた: accent-cyan-500 + Check アイコン（既存「会えた」プログレスと同色系統）
 */

import { Star, Check } from 'lucide-react';

interface Props {
  isFavorite: boolean;
  isVisited: boolean;
  /** sm: 20px（リストカード用）/ md: 24px（SlotCard 用）*/
  size?: 'sm' | 'md';
  /** 親側で absolute 等の配置クラスを渡す */
  className?: string;
}

export function BoothStateBadges({
  isFavorite,
  isVisited,
  size = 'sm',
  className,
}: Props) {
  // どちらも false なら DOM 自体を出さない（呼び出し側の条件分岐を不要に）
  if (!isFavorite && !isVisited) return null;

  const dim = size === 'sm' ? 20 : 24;
  const iconSize = size === 'sm' ? 11 : 14;

  return (
    <div
      className={
        className !== undefined
          ? `flex flex-col gap-1 ${className}`
          : 'flex flex-col gap-1'
      }
    >
      {isFavorite ? (
        <span
          aria-label="お気に入り済み"
          className="flex items-center justify-center rounded-full bg-amber-400 shadow-sm ring-2 ring-white"
          style={{ width: dim, height: dim }}
        >
          <Star
            size={iconSize}
            fill="white"
            stroke="white"
            strokeWidth={2}
            aria-hidden="true"
          />
        </span>
      ) : null}
      {isVisited ? (
        <span
          aria-label="会えた済み"
          className="flex items-center justify-center rounded-full bg-accent-cyan-500 shadow-sm ring-2 ring-white"
          style={{ width: dim, height: dim }}
        >
          <Check
            size={iconSize + 1}
            stroke="white"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
      ) : null}
    </div>
  );
}
