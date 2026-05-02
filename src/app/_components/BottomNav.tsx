'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Heart, Info } from 'lucide-react';

/**
 * スマホ用ボトムナビゲーション（PWA でホーム画面起動された想定）
 *
 * - スタンドアロン表示時に底部固定
 * - 主要 4 タブ: 一覧 / AI で選ぶ（DISCOVER ハブ）/ 気になる / About
 *   ※ AI レコメンドはサイトのメイン機能なので最短 1 タップで届くようにする
 * - 非スマホ（lg:）では非表示
 */
export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: '一覧', icon: Home, activeMatch: 'exact' as const },
    {
      href: '/#discover',
      label: 'AIリコメンド',
      icon: Sparkles,
      // # はクライアントサイドアンカーで pathname には含まれないため active 判定しない
      activeMatch: 'never' as const,
      emphasis: true,
    },
    { href: '/plan', label: '気になる', icon: Heart, activeMatch: 'prefix' as const },
    { href: '/about', label: 'サイトについて', icon: Info, activeMatch: 'prefix' as const },
  ];

  return (
    <nav
      aria-label="メインナビゲーション（モバイル）"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.activeMatch === 'never'
              ? false
              : tab.activeMatch === 'exact'
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const emphasis = 'emphasis' in tab && tab.emphasis === true;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors active:bg-neutral-50 ${
                  isActive
                    ? 'text-primary-600'
                    : emphasis
                      ? 'text-primary-600 hover:text-primary-700'
                      : 'text-neutral-500 hover:text-neutral-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={22}
                  className={isActive || emphasis ? 'fill-primary-100' : ''}
                  aria-hidden="true"
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
