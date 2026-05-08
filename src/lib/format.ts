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

/**
 * 営業時間を圧縮表記に変換（カードの狭いスペース向け）
 *
 * @example
 *   compactHours('10:00 - 18:00') → '10-18時'
 *   compactHours('10:30 - 19:00') → '10:30-19時'（半端な分は維持）
 *   compactHours('10:00～18:00')  → '10-18時'（〜・~ も区切りとして許容）
 *
 * パース失敗時は元の文字列をそのまま返す（fail-safe）
 */
export function compactHours(hours: string): string {
  const m = hours.match(
    /^\s*(\d{1,2}):(\d{2})\s*[-〜~]\s*(\d{1,2}):(\d{2})\s*$/,
  );
  if (m === null) return hours;
  const startH = m[1];
  const startM = m[2];
  const endH = m[3];
  const endM = m[4];
  const startStr = startM === '00' ? startH : `${startH}:${startM}`;
  const endStr = endM === '00' ? endH : `${endH}:${endM}`;
  return `${startStr}-${endStr}時`;
}
