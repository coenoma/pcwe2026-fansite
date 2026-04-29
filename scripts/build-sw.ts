/**
 * Service Worker のビルド時バージョニング
 *
 * `public/sw.template.js` を読み、`__BUILD_ID__` を一意な ID に置換して
 * `public/sw.js` を生成する。
 *
 * ID は次の優先順位:
 *   1. 環境変数 VERCEL_GIT_COMMIT_SHA（Vercel ビルド時に自動設定）
 *   2. 環境変数 GITHUB_SHA（GitHub Actions）
 *   3. ローカル git の HEAD コミット hash
 *   4. Date.now()（ローカル開発時のフォールバック）
 *
 * `prebuild` フックで `npm run build` の前に実行される。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

function getBuildId(): string {
  if (typeof process.env.VERCEL_GIT_COMMIT_SHA === 'string' && process.env.VERCEL_GIT_COMMIT_SHA.length > 0) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
  }
  if (typeof process.env.GITHUB_SHA === 'string' && process.env.GITHUB_SHA.length > 0) {
    return process.env.GITHUB_SHA.slice(0, 12);
  }
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    if (sha.length > 0) return sha.slice(0, 12);
  } catch {
    // git が無い / リポジトリ外（fallthrough）
  }
  return `local-${Date.now()}`;
}

function main(): void {
  const root = process.cwd();
  const templatePath = join(root, 'public/sw.template.js');
  const outputPath = join(root, 'public/sw.js');
  const buildId = getBuildId();

  const template = readFileSync(templatePath, 'utf-8');
  const generated = template.replace(/__BUILD_ID__/g, buildId);

  writeFileSync(outputPath, generated, 'utf-8');
  console.log(`✅ Service Worker を生成しました（CACHE_VERSION=${buildId}）`);
}

main();
