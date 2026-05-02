'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Curation, Program } from '@/lib/types';
import { dayLabel } from '@/lib/format';

interface Props {
  lanes: { curation: Curation; programs: Program[] }[];
}

/**
 * 手動キュレーション タブ UI（v1.7 改修）
 *
 * - 4 切り口をタブで切替
 * - 選択中タブのみ番組カードを描画（縦に伸びすぎない）
 * - SP: 2 列グリッド / PC: 5 列（タブごとに 5 本想定）
 * - タブのアクティブ色は curation.themeColor を反映
 */
export function CurationLanes({ lanes }: Props) {
  const [activeId, setActiveId] = useState<string>(lanes[0]?.curation.id ?? '');
  if (lanes.length === 0) return null;

  const active = lanes.find((l) => l.curation.id === activeId) ?? lanes[0];

  // WAI-ARIA Tabs Pattern: タブとパネルを id で結びつけて読み上げ可能にする
  const tabId = (curationId: string) => `curation-tab-${curationId}`;
  const panelId = (curationId: string) => `curation-panel-${curationId}`;

  return (
    <div>
      {/*
        タブバー
        - SP: 2x2 grid（4 タブを 2 列 × 2 段で表示、矩形ボックス + border でアクティブ表現）
        - PC (sm 以上): 横並び flex + 下線でアクティブ表現
      */}
      <div
        role="tablist"
        aria-label="キュレーションタブ"
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:border-b sm:border-neutral-200"
      >
        {lanes.map(({ curation }) => {
          const isActive = curation.id === active.curation.id;
          return (
            <button
              key={curation.id}
              type="button"
              role="tab"
              id={tabId(curation.id)}
              aria-selected={isActive}
              aria-controls={panelId(curation.id)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(curation.id)}
              className={
                // SP は矩形ボックス、PC は下線スタイル
                isActive
                  ? 'flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold transition-colors sm:-mb-px sm:justify-start sm:rounded-none sm:border-0 sm:border-b-2 sm:px-3 sm:pb-3 sm:pt-2 sm:text-base'
                  : 'flex items-center justify-center gap-1.5 rounded-xl border-2 border-neutral-200 px-3 py-2.5 text-sm font-bold text-neutral-500 transition-colors hover:border-primary-300 hover:text-neutral-900 sm:-mb-px sm:justify-start sm:rounded-none sm:border-0 sm:border-b-2 sm:border-transparent sm:px-3 sm:pb-3 sm:pt-2 sm:text-base'
              }
              style={
                isActive
                  ? { borderColor: curation.themeColor, color: curation.themeColor }
                  : undefined
              }
            >
              {curation.emoji !== undefined && (
                <span aria-hidden="true" className="text-base sm:text-lg">
                  {curation.emoji}
                </span>
              )}
              <span className="truncate">{curation.title}</span>
            </button>
          );
        })}
      </div>

      {/* アクティブタブのパネル（WAI-ARIA tabpanel）*/}
      <div
        role="tabpanel"
        id={panelId(active.curation.id)}
        aria-labelledby={tabId(active.curation.id)}
        // タブ切替時のチラつき防止のため key で再マウント
        key={active.curation.id}
      >
        {/* アクティブタブの説明 */}
        <p className="mt-4 text-sm text-neutral-600 sm:mt-5 sm:text-base">
          {active.curation.subtitle}
        </p>

        {/* 番組カード（SP: 2 列 / PC: 最大 5 列）*/}
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {active.programs.map((program) => (
            <li key={program.id}>
              <CurationCard program={program} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CurationCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/booth/${program.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl active:scale-[0.99]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={program.thumbnail}
          alt={`${program.name} のロゴ画像`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <div className="flex flex-wrap gap-1 text-[10px]">
          <span
            className="rounded-full px-1.5 py-0.5 font-bold"
            style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}
          >
            {program.fanGuide.genre}
          </span>
          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 font-bold text-neutral-600">
            {dayLabel(program.exhibition.days)}
          </span>
        </div>
        <h4 className="line-clamp-2 text-xs font-extrabold leading-snug text-neutral-900 group-hover:text-primary-700 sm:text-sm">
          {program.shortName ?? program.name}
        </h4>
        <p className="line-clamp-3 text-[11px] leading-relaxed text-neutral-700 sm:text-xs">
          {program.fanGuide.catchphrase}
        </p>
        <p className="mt-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-primary-700 opacity-0 transition-opacity group-hover:opacity-100">
          詳しく見る
          <ArrowRight size={10} aria-hidden="true" />
        </p>
      </div>
    </Link>
  );
}
