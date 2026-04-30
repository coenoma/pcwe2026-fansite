/**
 * 番組ベースレコメンド（純粋関数）
 *
 * ある番組を起点に、3 つの軸でレコメンドを返す:
 *   - 🎯 同心: 同 vibe + 同 genre + タグ重複（ど真ん中で似てる）
 *   - 🌐 拡張: 同 vibe + 異 genre + タグ重複（雰囲気は近いが新しいジャンル）
 *   - 💫 意外: 異 vibe + 異 genre + タグ重複（カテゴリは違うが共通点あり）
 *
 * 各レコメンド項目には「**何が一致しているか**」（共通タグ / 同 vibe / 同 genre）を
 * 付与して返す。UI 側で「✓ 内省的」「✓ じっくり」のように共通点を可視化することで
 * 「なぜこれをおすすめされたか」が読み手にも伝わる。
 */

import type { Program } from './types';

/** 個別レコメンド（番組 + 起点との一致点）*/
export interface RecommendItem {
  program: Program;
  /** 起点と共通するタグ（少ない順 → 多い順で並び順は安定）*/
  sharedTags: string[];
  /** 起点と vibe が同じか */
  sameVibe: boolean;
  /** 起点と genre が同じか */
  sameGenre: boolean;
}

export interface RecommendBuckets {
  /** 起点番組（基準）*/
  origin: Program;
  /** 同 vibe + 同 genre で似てる */
  sameVibeAndGenre: RecommendItem[];
  /** 同 vibe で異 genre — ジャンルを広げる */
  sameVibeOtherGenre: RecommendItem[];
  /** 異 vibe + 異 genre だが tag 重複あり — 意外な共通点 */
  serendipity: RecommendItem[];
}

/** タグ重複（起点に対する共通タグ配列）*/
function intersectTags(a: readonly string[], b: readonly string[]): string[] {
  const set = new Set(a);
  return b.filter((t) => set.has(t));
}

/** 起点番組に対する各候補のスコアと分類軸 */
interface ScoredCandidate {
  program: Program;
  sharedTags: string[];
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
    .map((p) => {
      const sharedTags = intersectTags(originTags, p.fanGuide.tags);
      return {
        program: p,
        sharedTags,
        tagScore: sharedTags.length,
        sameVibe: p.fanGuide.vibe === origin.fanGuide.vibe,
        sameGenre: p.fanGuide.genre === origin.fanGuide.genre,
      };
    });
}

function toItem(c: ScoredCandidate): RecommendItem {
  return {
    program: c.program,
    sharedTags: c.sharedTags,
    sameVibe: c.sameVibe,
    sameGenre: c.sameGenre,
  };
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
    .map(toItem);

  // 軸 2: 同 vibe + 異 genre（タグ重複多い順）
  const sameVibeOtherGenre = candidates
    .filter((c) => c.sameVibe && !c.sameGenre)
    .sort((a, b) => b.tagScore - a.tagScore || a.program.id.localeCompare(b.program.id))
    .slice(0, perBucket)
    .map(toItem);

  // 軸 3: 異 vibe + 異 genre + tag 重複あり（≥1）
  const serendipity = candidates
    .filter((c) => !c.sameVibe && !c.sameGenre && c.tagScore >= 1)
    .sort((a, b) => b.tagScore - a.tagScore || a.program.id.localeCompare(b.program.id))
    .slice(0, perBucket)
    .map(toItem);

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
