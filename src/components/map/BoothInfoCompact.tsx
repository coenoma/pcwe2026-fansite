/**
 * 番組情報の compact 表示（リスト・SlotCard の補助エリア用）。
 *
 * v1.9.2 で物販主役構造への再設計の一環として導入。
 * 物販情報を画面上半分の主役として出した後、画面下半分で
 * 番組サムネ + 番組名 + catchphrase + fanGuide.tags + subCatch を
 * 補助情報として簡潔にまとめる役割を担う。
 *
 * 設計思想:
 * - 自身は装飾枠を持たず、呼び出し側がボーダー / padding を制御する。
 * - 物販タグ（merchandiseTags）/ spotlight / 状態バッジは扱わない（責務分離）。
 *
 * 詳細設計: docs/plans/v1.9-info-density-on-discovery/README.md（v1.9.2 補正）
 */

import Image from 'next/image';
import { tagAxis, tagAxisClass } from '@/lib/tag-axis';
import type { Program } from '@/lib/types';

interface Props {
  program: Program;
  /** 番組サムネサイズ（リスト 48 / SlotCard 40 推奨）*/
  thumbnailSize?: number;
  /** catchphrase の line-clamp 数（標準 2）*/
  catchphraseClamp?: 2 | 3;
  /** fanGuide.tags の表示件数（標準 3）*/
  tagLimit?: number;
  /** 親側で配置クラスを渡す */
  className?: string;
}

export function BoothInfoCompact({
  program,
  thumbnailSize = 40,
  catchphraseClamp = 2,
  tagLimit = 3,
  className,
}: Props) {
  const tags = program.fanGuide.tags.slice(0, tagLimit);
  const catchphraseClass =
    catchphraseClamp === 3 ? 'line-clamp-3' : 'line-clamp-2';

  return (
    <div className={className ?? ''}>
      <div className="flex items-start gap-2.5">
        <Image
          src={program.thumbnail}
          alt=""
          width={thumbnailSize}
          height={thumbnailSize}
          className="shrink-0 rounded-lg object-cover"
          style={{ width: thumbnailSize, height: thumbnailSize }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-xs font-bold leading-snug text-neutral-900">
            {program.name}
          </p>
          {program.fanGuide.subCatch ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-neutral-500">
              {program.fanGuide.subCatch}
            </p>
          ) : null}
        </div>
      </div>

      {/* catchphrase（amber 蛍光下線、補助エリアでも世界観は伝えたい）*/}
      {program.fanGuide.catchphrase ? (
        <p
          className={`mt-2 ${catchphraseClass} text-[11px] leading-relaxed text-neutral-700`}
        >
          <span
            className="box-decoration-clone"
            style={{
              backgroundImage:
                'linear-gradient(180deg, transparent 78%, rgba(252, 211, 77, 0.4) 78%, rgba(252, 211, 77, 0.4) 94%, transparent 94%)',
              paddingInline: '0.1em',
            }}
          >
            {program.fanGuide.catchphrase}
          </span>
        </p>
      ) : null}

      {/* fanGuide.tags（軸別カラー pill、上位 N 件）*/}
      {tags.length > 0 ? (
        <p className="mt-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${tagAxisClass(
                tagAxis(tag),
              )}`}
            >
              {tag}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
