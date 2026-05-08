/**
 * 番組の主要リスニング・SNS リンクを絵文字アイコン列で表示する。
 *
 * 既存 ProgramCard.tsx の Spotify ボタン（🎧 絵文字）パターンを踏襲し、
 * ライブラリ依存（lucide-react / Simple Icons 等）を増やさずに視認性を確保。
 *
 * リスト・モーダル内で外部リンクとして機能するため、親が `<button>` の場合は
 * stretched button パターン（外殻 article + 内側絶対 button）と組み合わせ、
 * このコンポーネント自体は `relative z-20 pointer-events-auto` の領域に置くこと。
 *
 * onClick で stopPropagation を呼ぶため Client Component。
 */

'use client';

import type { Program } from '@/lib/types';

interface Props {
  /** Program['links'] をそのまま渡す（spotify / x / instagram のみ参照）*/
  links: Program['links'];
  /** aria-label に組み込む番組名 */
  programName: string;
  /** 絵文字サイズの基準（px）。アイコンの外側丸ボタンは size + 8px */
  size?: number;
  /** 親側で配置クラスを渡す */
  className?: string;
}

const LINK_DEFS = [
  { key: 'spotify', emoji: '🎧', label: 'Spotify' },
  { key: 'x', emoji: '𝕏', label: 'X (旧 Twitter)' },
  { key: 'instagram', emoji: '📷', label: 'Instagram' },
] as const;

export function BoothLinkIcons({
  links,
  programName,
  size = 16,
  className,
}: Props) {
  // present な link だけアイコン化。1 件もなければ DOM 自体出さない
  const items = LINK_DEFS.filter(
    (def) => links[def.key] !== undefined && links[def.key]!.length > 0,
  );
  if (items.length === 0) return null;

  const buttonDim = size + 12;

  return (
    <div
      className={
        className !== undefined
          ? `flex items-center gap-1.5 ${className}`
          : 'flex items-center gap-1.5'
      }
    >
      {items.map(({ key, emoji, label }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${programName} を ${label} で開く`}
          className="flex items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-primary-100 hover:text-primary-700"
          style={{ width: buttonDim, height: buttonDim }}
          // 親要素のクリック（stretched button）にバブルさせない
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <span aria-hidden="true" style={{ fontSize: size }}>
            {emoji}
          </span>
        </a>
      ))}
    </div>
  );
}
