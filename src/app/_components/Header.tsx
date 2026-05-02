import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { FavoriteCountBadge } from './FavoriteCountBadge';

/**
 * 共通ヘッダー
 *
 * ブランディング:
 * - 手描きマイクのアプリアイコン（OGP / favicon と同シリーズ）+ PCWE2026 ロゴテキスト
 * - 「非公式ファンガイド」バッジ
 * - 上端の 3 色グラデ装飾線は意図的に置かない（podmate.fm のトーンに合わせて
 *   装飾要素を絞り、過剰な装飾による「AI 的フリル感」を排除）
 */
export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          {/* ロゴアイコン（手描きマイク。OGP・favicon と統一感）*/}
          <Image
            src="/icons/icon-192.png"
            alt="PCWE2026 ファンガイド ロゴ"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-xl shadow-sm"
          />

          {/* ロゴテキスト + サブ */}
          <span className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight text-neutral-900">
              PCWE<span className="text-primary-600">2026</span>
            </span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
              FAN GUIDE
            </span>
          </span>

          <span className="ml-2 hidden rounded-full border border-primary-300 bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700 sm:inline-block">
            非公式
          </span>
        </Link>

        <nav aria-label="メインナビゲーション" className="flex items-center gap-1 text-sm">
          {/* メイン機能 = AI 番組レコメンドへ最短アクセス。プライマリーカラーで強調 */}
          <Link
            href="/#discover"
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md sm:px-4"
          >
            <Sparkles size={14} aria-hidden="true" />
            <span className="hidden sm:inline">AI で番組を選ぶ</span>
            <span className="sm:hidden">AI 選ぶ</span>
          </Link>
          <Link
            href="/plan"
            className="inline-flex items-center rounded-full px-3 py-1.5 font-bold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-primary-600"
          >
            気になる
            <FavoriteCountBadge />
          </Link>
          <Link
            href="/about"
            className="hidden items-center rounded-full px-3 py-1.5 font-bold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-primary-600 sm:inline-flex"
          >
            このサイトについて
          </Link>
        </nav>
      </div>
    </header>
  );
}
