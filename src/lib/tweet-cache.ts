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
import type { BoothPositionsData, MerchandiseDetail, Program } from './types';

export type TweetMap = Record<string, Tweet | undefined>;

/** X 投稿 URL から tweet ID を抽出。マッチしなければ null */
export function extractTweetIdFromUrl(url: string): string | null {
  const m = url.match(/\/status\/(\d+)/);
  return m?.[1] ?? null;
}

/** merchandiseDetails 配列から x-post の tweet ID を Set に追加するヘルパー */
function collectTweetIds(
  details: ReadonlyArray<MerchandiseDetail> | undefined,
  ids: Set<string>,
): void {
  if (details === undefined) return;
  for (const d of details) {
    if (d.sourceType === 'x-post') {
      const mainId = extractTweetIdFromUrl(d.sourceUrl);
      if (mainId) ids.add(mainId);
    }
    for (const src of d.additionalSources ?? []) {
      if (src.type === 'x-post') {
        const subId = extractTweetIdFromUrl(src.url);
        if (subId) ids.add(subId);
      }
    }
  }
}

/**
 * 全番組の merchandiseDetails + booth-positions の external 物販詳細をスキャンして、
 * すべての tweet ID を抽出 + 一括取得。
 * 取得失敗の tweet は undefined のまま map に入れる。
 */
export async function fetchTweetsForPrograms(
  programs: ReadonlyArray<Program>,
  boothPositions?: BoothPositionsData,
): Promise<TweetMap> {
  const ids = new Set<string>();
  // 番組（programs.json）の物販詳細
  for (const p of programs) {
    collectTweetIds(p.official.merchandiseDetails, ids);
  }
  // v1.14: external（スポンサー / キッチン）の物販詳細も
  if (boothPositions !== undefined) {
    for (const tent of boothPositions.tents) {
      for (const slot of tent.slots) {
        collectTweetIds(slot.satExternal?.merchandiseDetails, ids);
        collectTweetIds(slot.sunExternal?.merchandiseDetails, ids);
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
