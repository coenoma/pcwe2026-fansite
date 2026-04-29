/**
 * 番組検索（Fuse.js ラッパー、純粋関数）
 *
 * 144 番組をクライアント側で全文検索する。
 * SSG ビルドに含まれるので、サーバー API 不要。
 */

import Fuse from 'fuse.js';
import type { Program } from './types';

/**
 * Fuse インスタンスを作成。
 * 番組名・概要・キャッチ・サブキャッチ・タグ・ターゲットリスナーを横断検索。
 */
export function createFuse(programs: Program[]): Fuse<Program> {
  return new Fuse(programs, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'shortName', weight: 3 },
      { name: 'fanGuide.catchphrase', weight: 2 },
      { name: 'fanGuide.subCatch', weight: 2 },
      { name: 'fanGuide.targetListener', weight: 1 },
      { name: 'fanGuide.tags', weight: 1.5 },
      { name: 'fanGuide.genre', weight: 1.5 },
      { name: 'official.description', weight: 1 },
      { name: 'official.hosts', weight: 1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

/**
 * 検索クエリで番組を絞り込む。
 * クエリ空なら全件返す。
 */
export function searchPrograms(programs: Program[], query: string): Program[] {
  const trimmed = query.trim();
  if (trimmed === '') return programs;

  const fuse = createFuse(programs);
  return fuse.search(trimmed).map((r) => r.item);
}
