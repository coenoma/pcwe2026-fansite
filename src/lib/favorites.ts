/**
 * 「気になる」リスト管理（localStorage、純粋関数 + 副作用関数）
 *
 * クライアントサイドで実行。SSR では呼ばない（typeof window === 'undefined' でガード）。
 */

const STORAGE_KEY = 'pcwe2026-favorites';

/**
 * localStorage から ID 配列を読み込む。
 * SSR / プライベートモード等で失敗したら空配列を返す。
 */
export function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch (error) {
    console.warn('⚠️ お気に入りの読み込みに失敗しました', error);
    return [];
  }
}

/**
 * localStorage に ID 配列を保存。
 * 失敗時は false を返す（プライベートモード等）。
 */
export function saveFavorites(ids: string[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    return true;
  } catch (error) {
    console.warn('⚠️ お気に入りの保存に失敗しました（プライベートモードの可能性）', error);
    return false;
  }
}

/** ID を追加（重複なし）*/
export function addFavorite(current: string[], id: string): string[] {
  if (current.includes(id)) return current;
  return [...current, id];
}

/** ID を削除 */
export function removeFavorite(current: string[], id: string): string[] {
  return current.filter((v) => v !== id);
}

/** ID をトグル */
export function toggleFavorite(current: string[], id: string): string[] {
  return current.includes(id) ? removeFavorite(current, id) : addFavorite(current, id);
}
