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
import {
  BoothPositionsDataSchema,
  ProgramSchema,
  ProgramsDataSchema,
  type BoothPosition,
  type Program,
} from '../src/lib/types';

const ROOT = process.cwd();
const OFFICIAL_DIR = join(ROOT, 'data/sources/official');
const FAN_GUIDE_DIR = join(ROOT, 'data/sources/fan-guide');
const BOOTH_POSITIONS_PATH = join(ROOT, 'data/booth-positions.json');
const OUTPUT_PATH = join(ROOT, 'data/programs.json');

/**
 * booth-positions.json から、各 program ID ごとの sat/sun 物理位置を取り出して
 * { 'pcwe-002': { sat: '11-B', sun: '11-B' }, ... } の形式で返す。
 * 両日同位置 → exhibition.position に正規化。両日異位置 → positionBySatSun に。
 */
function loadBoothPositions(): Map<string, { sat?: BoothPosition; sun?: BoothPosition }> {
  const result = new Map<string, { sat?: BoothPosition; sun?: BoothPosition }>();
  if (!existsSync(BOOTH_POSITIONS_PATH)) {
    console.warn(`⚠️ booth-positions.json が見つからない（マップ機能用、Phase 1 で追加）`);
    return result;
  }
  const raw: unknown = JSON.parse(readFileSync(BOOTH_POSITIONS_PATH, 'utf-8'));
  const data = BoothPositionsDataSchema.parse(raw);

  for (const tent of data.tents) {
    for (const slot of tent.slots) {
      const position: BoothPosition = {
        tent: tent.id,
        ...(slot.slot ? { slot: slot.slot } : {}),
        label: slot.position,
      };
      for (const day of ['sat', 'sun'] as const) {
        const programId = slot[day];
        if (programId !== null && programId !== undefined) {
          const existing = result.get(programId) ?? {};
          // 同じ番組が複数位置に居る場合は **最初に見つかった位置** を採用
          // （メインブースを優先する想定。例: まかないラジオは 26-B 日 + 32 日 両方居るが、
          //   tents 配列の id 順で 26 が先なので 26-B が exhibition.position に注入される）
          if (existing[day] === undefined) {
            existing[day] = position;
            result.set(programId, existing);
          }
        }
      }
    }
  }
  return result;
}

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

function mergeProgram(
  official: OfficialSource,
  fanGuide: FanGuideSource,
  positions: { sat?: BoothPosition; sun?: BoothPosition } | undefined,
): Program {
  // 物理位置を exhibition に注入
  // 両日同位置 → position（単一）、両日異位置 → positionBySatSun
  let exhibitionWithPosition = official.exhibition;
  if (positions !== undefined) {
    const samePosition =
      positions.sat !== undefined &&
      positions.sun !== undefined &&
      positions.sat.label === positions.sun.label;
    if (samePosition && positions.sat) {
      exhibitionWithPosition = {
        ...exhibitionWithPosition,
        position: positions.sat,
      };
    } else if (positions.sat !== undefined || positions.sun !== undefined) {
      exhibitionWithPosition = {
        ...exhibitionWithPosition,
        positionBySatSun: {
          ...(positions.sat ? { sat: positions.sat } : {}),
          ...(positions.sun ? { sun: positions.sun } : {}),
        },
      };
    }
  }

  return {
    id: official.id,
    name: official.name,
    shortName: official.shortName,
    thumbnail: official.thumbnail,
    boothUrl: official.boothUrl,
    official: official.official,
    exhibition: exhibitionWithPosition,
    links: official.links,
    fanGuide: fanGuide.fanGuide,
    recommendedEpisode: official.recommendedEpisode,
  };
}

function main(): void {
  console.log('🔨 programs.json を生成中...');

  const officials = loadSources(OFFICIAL_DIR, (raw) => OfficialSourceSchema.parse(raw), '公式情報');
  const fanGuides = loadSources(FAN_GUIDE_DIR, (raw) => FanGuideSourceSchema.parse(raw), 'ファンガイド');
  const boothPositions = loadBoothPositions();
  if (boothPositions.size > 0) {
    console.log(`📍 booth-positions.json から ${boothPositions.size} 番組の物理位置を読み込み`);
  }

  // 突合: 両方ある ID のみマージ
  const programs: Program[] = [];
  const onlyOfficial: string[] = [];
  const onlyFanGuide: string[] = [];

  for (const id of officials.keys()) {
    if (fanGuides.has(id)) {
      const merged = mergeProgram(
        officials.get(id) as OfficialSource,
        fanGuides.get(id) as FanGuideSource,
        boothPositions.get(id),
      );
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
