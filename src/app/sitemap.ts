import type { MetadataRoute } from 'next';
import { getAllPrograms, getGenreCounts, getMoods } from '@/lib/data';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const programs = getAllPrograms();
  const genres = getGenreCounts();
  const moods = getMoods();
  const lastModified = new Date();

  return [
    // トップ
    {
      url: SITE.url,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // 静的ページ
    {
      url: `${SITE.url}/plan`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE.url}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE.url}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // ジャンル一覧（17 ジャンル）
    ...genres.map((g) => ({
      url: `${SITE.url}/genre/${encodeURIComponent(g.genre)}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    // 気分・シーン入口
    ...moods.map((m) => ({
      url: `${SITE.url}/mood/${m.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    // 番組詳細（142 件）
    ...programs.map((p) => ({
      url: `${SITE.url}/booth/${p.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
