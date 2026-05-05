/**
 * 物販詳細ロールアウトの進捗を集計し、
 * docs/plans/v1-merchandise-rollout/progress.md を自動生成する。
 *
 * 実行: npm run progress:merchandise
 *
 * 集計ロジック:
 * - data/programs.json を読み込み
 * - 各番組について merchandiseDetails の有無で done / not-yet を判定
 * - not-found.md の表から `pcwe-XXX` を抽出して not-found リストに加算
 * - 残りが pending（done でも not-found でもない番組）
 *
 * 出力: 集計表 + done リスト + pending リスト（X / IG / Web の有無付き）
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ProgramsDataSchema, type Program } from '../src/lib/types';

const ROOT = process.cwd();
const PROGRAMS_PATH = join(ROOT, 'data/programs.json');
const NOT_FOUND_PATH = join(ROOT, 'docs/plans/v1-merchandise-rollout/not-found.md');
const OUTPUT_PATH = join(ROOT, 'docs/plans/v1-merchandise-rollout/progress.md');

function loadPrograms(): readonly Program[] {
  const json = JSON.parse(readFileSync(PROGRAMS_PATH, 'utf8')) as unknown;
  const parsed = ProgramsDataSchema.parse(json);
  return parsed.programs;
}

/** not-found.md の表から `pcwe-XXX` を抽出する。シンプルに正規表現マッチで OK */
function loadNotFoundIds(): Set<string> {
  const md = readFileSync(NOT_FOUND_PATH, 'utf8');
  const ids = new Set<string>();
  // 表の各行から `| pcwe-XXX |` パターンを抽出
  const re = /\|\s*(pcwe-\d{3})\s*\|/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    ids.add(m[1]);
  }
  return ids;
}

interface ClassifiedProgram {
  id: string;
  name: string;
  hasX: boolean;
  hasInstagram: boolean;
  hasWebsite: boolean;
  detailsCount: number;
}

interface Summary {
  total: number;
  done: ClassifiedProgram[];
  notFound: ClassifiedProgram[];
  pending: ClassifiedProgram[];
}

function classify(programs: readonly Program[], notFoundIds: Set<string>): Summary {
  const done: ClassifiedProgram[] = [];
  const notFound: ClassifiedProgram[] = [];
  const pending: ClassifiedProgram[] = [];

  for (const p of programs) {
    const md = p.official.merchandiseDetails ?? [];
    const cp: ClassifiedProgram = {
      id: p.id,
      name: p.name,
      hasX: p.links.x !== undefined,
      hasInstagram: p.links.instagram !== undefined,
      hasWebsite: p.links.website !== undefined,
      detailsCount: md.length,
    };
    if (md.length > 0) {
      done.push(cp);
    } else if (notFoundIds.has(p.id)) {
      notFound.push(cp);
    } else {
      pending.push(cp);
    }
  }

  return { total: programs.length, done, notFound, pending };
}

function snsBadges(p: ClassifiedProgram): string {
  const parts: string[] = [];
  if (p.hasX) parts.push('X');
  if (p.hasInstagram) parts.push('IG');
  if (p.hasWebsite) parts.push('Web');
  return parts.length > 0 ? parts.join(' / ') : '—';
}

