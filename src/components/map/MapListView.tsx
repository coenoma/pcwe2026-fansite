/**
 * リストビュー（マップの代替表示）。
 *
 * v1.9.2 で物販主役構造に再構築:
 *   フィルタ検索（体験 / 飲食 / 珍しい等）の選別フェーズで
 *   「何が買えるか」を主役に、番組情報を補助に降格する。
 *
 *   セクション構造（縦に積む）:
 *     1. ヘッダー: ブース番号 + 営業時間 + 状態バッジ（右上）
 *     2. 物販タグ（merchandiseTags、メイン・中サイズ pill）
 *     3. 物販ハイライト（MerchandisePreview variant="card-main"）
 *     4. spotlight 強調 box（amber/primary 背景）
 *     5. 番組情報補助（BoothInfoCompact: サムネ小 + 番組名 + catchphrase + fanGuide.tags）
 *     6. link アイコン footer（Spotify / X / Instagram）
 *
 * HTML 構造は「stretched ボタンパターン」（外殻 article + 内側絶対配置 button）。
 * link <a> や状態バッジ等は z-20 領域で独立クリック可能。
 */

import { MerchandisePreview } from '@/components/merchandise/MerchandisePreview';
import { BoothStateBadges } from './BoothStateBadges';
import { BoothLinkIcons } from './BoothLinkIcons';
import { BoothInfoCompact } from './BoothInfoCompact';
import { compactHours } from '@/lib/format';
import type { Day, MerchandiseTag, Program } from '@/lib/types';
import { type SlotPlacement } from '@/lib/booth-map';

interface Props {
  programs: Program[];
  placements: SlotPlacement[];
  day: Day;
  onSelect: (placement: SlotPlacement) => void;
  /** お気に入り登録中の program ID 配列（未指定時は状態バッジ非表示）*/
  favorites?: string[];
  /** 「会えた」記録（key = position、未指定時は状態バッジ非表示）*/
  visited?: Record<string, string>;
}

export function MapListView({
  programs,
  placements,
  day,
  onSelect,
  favorites,
  visited,
}: Props) {
  const programsById = new Map(programs.map((p) => [p.id, p]));

  const items = placements
    .map((pl) => ({
      placement: pl,
      program: pl.programId ? programsById.get(pl.programId) : undefined,
    }))
    .filter((x) => x.program !== undefined || x.placement.externalName !== undefined);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center">
        <p className="text-3xl" aria-hidden="true">🔍✨</p>
        <p className="mt-3 text-sm font-bold text-neutral-700">
          条件にぴったりのブースは見つからなかった！
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          フィルタを外す・検索キーワードを変える・別の日も覗いてみる ── どれかで見つかるかも ✨
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ placement, program }) => {
        const name = program?.name ?? placement.externalName ?? '番組情報未登録';
        const isFavorite =
          program !== undefined &&
          favorites !== undefined &&
          favorites.includes(program.id);
        const isVisited = visited !== undefined && placement.position in visited;
        const hoursLabel = program
          ? compactHours(program.exhibition.hours)
          : null;
        const merchTags = program?.official.merchandiseTags ?? [];
        const merchDetails = program?.official.merchandiseDetails ?? [];
        const spotlight = program?.official.merchandiseSpotlight;
        const hasMerchSection =
          merchTags.length > 0 ||
          merchDetails.length > 0 ||
          spotlight !== undefined;

        return (
          <li key={`${placement.position}-${day}`}>
            <article className="group relative rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
              {/* stretched button: カード全体タップ可能（z-10）*/}
              <button
                type="button"
                onClick={() => onSelect(placement)}
                aria-label={`${name} のブース詳細を開く`}
                className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <span className="sr-only">ブース詳細を開く</span>
              </button>

              {/* 表示コンテンツ（pointer-events-none でクリックを stretched button に通す）*/}
              <div className="pointer-events-none flex flex-col gap-2 p-3">
                {/* 1. ヘッダー: ブース番号 + 営業時間 + 状態バッジ */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold text-primary-600">
                    ブース {placement.position}
                    {hoursLabel !== null ? (
                      <span className="ml-1 font-medium text-neutral-400">
                        · {hoursLabel}
                      </span>
                    ) : null}
                  </p>
                  <BoothStateBadges
                    isFavorite={isFavorite}
                    isVisited={isVisited}
                    size="sm"
                    direction="row"
                    className="shrink-0"
                  />
                </div>

                {/* 2. 物販タグ（メイン・大）— フィルタ検索の答え */}
                {merchTags.length > 0 ? (
                  <p className="flex flex-wrap gap-1.5">
                    {merchTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-bold text-secondary-800"
                      >
                        {shortTagLabel(tag)}
                      </span>
                    ))}
                  </p>
                ) : null}

                {/* 3. 物販ハイライト（メイン）*/}
                {merchDetails.length > 0 ? (
                  <MerchandisePreview details={merchDetails} variant="card-main" />
                ) : null}

                {/* 4. spotlight 強調 box（ファンガイドおすすめ）*/}
                {spotlight !== undefined && spotlight.length > 0 ? (
                  <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2">
                    <p className="text-[10px] font-bold tracking-wide text-primary-700">
                      ✨ ファンガイドおすすめ
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-800">
                      {spotlight}
                    </p>
                  </div>
                ) : null}

                {/* 5. 番組情報（補助）*/}
                {program ? (
                  <BoothInfoCompact
                    program={program}
                    thumbnailSize={48}
                    catchphraseClamp={2}
                    className={
                      hasMerchSection
                        ? 'border-t border-neutral-100 pt-2.5'
                        : ''
                    }
                  />
                ) : (
                  // external 番組（programs.json 未登録）は名前だけ大きく
                  <div className="flex items-center gap-2.5 border-t border-neutral-100 pt-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-2xl"
                    >
                      📍
                    </span>
                    <p className="line-clamp-2 text-xs font-bold text-neutral-900">
                      {name}
                    </p>
                  </div>
                )}
              </div>

              {/* 6. link アイコン footer（z-20、独立クリック可）*/}
              {program ? (
                <div className="relative z-20 flex justify-end px-3 pb-2 pointer-events-auto">
                  <BoothLinkIcons
                    links={program.links}
                    programName={program.name}
                    size={14}
                  />
                </div>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}

function shortTagLabel(tag: MerchandiseTag): string {
  switch (tag) {
    case 'food-drink':
      return '🍴食';
    case 'experience':
      return '🎟体験';
    case 'rare-curious':
      return '🔮珍';
    case 'free-distribution':
      return '🎁無料';
    case 'limited-new':
      return '✨限定';
    case 'zine-book':
      return '📕ZINE';
  }
}
