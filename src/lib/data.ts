/**
 * 番組データの読み込み（純粋関数）
 *
 * SSG ビルド時に programs.json を読み、zod で検証して返す。
 * 検証失敗ならビルドが落ちる（言行一致の最後の砦）。
 */

import programsJson from '../../data/programs.json';
import genresJson from '../../data/genres.json';
import { ProgramsDataSchema, GenresMapSchema } from './types';
import type { Program, Genre, GenresMap } from './types';

/** すべての番組を取得（検証済み）*/
export function getAllPrograms(): Program[] {
  const parsed = ProgramsDataSchema.safeParse(programsJson);
  if (!parsed.success) {
    console.error('❌ programs.json の検証に失敗しました');
    console.error(parsed.error.format());
    throw new Error('programs.json validation failed');
  }
  return parsed.data.programs;
}

/** ID から 1 番組を取得 */
export function getProgramById(id: string): Program | undefined {
  return getAllPrograms().find((p) => p.id === id);
}

/** ジャンルから絞り込み */
export function getProgramsByGenre(genre: Genre): Program[] {
  return getAllPrograms().filter((p) => p.fanGuide.genre === genre);
}

/** ジャンルメタ情報（lucide アイコン名 + アクセントカラー）*/
export function getGenresMap(): GenresMap {
  const parsed = GenresMapSchema.safeParse(genresJson);
  if (!parsed.success) {
    console.error('❌ genres.json の検証に失敗しました');
    console.error(parsed.error.format());
    throw new Error('genres.json validation failed');
  }
  return parsed.data;
}

/** ジャンル一覧（番組数付き）*/
export function getGenreCounts(): { genre: Genre; count: number }[] {
  const programs = getAllPrograms();
  const genres = Object.keys(getGenresMap()) as Genre[];
  return genres
    .map((genre) => ({
      genre,
      count: programs.filter((p) => p.fanGuide.genre === genre).length,
    }))
    .filter((g) => g.count > 0);
}
