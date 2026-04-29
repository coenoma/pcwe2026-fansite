/**
 * Jest 設定（next/jest ベース）
 *
 * - SWC で TypeScript / TSX を高速変換
 * - lib/ の純粋関数中心なので default は node 環境
 * - localStorage を使うテスト（favorites）のみファイル先頭で
 *   `@jest-environment jsdom` を指定して上書きする
 * - tsconfig の `@/*` パスを moduleNameMapper で解決
 */

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // next.config.* と .env を読み込む基準ディレクトリ
  dir: './',
});

const customConfig: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],
  // node_modules / .next / fixtures は対象外
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/src/__tests__/fixtures',
  ],
  clearMocks: true,
};

// next/jest が返す関数で wrapping することで Next.js の transform 設定が乗る
export default createJestConfig(customConfig);
