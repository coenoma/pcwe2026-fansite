/**
 * テスト用 Program fixture
 *
 * 実データに依存しないよう、最小限の Program を組み立てる。
 * vibe / genre / tags の組み合わせを変えて、フィルタ・スコアリング・多様性
 * 抽出を網羅できるようにしている。
 */

import type { Program, Vibe, Genre, Day } from '@/lib/types';

interface BuildOptions {
  id: string;
  name?: string;
  vibe: Vibe;
  genre: Genre;
  tags: string[];
  days?: Day[];
  themeColor?: string;
}

/**
 * 単一の Program を組み立てる。
 * fanGuide のバリデーション（catchphrase 15 字以上、targetListener 20 字以上 等）を
 * 満たす最小値をデフォルトで埋める。
 */
export function buildProgram(opts: BuildOptions): Program {
  const num = opts.id.replace(/[^0-9]/g, '').padStart(3, '0');
  return {
    id: opts.id,
    name: opts.name ?? `テスト番組 ${opts.id}`,
    thumbnail: `/thumbnails/${num}.jpeg`,
    boothUrl: `https://podcastexpo.jp/booth/${opts.id}/`,
    official: {
      description: 'テスト用の番組説明文です。十分な長さを持たせています。',
    },
    exhibition: {
      days: opts.days ?? ['sat', 'sun'],
      hours: '10:00 - 18:00',
      area: 'free',
      boothNumber: num,
    },
    links: {},
    fanGuide: {
      catchphrase: 'テスト用のキャッチコピーです、十分な長さで。',
      subCatch: 'テスト用のサブキャッチです。',
      genre: opts.genre,
      tags: opts.tags,
      targetListener:
        'テスト用のターゲットリスナー。十分な文字数で記述しています。',
      vibe: opts.vibe,
      themeColor: opts.themeColor,
    },
  };
}

/**
 * 7 vibe / 多様なジャンル / 多様なタグをカバーする標準サンプル。
 * 各テストでこの配列を使い回す。
 */
export const SAMPLE_PROGRAMS: Program[] = [
  buildProgram({
    id: 'pcwe-006',
    name: '本茶本茶',
    vibe: 'contemplative',
    genre: '文芸・読書',
    tags: ['内省的', 'じっくり', '寝る前', '癒し'],
  }),
  buildProgram({
    id: 'pcwe-013',
    name: 'ピスタチオパフェクラブ',
    vibe: 'energetic',
    genre: 'コメディ',
    tags: ['熱量高い', '笑える', '通勤', '二人以上の掛け合い'],
  }),
  buildProgram({
    id: 'pcwe-040',
    name: '俺思',
    vibe: 'earnest',
    genre: 'カルチャー',
    tags: ['熱量高い', '考えさせる', 'ニッチ', '夜向き'],
  }),
  buildProgram({
    id: 'pcwe-072',
    name: '失敗から学ぶゲイとおこげ',
    vibe: 'conversational',
    genre: '恋愛・ジェンダー',
    tags: ['笑える', '共感', 'マイノリティ', '寄り添う'],
    days: ['sat'],
  }),
  buildProgram({
    id: 'pcwe-118',
    name: '朝日新聞ポッドキャスト',
    vibe: 'intellectual',
    genre: 'ニュース・社会',
    tags: ['知的', '学べる', '朝向き', '通勤'],
  }),
  buildProgram({
    id: 'pcwe-200',
    name: 'ゆるラボ',
    vibe: 'humorous',
    genre: 'AI・テック',
    tags: ['笑える', '一人語り', '作業 BGM'],
    days: ['sun'],
  }),
  buildProgram({
    id: 'pcwe-201',
    name: '夜の散歩道',
    vibe: 'laid-back',
    genre: '暮らし',
    tags: ['癒し', '夜向き', '一人語り'],
  }),
];
