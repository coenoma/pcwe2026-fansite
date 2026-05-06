/**
 * 1 グループ（= 1 出典に紐づく 1 件以上の物販）を 1 カードでレンダリングする。
 *
 * - グループ内の物販リストを縦に並べて表示
 * - X 投稿は最後に 1 度だけ埋め込み、それ以外の出典は「○○で見る」リンクボタンに
 * - 各 item に additionalSources があれば小さく「関連: 1, 2」を並べる
 *
 * カード自体は flex-col で、tweet 埋め込みが下に伸びても他カードと並んだ時の
 * 上揃えを保つ（grid 内で各カードの heights は独立して伸縮する）。
 *
 * `compact` モード:
 * - マップピン押下時のポップアップ等、限られたスペース向け
 * - パディング・フォントを縮小し、X 埋め込みの余白を削る
 */

import { ExternalLink } from 'lucide-react';
import {
  TwitterEmbed,
  extractTweetId,
} from '@/components/twitter-embed/TwitterEmbed';
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
  const tweetId =
    group.sourceType === 'x-post' ? extractTweetId(group.sourceUrl) : null;

  return (
    <article
      className={
        compact
          ? 'flex flex-col rounded-xl border border-neutral-200 bg-white p-3'
          : 'flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5'
      }
    >
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
          {item.additionalSources !== undefined &&
          item.additionalSources.length > 0 ? (
            <p className="mt-2 text-xs text-neutral-500">
              関連:{' '}
              {item.additionalSources.map((src, si) => (
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
      {tweetId !== null ? (
        // react-tweet がビルド時に server で syndication API から取得し、static HTML として埋め込む
        <div className="mt-3 [&_.react-tweet-theme]:!my-0">
          <TwitterEmbed tweetId={tweetId} />
        </div>
      ) : (
        <a
          href={group.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={
            compact
              ? 'mt-2 inline-flex items-center gap-1 self-start text-xs font-bold text-primary-700 transition-colors hover:text-primary-800 hover:underline'
              : 'mt-3 inline-flex items-center gap-1 self-start text-sm font-bold text-primary-700 transition-colors hover:text-primary-800 hover:underline'
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
