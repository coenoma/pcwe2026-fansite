'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Program } from '@/lib/types';
import { loadFavorites, saveFavorites } from '@/lib/favorites';
import { ProgramCard } from '@/app/_components/ProgramCard';
import { SITE } from '@/lib/constants';

interface Props {
  programs: Program[];
}

/**
 * 気になるリスト（土・日別表示）
 *
 * - URL クエリ ?ids=040,006 から復元できる（シェア機能）
 * - URL に ids がある時は localStorage より優先 → 開いた時点で localStorage に同期
 * - 「リンクをコピー」で URL シェア
 */
export function PlanClient({ programs }: Props) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);

    // URL クエリ ?ids=040,006 から復元（カンマ区切り、ID は数字 3 桁）
    const url = new URL(window.location.href);
    const idsParam = url.searchParams.get('ids');
    if (idsParam !== null && idsParam !== '') {
      const ids = idsParam
        .split(',')
        .map((id) => id.trim())
        .filter((id) => /^\d{3}$/.test(id))
        .map((n) => `pcwe-${n}`);

      if (ids.length > 0) {
        setFavoriteIds(ids);
        saveFavorites(ids);
        // URL から ids を消す（履歴を残さない）
        url.searchParams.delete('ids');
        window.history.replaceState({}, '', url.toString());
        return;
      }
    }

    setFavoriteIds(loadFavorites());
  }, []);

  // shareUrl を再生成（favoriteIds が変わったら）
  useEffect(() => {
    if (favoriteIds.length === 0) {
      setShareUrl('');
      return;
    }
    const numbers = favoriteIds.map((id) => id.replace('pcwe-', '')).join(',');
    setShareUrl(`${SITE.url}/plan?ids=${numbers}`);
  }, [favoriteIds]);

  const handleCopyShare = async () => {
    if (shareUrl === '' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('⚠️ クリップボードコピーに失敗しました', error);
    }
  };

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

      {/* シェア・サマリ */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-sm font-bold text-neutral-700">
          このリストには {favoritePrograms.length} 番組が入っています
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          端末の localStorage に保存されています。下のリンクで他端末・友達と共有できます。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-700"
          >
            {copied ? '✓ リンクをコピーしました' : 'このリストをシェア'}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:border-primary-400"
          >
            番組をもっと探す →
          </Link>
        </div>
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
