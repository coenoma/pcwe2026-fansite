/**
 * 物販詳細グループのリスト。**件数に応じてレイアウトを切り替える** 中核コンポーネント。
 *
 * 番組詳細ページ（booth/[id]）のメインセクションだけでなく、将来的にはマップピン
 * 押下時のポップアップでも使う想定で、見出しなど外側装飾を持たないピュアな
 * リスト UI として実装している。
 *
 * レイアウト仕様（件数別）:
 * - 1 件: 中央寄せ、`max-w-md`（≈ 28rem / 448px）
 *         → ワイド画面でも無理に広げず、1 枚物販の存在感を保つ
 * - 2 件: 中央寄せ、`max-w-3xl`、`md+` で 2 列
 *         → モバイルは縦並び、PC では並べて余白を活用
 * - 3 件以上: 既存の `md:2 / xl:3` レスポンシブグリッド（`max-w-6xl`）
 *
 * `layout` prop:
 * - 'grid' (default): 上記の件数別自動切り替え
 * - 'popup': マップポップアップ等の限定スペース向け（縦積みのみ、compact カード）
 */

import {
  MerchandiseGroupCard,
  groupMerchandiseDetails,
} from './MerchandiseGroupCard';
import type { MerchandiseDetail } from '@/lib/types';
import type { TweetMap } from '@/lib/tweet-cache';

interface Props {
  /** 構造化された物販詳細（X 投稿引用など）*/
  details: ReadonlyArray<MerchandiseDetail>;
  /** 表示レイアウト。'grid' は件数別自動切り替え、'popup' はコンパクト縦積み */
  layout?: 'grid' | 'popup';
  /** SSG で pre-fetch した X 投稿データ（compact mode 時に EmbeddedTweet に渡す）*/
  tweets?: TweetMap;
}

export function MerchandiseList({ details, layout = 'grid', tweets }: Props) {
  if (details.length === 0) return null;

  const groups = groupMerchandiseDetails(details);

  // popup レイアウト: マップポップアップ等の限定スペース向け
  if (layout === 'popup') {
    return (
      <div className="flex flex-col gap-3">
        {groups.map((group, i) => (
          <MerchandiseGroupCard key={i} group={group} compact tweets={tweets} />
        ))}
      </div>
    );
  }

  // grid レイアウト: 件数別に最適化
  const count = groups.length;

  if (count === 1) {
    // 1 件: 中央寄せの単一カード（max-w-md ≈ 28rem ≈ 448px）
    // ワイド画面でも 350px のスカスカ感を回避しつつ、3 列グリッドの 1 列分より大きく
    return (
      <div className="mx-auto max-w-md">
        <MerchandiseGroupCard group={groups[0]} />
      </div>
    );
  }

  if (count === 2) {
    // 2 件: モバイル 1 列 / md+ で 2 列、中央寄せ（max-w-3xl ≈ 48rem ≈ 768px）
    return (
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        {groups.map((group, i) => (
          <MerchandiseGroupCard key={i} group={group} />
        ))}
      </div>
    );
  }

  // 3 件以上: 既存のレスポンシブグリッド
  // breakpoint:
  //   ~768px (md 未満): 1 列
  //   768-1279px (md-xl): 2 列
  //   1280px+ (xl): 3 列
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group, i) => (
        <MerchandiseGroupCard key={i} group={group} />
      ))}
    </div>
  );
}
