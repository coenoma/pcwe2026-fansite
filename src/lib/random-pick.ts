/**
 * ランダムピック（純粋関数）
 *
 * ガチャ用の「ジャンル / vibe をばらけさせた 3 番組」抽出ロジック。
 * 同じ系統ばかり出ると「運命の出会い」感が薄れるので、多様性を優先する。
 */

import type { Program, Genre, Vibe } from './types';

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PickOptions {
  count?: number;
  excludeIds?: readonly string[];
}

/**
 * ジャンル / vibe をばらけさせて count 番組をランダムに選ぶ。
 *
 * - 第 1 パス: ジャンルが重複しないよう優先
 * - 第 2 パス: ジャンル枠が埋まらない場合、vibe で多様性を担保
 * - 第 3 パス: 残りをランダムで埋める
 */
export function pickDiverseRandom(
  programs: readonly Program[],
  options: PickOptions = {}
): Program[] {
  const count = options.count ?? 3;
  const excludeIds = options.excludeIds ?? [];

  const available = programs.filter((p) => !excludeIds.includes(p.id));
  if (available.length <= count) return shuffle(available);

  const result: Program[] = [];
  const usedGenres = new Set<Genre>();
  const usedVibes = new Set<Vibe>();
  const shuffled = shuffle(available);

  // Pass 1: ジャンルが重複しないよう優先
  for (const p of shuffled) {
    if (result.length >= count) break;
    if (!usedGenres.has(p.fanGuide.genre)) {
      result.push(p);
      usedGenres.add(p.fanGuide.genre);
      usedVibes.add(p.fanGuide.vibe);
    }
  }

  // Pass 2: 足りない分は vibe で多様性を担保
  for (const p of shuffled) {
    if (result.length >= count) break;
    if (result.includes(p)) continue;
    if (!usedVibes.has(p.fanGuide.vibe)) {
      result.push(p);
      usedVibes.add(p.fanGuide.vibe);
    }
  }

  // Pass 3: 残りはランダムで埋める
  for (const p of shuffled) {
    if (result.length >= count) break;
    if (result.includes(p)) continue;
    result.push(p);
  }

  return result;
}
