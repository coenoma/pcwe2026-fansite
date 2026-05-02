import Link from 'next/link';
import { CREATOR, EVENT, FORM_FIX_URL, FORM_TAKEDOWN_URL, SITE } from '@/lib/constants';

/**
 * 共通フッター
 *
 * 「非公式」明示・削除依頼導線・主要機能への入口・Podmate 控えめ言及。
 *
 * 構造:
 * - サイト情報セクション（このサイトについて → /about、削除/変更依頼の Google フォーム直リンク、プライバシー）
 * - 機能セクション（AI レコメンド・番組検索・気になるリストへのアンカー or 別ページ）
 * - 制作セクション（コエノマ + Podmate + X）
 */
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs text-neutral-500">{SITE.unofficialNotice}</p>

        <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {/* このサイトについて */}
          <div>
            <h3 className="font-bold text-neutral-700">このサイトについて</h3>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li>
                <Link href="/about" className="transition-colors hover:text-primary-600">
                  このサイトについて
                </Link>
              </li>
              <li>
                掲載の削除依頼は
                {/*
                  「こちら」だけをリンク化。Google フォーム URL が未設定なら /about の
                  該当セクションにフォールバックして安全側に倒す。
                */}
                {FORM_TAKEDOWN_URL.length > 0 ? (
                  <a
                    href={FORM_TAKEDOWN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600"
                  >
                    こちら
                  </a>
                ) : (
                  <Link
                    href="/about"
                    className="font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600"
                  >
                    こちら
                  </Link>
                )}
              </li>
              <li>
                掲載内容の変更依頼は
                {FORM_FIX_URL.length > 0 ? (
                  <a
                    href={FORM_FIX_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600"
                  >
                    こちら
                  </a>
                ) : (
                  <Link
                    href="/about"
                    className="font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600"
                  >
                    こちら
                  </Link>
                )}
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-primary-600">
                  プライバシーと取り扱い
                </Link>
              </li>
            </ul>
          </div>

          {/* 機能 */}
          <div>
            <h3 className="font-bold text-neutral-700">機能</h3>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li>
                <Link href="/#discover" className="transition-colors hover:text-primary-600">
                  AI による番組レコメンド
                </Link>
              </li>
              <li>
                <Link href="/#all-programs" className="transition-colors hover:text-primary-600">
                  キーワード・タグから番組検索
                </Link>
              </li>
              <li>
                <Link href="/plan" className="transition-colors hover:text-primary-600">
                  気になる番組リスト
                </Link>
              </li>
            </ul>
          </div>

          {/* イベント公式情報（PODCAST EXPO 2026 公式 + 公式ライブ配信）*/}
          <div>
            <h3 className="font-bold text-neutral-700">イベント公式情報</h3>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li>
                <a
                  href={EVENT.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary-600"
                >
                  {EVENT.parentName} 公式サイト
                </a>
              </li>
              <li>
                <a
                  href={EVENT.expoTvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary-600"
                >
                  📺 {EVENT.expoTvName}
                </a>
                <span className="block text-xs text-neutral-400">公式ライブ配信</span>
              </li>
            </ul>
          </div>

          {/* 制作 */}
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
            このサイトは <strong>非公式</strong> のファンサイトです。<strong>PODCAST WEEKEND 2026</strong>（ポッドキャストウィークエンド／<a href="https://podcastexpo.jp/" target="_blank" rel="noopener noreferrer" className="underline decoration-transparent transition-colors hover:text-primary-600 hover:decoration-primary-600">PODCAST EXPO 2026</a> 内のマーケットイベント）の出展番組を対象にしています。番組のロゴ・概要などは、各番組さんと公式の情報を引用しています。
          </p>
          <p>掲載取り下げや内容の修正は、上の「このサイトについて」セクションのリンクからご連絡ください。</p>
          <p className="pt-2 text-neutral-400">© {new Date().getFullYear()} {CREATOR.company}</p>
        </div>
      </div>
    </footer>
  );
}
