/**
 * テキスト中の検索クエリをハイライトする純粋関数（JSX を返す）
 *
 * dangerouslySetInnerHTML を使わず、React Element 配列を返す。
 */

import { Fragment, type ReactNode } from 'react';

/**
 * text 中の query 出現箇所を <mark> でラップして返す。
 * query が空 / 0 文字なら text をそのまま返す。
 * 大文字小文字を区別しない単純マッチ。
 */
export function highlightText(text: string, query: string): ReactNode {
  const trimmed = query.trim();
  if (trimmed === '') return text;

  const normalizedQuery = trimmed.toLowerCase();
  const normalizedText = text.toLowerCase();

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, cursor);
    if (matchIndex === -1) {
      parts.push(<Fragment key={`t-${key++}`}>{text.slice(lastIndex)}</Fragment>);
      break;
    }
    if (matchIndex > lastIndex) {
      parts.push(<Fragment key={`t-${key++}`}>{text.slice(lastIndex, matchIndex)}</Fragment>);
    }
    parts.push(
      <mark key={`m-${key++}`} className="rounded-sm bg-amber-200/80 px-0.5">
        {text.slice(matchIndex, matchIndex + trimmed.length)}
      </mark>
    );
    lastIndex = matchIndex + trimmed.length;
    cursor = lastIndex;
  }

  return parts;
}
