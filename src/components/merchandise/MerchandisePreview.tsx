/**
 * 物販ハイライトプレビュー — リスト・モーダル・ヘッダーで使い回す compact UI。
 *
 * 既存の `groupMerchandiseDetails(details)` を再利用し、先頭グループの先頭アイテムを
 * 「代表アイテム」として表示する。ディスカバリー文脈で「何が買えるか」を 0.5 秒で
 * 伝えるための共通コンポーネント。
 *
 * variant ごとの責務:
 * - list:         MapListView のリストカード用（サムネ 24px + name 1 行 + +N件バッジ）
 * - slot:         TentOverviewSheet の SlotCard 用（サムネ 28px + name 1 行 + +N件バッジ）
 * - sheet-header: BoothBottomSheet のヘッダー直下用（サムネ 32px + name 上位 2 件 + 残り件数テキスト）
 *
 * 設計思想:
 * - spotlight / catchphrase / subCatch などのコピーは扱わない（責務分離）。
 * - 物販に関する情報のみを compact に「ちょいだし」することに専念する。
 * - imagePath が無い物販は 🛍 アイコンでフォールバック表示（X 投稿出典では imagePath を持たないことが多いため、設計上の正常系）。
 *
 * 詳細設計: docs/plans/v1.8-merchandise-preview-on-discovery/README.md
 */

import Image from 'next/image';
import { groupMerchandiseDetails } from './MerchandiseGroupCard';
import type { MerchandiseDetail } from '@/lib/types';

type Variant = 'list' | 'slot' | 'sheet-header';

interface Props {
  /** 物販詳細群（merchandiseDetails をそのまま渡す）*/
  details: ReadonlyArray<MerchandiseDetail>;
  /** 表示バリエーション */
  variant: Variant;
  /** 追加のスタイリング上書き（外側のラッパーに付与）*/
  className?: string;
}

export function MerchandisePreview({ details, variant, className }: Props) {
  // 物販がなければ何も表示しない（呼び出し側の条件分岐を不要にする）
  if (details.length === 0) return null;

  const groups = groupMerchandiseDetails(details);
  // 安全な代表アイテム取得: groupMerchandiseDetails の挙動上、details が空でなければ
  // groups[0].items[0] は存在するが、型システムには伝わらないため明示的に early return する
  // （non-null assertion を避けて型の整合を保つ AGENTS.md 方針）
  const headGroup = groups[0];
  if (headGroup === undefined) return null;
  const headItem = headGroup.items[0];
  if (headItem === undefined) return null;
  // バッジ用件数: 物販総件数 − 1（先頭 1 件は表示済み）
  const totalCount = details.length;
  const remainingCount = totalCount - 1;
  const headImage = headItem.imagePath;

  if (variant === 'list') {
    return (
      <div
        className={
          className !== undefined
            ? `flex items-center gap-1.5 ${className}`
            : 'flex items-center gap-1.5'
        }
      >
        <Thumbnail imagePath={headImage} size={24} />
        <p className="line-clamp-1 min-w-0 flex-1 text-[11px] font-bold text-neutral-800">
          {headItem.name}
        </p>
        {remainingCount > 0 ? (
          <span
            aria-label={`残り ${remainingCount} 件`}
            className="shrink-0 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-700"
          >
            +{remainingCount}件
          </span>
        ) : null}
      </div>
    );
  }

  if (variant === 'slot') {
    return (
      <div
        className={
          className !== undefined
            ? `flex items-center gap-2 ${className}`
            : 'flex items-center gap-2'
        }
      >
        <Thumbnail imagePath={headImage} size={28} />
        <p className="line-clamp-1 min-w-0 flex-1 text-[11px] font-bold text-neutral-800">
          {headItem.name}
        </p>
        {remainingCount > 0 ? (
          <span
            aria-label={`残り ${remainingCount} 件`}
            className="shrink-0 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-700"
          >
            +{remainingCount}件
          </span>
        ) : null}
      </div>
    );
  }

  // variant === 'sheet-header'
  // 上位 2 件の name を箇条書き、3 件以上あれば「他 N 件は X 投稿で詳細 ↓」テキスト
  const headlineItems = details.slice(0, 2);
  const restCount = details.length - headlineItems.length;

  return (
    <div className={className ?? ''}>
      <p className="text-[11px] font-bold tracking-wide text-neutral-500">
        🛍 物販ハイライト
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {headlineItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <Thumbnail imagePath={item.imagePath} size={32} />
            <p className="line-clamp-2 min-w-0 flex-1 text-xs font-bold leading-snug text-neutral-800">
              {item.name}
            </p>
          </li>
        ))}
      </ul>
      {restCount > 0 ? (
        <p className="mt-2 text-[11px] text-neutral-500">
          他 {restCount} 件は下のブース物販セクションで詳細 ↓
        </p>
      ) : null}
    </div>
  );
}

/**
 * 物販サムネ。imagePath があれば next/image、無ければ 🛍 アイコンでフォールバック。
 * size はピクセル単位の数値（24 / 28 / 32 等）。
 */
function Thumbnail({
  imagePath,
  size,
}: {
  imagePath: string | undefined;
  size: number;
}) {
  if (imagePath !== undefined) {
    return (
      <Image
        src={imagePath}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-md object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-md bg-neutral-100"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
    >
      🛍
    </span>
  );
}
