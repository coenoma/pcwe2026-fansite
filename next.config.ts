import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 親ディレクトリの package-lock.json による誤検出を防ぐ
  outputFileTracingRoot: __dirname,

  // 静的生成（SSG）を強制
  output: 'export',

  // Image 最適化（静的エクスポートでは loader: custom 必要）
  images: {
    unoptimized: true, // SSG なので Next.js Image 最適化は無効
  },

  // 末尾スラッシュを統一（Vercel 互換）
  trailingSlash: false,
};

export default nextConfig;
