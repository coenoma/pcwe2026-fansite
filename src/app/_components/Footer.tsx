import Link from 'next/link';
import { CREATOR, SITE } from '@/lib/constants';

/**
 * 共通フッター
 *
 * 「非公式」明示・削除依頼導線・Podmate 控えめ言及。
 */
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs text-neutral-500">{SITE.unofficialNotice}</p>

        <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <h3 className="font-bold text-neutral-700">サイトについて</h3>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li>
                <Link href="/about" className="transition-colors hover:text-primary-600">
                  非公式の徹底・削除依頼
                </Link>
              </li>
              <li>
                <Link href="/plan" className="transition-colors hover:text-primary-600">
                  気になるリスト
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-primary-600">
                  プライバシーと取り扱い
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-neutral-700">制作</h3>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li>{CREATOR.representativeLabel}</li>
              <li>
                <a
                  href={CREATOR.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary-600"
                >
                  {CREATOR.serviceName}.fm — ポッドキャスト運営の、おとも。
                </a>
              </li>
              <li>
                <a
                  href={CREATOR.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary-600"
                >
                  X: {CREATOR.twitterHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-2 text-xs text-neutral-500">
          <p>
            このサイトは <strong>非公式</strong> のファンガイドです。<strong>PODCAST WEEKEND 2026</strong>（ポッドキャストウィークエンド／<a href="https://podcastexpo.jp/" target="_blank" rel="noopener noreferrer" className="underline decoration-transparent transition-colors hover:text-primary-600 hover:decoration-primary-600">PODCAST EXPO 2026</a> 内のマーケットイベント）の出展番組を対象にしています。番組のロゴ・概要などは、各番組さんと公式の情報を引用しています。
          </p>
          <p>掲載取り下げや内容の修正は、上の「このサイトについて」からご連絡ください。</p>
          <p className="pt-2 text-neutral-400">© {new Date().getFullYear()} {CREATOR.company}</p>
        </div>
      </div>
    </footer>
  );
}
