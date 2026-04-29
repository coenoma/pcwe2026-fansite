'use client';

import { useEffect } from 'react';

/**
 * Service Worker 登録（クライアントのみで実行）
 *
 * ビルド成果物の /sw.js を登録。失敗しても致命的ではない（オフライン機能のみ無効）。
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.info('✅ Service Worker 登録成功');
      } catch (error) {
        console.warn('⚠️ Service Worker 登録失敗', error);
      }
    };

    void registerSW();
  }, []);

  return null;
}
