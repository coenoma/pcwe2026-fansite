/**
 * vibe → UI スタイルマッピング（純粋関数）
 *
 * 7 種の vibe で、カードのトップアクセントライン・ホバー色・ブロブカラーを変える。
 */

import type { Vibe, ThemeFont } from './types';

interface VibeStyle {
  /** カード上端のアクセントライン（4px 横帯）*/
  topAccent: string;
  /** ブロブフレームの色（Hero 用）*/
  blobColor: string;
  /** 詳細ページ Hero 背景の薄いグラデ起点 */
  heroGradient: string;
  /** themeColor の vibe デフォルト（hex）*/
  defaultThemeColor: string;
  /** themeFont の vibe デフォルト */
  defaultThemeFont: ThemeFont;
  /** バッジ表現（番組らしさを 1 行で）*/
  personalityLabel: string;
}

const STYLES: Record<Vibe, VibeStyle> = {
  earnest: {
    topAccent: 'bg-primary-400',
    blobColor: 'primary-200',
    heroGradient: 'from-primary-50',
    defaultThemeColor: '#DC725A',
    defaultThemeFont: 'noto-serif-jp',
    personalityLabel: '誠実に対話を分解していく番組',
  },
  contemplative: {
    topAccent: 'bg-neutral-400',
    blobColor: 'neutral-200',
    heroGradient: 'from-neutral-50',
    defaultThemeColor: '#6B7280',
    defaultThemeFont: 'klee-one',
    personalityLabel: '静かに余韻を残す番組',
  },
  energetic: {
    topAccent: 'bg-amber-400',
    blobColor: 'amber-200',
    heroGradient: 'from-amber-50',
    defaultThemeColor: '#F59E0B',
    defaultThemeFont: 'rocknroll-one',
    personalityLabel: '熱量で空気を変える番組',
  },
  conversational: {
    topAccent: 'bg-emerald-400',
    blobColor: 'emerald-200',
    heroGradient: 'from-emerald-50',
    defaultThemeColor: '#10B981',
    defaultThemeFont: 'zen-kaku',
    personalityLabel: '共感の余白がある番組',
  },
  intellectual: {
    topAccent: 'bg-sky-400',
    blobColor: 'sky-200',
    heroGradient: 'from-sky-50',
    defaultThemeColor: '#3B82F6',
    defaultThemeFont: 'noto-serif-jp',
    personalityLabel: '知的に世界を解像する番組',
  },
  humorous: {
    topAccent: 'bg-amber-300',
    blobColor: 'amber-200',
    heroGradient: 'from-amber-50',
    defaultThemeColor: '#F59E0B',
    defaultThemeFont: 'dot-gothic-16',
    personalityLabel: '笑いで核心を捉える番組',
  },
  'laid-back': {
    topAccent: 'bg-neutral-300',
    blobColor: 'neutral-200',
    heroGradient: 'from-neutral-50',
    defaultThemeColor: '#9CA3AF',
    defaultThemeFont: 'shippori-mincho',
    personalityLabel: 'くつろぎが滲む番組',
  },
};

export function vibeStyle(vibe: Vibe): VibeStyle {
  return STYLES[vibe];
}

/** themeFont → CSS variable name */
const FONT_VAR_MAP: Record<ThemeFont, string> = {
  'klee-one': 'var(--font-klee-one)',
  'noto-serif-jp': 'var(--font-noto-serif-jp)',
  'rocknroll-one': 'var(--font-rocknroll-one)',
  'dot-gothic-16': 'var(--font-dot-gothic-16)',
  'shippori-mincho': 'var(--font-shippori-mincho)',
  'zen-kaku': 'var(--font-zen-kaku)',
};

export function themeFontVar(font: ThemeFont): string {
  return FONT_VAR_MAP[font];
}
