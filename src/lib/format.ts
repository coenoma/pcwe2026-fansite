/**
 * 表示フォーマット用の純粋関数
 */

import type { Day } from './types';

/**
 * 出展日配列を表示用ラベルに変換
 *
 * @example
 *   dayLabel(['sat', 'sun']) → '両日'
 *   dayLabel(['sat'])        → '土曜のみ'
 *   dayLabel(['sun'])        → '日曜のみ'
 */
export function dayLabel(days: Day[]): string {
  const hasSat = days.includes('sat');
  const hasSun = days.includes('sun');
  if (hasSat && hasSun) return '両日';
  if (hasSat) return '土曜のみ';
  if (hasSun) return '日曜のみ';
  return '出展日未定';
}

/**
 * 出展日を絵文字付き短縮形に変換（カードタグ用）
 */
export function dayLabelShort(days: Day[]): string {
  const hasSat = days.includes('sat');
  const hasSun = days.includes('sun');
  if (hasSat && hasSun) return '5/9・10';
  if (hasSat) return '5/9';
  if (hasSun) return '5/10';
  return '日程TBD';
}
