/**
 * 1 グループ（= 1 メイン出典に紐づく 1 件以上の物販）を 1 カードでレンダリングする。
 *
 * 表示順序:
 * 1. お品書き画像（imagePath）— 物販ラインナップ全体を俯瞰できるサムネ
 * 2. 商品リスト（グループ内 items）
 * 3. 日本式出典明記（著者「タイトル」種別、公開日（参照日））
 * 4. X 埋め込み（additionalSources に x-post があれば、王道パターン）
 * 5. メイン出典への CTA（「note で詳細を見る」等）
 *
 * 王道パターン（X 概要 + note 詳細 + お品書き画像）:
 * - メイン sourceType が note / web、additionalSources に x-post を持つケース
 * - X 埋め込みで番組ホストの生の告知を見せつつ、お品書き画像で物販を俯瞰、
 *   note CTA で詳細記事へ誘導する三段構成
 *
 * カード自体は flex-col で、tweet 埋め込みが下に伸びても他カードと並んだ時の
 * 上揃えを保つ（grid 内で各カードの heights は独立して伸縮する）。
 *
 * `compact` モード:
 * - マップピン押下時のポップアップ等、限られたスペース向け
 * - パディング・フォントを縮小し、X 埋め込みの余白を削る
 */

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import {
  TwitterEmbed,
  extractTweetId,
} from '@/components/twitter-embed/TwitterEmbed';
import { TweetClient } from '@/components/twitter-embed/TweetClient';
import type {
  MerchandiseDetail,
  MerchandiseSourceType,
} from '@/lib/types';

export interface MerchandiseGroup {
  sourceUrl: string;
  sourceType: MerchandiseSourceType;
  /** この出典でまとめて紹介される物販 1 件以上 */
  items: MerchandiseDetail[];
}

interface Props {
  group: MerchandiseGroup;
  /** 限られたスペース向けの圧縮表示モード（マップポップアップ等）*/
  compact?: boolean;
}

