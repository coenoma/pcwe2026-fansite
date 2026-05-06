/**
 * 142 番組の merchandiseTags / merchandiseSubTypes を自動付与する。
 *
 * 実行: npm run auto-tag-merchandise
 *
 * 設計:
 * - data/sources/official/pcwe-XXX.json の各番組について、
 *   merchandise[] + merchandiseDetails[].name + description を結合した文字列を作る
 * - キーワード辞書で部分一致タグ付与
 * - 結果を各 pcwe-XXX.json の official.merchandiseTags / merchandiseSubTypes に書き戻す
 *
 * ユーザー運用方針（Q6 確定）:
 * - 自動付与でリリース OK
 * - その後コエノマ運営が人間レビューで誤分類修正
 *
 * 詳細: docs/plans/v2-interactive-map/03-merchandise-taxonomy.md
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  OfficialSourceSchema,
  type OfficialSource,
} from '../src/lib/sources';
import type {
  MerchandiseTag,
  MerchandiseSubType,
} from '../src/lib/types';

const ROOT = process.cwd();
const OFFICIAL_DIR = join(ROOT, 'data/sources/official');

/**
 * 散策型向け 6 カテゴリのキーワード辞書。
 * 部分一致（lowercase 比較）でヒットしたら該当タグ付与。
 */
const TAG_RULES: Record<MerchandiseTag, ReadonlyArray<string>> = {
  'food-drink': [
    'コーヒー', 'カフェ', 'お茶', 'ハーブ', '茶', 'ジュース', 'ジェラート',
    'タレ', '焼肉', '薬膳', 'カレー', 'スープ', 'シロップ', 'ふりかけ',
    'お菓子', '菓子', 'クッキー', '酒', 'ワイン', '日本酒', 'コーラ',
    'トルティーヤ', 'グルメ', '飲', '食材', '本茶', 'ドリンク', 'コーヒー豆',
    '雑炊', 'チップス',
  ],
  experience: [
    '占い', 'タロット', '似顔絵', 'チェキ', 'ガチャ', 'おみくじ',
    'ワークショップ', '体験', '相談', '診断', '測定', 'カウンセリング',
    'スタンプラリー', '対戦', 'ゲーム', '実演', '撮影', 'スタンプ',
  ],
  'rare-curious': [
    '肌測定', 'AI 診断', '即興', '一点もの', '実演', '占い', 'タロット',
    '鑑定', '個人セッション', '魔法',
  ],
  'free-distribution': [
    '無料配布', 'ノベルティ', 'フリーペーパー', '先着', 'プレゼント',
    '配布物',
  ],
  'limited-new': [
    '限定', '新刊', '新作', '初販', '先行販売', 'NEW', '記念',
    '一品', '一点', 'PCWE 限定',
  ],
  'zine-book': [
    'ZINE', 'ジン', '書籍', '冊子', '雑誌', '漫画', 'リトルプレス',
    '同人誌', '読本', 'パンフ', 'マガジン',
  ],
};

/**
 * 詳細種別（参考表示用、フィルタ非表示）のキーワード辞書。
 * 自動付与のままで OK（精度ノイズ許容）。
 */
const SUBTYPE_RULES: Record<MerchandiseSubType, ReadonlyArray<string>> = {
  apparel: [
    'tシャツ', 'シャツ', 'パーカー', 'キャップ', '帽子', 'タオル',
    'バッグ', 'トート', 'エコバッグ', 'ポーチ', 'マフラー',
  ],
  'paper-stationery': [
    'ステッカー', 'シール', 'しおり', 'ポストカード', 'カード',
    'ペーパー', 'ノート', 'ペン', 'ボールペン', '便箋', 'ふせん',
    'メモ', 'カレンダー',
  ],
  'goods-acrylic': [
    'アクリル', 'アクキー', 'キーホルダー', '缶バッジ', 'バッチ',
    'ラバスト', 'ピンバッジ', 'マグネット', 'チャーム',
  ],
  'goods-tableware': [
    'マグカップ', 'タンブラー', 'コースター', 'グラス', '湯のみ',
  ],
  'audio-music': [
    'cd', 'ミュージックカード', 'usb', '音源', 'ダウンロード',
    'dvd', 'デモ', 'アルバム',
  ],
  'goods-misc': [
    '入浴剤', 'アロマ', '香り', '雑貨', 'ぬいぐるみ', 'クリアファイル',
  ],
};

