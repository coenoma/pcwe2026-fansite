/**
 * X (Twitter) 投稿の埋め込みコンポーネント。
 *
 * Vercel 公式の `react-tweet` を使い、**ビルド時に server で syndication API から
 * tweet データを取得**し、static HTML として埋め込む（iframe 不使用）。
 *
 * 設計判断:
 * - `output: 'export'` (SSG) と完全に親和（react-tweet 公式が推奨する SSG パターン）
 * - iframe を持たないため、CSP 制約・widgets.js のタイミング問題から解放される
 * - 画像も syndication API 経由で取得した URL を使うため X TOS（Display Requirements）に準拠
 *
 * 関連:
 * - https://react-tweet.vercel.app/next
 * - https://github.com/vercel/react-tweet
 */

import { EmbeddedTweet, TweetNotFound } from 'react-tweet';
import { getTweet } from 'react-tweet/api';

interface Props {
  /** Tweet ID（X URL の `/status/{id}` 部分の数字）*/
  tweetId: string;
}

export async function TwitterEmbed({ tweetId }: Props) {
  try {
    const tweet = await getTweet(tweetId);
    return tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />;
  } catch (error) {
    // build 時に rate limit / 削除済み tweet 等で失敗した場合のフォールバック。
    // production では fan-guide のビルドそのものを止めない（404 や rate limit は許容）。
    console.warn(`⚠️ tweet ${tweetId} の取得に失敗:`, error);
    return <TweetNotFound error={error} />;
  }
}

/**
 * X 投稿 URL から tweet ID を抽出する。
 * 例: 'https://x.com/noshokuradio/status/2048685734534721542' → '2048685734534721542'
 *     'https://twitter.com/foo/status/123?s=20' → '123'
 *
 * 抽出失敗時は null を返す（呼び出し側でリンクボタンへフォールバックする想定）。
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/);
  return match?.[1] ?? null;
}
