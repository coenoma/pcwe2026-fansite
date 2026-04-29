/**
 * ジャンル → lucide アイコン
 *
 * data/genres.json の icon 名（"Sparkles", "BookOpen" 等）を React コンポーネントに解決。
 * 動的 import せず、使う 17 種を全部静的 import（ツリーシェイクで未使用は除去）。
 */

import {
  Sparkles,
  BookOpen,
  UtensilsCrossed,
  Film,
  Music,
  Plane,
  Home,
  Heart,
  Briefcase,
  Cpu,
  GraduationCap,
  Newspaper,
  Scroll,
  Atom,
  Trophy,
  Laugh,
  Circle,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  BookOpen,
  UtensilsCrossed,
  Film,
  Music,
  Plane,
  Home,
  Heart,
  Briefcase,
  Cpu,
  GraduationCap,
  Newspaper,
  Scroll,
  Atom,
  Trophy,
  Laugh,
  Circle,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export function GenreIcon({ name, size = 14, className }: Props) {
  const Icon = ICON_MAP[name] ?? Circle;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
