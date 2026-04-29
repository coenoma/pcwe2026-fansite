/**
 * タグの軸判定（純粋関数）
 *
 * 雰囲気 / シーン / 内容 の 3 軸でタグを分類し、UI で色分けする。
 */

export type TagAxis = 'mood' | 'scene' | 'content';

const MOOD_TAGS = [
  '笑える',
  'じっくり',
  '軽快',
  '内省的',
  '熱量高い',
  '癒し',
  '知的',
  '共感',
];

const SCENE_TAGS = ['朝向き', '夜向き', '通勤', '作業 BGM', '寝る前'];

const CONTENT_TAGS = [
  'ニッチ',
  '学べる',
  '考えさせる',
  '元気が出る',
  '寄り添う',
  'マイノリティ',
  '二人以上の掛け合い',
  '一人語り',
];

/** タグの軸を返す（未分類は 'content' フォールバック）*/
export function tagAxis(tag: string): TagAxis {
  if (MOOD_TAGS.includes(tag)) return 'mood';
  if (SCENE_TAGS.includes(tag)) return 'scene';
  if (CONTENT_TAGS.includes(tag)) return 'content';
  return 'content';
}

/** 軸 → Tailwind クラス（ボーダー色 + 文字色）*/
export function tagAxisClass(axis: TagAxis): string {
  switch (axis) {
    case 'mood':
      return 'border-amber-300 text-amber-800 bg-amber-50';
    case 'scene':
      return 'border-sky-300 text-sky-800 bg-sky-50';
    case 'content':
      return 'border-emerald-300 text-emerald-800 bg-emerald-50';
  }
}
