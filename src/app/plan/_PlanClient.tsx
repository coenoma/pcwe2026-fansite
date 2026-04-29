'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Program } from '@/lib/types';
import { loadFavorites } from '@/lib/favorites';
import { ProgramCard } from '@/app/_components/ProgramCard';

interface Props {
  programs: Program[];
}

/**
 * 気になるリスト（土・日別表示）
 */
export function PlanClient({ programs }: Props) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavoriteIds(loadFavorites());
  }, []);

  if (!mounted) {
    return <p className="text-neutral-500">読み込み中…</p>;
  }

  if (favoriteIds.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-neutral-700">まだ「気になる」に追加した番組がありません。</p>
        <Link
          href="/"
          className="mt-4 inline-flex font-bold text-primary-600 hover:opacity-70"
        >
          番組を探しに行く →
        </Link>
      </div>
    );
  }

  const favoritePrograms = favoriteIds
    .map((id) => programs.find((p) => p.id === id))
    .filter((p): p is Program => p !== undefined);

  const satPrograms = favoritePrograms.filter((p) => p.exhibition.days.includes('sat'));
  const sunPrograms = favoritePrograms.filter((p) => p.exhibition.days.includes('sun'));

  return (
    <div className="space-y-12">
      <DaySection title="5/9（土）に行く" programs={satPrograms} />
      <DaySection title="5/10（日）に行く" programs={sunPrograms} />

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
        <p className="font-bold text-neutral-700">合計 {favoritePrograms.length} 番組</p>
        <p className="mt-1">
          このリストは端末の localStorage に保存されています。別端末では引き継がれません。
        </p>
      </div>
    </div>
  );
}

function DaySection({ title, programs }: { title: string; programs: Program[] }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
        {title}（{programs.length} 番組）
      </h2>
      {programs.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">この日に出展する気になる番組はありません。</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      )}
    </div>
  );
}
