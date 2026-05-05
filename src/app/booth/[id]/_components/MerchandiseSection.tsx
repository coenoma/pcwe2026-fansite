/**
 * 番組詳細ページの「ブース物販」独立セクション。
 *
 * 表示優先順位:
 * 1. merchandiseDetails（情報源 URL 付きの構造化データ）— X 投稿は react-tweet で埋め込み
 * 2. merchandise（公式ブース由来のテキストリスト）— 補足として表示
 *
 * X 投稿の画像は **react-tweet が syndication API 経由で取得** するため、
 * `pbs.twimg.com` をホットリンクせず、X の Display Requirements に準拠する。
 *
 * `output: 'export'` (SSG) なのでビルド時に `getTweet()` が server で実行され、
 * 完全な static HTML が生成される（iframe 不使用、widgets.js 不使用）。
 *
 * レイアウト:
 * - 「公式情報」セクション（max-w-3xl）から独立して、max-w-5xl の独立セクションに
 * - グリッドで sm:2 列、xl:3 列にして PC ワイド画面でも空白を活かす
 * - bg-white で公式情報と同色 → セクション境界を主張せず連続感を保つ
 */

import { ExternalLink } from 'lucide-react';
import type { MerchandiseDetail, MerchandiseSourceType } from '@/lib/types';
import { TwitterEmbed, extractTweetId } from './TwitterEmbed';

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
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
          ブース物販
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          番組ホストが SNS で予告したグッズ・情報を可能な範囲でまとめています。
        </p>

        {hasDetails ? (
          // breakpoint:
          //   ~768px (md 未満): 1 列
          //   768-1279px (md-xl): 2 列（各 ~360-580px）
          //   1280px+ (xl): 3 列（各 ~355px+ 確保）
          // tweet 埋め込みは横幅 350px 程度から綺麗に表示できるため、
          // 最大 3 列でも各カードが「細長すぎ」になるのを避けられる。
          <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {merchandiseDetails!.map((detail, i) => (
              <MerchandiseCard key={`${detail.sourceUrl}-${i}`} detail={detail} />
            ))}
          </div>
        ) : null}

        {/*
          merchandiseDetails があれば公式ブースのテキストリストは「補足」として控えめに。
          merchandiseDetails がなければ既存通りメインで表示。
        */}
        {!hasDetails && hasList ? (
          <p className="mt-3 text-base text-neutral-800">
            {merchandise!.join(' / ')}
          </p>
        ) : null}

        {hasDetails && hasList ? (
          <p className="mt-6 text-xs text-neutral-500">
            公式ブース出店予定: {merchandise!.join(' / ')}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/**
 * 1 つの物販詳細カード。
 * sourceType が 'x-post' なら react-tweet で SSG 時に投稿を埋め込み、
 * それ以外（公式ブース / note / web 等）は出典リンクボタンで誘導。
 *
 * カード自体は flex-col で、tweet 埋め込みが下に伸びても他カードと並んだ時の
 * 上揃えを保つ（grid 内で各カードの heights は独立して伸縮する）。
 */
function MerchandiseCard({ detail }: { detail: MerchandiseDetail }) {
  const tweetId =
    detail.sourceType === 'x-post' ? extractTweetId(detail.sourceUrl) : null;

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <h3 className="font-bold text-neutral-900">{detail.name}</h3>
      {detail.description !== undefined && detail.description.length > 0 ? (
        <p className="mt-1 text-sm leading-relaxed text-neutral-700">
          {detail.description}
        </p>
      ) : null}
      {tweetId !== null ? (
        // react-tweet がビルド時に server で syndication API から取得し、static HTML として埋め込む
        <div className="mt-3 [&_.react-tweet-theme]:!my-0">
          <TwitterEmbed tweetId={tweetId} />
        </div>
      ) : (
        <a
          href={detail.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 self-start text-sm font-bold text-primary-700 transition-colors hover:text-primary-800 hover:underline"
        >
          {sourceTypeLabel(detail.sourceType)}で見る
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </article>
  );
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
