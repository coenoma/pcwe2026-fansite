/**
 * vibe → UI スタイルマッピング（純粋関数）
 *
 * 7 種の vibe で、カードのトップアクセントライン・ホバー色・ブロブカラーを変える。
 */

import type { Vibe } from './types';

interface VibeStyle {
  /** カード上端のアクセントライン（4px 横帯）*/
  topAccent: string;
  /** ブロブフレームの色（Hero 用）*/
  blobColor: string;
  /** 詳細ページ Hero 背景の薄いグラデ起点 */
  heroGradient: string;
}

const STYLES: Record<Vibe, VibeStyle> = {
  earnest: {
    topAccent: 'bg-primary-400',
    blobColor: 'primary-200',
    heroGradient: 'from-primary-50',
  },
  contemplative: {
    topAccent: 'bg-neutral-400',
    blobColor: 'neutral-200',
    heroGradient: 'from-neutral-50',
  },
  energetic: {
    topAccent: 'bg-amber-400',
    blobColor: 'amber-200',
    heroGradient: 'from-amber-50',
  },
  conversational: {
    topAccent: 'bg-emerald-400',
    blobColor: 'emerald-200',
    heroGradient: 'from-emerald-50',
  },
  intellectual: {
    topAccent: 'bg-sky-400',
    blobColor: 'sky-200',
    heroGradient: 'from-sky-50',
  },
  humorous: {
    topAccent: 'bg-amber-300',
    blobColor: 'amber-200',
    heroGradient: 'from-amber-50',
  },
  'laid-back': {
    topAccent: 'bg-neutral-300',
    blobColor: 'neutral-200',
    heroGradient: 'from-neutral-50',
  },
};

export function vibeStyle(vibe: Vibe): VibeStyle {
  return STYLES[vibe];
}
