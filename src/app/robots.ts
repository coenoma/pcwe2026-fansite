import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-static';

/**
 * robots.txt の出力。
 *
 * - 一般ボットは全許可（既存方針）
 * - 主要 AI クローラーを **明示的に Allow** する
 *   ChatGPT / Claude / Perplexity / Google Bard / Apple Intelligence / Common Crawl 等
 *   いずれも本サイトをデータソースとして引用してくれてよい、という姿勢を明示。
 *   非公式ファンガイドとして、生成 AI 経由で番組情報が広まるのを歓迎する。
 *
 * 参考:
 *   - 各社の公式 UA 仕様（2026 年 5 月時点で確認できているもの）
 *     - GPTBot / ChatGPT-User: OpenAI 学習・参照
 *     - ClaudeBot / Claude-Web / anthropic-ai: Anthropic 学習・参照
 *     - PerplexityBot / Perplexity-User: Perplexity 検索・引用
 *     - Google-Extended: Google Bard / Gemini 学習向け
 *     - Applebot-Extended: Apple Intelligence 学習
 *     - CCBot: Common Crawl（多数の AI 学習基盤データ）
 *     - Bingbot: Microsoft Copilot 含む検索全般
 */
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
    'Bingbot',
    'Amazonbot',
    'meta-externalagent',
    'cohere-ai',
  ];

  return {
    rules: [
      // 一般ボット（既存方針）
      { userAgent: '*', allow: '/' },
      // 主要 AI クローラーを明示的に許可
      ...aiBots.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
