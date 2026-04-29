import Link from 'next/link';

/**
 * 共通ヘッダー
 *
 * 「非公式ファンガイド」明示が必須。
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-neutral-900">
            PCWE2026
          </span>
          <span className="rounded-full border border-primary-300 bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">
            非公式ファンガイド
          </span>
        </Link>
        <nav aria-label="メインナビゲーション" className="flex items-center gap-4 text-sm">
          <Link href="/plan" className="font-bold text-neutral-700 hover:text-primary-600">
            気になるリスト
          </Link>
          <Link href="/about" className="font-bold text-neutral-700 hover:text-primary-600">
            このサイトについて
          </Link>
        </nav>
      </div>
    </header>
  );
}
