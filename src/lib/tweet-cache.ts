/**
 * 全番組の merchandiseDetails から X 投稿 ID を集めて、
 * Server Component（SSG ビルド時）で一括 pre-fetch する。
 *
 * これにより:
 * - Client 側で fetch する必要なし → CORS / Rate Limit 問題回避
 * - Tweet not found / 削除済み tweet は build 時に warning で検出
 * - Map のボトムシート（Client）でも EmbeddedTweet を直接レンダリングできる
 *
 * 設計:
 * - extractTweetIdFromUrl で URL から数字 ID を抽出
 * - Promise.all で並列取得（getTweet は内部で syndication API を叩く）
 * - 失敗した tweet は undefined を入れる → Client で <TweetNotFound /> フォールバック
 */

import { getTweet } from 'react-tweet/api';
import type { Tweet } from 'react-tweet/api';
import type { Program } from './types';

export type TweetMap = Record<string, Tweet | undefined>;

/** X 投稿 URL から tweet ID を抽出。マッチしなければ null */
export function extractTweetIdFromUrl(url: string): string | null {
  const m = url.match(/\/status\/(\d+)/);
  return m?.[1] ?? null;
}

/**
 * 全番組の merchandiseDetails をスキャンして、すべての tweet ID を抽出 + 一括取得。
 * 取得失敗の tweet は undefined のまま map に入れる。
 */
export async function fetchTweetsForPrograms(
  programs: ReadonlyArray<Program>,
): Promise<TweetMap> {
  const ids = new Set<string>();
  for (const p of programs) {
    for (const d of p.official.merchandiseDetails ?? []) {
      // メイン sourceUrl が x-post なら ID 抽出
      if (d.sourceType === 'x-post') {
        const mainId = extractTweetIdFromUrl(d.sourceUrl);
        if (mainId) ids.add(mainId);
      }
      // 補助出典の x-post も
      for (const src of d.additionalSources ?? []) {
        if (src.type === 'x-post') {
          const subId = extractTweetIdFromUrl(src.url);
          if (subId) ids.add(subId);
        }
      }
    }
  }

  const result: TweetMap = {};
  await Promise.all(
    [...ids].map(async (id) => {
      try {
        const tweet = await getTweet(id);
        result[id] = tweet ?? undefined;
        if (!tweet) {
          console.warn(`⚠️ tweet ${id} は取得できなかった（削除済み or protected）`);
        }
      } catch (error) {
        console.warn(`⚠️ tweet ${id} 取得失敗:`, error);
        result[id] = undefined;
      }
    }),
  );

  console.log(
    `✅ ${ids.size} 件の tweet を pre-fetch（成功: ${
      Object.values(result).filter((v) => v !== undefined).length
    } / 失敗: ${Object.values(result).filter((v) => v === undefined).length}）`,
  );

  return result;
}