function formatProgressMd(summary: Summary): string {
  const { total, done, notFound, pending } = summary;
  const handled = done.length + notFound.length;
  const pct = ((handled / total) * 100).toFixed(1);

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const lines: string[] = [];
  lines.push('# 物販ロールアウト 進捗レポート');
  lines.push('');
  lines.push(`> このファイルは \`npm run progress:merchandise\` で自動生成されます。手で編集しないでください。`);
  lines.push(`> 最終更新: ${stamp}`);
  lines.push('');

  lines.push('## サマリ');
  lines.push('');
  lines.push('| 状態 | 件数 | 割合 |');
  lines.push('|---|---:|---:|');
  lines.push(`| ✅ 完了（merchandiseDetails あり） | ${done.length} | ${((done.length / total) * 100).toFixed(1)}% |`);
  lines.push(`| 🔎 取得不可（not-found.md 記載） | ${notFound.length} | ${((notFound.length / total) * 100).toFixed(1)}% |`);
  lines.push(`| ⏳ 未着手（pending） | ${pending.length} | ${((pending.length / total) * 100).toFixed(1)}% |`);
  lines.push(`| **着手済 (done + not-found)** | **${handled} / ${total}** | **${pct}%** |`);
  lines.push('');

  // pending を SNS の有無で内訳
  const pX = pending.filter((p) => p.hasX).length;
  const pIg = pending.filter((p) => p.hasInstagram && !p.hasX).length;
  const pWeb = pending.filter((p) => p.hasWebsite && !p.hasX && !p.hasInstagram).length;
  const pNone = pending.filter((p) => !p.hasX && !p.hasInstagram && !p.hasWebsite).length;
  lines.push('### 未着手の内訳（探索手段別）');
  lines.push('');
  lines.push('| 手段 | 件数 |');
  lines.push('|---|---:|');
  lines.push(`| X 公式アカウントあり（最優先） | ${pX} |`);
  lines.push(`| IG のみ | ${pIg} |`);
  lines.push(`| Web のみ | ${pWeb} |`);
  lines.push(`| SNS なし（即 not-found 候補） | ${pNone} |`);
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## ✅ 完了（merchandiseDetails あり）');
  lines.push('');
  if (done.length === 0) {
    lines.push('（まだありません）');
  } else {
    lines.push('| ID | 番組名 | 件数 |');
    lines.push('|---|---|---:|');
    for (const p of done) {
      lines.push(`| ${p.id} | ${p.name} | ${p.detailsCount} |`);
    }
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## 🔎 取得不可（not-found）');
  lines.push('');
  lines.push(`詳細は [not-found.md](./not-found.md) 参照。ここでは ID と番組名のみ。`);
  lines.push('');
  if (notFound.length === 0) {
    lines.push('（まだありません）');
  } else {
    lines.push('| ID | 番組名 | SNS |');
    lines.push('|---|---|---|');
    for (const p of notFound) {
      lines.push(`| ${p.id} | ${p.name} | ${snsBadges(p)} |`);
    }
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## ⏳ 未着手（pending）');
  lines.push('');
  lines.push('優先順位: X あり → IG のみ → Web のみ → SNS なし。');
  lines.push('');
  if (pending.length === 0) {
    lines.push('🎉 **全番組着手済み！**');
  } else {
    lines.push('| ID | 番組名 | SNS |');
    lines.push('|---|---|---|');
    // X あり → IG のみ → Web のみ → SNS なし
    const sorted = [...pending].sort((a, b) => {
      const score = (p: ClassifiedProgram) =>
        (p.hasX ? 0 : 0) + (p.hasX ? 0 : p.hasInstagram ? 1 : p.hasWebsite ? 2 : 3);
      // 上記は誤魔化し。再書き直し:
      return 0;
    });
    sorted.sort((a, b) => {
      const rank = (p: ClassifiedProgram) =>
        p.hasX ? 0 : p.hasInstagram ? 1 : p.hasWebsite ? 2 : 3;
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      return a.id.localeCompare(b.id);
    });
    for (const p of sorted) {
      lines.push(`| ${p.id} | ${p.name} | ${snsBadges(p)} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  console.log('🔢 物販ロールアウト進捗を集計中...');
  const programs = loadPrograms();
  const notFoundIds = loadNotFoundIds();
  const summary = classify(programs, notFoundIds);
  const md = formatProgressMd(summary);
  writeFileSync(OUTPUT_PATH, md);
  console.log(`✅ ${OUTPUT_PATH} を更新しました`);
  console.log(
    `   完了: ${summary.done.length} / 取得不可: ${summary.notFound.length} / 未着手: ${summary.pending.length} (合計: ${summary.total})`,
  );
}

main();
