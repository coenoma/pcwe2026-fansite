'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * ページレベルのエラーバウンダリ
 *
 * App Router の規約: layout は維持、ページ部分のみエラー画面に置き換え。
 * Sentry 等の監視を入れる場合はここで sendError する。
 */
export default function ErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    console.error('❌ ページレベルのエラーが発生しました', error);
  }, [error]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          ちょっとした不具合が起きました
        </h1>
        <p className="mt-4 text-base text-neutral-600">
          ページの表示に失敗しました。お手数ですが再読み込みするか、トップページへ戻ってみてください。
        </p>
        {error.digest !== undefined && (
          <p className="mt-2 text-xs text-neutral-400">エラー ID: {error.digest}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-primary-700 hover:shadow-md"
          >
            再読み込み
          </button>
          <Link
            href="/"
            className="inline-flex rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition-all active:scale-95 hover:border-primary-400 hover:text-primary-700"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </section>
  );
}
