import Link from 'next/link';
import { Mic } from 'lucide-react';
import { FavoriteCountBadge } from './FavoriteCountBadge';

/**
 * 共通ヘッダー
 *
 * ブランディング:
 * - マイクアイコン + PCWE2026 ロゴテキスト + サブタイトル
 * - 「非公式ファンガイド」バッジ
 * - 装飾ストライプ（primary グラデ）で視覚的アンカー
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      {/* 上端の装飾グラデライン */}
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-primary-500 via-amber-400 to-sky-400"
      />

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          {/* ロゴアイコン */}
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm"
          >
            <Mic size={18} />
          </span>

          {/* ロゴテキスト + サブ */}
          <span className="flex flex-col leading-none">
            <span
              className="text-xl font-extrabold tracking-tight text-neutral-900"
              style={{ fontFamily: 'var(--font-noto-serif-jp)' }}
            >
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
