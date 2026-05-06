/**
 * /map - インタラクティブ会場マップ
 *
 * - SSG: ビルド時に programs.json + booth-positions.json を読み込み props 渡し
 * - インタラクティブ部分（SVG タップ、ボトムシート、日付切替）は MapClient（'use client'）
 *
 * 設計詳細: docs/plans/v2-interactive-map/04-discovery-experience.md
 */

import type { Metadata } from 'next';
import { getAllPrograms } from '@/lib/data';
import { getBoothPositions } from '@/lib/booth-map';
import { MapClient } from './_components/MapClient';
import { EVENT, SITE } from '@/lib/constants';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '会場マップ｜PCWE2026 非公式ファンガイド',
  description:
    'PODCAST WEEKEND 2026（5月9日土・5月10日日）の会場マップ。' +
    '142 番組のブースをタップで詳細確認。土日切替・グッズ検索・お気に入り対応。',
  alternates: {
    canonical: `${SITE.url}/map`,
  },
  openGraph: {
    title: '会場マップ｜PCWE2026 非公式ファンガイド',
    description:
      'PODCAST WEEKEND 2026 の会場マップ。142 番組のブースを土日切替で確認。',
    url: `${SITE.url}/map`,
    type: 'website',
  },
};

export default function MapPage() {
  const programs = getAllPrograms();
  const boothPositions = getBoothPositions();

  return (
    <main className="min-h-screen bg-neutral-50">
      <MapClient
        programs={programs}
        boothPositions={boothPositions}
        eventDates={{
          sat: EVENT.startDate,
          sun: EVENT.endDate,
        }}
      />
    </main>
  );
}
