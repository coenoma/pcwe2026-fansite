/**
 * 番組データの読み込み（純粋関数）
 *
 * SSG ビルド時に programs.json を読み、zod で検証して返す。
 * 検証失敗ならビルドが落ちる（言行一致の最後の砦）。
 */

import programsJson from '../../data/programs.json';
import genresJson from '../../data/genres.json';
import curationsJson from '../../data/curations.json';
import moodsJson from '../../data/moods.json';
import {
  ProgramsDataSchema,
  GenresMapSchema,
  CurationsDataSchema,
  MoodsDataSchema,
} from './types';
import type { Program, Genre, GenresMap, Curation, Mood } from './types';

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

/** 手動キュレーションのレーン一覧（存在する番組のみ含めて返す）*/
export function getCurations(): { curation: Curation; programs: Program[] }[] {
  const parsed = CurationsDataSchema.safeParse(curationsJson);
  if (!parsed.success) {
    console.error('❌ curations.json の検証に失敗しました');
    console.error(parsed.error.format());
    throw new Error('curations.json validation failed');
  }
  const programs = getAllPrograms();
  const byId = new Map(programs.map((p) => [p.id, p]));
  return parsed.data.curations
    .map((curation) => ({
      curation,
      programs: curation.programIds
        .map((id) => byId.get(id))
        .filter((p): p is Program => p !== undefined),
    }))
    .filter((c) => c.programs.length >= 2);
}

/** 気分入口の定義一覧 */
export function getMoods(): Mood[] {
  const parsed = MoodsDataSchema.safeParse(moodsJson);
  if (!parsed.success) {
    console.error('❌ moods.json の検証に失敗しました');
    console.error(parsed.error.format());
    throw new Error('moods.json validation failed');
  }
  return parsed.data.moods;
}

/** slug から気分入口を取得 */
export function getMoodBySlug(slug: string): Mood | undefined {
  return getMoods().find((m) => m.slug === slug);
}

/** 気分入口にマッチする番組を返す（matchTags のいずれかを持つ番組）*/
export function getProgramsByMood(mood: Mood): Program[] {
  const programs = getAllPrograms();
  return programs.filter((p) =>
    p.fanGuide.tags.some((tag) => mood.matchTags.includes(tag)),
  );
}
