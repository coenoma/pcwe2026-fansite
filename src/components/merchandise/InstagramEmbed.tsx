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
  // `/embed/captioned/` でキャプション本文（説明欄）を含む長尺レイアウトに。
  // 標準の `/embed/` は画像のみで本文が出ず物足りないため、こちらを採用。
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  // captioned は画像 + プロフィール + キャプション本文 + コメント数 で縦長になる。
  // 投稿によって高さが大きく変わるため、十分な高さを確保しつつ iframe 内スクロール
  // でフォールバック可能にする（ユーザー指示「キルする必要なしスクロールで OK」）。
  // - 通常: 1100px（番組詳細ページの広い枠で全部見える想定）
  // - compact（マップポップアップ）: 800px（モーダル全体の縦圧迫を抑え、足りない分は内部スクロール）
  const iframeHeight = height ?? (compact ? 800 : 1100);

  return (
    <iframe
      src={embedUrl}
      title="Instagram 投稿"
      width="100%"
      height={iframeHeight}
      loading="lazy"
      // 高さに収まらない場合は iframe 内でスクロール可能に
      scrolling="auto"
      style={{ border: 0 }}
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
