/**
 * 番組詳細ページの Hero（podmate-next の ClassicHero を踏襲）
 *
 * - 番組ごとの themeColor / themeFont で「その番組のサイト」感を演出
 * - レイアウトは ClassicHero（左テキスト + 右画像）固定
 * - vibe → デフォルト color/font、override は fanGuide.themeColor / themeFont
 */

import Image from 'next/image';
import Link from 'next/link';
import type { Program } from '@/lib/types';
import { dayLabel } from '@/lib/format';
import { vibeStyle, themeFontVar } from '@/lib/vibe-style';
import { FavoriteButton } from './FavoriteButton';
import { LinksRow } from './LinksRow';
import { ShareOnX } from './ShareOnX';
import { SITE } from '@/lib/constants';

interface Props {
  program: Program;
}

export function BoothHero({ program }: Props) {
  const vibe = vibeStyle(program.fanGuide.vibe);
  const themeColor = program.fanGuide.themeColor ?? vibe.defaultThemeColor;
  const themeFont = program.fanGuide.themeFont ?? vibe.defaultThemeFont;
  const fontFamily = themeFontVar(themeFont);

  // themeColor 派生（透明度違いのバリエーション）
  const bg = `${themeColor}0d`; // 5%
  const border = `${themeColor}40`; // 25%
  const decoration = `${themeColor}20`; // 12%
  // 蛍光ペン風の下線: 25% 透明度に抑え、暗い themeColor でもテキストが埋もれないように
  const highlightUnderline = `${themeColor}40`;

  const tweetText = `${program.shortName ?? program.name}\n${program.fanGuide.catchphrase}`;
  const detailUrl = `${SITE.url}/booth/${program.id}`;

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: bg }}
      aria-label={`${program.name} の紹介`}
    >
      {/* 背景装飾: 円ボーダー */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-10 h-24 w-24 rounded-full border-4 opacity-50"
        style={{ borderColor: border }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-10 bottom-10 h-32 w-32 rounded-full border-4 opacity-40"
        style={{ borderColor: border }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <Link
          href="/"
          className="inline-flex text-sm font-bold text-neutral-600 transition-colors hover:text-neutral-900"
        >
          ← 一覧へ戻る
        </Link>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* 左: テキスト */}
          <div className="order-2 lg:order-1">
            {/* メタバッジ群 */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={`/genre/${encodeURIComponent(program.fanGuide.genre)}`}
                className="rounded-full border bg-white/80 px-3 py-1 font-bold backdrop-blur transition-colors hover:bg-white"
                style={{ borderColor: border, color: themeColor }}
              >
                {program.fanGuide.genre}
              </Link>
              <span
                className="rounded-full border bg-white/80 px-3 py-1 font-bold text-neutral-700 backdrop-blur"
                style={{ borderColor: border }}
              >
                {dayLabel(program.exhibition.days)}
              </span>
              <span
                className="rounded-full border bg-white/80 px-3 py-1 font-bold text-neutral-700 backdrop-blur"
                style={{ borderColor: border }}
              >
                ブース {program.exhibition.boothNumber}
              </span>
              <span className="ml-auto">
                <FavoriteButton programId={program.id} size="md" />
              </span>
            </div>

            {/* 番組名（themeFont 適用）*/}
            <h1
              className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl md:text-[42px]"
              style={{ fontFamily }}
            >
              {program.name}
            </h1>

            {/*
              キャッチコピー（themeColor 蛍光下線）
              - catchphraseLines（任意）が指定されていれば、その配列を意味の切れ目で改行
              - 各行を block span で出すことで、行ごとに蛍光下線が独立して引かれる
              - 未指定なら catchphrase 1 行を従来どおり表示（box-decoration-clone で複数行
                自動折り返しにも対応）
            */}
            <p className="mt-6 text-lg font-bold leading-relaxed text-neutral-800 sm:text-xl md:text-2xl">
              {program.fanGuide.catchphraseLines !== undefined ? (
                program.fanGuide.catchphraseLines.map((line, i) => (
                  <span
                    key={i}
                    className="block box-decoration-clone"
                    style={{
                      backgroundImage: `linear-gradient(180deg, transparent 78%, ${highlightUnderline} 78%, ${highlightUnderline} 94%, transparent 94%)`,
                      paddingInline: '0.1em',
                    }}
                  >
                    {line}
                  </span>
                ))
              ) : (
                <span
                  className="box-decoration-clone"
                  style={{
                    backgroundImage: `linear-gradient(180deg, transparent 78%, ${highlightUnderline} 78%, ${highlightUnderline} 94%, transparent 94%)`,
                    paddingInline: '0.1em',
                  }}
                >
                  {program.fanGuide.catchphrase}
                </span>
              )}
            </p>

            {/* サブキャッチ */}
            <p className="mt-3 text-sm text-neutral-600 sm:text-base">
              {program.fanGuide.subCatch}
            </p>

            {/* リンク行 */}
            <div className="mt-8">
              <LinksRow links={program.links} />
            </div>

            {/* X シェア */}
            <div className="mt-4">
              <ShareOnX text={tweetText} url={detailUrl} />
            </div>
          </div>

          {/* 右: 画像（themeColor のフレーム）*/}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative">
              <div
                className="rounded-3xl border-2 bg-white p-3"
                style={{ borderColor: border }}
              >
                <div className="relative aspect-square w-[260px] sm:w-[320px] lg:w-[360px]">
                  <Image
                    src={program.thumbnail}
                    alt={`${program.name} のロゴ画像`}
                    fill
                    sizes="(max-width: 640px) 260px, (max-width: 1024px) 320px, 360px"
                    className="rounded-2xl border-2 object-cover"
                    style={{ borderColor: border }}
                    priority
                  />
                </div>
              </div>
              {/* 装飾円 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -right-4 -z-10 h-24 w-24 rounded-full opacity-50"
                style={{ backgroundColor: decoration }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-4 -left-4 -z-10 h-16 w-16 rounded-full opacity-50"
                style={{ backgroundColor: decoration }}
              />
            </div>
          </div>
        </div>

        {/* 番組らしさバッジ（遊び心: AI 分析っぽく）*/}
        <div className="mt-10 flex justify-center">
          <p
            className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border bg-white/80 px-4 py-1.5 text-xs text-neutral-600 backdrop-blur"
            style={{ borderColor: border }}
          >
            <span aria-hidden="true">🎨</span>
            <span>分析結果: <strong style={{ color: themeColor }}>{vibe.personalityLabel}</strong></span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">独断と偏見につき、</span>
            <Link
              href="/about"
              className="font-bold underline decoration-transparent transition-colors hover:opacity-80"
              style={{ color: themeColor }}
            >
              違ったら教えてね
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
