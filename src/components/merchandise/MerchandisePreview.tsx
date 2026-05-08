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
 * - card-main:    v1.9.2 物販主役カード用（見出し + サムネ 36px + 物販リスト）
 *                 → リストカード / SlotCard で物販を画面の主役として大きく出す
 *                 v1.9.5 で 4 件以上の番組は 3 件 + fade-out + 「あと N 件を見る」展開
 *                 ボタンに変更（カードがバカ長くなる問題と「省略表記の不自然」問題を両立解決）
 *
 * 設計思想:
 * - spotlight / catchphrase / subCatch などのコピーは扱わない（責務分離）。
 * - 物販に関する情報のみを compact に「ちょいだし」することに専念する。
 * - imagePath が無い物販は 🛍 アイコンでフォールバック表示（X 投稿出典では imagePath を持たないことが多いため、設計上の正常系）。
 *
 * card-main variant が useState で展開状態を管理するため、このファイル全体を
 * Client Component として扱う（呼び出し側はすでに全て 'use client'）。
 *
 * 詳細設計: docs/plans/v1.8-merchandise-preview-on-discovery/README.md
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { groupMerchandiseDetails } from './MerchandiseGroupCard';
import type { MerchandiseDetail } from '@/lib/types';

/** card-main variant の折りたたみ時に見せる件数 */
const CARD_MAIN_PREVIEW_COUNT = 3;
/** card-main variant のリスト固定高さ（3 アイテム + gap 程度）
 *  - サムネ 36px + line-clamp 2行 ≒ 1 アイテム 38-44px
 *  - gap 6px × 2
 *  - 余白少々 → 132px に固定
 *  この高さは折りたたみ時 / 展開時の両方で同じ。展開時は内部スクロールにする
 *  ことで、親モーダル / カードの高さチラつきを防ぐ。
 */
const CARD_MAIN_LIST_HEIGHT_PX = 132;

type Variant = 'list' | 'slot' | 'sheet-header' | 'card-main';

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

  if (variant === 'card-main') {
    // v1.9.2 / v1.9.5 物販主役カード用:
    // - 4 件以上の番組: 3 件表示 + 末尾 fade-out + 「あと N 件を見る ↓」展開ボタン
    // - 3 件以下の番組: 全件表示（fade-out / ボタン無し）
    // 件数省略の不自然と、カードがバカ長くなる問題を両立解決する設計。
    return <CardMainPreview details={details} className={className} />;
  }

  // variant === 'sheet-header'
  // 上位 2 件の name を箇条書き（残り件数の説明テキストはユーザー判断で省略：下にブース物販セクションが続くため自明）
  const headlineItems = details.slice(0, 2);

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
    </div>
  );
}

/**
 * card-main variant の本体（useState で展開状態を持つため独立関数化）。
 *
 * v1.9.6 改修: カード高さ固定 + 内部スクロールに変更。
 * 展開時にカードが縦に伸びると親モーダル全体の高さが変動して
 * 「目がチカチカする」ため、リスト領域は常に同じ高さ (132px) で固定し、
 * 展開時は overflow-y-auto で内部スクロール可能にする。
 *
 * 親 (SlotCard / リストカード) が stretched button パターンで card 全体タップを
 * 拾うため、展開ボタン・スクロール領域は `relative z-20` + `pointer-events-auto`
 * + `stopPropagation` で独立クリック可能にする。
 *
 * アニメーション:
 * - ChevronDown を `rotate-180` で展開時に上向きに回転（300ms transition）
 * - fade-out グラデは展開時に opacity 0 で消える（300ms transition）
 * - スクロール領域の overflow は瞬時切替（ブラウザ標準）
 */
function CardMainPreview({
  details,
  className,
}: {
  details: ReadonlyArray<MerchandiseDetail>;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = details.length > CARD_MAIN_PREVIEW_COUNT;
  const hiddenCount = details.length - CARD_MAIN_PREVIEW_COUNT;
  // 4 件以上の番組はリスト領域を 132px で固定（折りたたみ時 / 展開時とも同じ）
  // 3 件以下の番組はそもそも overflow しないため maxHeight 制限なし
  const listMaxHeight = hasMore ? `${CARD_MAIN_LIST_HEIGHT_PX}px` : undefined;

  return (
    <div className={className ?? ''}>
      <p className="text-[10px] font-bold tracking-wide text-neutral-500">
        🛍 ブース物販
      </p>
      <div
        className={
          // 展開時はスクロール操作のため pointer-events-auto を有効化
          // （親 article の pointer-events-none を上書き、stretched button より前面に）
          hasMore && expanded
            ? 'relative mt-1.5 z-20 pointer-events-auto'
            : 'relative mt-1.5'
        }
      >
        <ul
          className="flex flex-col gap-1.5"
          style={{
            maxHeight: listMaxHeight,
            overflowY: hasMore && expanded ? 'auto' : 'hidden',
          }}
          // 親要素の pointer-events-none を継承するが、wheel イベント受付のため
          // 展開時は内側 ul もスクロール許可
          onClickCapture={(e) => {
            // 展開時の li クリックがバブルして stretched button を触らないように
            if (expanded) e.stopPropagation();
          }}
        >
          {details.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Thumbnail imagePath={item.imagePath} size={36} />
              <p className="line-clamp-2 min-w-0 flex-1 text-xs font-bold leading-snug text-neutral-800">
                {item.name}
              </p>
            </li>
          ))}
        </ul>
        {/* 折りたたみ時、リスト下端に fade-out グラデで「下にもまだある」感を出す。
            展開時は opacity 0 にすることでフェードアウト */}
        {hasMore ? (
          <div
            aria-hidden="true"
            className={
              expanded
                ? 'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent opacity-0 transition-opacity duration-300'
                : 'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent opacity-100 transition-opacity duration-300'
            }
          />
        ) : null}
      </div>

      {/* もっと見る / 閉じるボタン（4 件以上の番組のみ） — 1 つの ChevronDown を回転させて状態表現 */}
      {hasMore ? (
        <button
          type="button"
          onClick={(e) => {
            // stretched button（card 全体タップ）にバブルさせない
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
          className="relative z-20 mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-neutral-100 py-1.5 text-[11px] font-bold text-neutral-700 transition-colors hover:bg-neutral-200 pointer-events-auto"
        >
          <span>{expanded ? '閉じる' : `あと ${hiddenCount} 件を見る`}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={
              expanded
                ? 'transition-transform duration-300 rotate-180'
                : 'transition-transform duration-300'
            }
          />
        </button>
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
