/**
 * 番組フィルタリング（純粋関数）
 *
 * UI コンポーネントから呼び出して、ジャンル・タグ・出展日で絞り込む。
 */

import type { Program, Genre, Day } from './types';

export interface FilterCriteria {
  genre?: Genre;
  tags?: string[];      // OR 条件（いずれかのタグがマッチ）
  day?: Day;            // 'sat' or 'sun' 単独
  bothOnly?: boolean;   // 両日出展のみ
}

/**
 * 番組リストを条件で絞り込む。
 * 条件が空なら全件返す。
 */
export function filterPrograms(programs: Program[], criteria: FilterCriteria): Program[] {
  return programs.filter((program) => {
    // ジャンル
    if (criteria.genre && program.fanGuide.genre !== criteria.genre) {
      return false;
    }

    // タグ（OR 条件）
    if (criteria.tags && criteria.tags.length > 0) {
      const hasMatch = criteria.tags.some((tag) => program.fanGuide.tags.includes(tag));
      if (!hasMatch) return false;
    }

    // 出展日
    if (criteria.day && !program.exhibition.days.includes(criteria.day)) {
      return false;
    }

    // 両日出展のみ
    if (criteria.bothOnly && program.exhibition.days.length !== 2) {
      return false;
    }

    return true;
  });
}

/**
 * 全番組から一意なタグリストを抽出（フィルタ UI のオプション用）
 */
export function extractAllTags(programs: Program[]): string[] {
  const tagSet = new Set<string>();
  for (const program of programs) {
    for (const tag of program.fanGuide.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}
