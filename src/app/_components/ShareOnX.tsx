'use client';

import { useState } from 'react';

interface Props {
  /** ツイート本文（URL なしで OK、本コンポーネントが付与） */
  text: string;
  /** 共有 URL（このページの URL）*/
  url: string;
  /** 推奨ハッシュタグ */
  hashtags?: string[];
  className?: string;
}

/**
 * X 投稿リンク（事前文面付き）
 *
 * 「教えてあげる」のニュアンスでボタン文言を統一（押し売り禁止）。
 */
export function ShareOnX({ text, url, hashtags = ['PCWE2026'], className }: Props) {
  const [copied, setCopied] = useState(false);

  const buildIntentUrl = () => {
    const params = new URLSearchParams({
      text: `${text}\n\n${url}`,
      hashtags: hashtags.join(','),
    });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  };

  const handleCopy = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('⚠️ クリップボードコピーに失敗しました', error);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <a
        href={buildIntentUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-neutral-700"
      >
        <span aria-hidden="true">𝕏</span>
        この番組を教えてあげる
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:border-primary-400 hover:text-primary-700"
      >
        {copied ? '✓ コピーしました' : 'リンクをコピー'}
      </button>
    </div>
  );
}
