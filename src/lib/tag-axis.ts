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

/**
 * 軸 → Tailwind クラス（ボーダー色 + 文字色）
 *
 * デザインガイドライン（docs/design-guideline.md）に沿う:
 * - mood（感情・雰囲気）  → primary 系 = 「探索・感情」を示すブランドオレンジ
 * - scene（時間・シーン）  → secondary 系 = 「データ・事実情報」を示すブルー
 * - content（内容・性質）  → neutral 系 = 控えめ、装飾を抑えてノイズ削減
 *
 * 旧: amber/sky/emerald の 3 色彩度高めで「全タグに色を当てる systemize 感」が強かった。
 * 新: 2 系統 + ニュートラルに集約することで、画面全体の色数が減り
 *     ahamo 的な「整理された情報密度」になる。
 */
export function tagAxisClass(axis: TagAxis): string {
  switch (axis) {
    case 'mood':
      return 'border-primary-200 text-primary-700 bg-primary-50';
    case 'scene':
      return 'border-secondary-200 text-secondary-700 bg-secondary-50';
    case 'content':
      return 'border-neutral-200 text-neutral-700 bg-neutral-50';
  }
}
