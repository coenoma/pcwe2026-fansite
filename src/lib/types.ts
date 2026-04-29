/**
 * PCWE2026 ファンサイトのドメイン型定義
 *
 * 設計書: /docs/plans/v1-mvp-launch/README.md
 * AGENTS.md: データ構造ガイドライン
 */

import { z } from 'zod';

// ====================
// 基本型
// ====================

/** 出展日（土・日・両日）*/
export const DaySchema = z.enum(['sat', 'sun']);
export type Day = z.infer<typeof DaySchema>;

/** エリア（無料・有料）*/
export const AreaSchema = z.enum(['free', 'paid']);
export type Area = z.infer<typeof AreaSchema>;

/** 番組らしさを演出するフォント（Google Fonts）*/
export const ThemeFontSchema = z.enum([
  'klee-one',          // 手書き温かみ
  'noto-serif-jp',     // 知的・落ち着き
  'rocknroll-one',     // 印象的・太字
  'dot-gothic-16',     // レトロ・遊び心
  'shippori-mincho',   // 上品・和
  'zen-kaku',          // ニュートラル現代
]);
export type ThemeFont = z.infer<typeof ThemeFontSchema>;

/** 番組の雰囲気（UI アクセントに使用）*/
export const VibeSchema = z.enum([
  'earnest',        // 誠実、論考型（俺思）
  'contemplative',  // 内省的（本茶本茶）
  'energetic',      // エネルギッシュ（ピスタチオパフェクラブ）
  'conversational', // 会話的、共感系（失敗から学ぶ）
  'intellectual',   // 知的（朝日新聞ポッドキャスト）
  'humorous',       // ユーモラス
  'laid-back',      // くつろいだ
]);
export type Vibe = z.infer<typeof VibeSchema>;

/** ジャンル（17 種、共通分類）*/
export const GenreSchema = z.enum([
  'カルチャー',
  '文芸・読書',
  '食',
  '映画',
  '音楽',
  '旅',
  '暮らし',
  '恋愛・ジェンダー',
  'ビジネス',
  'AI・テック',
  '子育て・教育',
  'ニュース・社会',
  '歴史',
  '科学・学問',
  'スポーツ',
  'コメディ',
  'その他',
]);
export type Genre = z.infer<typeof GenreSchema>;

// ====================
// 番組詳細スキーマ
// ====================

/** 公式ブースから抽出した情報 */
export const OfficialInfoSchema = z.object({
  description: z.string().min(1, '公式説明文は必須'),
  hosts: z.array(z.string()).optional(),
  merchandise: z.array(z.string()).optional(),
});
export type OfficialInfo = z.infer<typeof OfficialInfoSchema>;

/** 出展情報 */
export const ExhibitionSchema = z.object({
  days: z.array(DaySchema).min(1, '出展日は最低 1 日必須'),
  hours: z.string(),
  area: AreaSchema,
  boothNumber: z.string().regex(/^\d{3}$/, 'ブース番号は 3 桁'),
});
export type Exhibition = z.infer<typeof ExhibitionSchema>;

/** 配信プラットフォーム・SNS リンク */
export const LinksSchema = z.object({
  spotify: z.string().url().optional(),
  applePodcasts: z.string().url().optional(),
  youtube: z.string().url().optional(),
  listen: z.string().url().optional(),
  amazonMusic: z.string().url().optional(),
  x: z.string().url().optional(),
  instagram: z.string().url().optional(),
  website: z.string().url().optional(),
});
export type Links = z.infer<typeof LinksSchema>;

/** ファンガイド（コエノマ手書きキュレーション部分）*/
export const FanGuideSchema = z.object({
  catchphrase: z
    .string()
    .min(15, 'キャッチコピーは 15 字以上')
    .max(60, 'キャッチコピーは 60 字以内（推奨 30-50 字）'),
  subCatch: z
    .string()
    .min(10, 'サブキャッチは 10 字以上')
    .max(50, 'サブキャッチは 50 字以内（推奨 20-40 字）'),
  genre: GenreSchema,
  tags: z
    .array(z.string())
    .min(1, 'タグは最低 1 個')
    .max(6, 'タグは 6 個以内（推奨 3-5 個）'),
  targetListener: z
    .string()
    .min(20, 'ターゲットリスナーは 20 字以上')
    .max(120, 'ターゲットリスナーは 120 字以内（推奨 50-80 字）'),
  vibe: VibeSchema,
  /** 番組のテーマカラー（hex）。未指定なら vibe デフォルトを使用 */
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'themeColor は #RRGGBB 形式').optional(),
  /** 番組のテーマフォント。未指定なら vibe デフォルトを使用 */
  themeFont: ThemeFontSchema.optional(),
});
export type FanGuide = z.infer<typeof FanGuideSchema>;

/** 番組（最上位）*/
export const ProgramSchema = z.object({
  id: z.string().regex(/^pcwe-\d{3}$/, 'ID は pcwe-XXX 形式'),
  name: z.string().min(1, '番組名は必須'),
  shortName: z.string().optional(),
  thumbnail: z
    .string()
    .regex(/^\/thumbnails\/\d{3}\.(jpeg|jpg|png|webp)$/, '画像パスは /thumbnails/XXX.jpeg 形式'),
  boothUrl: z.string().url('公式 URL は必須'),
  official: OfficialInfoSchema,
  exhibition: ExhibitionSchema,
  links: LinksSchema,
  fanGuide: FanGuideSchema,
});
export type Program = z.infer<typeof ProgramSchema>;

/** 番組データ全体（programs.json のルート）*/
export const ProgramsDataSchema = z.object({
  version: z.string(),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'lastUpdated は YYYY-MM-DD'),
  totalPrograms: z.number().int().nonnegative(),
  programs: z.array(ProgramSchema),
});
export type ProgramsData = z.infer<typeof ProgramsDataSchema>;

// ====================
// ジャンルメタ情報
// ====================

/** ジャンルの UI メタ情報（lucide アイコン名 + Tailwind カラー）*/
export const GenreMetaSchema = z.object({
  icon: z.string(),
  accent: z.enum(['primary', 'amber', 'sky', 'emerald', 'neutral']),
});
export type GenreMeta = z.infer<typeof GenreMetaSchema>;

export const GenresMapSchema = z.record(GenreSchema, GenreMetaSchema);
export type GenresMap = z.infer<typeof GenresMapSchema>;
