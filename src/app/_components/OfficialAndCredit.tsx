import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { CREATOR, EVENT } from '@/lib/constants';

/**
 * トップ末尾セクション「公式情報＆制作者紹介」
 *
 * 設計意図:
 * - 「非公式ファンサイト」だからこそ、公式へのトラフィック誘導と敬意を最後に明示
 * - 同時に「このサイトの作り手 = Podmate」という制作者文脈も自然に提示
 * - 公式カラム = テキスト主体、Podmate カラム = Hero 画像入りのバナー風
 *   （視覚的に「Podmate こんなサービスです」が一発で伝わるよう、視認性を強化）
 * - 押し付けがましさ回避のため、淡い背景・控えめ余白
 */
export function OfficialAndCredit() {
  return (
    <section className="border-t border-neutral-200 bg-neutral-50/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          {/* 左: 公式情報 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600">
              OFFICIAL
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              公式の情報も、ぜひ。
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              本サイトはあくまで非公式ファンガイド。当日の最新情報・タイムテーブル・
              チケットは <strong className="text-neutral-800">PODCAST EXPO 2026</strong> 公式で。
              来場できない方は、LISTEN による公式ライブ配信「{EVENT.expoTvName}」を
              チェックすると会場の熱気が伝わります。
            </p>

            <ul className="mt-5 space-y-2 text-sm">
              <li>
                <a
                  href={EVENT.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 font-bold text-primary-700 transition-colors hover:text-primary-800"
                >
                  <span className="underline decoration-transparent transition-colors group-hover:decoration-primary-600">
                    PODCAST EXPO 2026 公式サイト
                  </span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={EVENT.expoTvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 font-bold text-primary-700 transition-colors hover:text-primary-800"
                >
                  <span className="underline decoration-transparent transition-colors group-hover:decoration-primary-600">
                    📺 {EVENT.expoTvName}（公式ライブ配信）
                  </span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          {/*
            右: Podmate.fm へのバナーリンク
            - カード全体が <a> = 大きなクリック領域
            - Hero 画像を上半分にフル幅で配置（アスペクト比固定）
            - 下半分に Podmate のキャッチ + CTA
            - hover で軽く浮き上がる微アニメ + ring 表示
          */}
          <a
            href={CREATOR.serviceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${CREATOR.serviceName}.fm（${CREATOR.company} のポッドキャスト運営支援サービス）を新しいタブで開く`}
            className="group relative block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            {/* Hero 画像（podmate-next/public/images/top/hero-visual.png をコピー → WebP 化）*/}
            <div className="relative aspect-[1825/1656] overflow-hidden bg-gradient-to-br from-amber-50 via-white to-sky-50 sm:aspect-[16/9] lg:aspect-[1825/1100]">
              <Image
                src="/images/podmate-hero.webp"
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* 画像下端をテキストエリアに馴染ませるグラデオーバーレイ */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/60 to-transparent"
              />
            </div>

            {/* テキストエリア */}
            <div className="relative p-6 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600">
                MADE BY
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                このサイトを作った{CREATOR.serviceName}。
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {CREATOR.company}（代表 {CREATOR.representative}）が、ファン活動として制作・運営しています。
                本サイトのような<strong className="text-neutral-800">「番組ごとのファン目線サイト」</strong>も、
                ぼくらが運営する <strong className="text-neutral-800">{CREATOR.serviceName}</strong> なら数分で作れます。
                配信者の方は、ぜひ覗いてみてください。
              </p>

              <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:bg-primary-700 group-hover:shadow-md">
                {CREATOR.serviceName}.fm を見る
                <ExternalLink size={14} aria-hidden="true" />
              </span>

              <p className="mt-3 text-xs text-neutral-400">
                {CREATOR.serviceName} — ポッドキャスト運営の、おとも。
              </p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
