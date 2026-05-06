/**
 * 番組詳細ページの「ブース物販」独立セクション。
 *
 * 表示優先順位:
 * 1. merchandiseDetails（情報源 URL 付きの構造化データ）— X 投稿は react-tweet で埋め込み
 * 2. merchandise（公式ブース由来のテキストリスト）— 補足として表示
 *
 * 設計:
 * - 件数別レスポンシブグリッドのロジックは {@link MerchandiseList} に切り出し済み。
 *   このコンポーネントは booth ページ用の見出し + section 装飾 + 補足テキストを
 *   担当する薄いラッパー。
 * - 同じ MerchandiseList は将来のマップピン押下ポップアップでも使い回す想定
 *   （`layout="popup"` で compact 縦積みに切り替え可）。
 * - X 投稿の画像は **react-tweet が syndication API 経由で取得** するため、
 *   `pbs.twimg.com` をホットリンクせず、X の Display Requirements に準拠する。
 * - `output: 'export'` (SSG) なのでビルド時に `getTweet()` が server で実行され、
 *   完全な static HTML が生成される（iframe 不使用、widgets.js 不使用）。
 */

import { MerchandiseList } from '@/components/merchandise/MerchandiseList';
import type { MerchandiseDetail } from '@/lib/types';

interface Props {
  /** 公式ブース由来の物販名一覧（テキストのみ）*/
  merchandise: ReadonlyArray<string> | undefined;
  /** 構造化された物販詳細（X 投稿引用など）*/
  merchandiseDetails: ReadonlyArray<MerchandiseDetail> | undefined;
}

export function MerchandiseSection({ merchandise, merchandiseDetails }: Props) {
  // 制御フロー解析でナローイングするため、配列そのものを参照する形で判定
  const detailsList =
    merchandiseDetails !== undefined && merchandiseDetails.length > 0
      ? merchandiseDetails
      : null;
  const merchList =
    merchandise !== undefined && merchandise.length > 0 ? merchandise : null;

  if (detailsList === null && merchList === null) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
          ブース物販
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          番組ホストが SNS で予告したグッズ・情報を可能な範囲でまとめています。
        </p>

        {detailsList !== null ? (
          <div className="mt-6">
            <MerchandiseList details={detailsList} />
          </div>
        ) : null}

        {/*
          merchandiseDetails があれば公式ブースのテキストリストは「補足」として控えめに。
          merchandiseDetails がなければ既存通りメインで表示。
        */}
        {detailsList === null && merchList !== null ? (
          <p className="mt-3 text-base text-neutral-800">
            {merchList.join(' / ')}
          </p>
        ) : null}

        {detailsList !== null && merchList !== null ? (
          <p className="mt-6 text-xs text-neutral-500">
            公式ブース出店予定: {merchList.join(' / ')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