/**
 * 番組の物販テキストを 1 つの文字列に結合する。
 * 大文字小文字統一済み。
 */
function collectText(src: OfficialSource): string {
  const parts: string[] = [];
  const off = src.official;
  if (off.merchandise) {
    parts.push(...off.merchandise);
  }
  if (off.merchandiseDetails) {
    for (const d of off.merchandiseDetails) {
      parts.push(d.name);
      if (d.description) parts.push(d.description);
    }
  }
  return parts.join(' ').toLowerCase();
}

function matchTags(
  text: string,
  rules: Record<string, ReadonlyArray<string>>,
): string[] {
  const matched = new Set<string>();
  for (const [tag, keywords] of Object.entries(rules)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        matched.add(tag);
        break;
      }
    }
  }
  return Array.from(matched).sort();
}

function main(): void {
  console.log('🏷  物販タグ自動付与を開始します');

  const files = readdirSync(OFFICIAL_DIR)
    .filter((f) => /^pcwe-\d{3}\.json$/.test(f))
    .sort();

  let updated = 0;
  let skipped = 0;
  const tagCounts: Record<string, number> = {};

  for (const file of files) {
    const path = join(OFFICIAL_DIR, file);
    const raw: unknown = JSON.parse(readFileSync(path, 'utf-8'));
    const result = OfficialSourceSchema.safeParse(raw);
    if (!result.success) {
      console.warn(`⚠️ ${file} は zod 検証失敗（スキップ）`);
      skipped += 1;
      continue;
    }
    const src = result.data;
    const text = collectText(src);

    if (text.trim().length === 0) {
      // 物販情報なし: タグ付与スキップ
      skipped += 1;
      continue;
    }

    const tags = matchTags(text, TAG_RULES) as MerchandiseTag[];
    const subTypes = matchTags(text, SUBTYPE_RULES) as MerchandiseSubType[];

    // 既存値を保持しつつ自動付与結果でマージ（人間レビュー後の修正値を上書きしないよう、
    // 完全に同じセットなら書き戻し不要）
    const existingTags = new Set(src.official.merchandiseTags ?? []);
    const newTags = new Set(tags);
    const tagsChanged =
      existingTags.size !== newTags.size ||
      [...newTags].some((t) => !existingTags.has(t));

    const existingSubTypes = new Set(src.official.merchandiseSubTypes ?? []);
    const newSubTypes = new Set(subTypes);
    const subTypesChanged =
      existingSubTypes.size !== newSubTypes.size ||
      [...newSubTypes].some((t) => !existingSubTypes.has(t));

    if (!tagsChanged && !subTypesChanged) {
      // 何も変わらないのでスキップ
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
      continue;
    }

    src.official.merchandiseTags = tags.length > 0 ? tags : undefined;
    src.official.merchandiseSubTypes = subTypes.length > 0 ? subTypes : undefined;

    writeFileSync(path, JSON.stringify(src, null, 2) + '\n', 'utf-8');
    updated += 1;
    for (const t of tags) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }

  console.log(`\n✅ 自動タグ付与完了`);
  console.log(`   更新: ${updated} 件 / スキップ: ${skipped} 件 / 全: ${files.length} 件`);
  console.log(`\n📊 カテゴリ別 番組数（merchandiseTags）:`);
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sortedTags) {
    console.log(`   ${count.toString().padStart(3)}  ${tag}`);
  }

  console.log(`\n💡 自動付与は叩き台です。人間レビューで誤分類を修正してください。`);
  console.log(`   設計書: docs/plans/v2-interactive-map/03-merchandise-taxonomy.md`);
}

main();