export function MerchandiseGroupCard({ group, compact = false }: Props) {
  const mainTweetId =
    group.sourceType === 'x-post' ? extractTweetId(group.sourceUrl) : null;

  // 王道パターン: メイン出典が X 以外で、グループ先頭 item の additionalSources に
  // x-post が含まれる場合は「X 概要 + 本出典詳細」の二段構成として大きく扱う。
  const headItem = group.items[0];
  const supplementaryTweetId = (() => {
    if (mainTweetId !== null) return null;
    const xSource = headItem.additionalSources?.find(
      (s) => s.type === 'x-post',
    );
    return xSource !== undefined ? extractTweetId(xSource.url) : null;
  })();

  // 表示用: お品書き画像はグループ先頭 item の imagePath を採用
  const heroImage = headItem.imagePath;
  const heroAlt = headItem.imageAlt ?? '物販お品書き';
  const heroCredit = headItem.imageCredit;

  return (
    <article
      className={
        compact
          ? 'flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white'
          : 'flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white'
      }
    >
      {/* お品書き画像（あれば、カード上部に大きく） */}
      {heroImage !== undefined ? (
        <figure className="relative w-full bg-neutral-50">
          <Image
            src={heroImage}
            alt={heroAlt}
            width={1200}
            height={675}
            className="h-auto w-full object-cover"
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
          {heroCredit !== undefined ? (
            <figcaption
              className={
                compact
                  ? 'px-3 py-1.5 text-[10px] leading-tight text-neutral-500'
                  : 'px-4 py-2 text-xs leading-tight text-neutral-500 sm:px-5'
              }
            >
              {heroCredit}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className={compact ? 'p-3' : 'p-4 sm:p-5'}>
        {group.items.map((item, i) => (
          <div
            key={i}
            className={i > 0 ? 'mt-3 border-t border-neutral-100 pt-3' : ''}
          >
            <h3
              className={
                compact
                  ? 'text-sm font-bold text-neutral-900'
                  : 'font-bold text-neutral-900'
              }
            >
              {item.name}
            </h3>
            {item.description !== undefined && item.description.length > 0 ? (
              <p
                className={
                  compact
                    ? 'mt-1 text-xs leading-relaxed text-neutral-700'
                    : 'mt-1 text-sm leading-relaxed text-neutral-700'
                }
              >
                {item.description}
              </p>
            ) : null}
            {/* 補助出典（x-post 以外）のみテキストリンクで表示。x-post は下に大きく埋め込む */}
            {item.additionalSources !== undefined &&
            item.additionalSources.filter((s) => s.type !== 'x-post').length >
              0 ? (
              <p className="mt-2 text-xs text-neutral-500">
                関連:{' '}
                {item.additionalSources
                  .filter((s) => s.type !== 'x-post')
                  .map((src, si) => (
                    <span key={src.url}>
                      {si > 0 ? ' / ' : ''}
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 underline-offset-2 hover:underline"
                      >
                        {src.label ?? sourceTypeLabel(src.type)}
                      </a>
                    </span>
                  ))}
              </p>
            ) : null}
          </div>
        ))}

        {/* 日本式出典明記（メイン出典が X 以外で、出典メタが揃っている場合のみ） */}
        {mainTweetId === null ? (
          <Citation item={headItem} sourceType={group.sourceType} compact={compact} />
        ) : null}

        {/* 王道パターン: 補助 X 投稿
            - compact（マップポップアップ等、Client Component 内）: TweetClient（CSR fetch 版）で埋め込み
            - 通常（Server Component の番組詳細ページ）: TwitterEmbed (Server, getTweet で SSR) で埋め込み */}
        {supplementaryTweetId !== null ? (
          <div className={compact ? 'mt-3 [&_.react-tweet-theme]:!my-0' : 'mt-4 [&_.react-tweet-theme]:!my-0'}>
            <p
              className={
                compact
                  ? 'mb-2 text-[10px] font-semibold tracking-wide text-neutral-500'
                  : 'mb-2 text-xs font-semibold tracking-wide text-neutral-500'
              }
            >
              📣 番組ホストの告知ツイート
            </p>
            {compact ? (
              <TweetClient tweetId={supplementaryTweetId} />
            ) : (
              <TwitterEmbed tweetId={supplementaryTweetId} />
            )}
          </div>
        ) : null}
      </div>

      {/* CTA: メイン出典が X なら埋め込み、それ以外はリンクボタン */}
      {mainTweetId !== null ? (
        <div
          className={
            compact
              ? 'border-t border-neutral-100 p-3 [&_.react-tweet-theme]:!my-0'
              : 'border-t border-neutral-100 p-4 sm:p-5 [&_.react-tweet-theme]:!my-0'
          }
        >
          {compact ? (
            <TweetClient tweetId={mainTweetId} />
          ) : (
            <TwitterEmbed tweetId={mainTweetId} />
          )}
        </div>
      ) : (
        <a
          href={group.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={
            compact
              ? 'mx-3 mb-3 inline-flex items-center gap-1 self-start rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100'
              : 'mx-4 mb-4 inline-flex items-center gap-1 self-start rounded-lg bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-100 sm:mx-5 sm:mb-5'
          }
        >
          {sourceTypeLabel(group.sourceType)}で見る
          <ExternalLink size={compact ? 12 : 14} aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

/**
 * 連続する同 sourceUrl の merchandiseDetails をグループ化する。
 * 例: [A url1, B url1, C url1, D url2] → [{url1, items: [A, B, C]}, {url2, items: [D]}]
 *
 * 同じ sourceUrl を持つ entry が連続でない場合（途中に別 URL が挟まる場合）は別グループに
 * なるが、これはほぼ起きない（データ作成時に同じ出典の物販はまとめて並べるルール）。
 */
export function groupMerchandiseDetails(
  details: ReadonlyArray<MerchandiseDetail>,
): MerchandiseGroup[] {
  const groups: MerchandiseGroup[] = [];
  for (const d of details) {
    const last = groups[groups.length - 1];
    if (
      last !== undefined &&
      last.sourceUrl === d.sourceUrl &&
      last.sourceType === d.sourceType
    ) {
      last.items.push(d);
    } else {
      groups.push({
        sourceUrl: d.sourceUrl,
        sourceType: d.sourceType,
        items: [d],
      });
    }
  }
  return groups;
}

/**
 * 日本式出典表記（学術論文や記事で一般的なフォーマット）。
 * 例: 「内海あさ「PCWE2026 出展商品ラインアップ」note、2026年5月4日公開（2026年5月7日 07:33 参照）」
 *
 * フォールバック: メタが不足している場合は sourceUrl のドメインのみを表示。
 */
function Citation({
  item,
  sourceType,
  compact,
}: {
  item: MerchandiseDetail;
  sourceType: MerchandiseSourceType;
  compact: boolean;
}) {
  const author = item.sourceAuthor;
  const title = item.sourceTitle;
  const published = item.sourcePublishedAt;
  const accessed = item.accessedAt;

  // メタが何もない場合は出典明記スキップ（CTA リンクのみで十分）
  if (
    author === undefined &&
    title === undefined &&
    published === undefined &&
    accessed === undefined
  ) {
    return null;
  }

  const mediaLabel = sourceTypeLabel(sourceType);
  const publishedJa = published !== undefined ? formatJaDate(published) : null;
  const accessedJa = accessed !== undefined ? formatJaDateTime(accessed) : null;

  return (
    <p
      className={
        compact
          ? 'mt-3 border-t border-neutral-100 pt-2 text-[10px] leading-relaxed text-neutral-500'
          : 'mt-4 border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-500'
      }
    >
      <span className="font-semibold">出典: </span>
      {author !== undefined ? `${author}` : ''}
      {title !== undefined ? `「${title}」` : ''}
      {mediaLabel}
      {publishedJa !== null ? `、${publishedJa}公開` : ''}
      {accessedJa !== null ? `（${accessedJa} 参照）` : ''}
    </p>
  );
}

function formatJaDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m === null) return iso;
  return `${m[1]}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
}

function formatJaDateTime(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (m === null) return iso;
  const date = `${m[1]}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
  if (m[4] === undefined) return date;
  return `${date} ${m[4]}:${m[5]}`;
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
      return 'note';
    case 'web':
      return 'web';
  }
}
