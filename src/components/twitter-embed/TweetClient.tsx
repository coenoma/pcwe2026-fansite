/**
 * X (Twitter) 投稿の Client Component 版埋め込み。
 *
 * 用途:
 * - Server Component の TwitterEmbed (`react-tweet/api` で getTweet) は async function なので、
 *   Client Component の中（マップのボトムシート等）に直接配置すると Next.js の制約でエラーになる。
 * - そこで `react-tweet` の Client 版 `<Tweet id="..." />` を wrap した本コンポーネントを使う。
 *
 * 動作:
 * - 初回マウント時に syndication API から fetch（CSR）→ ロード中は TweetSkeleton 表示
 * - エラー時は `react-tweet` 側のフォールバック UI
 *
 * 参照: https://react-tweet.vercel.app/
 */

'use client';

import { Tweet } from 'react-tweet';

interface Props {
  tweetId: string;
}

export function TweetClient({ tweetId }: Props) {
  return <Tweet id={tweetId} />;
}
