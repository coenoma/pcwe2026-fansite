/**
 * data/booth-positions.json と data/programs.json の整合性を検証する。
 *
 * 実行: npm run validate-booth-positions
 *
 * チェック内容:
 * 1. booth-positions.json が zod スキーマに従う
 * 2. 各 slot の sat/sun に書かれた pcwe-XXX が programs.json に存在する
 * 3. 番組の exhibition.days と slot の sat/sun 出現が整合
 *    - days: ['sat'] なら slot.sat にあって slot.sun にない
 *    - days: ['sun'] なら slot.sun にあって slot.sat にない
 *    - days: ['sat', 'sun'] なら両方にある（同じ位置 or positionBySatSun）
 * 4. programs.json の全 142 番組が少なくとも 1 つの slot に配置されている
 * 5. 同じ pcwe-XXX が両日同じ position に居るか異なる position に居るか確認
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BoothPositionsDataSchema,
  ProgramsDataSchema,
  type Program,
} from '../src/lib/types';

const ROOT = process.cwd();

function main(): void {
  console.log('🔍 booth-positions.json と programs.json の整合性を検証します\n');

  let hasError = false;

  // データ読み込み + zod 検証
  const bpRaw: unknown = JSON.parse(
    readFileSync(join(ROOT, 'data/booth-positions.json'), 'utf-8'),
  );
  const bpResult = BoothPositionsDataSchema.safeParse(bpRaw);
  if (!bpResult.success) {
    console.error('❌ booth-positions.json の zod 検証に失敗:');
    console.error(JSON.stringify(bpResult.error.format(), null, 2));
    process.exit(1);
  }
  const bp = bpResult.data;
  console.log(`✅ booth-positions.json zod 検証 OK（${bp.tents.length} テント）`);

  const progRaw: unknown = JSON.parse(
    readFileSync(join(ROOT, 'data/programs.json'), 'utf-8'),
  );
  const progResult = ProgramsDataSchema.safeParse(progRaw);
  if (!progResult.success) {
    console.error('❌ programs.json の zod 検証に失敗');
    process.exit(1);
  }
  const programsById = new Map<string, Program>();
  for (const p of progResult.data.programs) {
    programsById.set(p.id, p);
  }
  console.log(`✅ programs.json zod 検証 OK（${programsById.size} 番組）\n`);

  // 配置情報を集約
  const placedPrograms = new Map<string, { sat?: string; sun?: string }>();
  let totalSlots = 0;
  let externalSlots = 0;

  for (const tent of bp.tents) {
    for (const slot of tent.slots) {
      totalSlots += 1;
      for (const day of ['sat', 'sun'] as const) {
        const programId = slot[day];
        if (programId !== null && programId !== undefined) {
          // pcwe-XXX が programs.json に存在するか
          if (!programsById.has(programId)) {
            console.error(
              `❌ slot ${slot.position} (${day}) の ${programId} が programs.json に存在しない`,
            );
            hasError = true;
            continue;
          }
          const placed = placedPrograms.get(programId) ?? {};
          placed[day] = slot.position;
          placedPrograms.set(programId, placed);
        }
        // external 参照（programs.json 未登録）は別カウント
        const ext = day === 'sat' ? slot.satExternal : slot.sunExternal;
        if (ext) {
          externalSlots += 1;
        }
      }
    }
  }
  console.log(`📍 確認: ${totalSlots} スロット / ${placedPrograms.size} 番組配置 / external ${externalSlots} 件\n`);

  // 配置 vs days の整合性
  let dayMismatch = 0;
  for (const [programId, placed] of placedPrograms) {
    const program = programsById.get(programId);
    if (!program) continue;
    const days = new Set(program.exhibition.days);
    if (days.has('sat') && placed.sat === undefined) {
      console.warn(`⚠️ ${programId} は days に sat 含むが、slot.sat に配置なし`);
      dayMismatch += 1;
    }
    if (!days.has('sat') && placed.sat !== undefined) {
      console.warn(`⚠️ ${programId} は days に sat 含まないが、slot.sat (${placed.sat}) に配置されている`);
      dayMismatch += 1;
    }
    if (days.has('sun') && placed.sun === undefined) {
      console.warn(`⚠️ ${programId} は days に sun 含むが、slot.sun に配置なし`);
      dayMismatch += 1;
    }
    if (!days.has('sun') && placed.sun !== undefined) {
      console.warn(`⚠️ ${programId} は days に sun 含まないが、slot.sun (${placed.sun}) に配置されている`);
      dayMismatch += 1;
    }
  }
  if (dayMismatch === 0) {
    console.log(`✅ 全 ${placedPrograms.size} 番組の出展日と slot 配置が整合\n`);
  } else {
    console.warn(`⚠️ days と slot 配置のミスマッチ: ${dayMismatch} 件\n`);
  }

  // 配置されていない番組
  const unplaced: Program[] = [];
  for (const p of programsById.values()) {
    if (!placedPrograms.has(p.id)) {
      unplaced.push(p);
    }
  }
  if (unplaced.length > 0) {
    console.warn(`⚠️ 配置されていない番組: ${unplaced.length} 件`);
    for (const p of unplaced) {
      console.warn(`   - ${p.id}: ${p.name} (days=${p.exhibition.days.join(',')})`);
    }
    console.warn('');
  } else {
    console.log(`✅ programs.json の全 ${programsById.size} 番組が配置済み\n`);
  }

  // 両日異なる位置に居る番組
  const differentDays: Array<{ id: string; sat: string; sun: string }> = [];
  for (const [id, placed] of placedPrograms) {
    if (
      placed.sat !== undefined &&
      placed.sun !== undefined &&
      placed.sat !== placed.sun
    ) {
      differentDays.push({ id, sat: placed.sat, sun: placed.sun });
    }
  }
  if (differentDays.length > 0) {
    console.log(`📌 両日で位置が異なる番組: ${differentDays.length} 件`);
    for (const d of differentDays) {
      console.log(`   - ${d.id}: 土 ${d.sat} / 日 ${d.sun}`);
    }
    console.log('');
  }

  // テント 30, 31, 32 の状態
  for (const tent of bp.tents) {
    if (tent.id >= 30) {
      const slotCount = tent.slots.length;
      const note = tent.note ?? '(note なし)';
      console.log(`📋 テント ${tent.id} (${tent.shape}): スロット ${slotCount} 件、${note}`);
    }
  }

  if (hasError) {
    console.error('\n❌ エラーがあります。修正してください。');
    process.exit(1);
  }
  console.log('\n✅ booth-positions.json の整合性チェック完了');
}

main();
