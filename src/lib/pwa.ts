/**
 * PWA インストール プロモ用の環境判定（純粋関数のみ）
 *
 * - SSR 互換: window 参照は呼び出し側で useEffect 内に閉じ込める
 * - UserAgent ベースの分類は不確実性が常にあるため、
 *   絶対判定 ではなく「どのフローを案内するか」のヒューリスティクスとして使う
 */

/**
 * インストール プロモを出し分けるためのプラットフォーム種別
 *
 * - `desktop-chromium`: Chrome / Edge / Brave / Opera 等。beforeinstallprompt が使える
 * - `desktop-safari`:   macOS Safari。Sonoma 以降は「Dock に追加」可能だが API は無い
 * - `desktop-firefox`:  Firefox（PWA インストール非対応・案内も出さない）
 * - `android`:          Android Chrome / Edge / Samsung Internet 等
 * - `ios`:              iOS / iPadOS Safari（および同 OS の Chrome 等。WebKit ベース）
 * - `in-app-webview`:   Twitter/X、Instagram、Facebook、LINE などのアプリ内 WebView。
 *                       インストール不可なので「ブラウザで開く」案内に留める
 * - `other`:            判定不能 / プロモを出さない
 */
export type Platform =
  | 'desktop-chromium'
  | 'desktop-safari'
  | 'desktop-firefox'
  | 'android'
  | 'ios'
  | 'in-app-webview'
  | 'other';

/**
 * UA からプラットフォームを推定する純粋関数。
 * テスト時は任意の UA 文字列を直接渡す（ブラウザ環境依存ロジックを含めない）。
 */
export function detectPlatform(ua: string): Platform {
  // 1. アプリ内 WebView を最優先で識別（PWA 不可 → 案内も出さない）
  //    主要な日本語圏 SNS / メッセンジャー の WebView UA パターンを網羅
  const inApp =
    /\bTwitter\b|\bFBAN\b|\bFBAV\b|FB_IAB|\bInstagram\b|\bLine\/|\bMicroMessenger\b|\bKAKAOTALK\b/i;
  if (inApp.test(ua)) return 'in-app-webview';

  // 2. iOS / iPadOS（Safari 以外のブラウザも WebKit ベース、扱いは同じ）
  //    iPadOS 13+ は UA が Macintosh を返すこともあるので別途タッチ判定で補完したいが、
  //    純粋関数化のため UA のみで判定（過検出は許容）
  const isIos = /iPad|iPhone|iPod/.test(ua);
  if (isIos) return 'ios';

  // 3. Android（PWA インストール フローはほぼ Chromium 互換）
  if (/Android/.test(ua)) return 'android';

  // 4. デスクトップ判定
  //    Chromium 系（Edge / Opera / Brave / Vivaldi 等含む）
  const isChromium =
    /Edg\//.test(ua) || /OPR\//.test(ua) || /Brave\//.test(ua) || /Vivaldi\//.test(ua) || /Chrome\//.test(ua);
  if (isChromium && !/Mobile/.test(ua)) return 'desktop-chromium';

  // 5. デスクトップ Safari（Chrome を含む UA に注意）
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua)) {
    return 'desktop-safari';
  }

  // 6. Firefox
  if (/Firefox\//.test(ua) || /FxiOS/.test(ua)) return 'desktop-firefox';

  return 'other';
}

/**
 * すでにスタンドアロン（PWA としてインストール済み）で開かれているか。
 * これが true のときは絶対にインストール プロモを出さない。
 *
 * - 標準 (Chromium / Android): display-mode media query
 * - iOS Safari: navigator.standalone（独自プロパティ）
 */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;

  // iOS Safari の独自フラグ
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;

  return false;
}
