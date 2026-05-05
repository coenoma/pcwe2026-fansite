/**
 * 番組詳細ページの「ブース物販」セクション。
 *
 * 表示優先順位:
 * 1. merchandiseDetails（情報源 URL 付きの構造化データ）— X 投稿は react-tweet で埋め込み
 * 2. merchandise（公式ブース由来のテキストリスト）— 補足として表示
 *
 * X 投稿の画像は **公式 syndication API 経由で react-tweet が取得** するため、
 * `pbs.twimg.com` をホットリンクせず、X の Display Requirements に準拠する。
 */

import { Tweet } from 'react-tweet';
import { ExternalLink } from 'lucide-react';
import 'react-tweet/theme.css';
import type { MerchandiseDetail, MerchandiseSourceType } from '@/lib/types';

interface Props {
  /** 公式ブース由来の物販名一覧（テキストのみ）*/
  merchandise: ReadonlyArray<string> | undefined;
  /** 構造化された物販詳細（X 投稿引用など）*/
  merchandiseDetails: ReadonlyArray<MerchandiseDetail> | undefined;
}

export function MerchandiseSection({ merchandise, merchandiseDetails }: Props) {
  const hasDetails =
    merchandiseDetails !== undefined && merchandiseDetails.length > 0;
  const hasList = merchandise !== undefined && merchandise.length > 0;

  if (!hasDetails && !hasList) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-neutral-500">ブース物販</h3>

      {hasDetails ? (
        <div className="mt-3 flex flex-col gap-4">
          {merchandiseDetails!.map((detail, i) => (
            <MerchandiseCard key={`${detail.sourceUrl}-${i}`} detail={detail} />
          ))}
        </div>
      ) : null}

      {/*
        merchandiseDetails があれば公式ブースのテキストリストは「補足」として控えめに表示。
        merchandiseDetails がなければ既存通りメインで表示。
      */}
      {!hasDetails && hasList ? (
        <p className="mt-1 text-base text-neutral-800">
          {merchandise!.join(' / ')}
        </p>
      ) : null}

      {hasDetails && hasList ? (
        <p className="mt-4 text-xs text-neutral-500">
          公式ブース出店予定: {merchandise!.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}

/** 1 つの物販詳細カード。X 投稿は埋め込み、その他は出典リンクを表示。*/
function MerchandiseCard({ detail }: { detail: MerchandiseDetail }) {
  // X 投稿: status ID を抽出して react-tweet で埋め込む
  const tweetId = extractTweetId(detail);

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h4 className="font-bold text-neutral-900">{detail.name}</h4>
      {detail.description !== undefined && detail.description.length > 0 ? (
        <p className="mt-1 text-sm leading-relaxed text-neutral-700">
          {detail.description}
        </p>
      ) : null}

      {tweetId !== null ? (
        // 公式 syndication API 経由で X 投稿を埋め込み（規約準拠）。
        // data-theme で react-tweet の light テーマを指定。
        <div className="mt-3" data-theme="light">
          <Tweet id={tweetId} />
        </div>
      ) : (
        <a
          href={detail.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary-700 transition-colors hover:text-primary-800 hover:underline"
        >
          {sourceTypeLabel(detail.sourceType)}を見る
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

/**
 * X 投稿の場合は status ID を抽出する。
 * sourceType が 'x-post' で URL に `/status/{id}` を含む場合のみ ID を返す。
 */
function extractTweetId(detail: MerchandiseDetail): string | null {
  if (detail.sourceType !== 'x-post') return null;
  const match = detail.sourceUrl.match(/\/status\/(\d+)/);
  return match !== null ? match[1] : null;
}

function sourceTypeLabel(type: MerchandiseSourceType): string {
  switch (type) {
    case 'x-post':
      return 'X 投稿';
    case 'instagram-post':
      return 'Instagram 投稿';
    case 'official-booth':
      return '公式ブース';
    case 'official-site':
      return '番組公式サイト';
    case 'note':
      return 'note 記事';
    case 'web':
      return '出典';
  }
}
