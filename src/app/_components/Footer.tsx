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
                <Link href="/about" className="hover:text-primary-600">
                  非公式スタンス・削除依頼
                </Link>
              </li>
              <li>
                <Link href="/plan" className="hover:text-primary-600">
                  気になるリスト
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary-600">
                  プライバシーと取り扱い
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-neutral-700">制作</h3>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li>
                {CREATOR.company}（ファウンダー: {CREATOR.founder}）
              </li>
              <li>
                <a
                  href={CREATOR.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600"
                >
                  {CREATOR.serviceName}.fm — ポッドキャスト運営の、おとも。
                </a>
              </li>
              <li>
                <a
                  href={CREATOR.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600"
                >
                  X: {CREATOR.twitterHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs text-neutral-400">
          © {new Date().getFullYear()} {CREATOR.company}. 番組情報・画像は各番組制作者・PODCAST EXPO 2026 公式に帰属します。
        </p>
      </div>
    </footer>
  );
}
