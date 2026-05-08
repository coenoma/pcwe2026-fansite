import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPrograms, getProgramById } from '@/lib/data';
import { dayLabel } from '@/lib/format';
import { BoothHero } from '@/app/_components/BoothHero';
import { WaveDivider } from '@/app/_components/WaveDivider';
import { FadeInOnScroll } from '@/app/_components/FadeInOnScroll';
import { ProgramCard } from '@/app/_components/ProgramCard';
import { safeJsonLd } from '@/lib/safe-json-ld';
import { MerchandiseSection } from './_components/MerchandiseSection';
import { EVENT, SITE } from '@/lib/constants';
import { tagAxis, tagAxisClass } from '@/lib/tag-axis';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';

/** 全番組の静的パスを生成（SSG）*/
export function generateStaticParams() {
  return getAllPrograms().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const program = getProgramById(id);
  if (program === undefined) return {};

  const title = `${program.shortName ?? program.name}（${program.fanGuide.genre}）`;
  // 検索結果のスニペット用に「PODCAST WEEKEND 2026 出展 / ジャンル」を冒頭に置き、
  // 番組固有のキャッチコピーと組み合わせて自然な日本語で読める形にする。
  const description = `PODCAST WEEKEND 2026（ポッドキャストウィークエンド／PODCAST EXPO 2026 内のマーケットイベント）出展。${program.fanGuide.genre}ジャンルの「${program.fanGuide.catchphrase}」── ${program.fanGuide.subCatch}`;

  return {
    title,
    description,
    alternates: { canonical: `/booth/${program.id}` },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/booth/${program.id}`,
      images: [{ url: program.thumbnail, alt: program.name }],
    },
    twitter: {
      // 番組サムネは 640x640 の正方形のため summary（小カード）を採用。
      // summary_large_image は推奨 2:1 比率で、正方形画像だと X 実機側で
      // 画像表示がスキップされる挙動があるため。
      // サイト全体のトップ・OG（1200x630）は layout.tsx で summary_large_image を維持。
      card: 'summary',
      title,
      description,
      images: [program.thumbnail],
    },
  };
}

export default async function BoothPage({ params }: Props) {
  const { id } = await params;
  const program = getProgramById(id);
  if (program === undefined) notFound();

  const related = getAllPrograms()
    .filter((p) => p.fanGuide.genre === program.fanGuide.genre && p.id !== program.id)
    .slice(0, 3);

  // JSON-LD 構造化データ（PodcastSeries + BreadcrumbList）
  // subjectOf に Event をネストすることで、検索エンジンに「この番組は
  // PODCAST WEEKEND 2026 に出展している」という関係を伝える。
  const podcastJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: program.name,
    description: program.official.description,
    image: `${SITE.url}${program.thumbnail}`,
    url: program.links.spotify ?? program.boothUrl,
    sameAs: [program.links.x, program.links.instagram, program.links.website].filter(
      (v): v is string => typeof v === 'string'
    ),
    genre: program.fanGuide.genre,
    subjectOf: {
      '@type': 'Event',
      name: EVENT.name,
      alternateName: EVENT.alternateNames,
      startDate: `${EVENT.startDate}T10:30:00+09:00`,
      endDate: `${EVENT.endDate}T19:00:00+09:00`,
      location: { '@type': 'Place', name: EVENT.venue },
      url: program.boothUrl,
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: program.fanGuide.genre,
        item: `${SITE.url}/genre/${encodeURIComponent(program.fanGuide.genre)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: program.shortName ?? program.name,
        item: `${SITE.url}/booth/${program.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(podcastJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <BoothHero program={program} />

      {/*
        Hero 末尾に波々を乗せる（負マージンで Hero 内に侵食）
        → Hero と次のセクション（neutral-50）の間に白い余白が生まれず、自然な橋渡しに
      */}
      <WaveDivider fillClass="fill-neutral-50" className="-mt-12 sm:-mt-16" />

      {/* こんな人に刺さる: 派手な amber-50 → 落ち着いた neutral-50 にして共通枠の整理感を強化 */}
      <FadeInOnScroll>
        <section className="bg-neutral-50">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              こんな人に、刺さるかも？
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              AI の独断と偏見で「想定リスナー」を書いてみました。
            </p>
            <p className="mt-4 text-base leading-relaxed text-neutral-800 sm:text-lg">
              {program.fanGuide.targetListener}
            </p>
            {/*
              タグ群: tagAxis に従って色分け
              - 雰囲気（mood）= primary 系オレンジ（感情・探索）
              - シーン（scene）= secondary 系ブルー（時間・データ）
              - 内容（content）= ニュートラル
              一覧カードと統一感を保ちつつ、軸性が一目で読める。
            */}
            <div className="mt-6 flex flex-wrap gap-2">
              {program.fanGuide.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full border px-3 py-1 text-sm font-bold ${tagAxisClass(tagAxis(tag))}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      <WaveDivider fillClass="fill-white" className="-mt-12 sm:-mt-16" />

      {/* 公式情報（共通枠: 絵文字を削って整然と） */}
      <FadeInOnScroll>
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              公式情報
            </h2>
            {/*
              公式説明文。description には公式テンプレの <br> 由来の改行（\n）が
              保持されているため、whitespace-pre-line で意図した改行を反映する
            */}
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-neutral-700">
              {program.official.description}
            </p>

            {program.recommendedEpisode !== undefined && (
              <a
                href={program.recommendedEpisode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 block rounded-2xl border-2 border-primary-200 bg-primary-50/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md sm:p-5"
              >
                <p className="text-xs font-bold text-primary-700">
                  おすすめエピソード
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  番組ホストが選ぶ「まずはこの 1 本」
                </p>
                <p className="mt-2 text-base font-extrabold leading-snug text-neutral-900 group-hover:text-primary-700 sm:text-lg">
                  {program.recommendedEpisode.title}
                </p>
                <p className="mt-2 text-xs font-bold text-primary-600">
                  聴いてみる ↗
                </p>
              </a>
            )}

            {program.official.hosts !== undefined && program.official.hosts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-neutral-500">パーソナリティ</h3>
                <p className="mt-1 text-base text-neutral-800">
                  {program.official.hosts.join(' / ')}
                </p>
              </div>
            )}

            {/*
              ブース物販は別 section に独立させたため、ここでは表示しない。
              公式ブース由来の物販テキストリスト (merchandise) はそちらに集約。
            */}

            {/*
              出展日 / エリア: ahamo 風の「データ感」で見せる。
              - 出展日（土・日・両日）を secondary-700 + tabular-nums で大きく
              - 時間帯・エリアは添え物として小さく
            */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-neutral-500">出展日 / エリア</h3>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-black tabular-nums text-secondary-700 sm:text-3xl">
                  {dayLabel(program.exhibition.days)}
                </span>
                <span className="text-sm font-bold text-neutral-700 sm:text-base">
                  {program.exhibition.hours}
                </span>
                <span className="text-sm text-neutral-600 sm:text-base">
                  ／ {program.exhibition.area === 'free' ? '無料エリア' : '有料エリア'}
                </span>
              </p>
            </div>

            {/* 物理位置: 会場マップへの動線（exhibition.position or positionBySatSun があれば）*/}
            {(program.exhibition.position || program.exhibition.positionBySatSun) ? (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-neutral-500">ブース位置</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {program.exhibition.position ? (
                    <Link
                      href={`/map?day=${program.exhibition.days[0] ?? 'sat'}&pin=${encodeURIComponent(program.exhibition.position.label)}`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition-all hover:bg-primary-100 hover:shadow-sm"
                    >
                      <span aria-hidden="true">🗺</span>
                      <span>
                        ブース {program.exhibition.position.label}
                        {program.exhibition.days.length === 2 ? '（両日）' : ''}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                  {program.exhibition.positionBySatSun?.sat ? (
                    <Link
                      href={`/map?day=sat&pin=${encodeURIComponent(program.exhibition.positionBySatSun.sat.label)}`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition-all hover:bg-primary-100 hover:shadow-sm"
                    >
                      <span aria-hidden="true">🗺</span>
                      <span>5/9 土 ブース {program.exhibition.positionBySatSun.sat.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                  {program.exhibition.positionBySatSun?.sun ? (
                    <Link
                      href={`/map?day=sun&pin=${encodeURIComponent(program.exhibition.positionBySatSun.sun.label)}`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition-all hover:bg-primary-100 hover:shadow-sm"
                    >
                      <span aria-hidden="true">🗺</span>
                      <span>5/10 日 ブース {program.exhibition.positionBySatSun.sun.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  会場マップでブース位置を確認できます。
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex justify-center">
              <a
                href={program.boothUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-primary-300 bg-white px-5 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md"
              >
                <span>公式ブースページを見る</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      {/*
        ブース物販（独立 section）
        - 「公式情報」と bg-white で連続させ境界を主張しない
        - max-w-5xl + grid（sm:2 列, xl:3 列）でワイド画面を活用
      */}
      <FadeInOnScroll>
        <MerchandiseSection
          merchandise={program.official.merchandise}
          merchandiseDetails={program.official.merchandiseDetails}
        />
      </FadeInOnScroll>

      {/* 関連番組（同じジャンル）*/}
      {related.length > 0 && (
        <FadeInOnScroll>
          <section className="bg-neutral-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                  「{program.fanGuide.genre}」の他の番組
                </h2>
                <Link
                  href={`/genre/${encodeURIComponent(program.fanGuide.genre)}`}
                  className="text-xs font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600 sm:text-sm"
                >
                  「{program.fanGuide.genre}」をもっと見る →
                </Link>
              </div>
              <p className="text-xs text-neutral-500 sm:text-sm">
                同じジャンルだから、テイストが地続きで続けて聴けるかも。
              </p>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <ProgramCard key={p.id} program={p} />
                ))}
              </div>
            </div>
          </section>
        </FadeInOnScroll>
      )}

      {/*
        公式動線は layout の <OfficialAndCredit /> で全ページ共通表示するため、
        番組詳細ページ専用の末尾セクションは持たない（重複回避）。
      */}
    </>
  );
}

