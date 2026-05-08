/**
 * 公式画像 DL セクション（マップ下部に独立配置）。
 *
 * ユーザー指示:
 * 「公式画像をもとに、独自にマップを描き直してます。
 *  公式画像はこちらから、てきに、動線を設けて表示や DL ができるように」
 *
 * 当日電波が弱い前提のフォールバック + ライセンス透明性。
 */

import Image from 'next/image';

export function OfficialMapDownload() {
  return (
    <section
      aria-labelledby="official-map-heading"
      className="mx-auto mt-8 max-w-4xl rounded-2xl border border-neutral-200 bg-white px-5 py-6 sm:px-6"
    >
      <h2
        id="official-map-heading"
        className="text-base font-bold text-neutral-900 sm:text-lg"
      >
        📍 公式マップ画像（出典 / 画像保存）
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
        本マップは、PCWE2026 公式会場マップ画像をもとに独自に描き直したものです。
        公式画像はこちらからご覧いただけます。会場で電波が弱いときの予備としても、
        スマートフォンに保存しておくと安心です。
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <DayCard
          day="day1"
          label="5/9 土曜 公式マップ"
          src="/images/map/pcwe2026-day1.webp"
        />
        <DayCard
          day="day2"
          label="5/10 日曜 公式マップ"
          src="/images/map/pcwe2026-day2.webp"
        />
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        位置情報の出典: PCWE2026 公式会場マップ /{' '}
        <a
          href="https://podcastexpo.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-700 underline-offset-2 hover:underline"
        >
          PCWE 公式サイト →
        </a>
      </p>
    </section>
  );
}

function DayCard({
  day,
  label,
  src,
}: {
  day: 'day1' | 'day2';
  label: string;
  src: string;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
      <div className="relative aspect-[4/3] w-full bg-white">
        <Image
          src={src}
          alt={`${label}（クリックで拡大）`}
          fill
          className="object-contain"
          sizes="(min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs font-bold text-neutral-700 sm:text-sm">
          {label}
        </span>
        <a
          href={src}
          download={`pcwe2026-${day}.webp`}
          className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100"
        >
          ⬇ ダウンロード
        </a>
      </div>
    </article>
  );
}
