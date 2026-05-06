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
 * - 「公式情報」セクション（max-w-3xl）から独立して、max-w-6xl の独立セクションに
 * - グリッドで md:2 列、xl:3 列にして PC ワイド画面でも空白を活かす
 *
 * グルーピング:
 * - 同じ sourceUrl を持つ連続する merchandiseDetails は 1 グループ（1 カード）に
 *   まとめられる（X 埋め込みも 1 回のみ表示）
 * - これは「1 つの投稿で複数物販を紹介しているケース」（pcwe-020 等）に対応する
 *   ためで、出典の重複表示を避ける
 * - 同じ商品に対して情報源が複数ある場合は `additionalSources` で補強（小さく
 *   関連リンクを並べる）
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

/**
 * 連続する同 sourceUrl の merchandiseDetails をグループ化する。
 * 例: [A url1, B url1, C url1, D url2] → [{url1, items: [A, B, C]}, {url2, items: [D]}]
 *
 * 同じ sourceUrl を持つ entry が連続でない場合（途中に別 URL が挟まる場合）は別グループに
 * なるが、これはほぼ起きない（データ作成時に同じ出典の物販はまとめて並べるルール）。
 */
interface MerchandiseGroup {
  sourceUrl: string;
  sourceType: MerchandiseSourceType;
  /** この出典でまとめて紹介される物販 1 件以上 */
  items: MerchandiseDetail[];
}

function groupConsecutive(
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

  const groups = detailsList !== null ? groupConsecutive(detailsList) : [];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
          ブース物販
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          番組ホストが SNS で予告したグッズ・情報を可能な範囲でまとめています。
        </p>

        {groups.length > 0 ? (
          // breakpoint:
          //   ~768px (md 未満): 1 列
          //   768-1279px (md-xl): 2 列
          //   1280px+ (xl): 3 列（各 ~355px+ 確保）
          <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group, i) => (
              // key は index ベース。連続しない同 sourceUrl 重複を許容しつつ、
              // grouping 後の表示順は安定するため index で十分。
              <MerchandiseGroupCard key={i} group={group} />
            ))}
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

/**
 * 1 グループ（= 1 出典に紐づく 1 件以上の物販）を 1 カードでレンダリングする。
 *
 * - グループ内の物販リストを縦に並べて表示
 * - X 投稿は最後に 1 度だけ埋め込み、それ以外の出典は「○○で見る」リンクボタンに
 * - 各 item に additionalSources があれば小さく「関連: 1, 2」を並べる
 *
 * カード自体は flex-col で、tweet 埋め込みが下に伸びても他カードと並んだ時の
 * 上揃えを保つ（grid 内で各カードの heights は独立して伸縮する）。
 */
function MerchandiseGroupCard({ group }: { group: MerchandiseGroup }) {
  const tweetId =
    group.sourceType === 'x-post' ? extractTweetId(group.sourceUrl) : null;

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      {group.items.map((item, i) => (
        <div
          key={i}
          className={
            i > 0 ? 'mt-3 border-t border-neutral-100 pt-3' : ''
          }
        >
          <h3 className="font-bold text-neutral-900">{item.name}</h3>
          {item.description !== undefined && item.description.length > 0 ? (
            <p className="mt-1 text-sm leading-relaxed text-neutral-700">
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
          className="mt-3 inline-flex items-center gap-1 self-start text-sm font-bold text-primary-700 transition-colors hover:text-primary-800 hover:underline"
        >
          {sourceTypeLabel(group.sourceType)}で見る
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
