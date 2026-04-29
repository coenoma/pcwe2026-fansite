/**
 * PCWE2026 ファンサイト 共通定数
 */

// ====================
// イベント情報
// ====================

export const EVENT = {
  name: 'PODCAST EXPO 2026',
  shortName: 'PCWE2026',
  startDate: '2026-05-09',
  endDate: '2026-05-10',
  hours: '10:30 - 19:00',
  venue: 'HOME/WORK VILLAGE',
  venueAddress: '東京都世田谷区池尻 2-4-5',
  venueAccess: '東急田園都市線 池尻大橋駅 徒歩 10 分',
  officialUrl: 'https://podcastexpo.jp/',
} as const;

// ====================
// サイトメタ情報
// ====================

export const SITE = {
  name: 'PCWE2026 ファンガイド（非公式）',
  description:
    'PODCAST EXPO 2026 を 120% 楽しむ、非公式ファンガイド。144 番組から「これ刺さる」を探す。',
  url: 'https://pcwe2026-fansite.podmate.fm',
  ogImage: '/ogp.png',
  twitterHandle: '@yuto_podmate',
  unofficialNotice:
    '※ 本サイトは PODCAST EXPO 2026 公式とは無関係のファンメイドです（制作: 合同会社コエノマ）',
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
// 制作者情報
// ====================

export const CREATOR = {
  company: '合同会社コエノマ',
  founder: 'ゆと',
  twitterHandle: '@yuto_podmate',
  twitterUrl: 'https://x.com/yuto_podmate',
  serviceName: 'Podmate',
  serviceUrl: 'https://podmate.fm',
} as const;
