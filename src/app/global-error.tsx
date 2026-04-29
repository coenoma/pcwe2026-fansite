'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * ルートレベルのエラーバウンダリ（layout も含むエラー時のフォールバック）
 *
 * App Router の規約: 自前で <html><body> を返す必要がある。
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('❌ ルートレベルのエラーが発生しました', error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
          margin: 0,
          padding: '5rem 1rem',
          textAlign: 'center',
          color: '#262626',
          backgroundColor: '#ffffff',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          サイトに不具合が起きました
        </h1>
        <p style={{ marginTop: '1rem', color: '#525252' }}>
          ご迷惑をおかけしています。再読み込みしてみてください。
        </p>
        {error.digest !== undefined && (
          <p style={{ marginTop: '0.5rem', color: '#a3a3a3', fontSize: '0.75rem' }}>
            エラー ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            color: '#ffffff',
            backgroundColor: '#dc725a',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            transition: 'transform 150ms, box-shadow 150ms',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          再読み込み
        </button>
      </body>
    </html>
  );
}
