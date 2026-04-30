/**
 * 番組ベースレコメンド（純粋関数）
 *
 * ある番組を起点に、3 つの軸でレコメンドを返す:
 *   - 🎯 同心: 同 vibe + 同 genre + タグ重複（ど真ん中で似てる）
 *   - 🌐 拡張: 同 vibe + 異 genre + タグ重複（雰囲気は近いが新しいジャンル）
 *   - 💫 意外: 異 vibe + 異 genre + タグ重複（カテゴリは違うが共通点あり）
 *
 * シンプルなスコア計算でソートし、各軸の上位を返す。
 */

import type { Program } from './types';

export interface RecommendBuckets {
  /** 起点番組（基準）*/
  origin: Program;
  /** 同 vibe + 同 genre で似てる */
  sameVibeAndGenre: Program[];
  /** 同 vibe で異 genre — ジャンルを広げる */
  sameVibeOtherGenre: Program[];
  /** 異 vibe + 異 genre だが tag 重複あり — 意外な共通点 */
  serendipity: Program[];
}

/** タグ重複数（順不同）*/
function tagOverlap(a: readonly string[], b: readonly string[]): number {
  const set = new Set(a);
  let count = 0;
  for (const t of b) if (set.has(t)) count++;
  return count;
}

/** 起点番組に対する各候補のスコアと分類軸 */
interface ScoredCandidate {
  program: Program;
  tagScore: number;
  sameVibe: boolean;
  sameGenre: boolean;
}

function scoreCandidates(
  origin: Program,
  pool: readonly Program[],
): ScoredCandidate[] {
  const originTags = origin.fanGuide.tags;
  return pool
    .filter((p) => p.id !== origin.id)
    .map((p) => ({
      program: p,
      tagScore: tagOverlap(originTags, p.fanGuide.tags),
      sameVibe: p.fanGuide.vibe === origin.fanGuide.vibe,
      sameGenre: p.fanGuide.genre === origin.fanGuide.genre,
    }));
}

/**
 * 起点番組から 3 軸のレコメンドを返す。
 * 各バケットは tag 重複が多い順 → 並び順は安定。
 *
 * @param origin 基準番組
 * @param all 全番組（自身を含んでも除外される）
 * @param perBucket 各バケットの最大件数（既定 3）
 */
export function recommendFromProgram(
  origin: Program,
  all: readonly Program[],
  perBucket: number = 3,
): RecommendBuckets {
  const candidates = scoreCandidates(origin, all);

  // 軸 1: 同 vibe + 同 genre（タグ重複多い順）
  const sameVibeAndGenre = candidates
    .filter((c) => c.sameVibe && c.sameGenre)
    .sort((a, b) => b.tagScore - a.tagScore || a.program.id.localeCompare(b.program.id))
    .slice(0, perBucket)
    .map((c) => c.program);

  // 軸 2: 同 vibe + 異 genre（タグ重複多い順）
  const sameVibeOtherGenre = candidates
    .filter((c) => c.sameVibe && !c.sameGenre)
    .sort((a, b) => b.tagScore - a.tagScore || a.program.id.localeCompare(b.program.id))
    .slice(0, perBucket)
    .map((c) => c.program);

  // 軸 3: 異 vibe + 異 genre + tag 重複あり（≥1）
  const serendipity = candidates
    .filter((c) => !c.sameVibe && !c.sameGenre && c.tagScore >= 1)
    .sort((a, b) => b.tagScore - a.tagScore || a.program.id.localeCompare(b.program.id))
    .slice(0, perBucket)
    .map((c) => c.program);

  return { origin, sameVibeAndGenre, sameVibeOtherGenre, serendipity };
}

/**
 * 番組名のインクリメンタル検索（簡易、autocomplete 用）。
 * Fuse.js を使うと依存が膨らむため、シンプルな includes 検索で十分。
 * 番組名（name / shortName）に部分一致するものを返す。
 *
 * @param query 検索クエリ
 * @param all 全番組
 * @param limit 最大件数（既定 8）
 */
export function searchProgramNames(
  query: string,
  all: readonly Program[],
  limit: number = 8,
): Program[] {
  const trimmed = query.trim();
  if (trimmed === '') return [];
  const lower = trimmed.toLowerCase();

  return all
    .filter((p) => {
      const name = p.name.toLowerCase();
      const short = (p.shortName ?? '').toLowerCase();
      return name.includes(lower) || short.includes(lower);
    })
    .slice(0, limit);
}
