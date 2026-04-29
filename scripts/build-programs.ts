/**
 * data/sources/official/ + data/sources/fan-guide/ をマージして
 * data/programs.json を生成する。
 *
 * 実行: npm run build:programs
 *       自動: prebuild フックで毎回実行
 *
 * 設計:
 * - official.json （公式自動取得）と fan-guide.json （手動執筆）を ID で突合
 * - どちらかが欠けている ID は警告を出すが、ビルドは続行（部分公開も可能）
 * - 出力 programs.json は zod スキーマで最終検証
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  OfficialSourceSchema,
  FanGuideSourceSchema,
  type OfficialSource,
  type FanGuideSource,
} from '../src/lib/sources';
import { ProgramSchema, ProgramsDataSchema, type Program } from '../src/lib/types';

const ROOT = process.cwd();
const OFFICIAL_DIR = join(ROOT, 'data/sources/official');
const FAN_GUIDE_DIR = join(ROOT, 'data/sources/fan-guide');
const OUTPUT_PATH = join(ROOT, 'data/programs.json');

function loadSources<T>(
  dir: string,
  parser: (input: unknown) => T,
  label: string
): Map<string, T> {
  const result = new Map<string, T>();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.warn(`⚠️ ${label} ディレクトリが空: ${dir}`);
    return result;
  }
  const files = readdirSync(dir).filter((f) => /^pcwe-\d{3}\.json$/.test(f));
  for (const file of files) {
    const id = file.replace('.json', '');
    try {
      const raw = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
      result.set(id, parser(raw));
    } catch (error) {
      console.error(`❌ ${file} の読み込みに失敗`, error);
      throw error;
    }
  }
  return result;
}

function mergeProgram(official: OfficialSource, fanGuide: FanGuideSource): Program {
  return {
    id: official.id,
    name: official.name,
    shortName: official.shortName,
    thumbnail: official.thumbnail,
    boothUrl: official.boothUrl,
    official: official.official,
    exhibition: official.exhibition,
    links: official.links,
    fanGuide: fanGuide.fanGuide,
  };
}

function main(): void {
  console.log('🔨 programs.json を生成中...');

  const officials = loadSources(OFFICIAL_DIR, (raw) => OfficialSourceSchema.parse(raw), '公式情報');
  const fanGuides = loadSources(FAN_GUIDE_DIR, (raw) => FanGuideSourceSchema.parse(raw), 'ファンガイド');

  // 突合: 両方ある ID のみマージ
  const programs: Program[] = [];
  const onlyOfficial: string[] = [];
  const onlyFanGuide: string[] = [];

  for (const id of officials.keys()) {
    if (fanGuides.has(id)) {
      const merged = mergeProgram(officials.get(id) as OfficialSource, fanGuides.get(id) as FanGuideSource);
      programs.push(ProgramSchema.parse(merged));
    } else {
      onlyOfficial.push(id);
    }
  }
  for (const id of fanGuides.keys()) {
    if (!officials.has(id)) onlyFanGuide.push(id);
  }

  // 並び順: ID 昇順
  programs.sort((a, b) => a.id.localeCompare(b.id));

  if (onlyOfficial.length > 0) {
    console.warn(`⚠️ 公式情報あり / ファンガイド未執筆: ${onlyOfficial.join(', ')}`);
  }
  if (onlyFanGuide.length > 0) {
    console.warn(`⚠️ ファンガイドあり / 公式情報未取得: ${onlyFanGuide.join(', ')}`);
  }

  const output = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString().slice(0, 10),
    totalPrograms: programs.length,
    programs,
  };

  // 最終検証
  ProgramsDataSchema.parse(output);

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`✅ programs.json 生成完了: ${programs.length} 番組`);
}

main();
