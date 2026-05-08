/**
 * Instagram 投稿埋め込みコンポーネント。
 *
 * Instagram 公式の `/embed/` URL を iframe で埋め込む方式を採用。
 * - 公式 oEmbed API は廃止されたため、独自スクリプト（react-instagram-embed 等）に
 *   依存せず iframe 直接埋め込みでシンプルに済ませる
 * - X 投稿（react-tweet 経由）と並列の体験を意図、サイズ感も合わせる
 *
 * shortcode 抽出は p / reel / tv パスを許容（リールや IGTV にも対応）。
 *
 * CSP 上の前提:
 * - vercel.json の frame-src に `https://www.instagram.com https://*.instagram.com` 必須
 * - img-src に `https://*.cdninstagram.com https://*.fbcdn.net` を加えておくと
 *   フォールバックや SSR 表示時にも画像が出る（iframe 内は CSP 無関係だが念のため）
 *
 * このコンポーネントは状態を持たず純粋に iframe を返すだけのため Server Component
 * として実装。`extractInstagramShortcode` も Server / Client 双方から呼べる純粋関数。
 */

interface Props {
  /** Instagram 投稿 URL（例: https://www.instagram.com/p/SHORTCODE/）*/
  url: string;
  /** 限られたスペース向けの圧縮表示モード（マップポップアップ等） */
  compact?: boolean;
  /** iframe の高さを直接指定したい場合（compact 設定より優先） */
  height?: number;
}

export function InstagramEmbed({ url, compact = false, height }: Props) {
  const shortcode = extractInstagramShortcode(url);
  if (shortcode === null) {
    return null;
  }
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
  // 標準的な Instagram 埋め込みは縦長のフィード型: 600px 程度がデフォルト、
  // compact だと少し短くしてポップアップ内の縦圧迫を避ける
  const iframeHeight = height ?? (compact ? 540 : 640);

  return (
    <iframe
      src={embedUrl}
      title="Instagram 投稿"
      width="100%"
      height={iframeHeight}
      loading="lazy"
      // 投稿内のスクロール（複数枚画像のページネーション）を許可
      scrolling="no"
      // 内部の余白を Instagram 側で制御するため、独自の枠は付けない
      style={{ border: 0, overflow: 'hidden' }}
      className="block w-full rounded-xl bg-white"
      allow="encrypted-media; clipboard-write"
    />
  );
}

/**
 * Instagram URL から shortcode（投稿の短い ID）を抽出する。
 *
 * 対応 URL 形式:
 * - https://www.instagram.com/p/SHORTCODE/
 * - https://www.instagram.com/reel/SHORTCODE/
 * - https://www.instagram.com/tv/SHORTCODE/
 * - 末尾スラッシュ・クエリ文字列の有無いずれも OK
 */
export function extractInstagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}
