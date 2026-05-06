/**
 * マップ機能の LocalStorage 状態管理
 *
 * - 「会えた」記録（visited）: ブースを訪れた記録
 * - お気に入り（map-favorites）: マップ画面専用のピン留め
 *
 * 既存 src/lib/favorites.ts の「気になるリスト」とは別保存（用途が異なる）。
 * 既存パターンに揃えた設計（純粋関数 + 副作用関数の分離）。
 */

const VISITED_KEY = 'pcwe2026-map-visited';
const MAP_FAVORITES_KEY = 'pcwe2026-map-favorites';

/**
 * 「会えた」記録の構造。
 * key = ブース position（"14-A"）or program ID（"pcwe-002"）。
 * value = ISO 日時（"2026-05-09T11:23"）。
 */
export type VisitedRecord = Record<string, string>;

export function loadVisited(): VisitedRecord {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const result: VisitedRecord = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === 'string' && typeof v === 'string') {
        result[k] = v;
      }
    }
    return result;
  } catch (error) {
    console.warn('⚠️ 訪問記録の読み込みに失敗しました', error);
    return {};
  }
}

export function saveVisited(record: VisitedRecord): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(record));
    return true;
  } catch (error) {
    console.warn('⚠️ 訪問記録の保存に失敗しました', error);
    return false;
  }
}

/** 訪問記録をトグル（ON↔OFF）*/
export function toggleVisited(
  current: VisitedRecord,
  key: string,
): VisitedRecord {
  const next = { ...current };
  if (key in next) {
    delete next[key];
  } else {
    next[key] = new Date().toISOString();
  }
  return next;
}

// ====================
// マップ専用お気に入り
// ====================

export function loadMapFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MAP_FAVORITES_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch (error) {
    console.warn('⚠️ マップお気に入りの読み込みに失敗しました', error);
    return [];
  }
}

export function saveMapFavorites(ids: string[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(MAP_FAVORITES_KEY, JSON.stringify(ids));
    return true;
  } catch (error) {
    console.warn('⚠️ マップお気に入りの保存に失敗しました', error);
    return false;
  }
}

export function toggleMapFavorite(current: string[], id: string): string[] {
  return current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
}
