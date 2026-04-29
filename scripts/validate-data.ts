/**
 * data/programs.json と data/genres.json をビルド前に検証する。
 *
 * 実行: `npm run validate-data`
 * Vercel ビルド前に CI で走らせるか、`npm run build` 前にローカルで実行する。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ProgramsDataSchema, GenresMapSchema } from '../src/lib/types';

function loadJson(relativePath: string): unknown {
  const fullPath = join(process.cwd(), relativePath);
  const raw = readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw);
}

function main(): void {
  console.log('🔍 データ検証を開始します');

  let hasError = false;

  // programs.json
  const programsRaw = loadJson('data/programs.json');
  const programsResult = ProgramsDataSchema.safeParse(programsRaw);
  if (!programsResult.success) {
    console.error('❌ data/programs.json の検証に失敗:');
    console.error(JSON.stringify(programsResult.error.format(), null, 2));
    hasError = true;
  } else {
    const { totalPrograms, programs } = programsResult.data;
    if (totalPrograms !== programs.length) {
      console.error(
        `❌ totalPrograms (${totalPrograms}) と programs 配列長 (${programs.length}) が不一致`
      );
      hasError = true;
    } else {
      console.log(`✅ programs.json OK: ${programs.length} 番組`);
    }
  }

  // genres.json
  const genresRaw = loadJson('data/genres.json');
  const genresResult = GenresMapSchema.safeParse(genresRaw);
  if (!genresResult.success) {
    console.error('❌ data/genres.json の検証に失敗:');
    console.error(JSON.stringify(genresResult.error.format(), null, 2));
    hasError = true;
  } else {
    console.log(`✅ genres.json OK: ${Object.keys(genresResult.data).length} ジャンル`);
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('✅ すべての検証に成功しました');
}

main();
