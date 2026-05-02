import { ExternalLink } from 'lucide-react';
import { CREATOR, EVENT } from '@/lib/constants';

/**
 * トップ末尾セクション「公式情報＆運営から」
 *
 * 設計意図:
 * - 「非公式ファンサイト」だからこそ、公式への敬意とトラフィック誘導を最後に明示
 * - 同時に「このサイトの作り手 = Podmate」という制作者文脈も自然に提示
 * - 押し付けがましさを避けるため、装飾は最小限で 2 カラム、白背景
 * - 番組探索が完了した訪問者の最後の行き先 = 公式 / 制作者、を 2 つだけ並べる
 */
export function OfficialAndCredit() {
  return (
    <section className="border-t border-neutral-200 bg-neutral-50/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
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

          {/* 右: 運営 / Podmate */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600">
              MADE BY
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              このサイトを作った人たち。
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              {CREATOR.company}（代表 {CREATOR.representative}）が、ファン活動として制作・運営しています。
              本サイトのような「番組ごとのファン目線サイト」も、
              ぼくらが運営する <strong className="text-neutral-800">{CREATOR.serviceName}</strong> なら数分で作れます。
              番組をやっているなら、ぜひ覗いてみてください。
            </p>

            <ul className="mt-5 space-y-2 text-sm">
              <li>
                <a
                  href={CREATOR.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 font-bold text-primary-700 transition-colors hover:text-primary-800"
                >
                  <span className="underline decoration-transparent transition-colors group-hover:decoration-primary-600">
                    {CREATOR.serviceName}.fm — ポッドキャスト運営の、おとも
                  </span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={CREATOR.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 font-bold text-primary-700 transition-colors hover:text-primary-800"
                >
                  <span className="underline decoration-transparent transition-colors group-hover:decoration-primary-600">
                    X: {CREATOR.twitterHandle}（運営からのお知らせ）
                  </span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
