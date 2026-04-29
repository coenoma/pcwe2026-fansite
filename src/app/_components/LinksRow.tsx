/**
 * 配信プラットフォーム + SNS リンク行
 */

import type { Links } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface Props {
  links: Links;
}

export function LinksRow({ links }: Props) {
  const items: { key: string; label: string; url: string; emoji: string }[] = [];
  if (links.spotify !== undefined) items.push({ key: 'spotify', label: 'Spotify', url: links.spotify, emoji: '🎧' });
  if (links.applePodcasts !== undefined) items.push({ key: 'applePodcasts', label: 'Apple Podcasts', url: links.applePodcasts, emoji: '🎙️' });
  if (links.youtube !== undefined) items.push({ key: 'youtube', label: 'YouTube', url: links.youtube, emoji: '📺' });
  if (links.listen !== undefined) items.push({ key: 'listen', label: 'LISTEN', url: links.listen, emoji: '🎵' });
  if (links.amazonMusic !== undefined) items.push({ key: 'amazonMusic', label: 'Amazon Music', url: links.amazonMusic, emoji: '🎶' });
  if (links.x !== undefined) items.push({ key: 'x', label: 'X', url: links.x, emoji: '𝕏' });
  if (links.instagram !== undefined) items.push({ key: 'instagram', label: 'Instagram', url: links.instagram, emoji: '📷' });
  if (links.website !== undefined) items.push({ key: 'website', label: '公式サイト', url: links.website, emoji: '🌐' });

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">配信リンク情報なし</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-bold text-neutral-700 transition hover:border-primary-400 hover:text-primary-700"
        >
          <span aria-hidden="true">{item.emoji}</span>
          {item.label}
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
