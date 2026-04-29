'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Info } from 'lucide-react';

/**
 * スマホ用ボトムナビゲーション（PWA でホーム画面起動された想定）
 *
 * - スタンドアロン表示時に底部固定
 * - 主要 3 タブ: 一覧 / 気になる / About
 * - 非スマホ（lg:）では非表示
 */
export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: '番組一覧', icon: Home },
    { href: '/plan', label: '気になる', icon: Heart },
    { href: '/about', label: 'このサイト', icon: Info },
  ];

  return (
    <nav
      aria-label="メインナビゲーション（モバイル）"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {tabs.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors active:bg-neutral-50 ${
                  isActive ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} className={isActive ? 'fill-primary-100' : ''} aria-hidden="true" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
