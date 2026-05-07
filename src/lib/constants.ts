/**
 * PCWE2026 ファンサイト 共通定数
 */

// ====================
// イベント情報
// ====================

/**
 * 本サイトの主役イベントは「PODCAST WEEKEND 2026」（PODCAST EXPO 2026 内の
 * マーケットイベント = 142 番組の出展ブース）。
 * 傘イベントとして「PODCAST EXPO 2026」、英表記の他に「ポッドキャストウィークエンド」
 * 「ポッドキャストエキスポ」のカタカナ表記もあり、検索流入の対象。
 */
export const EVENT = {
  /** メイン名称（本サイトの軸）*/
  name: 'PODCAST WEEKEND 2026',
  /** 傘イベントの名称 */
  parentName: 'PODCAST EXPO 2026',
  /** 略称 */
  shortName: 'PCWE2026',
  /** 別名（カタカナ表記・傘イベント・略称など、構造化データ alternateName に使う）*/
  alternateNames: [
    'ポッドキャストウィークエンド 2026',
    'ポッドキャストウィークエンド2026',
    'PODCAST EXPO 2026',
    'ポッドキャストエキスポ 2026',
    'ポッドキャストエキスポ2026',
    'PCWE2026',
  ],
  startDate: '2026-05-09',
  endDate: '2026-05-10',
  hours: '10:30 - 19:00',
  venue: 'HOME/WORK VILLAGE',
  venueAddress: '東京都世田谷区池尻 2-4-5',
  venueAccess: '東急田園都市線 池尻大橋駅 徒歩 10 分',
  officialUrl: 'https://podcastexpo.jp/',
  /**
   * EXPO TV powered by LISTEN（公式ライブ配信）
   * 無料エリア = PODCAST WEEKEND / 企業ブースの熱気を 2 日間ライブ配信。
   * （現時点では告知記事 URL。配信本体 URL は当日切り替え予定）
   */
  expoTvUrl:
    'https://listen.style/blog/24/%E3%80%90%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B%E3%80%91Podcast%20Expo%202026%20%E5%85%AC%E5%BC%8F%E3%83%A9%E3%82%A4%E3%83%96%E3%80%8CEXPO%20TV%E3%80%8D%E3%82%92LISTEN%E3%81%8C%E5%85%A8%E9%9D%A2%E3%83%97%E3%83%AD%E3%83%87%E3%83%A5%E3%83%BC%E3%82%B9%E3%81%97%E3%81%BE%E3%81%99%EF%BC%81',
  expoTvName: 'EXPO TV powered by LISTEN',
} as const;

// ====================
// 番組数（programs.json 由来、ハードコードしないための定数）
// ====================

/**
 * 全出展番組数（programs.json の totalPrograms と一致させる）。
 *
 * 当初の公式 142 番組 + 後追加 3 番組（PodWalker / まかないラジオ / アイデア刺激法 〜どう？〜）
 * = 145 番組
 *
 * scripts/build-programs.ts で programs.json 生成時に検証され、
 * 値が変わったらここも更新する運用。
 */
export const TOTAL_PROGRAMS = 145;

// ====================
// サイトメタ情報
// ====================

export const SITE = {
  name: 'PCWE2026 ファンガイド（非公式）',
  description: `PODCAST WEEKEND 2026（ポッドキャストウィークエンド／PODCAST EXPO 2026 内のマーケットイベント）の出展 ${TOTAL_PROGRAMS} 番組から、あなたに「刺さる 1 本」を見つける非公式ファンガイド。キャッチコピー・タグ・ジャンルで当日が楽しみになる。`,
  url: 'https://pcwe2026-fansite.podmate.fm',
  ogImage: '/ogp.png',
  twitterHandle: '@yuto_podmate',
  unofficialNotice:
    '※ 本サイトは PODCAST WEEKEND / PODCAST EXPO 2026 公式とは無関係のファンサイトです（制作・運営: 合同会社コエノマ）',
} as const;

// ====================
// 運用フォーム URL（環境変数から）
// ====================

/**
 * 掲載取り下げ依頼フォーム URL
 * 番組制作者本人からの削除依頼を受け付ける
 */
export const FORM_TAKEDOWN_URL = process.env.NEXT_PUBLIC_FORM_TAKEDOWN_URL ?? '';

/**
 * 情報修正・追加依頼フォーム URL
 * 番組制作者・リスナーからの修正依頼を受け付ける
 */
export const FORM_FIX_URL = process.env.NEXT_PUBLIC_FORM_FIX_URL ?? '';

// ====================
// アクセス解析
// ====================

/**
 * Google Analytics 4 の Measurement ID
 * 例: G-XXXXXXXXXX
 *
 * - 未設定（空文字）なら GA タグは一切出力されない
 * - 本番環境（NODE_ENV === 'production'）でのみ動作
 * - Vercel Production 環境変数に設定する想定
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

// ====================
// 制作者情報
// ====================

export const CREATOR = {
  company: '合同会社コエノマ',
  /** 個人名（敬称・肩書きなし）*/
  representative: 'ゆと',
  /** 肩書き付きの自己紹介（フッター・About 等で使用）*/
  representativeLabel: 'コエノマ代表 / Podmate 運営: ゆと',
  twitterHandle: '@yuto_podmate',
  twitterUrl: 'https://x.com/yuto_podmate',
  serviceName: 'Podmate',
  serviceUrl: 'https://podmate.fm',
} as const;
