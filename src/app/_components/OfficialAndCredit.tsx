import { ExternalLink, Mic, Tv } from 'lucide-react';
import { CREATOR, EVENT } from '@/lib/constants';

/**
 * トップ末尾セクション「公式情報＆制作者紹介」
 *
 * - 公式（PODCAST EXPO 2026）への 2 動線をアウトラインボタンで揃え、左右中央寄せ
 * - 制作者カラムは画像に頼らず、CSS のみで Podmate ブランドのトーンを再現したバナー
 *   （ロゴ風大文字 + 蛍光下線アクセント + プライマリ CTA）。
 *   podmate.fm 本家 Hero を見た時に「同じ世界観だ」と感じる配色・余白に統一
 * - 左右のカード高さを grid stretch + 内部 flex-col で揃える
 */
export function OfficialAndCredit() {
  return (
    <section className="border-t border-neutral-200 bg-neutral-50/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-stretch gap-6 sm:gap-8 lg:grid-cols-2">
          {/* 左: 公式情報（左右中央寄せ + アウトラインボタン 2 つ）*/}
          <div className="flex h-full flex-col items-center rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-7">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              公式の情報も、ぜひ。
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
              本サイトはあくまで非公式ファンガイド。当日の最新情報・タイムテーブル・
              チケットは公式で。来場できない方は、LISTEN による公式ライブ配信
              「{EVENT.expoTvName}」をチェックすると会場の熱気が伝わります。
            </p>

            {/*
              公式 2 動線をアウトラインボタンで横並び（モバイルは縦積み）。
              色面積を抑えつつ、ボタン形状で「タップしてもらえる」視認性を確保。
            */}
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={EVENT.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-primary-300 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md"
              >
                <span>{EVENT.parentName} 公式サイト</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
              <a
                href={EVENT.expoTvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-primary-300 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md"
              >
                <Tv size={14} aria-hidden="true" />
                <span>{EVENT.expoTvName}</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              新しいタブで公式サイトに移動します
            </p>
          </div>

          {/* 右: Podmate.fm へのバナーリンク（CSS のみ、画像なし）*/}
          <a
            href={CREATOR.serviceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${CREATOR.serviceName}.fm（${CREATOR.company} のポッドキャスト運営支援サービス）を新しいタブで開く`}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            {/*
              Hero エリア: podmate.fm 本家 Hero と同じトーン（淡い水色 → 白
              のグラデ背景 + マイクアイコン + ロゴ風タイポ + 蛍光下線）を
              CSS のみで再現。画像非依存なので確実に表示崩れなし。
            */}
            <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-amber-50">
              {/* 背景の柔らかいハイライト */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-12 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-primary-100/40 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-100/40 blur-3xl"
              />

              <div className="relative flex flex-col items-center px-6 text-center">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
                >
                  <Mic size={24} />
                </span>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                  {CREATOR.serviceName}
                </p>
                <p className="relative mt-1 text-base font-bold text-neutral-700 sm:text-lg">
                  ポッドキャスト運営の、
                  <span className="relative inline-block">
                    <span className="relative z-10">おとも。</span>
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0.5 -z-0 h-2 bg-amber-200/80"
                    />
                  </span>
                </p>
              </div>
            </div>

            {/* テキストエリア */}
            <div className="relative flex flex-1 flex-col p-6 sm:p-7">
              <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                このサイトを作った人。
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {CREATOR.company}（代表 {CREATOR.representative}）が、ファン活動として制作・運営しています。
                本サイトのような<strong className="text-neutral-800">「番組ごとのファン目線サイト」</strong>も、
                ぼくらが運営する <strong className="text-neutral-800">{CREATOR.serviceName}</strong> なら数分で作れます。
                配信者の方は、ぜひ覗いてみてください。
              </p>

              <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:bg-primary-700 group-hover:shadow-md">
                {CREATOR.serviceName}.fm を見る
                <ExternalLink size={14} aria-hidden="true" />
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
