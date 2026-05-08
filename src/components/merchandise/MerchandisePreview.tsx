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

import Image from 'next/image';
import { groupMerchandiseDetails } from './MerchandiseGroupCard';
import type { MerchandiseDetail } from '@/lib/types';

/** card-main variant でスクロール扱いになる閾値件数 */
const CARD_MAIN_SCROLL_THRESHOLD = 3;
/** card-main variant のリスト固定高さ（3.5 件分 = 残り 0.5 件が見切れて「下にもある」感）
 *  - 1 アイテム ≒ サムネ 36px + 余白 = 約 40px
 *  - 3 アイテム + gap 6px × 2 + 半アイテム ≒ 140px
 *  カード高さ自体はこの値で常に固定。中身が多い番組は内部スクロールで全件見える。
 */
const CARD_MAIN_LIST_HEIGHT_PX = 140;

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
 * card-main variant の本体。
 *
 * v1.9.8 改修: 開閉ボタン廃止、常時スクロール UI に簡素化。
 *
 * - 4 件以上の番組: リスト高さ 140px（3.5 件分）で固定、内部スクロール常時有効
 *   - 残り 0.5 件が見切れることで「下にもある」感を出す
 *   - 下端の fade-out グラデが見切り部分のスクロールヒントを補強
 *   - カスタムスクロールバー（primary-200 細スクロール）でサイトの雰囲気と整合
 * - 3 件以下の番組: 高さ制限なし、全件そのまま表示
 *
 * カード高さは件数によらず一定で、親モーダルやリストレイアウトの高さチラつき
 * （v1.9.6 で問題視された目チカチカ）を完全回避する。
 *
 * 親 (SlotCard / リストカード) が stretched button パターンで card 全体タップを
 * 拾うため、スクロール領域は `relative z-20` + `pointer-events-auto` で独立。
 * リスト内 li タップ自体は stretched button へバブルさせて「ブース詳細を開く」
 * 動作を自然に発火させる（onClickCapture stopPropagation はしない）。
 */
function CardMainPreview({
  details,
  className,
}: {
  details: ReadonlyArray<MerchandiseDetail>;
  className?: string;
}) {
  const isScrollable = details.length > CARD_MAIN_SCROLL_THRESHOLD;

  return (
    <div className={className ?? ''}>
      <p className="text-[10px] font-bold tracking-wide text-neutral-500">
        🛍 ブース物販
      </p>
      <div
        className={
          // スクロール扱いの番組はホイール / タッチ操作のため pointer-events-auto を有効化
          isScrollable
            ? 'relative mt-1.5 z-20 pointer-events-auto'
            : 'relative mt-1.5'
        }
      >
        <ul
          className={
            isScrollable
              ? // カスタムスクロールバー: 細幅 + primary 系の thumb でサイトの雰囲気と整合
                'flex flex-col gap-1.5 overflow-y-auto pr-1 ' +
                '[&::-webkit-scrollbar]:w-1 ' +
                '[&::-webkit-scrollbar-track]:bg-transparent ' +
                '[&::-webkit-scrollbar-thumb]:bg-primary-200 ' +
                '[&::-webkit-scrollbar-thumb]:rounded-full ' +
                '[&::-webkit-scrollbar-thumb:hover]:bg-primary-300'
              : 'flex flex-col gap-1.5'
          }
          style={
            isScrollable
              ? {
                  maxHeight: `${CARD_MAIN_LIST_HEIGHT_PX}px`,
                  // Firefox 用のスクロールバースタイル指定
                  scrollbarWidth: 'thin',
                  scrollbarColor:
                    'var(--color-primary-200) transparent',
                }
              : undefined
          }
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
        {/* 下端 fade-out グラデ: 「下にもある」感を視覚化（スクロール対象のときだけ） */}
        {isScrollable ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent"
          />
        ) : null}
      </div>
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
