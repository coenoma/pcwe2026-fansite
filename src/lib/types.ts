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

/**
 * 物販グッズの情報源タイプ。
 *
 * - x-post / instagram-post: SNS 投稿（個別 URL）
 * - official-booth: PCWE 公式ブースページ（podcastexpo.jp）
 * - official-site: 番組公式サイト or ホスト個人サイト
 * - note: note 記事
 * - web: その他 web ページ
 */
export const MerchandiseSourceTypeSchema = z.enum([
  'x-post',
  'instagram-post',
  'official-booth',
  'official-site',
  'note',
  'web',
]);
export type MerchandiseSourceType = z.infer<typeof MerchandiseSourceTypeSchema>;

/**
 * 物販グッズの詳細情報。
 *
 * 1 つのグッズにつき 1 エントリ。1 投稿に画像で複数グッズが写っている場合でも、
 * グッズごとに別エントリを作って同じ sourceUrl / imageUrl を共有する。
 */
/**
 * 補助的な情報源（同一物販に対して複数の参照を持ちたいケース用）。
 * 例: 1 つの物販を異なるツイート（写真詳細・価格紹介・予約フォーム告知）の
 *     それぞれが補強しているとき、メイン sourceUrl 1 つに加えて
 *     additionalSources でリンクを並べる。
 */
export const MerchandiseAdditionalSourceSchema = z.object({
  url: z.string().url(),
  type: MerchandiseSourceTypeSchema,
  /** 表示ラベル（例: "予約フォーム", "サイズ詳細"）。未指定なら type ベースの
   *  ラベル（"X 投稿" 等）が使われる */
  label: z.string().optional(),
});
export type MerchandiseAdditionalSource = z.infer<
  typeof MerchandiseAdditionalSourceSchema
>;

export const MerchandiseDetailSchema = z.object({
  /** グッズ名（例: "オリジナルロゴステッカー"） */
  name: z.string().min(1),
  /** 補足（価格、限定数、配布タイミング等） */
  description: z.string().optional(),
  /** メイン情報源 URL（必須）。X 投稿なら埋め込み、それ以外はリンクボタン化される */
  sourceUrl: z.string().url(),
  /** 情報源の種類 */
  sourceType: MerchandiseSourceTypeSchema,
  /** 参考画像 URL（X 投稿の画像 / 商品写真等）*/
  imageUrl: z.string().url().optional(),
  /** 補助的な情報源（任意・複数）。UI では「関連: 1, 2」と小さく表示 */
  additionalSources: z.array(MerchandiseAdditionalSourceSchema).optional(),
});
export type MerchandiseDetail = z.infer<typeof MerchandiseDetailSchema>;

/** 公式ブースから抽出した情報 */
export const OfficialInfoSchema = z.object({
  // 自動取得時に空になる場合があるため min 制約は外す。表示側でフォールバック表示。
  description: z.string(),
  hosts: z.array(z.string()).optional(),
  /** 旧フィールド: 物販名のみの string 配列。新規データは merchandiseDetails を推奨 */
  merchandise: z.array(z.string()).optional(),
  /** 物販詳細（情報源 URL 付き）。merchandise より優先して UI 側で表示する */
  merchandiseDetails: z.array(MerchandiseDetailSchema).optional(),
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
  /**
   * Hero 表示用の明示改行（任意）。
   * - catchphrase の意味の切れ目で改行したい時に行配列で指定
   * - 各行を <span className="block"> でレンダーして、蛍光ペン下線を行ごとに当てる
   * - 未指定なら catchphrase を 1 行で表示（カード表示は常に 1 行）
   * - lines を join したものが catchphrase と意味的に一致する前提
   */
  catchphraseLines: z
    .array(z.string().min(1, '空行は不可'))
    .min(2, '改行指定は最低 2 行から')
    .max(4, '改行指定は最大 4 行まで（モバイル可読性のため）')
    .optional(),
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

/** 公式の「おすすめエピソード」（番組詳細ページの entry-recommend ブロックから抽出）*/
export const RecommendedEpisodeSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});
export type RecommendedEpisode = z.infer<typeof RecommendedEpisodeSchema>;

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
  /** 公式が指定したおすすめエピソード（任意）*/
  recommendedEpisode: RecommendedEpisodeSchema.optional(),
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

// ====================
// キュレーション（手動レーン）
// ====================

/** 手動キュレーションされた番組レーン */
export const CurationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  /** タブのアイコン絵文字（例: 🌙）*/
  emoji: z.string().min(1).optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  programIds: z.array(z.string().regex(/^pcwe-\d{3}$/)).min(2),
});
export type Curation = z.infer<typeof CurationSchema>;

export const CurationsDataSchema = z.object({
  curations: z.array(CurationSchema).min(1),
});
export type CurationsData = z.infer<typeof CurationsDataSchema>;

// ====================
// 気分・シーン入口
// ====================

export const MoodSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug は kebab-case の英小文字'),
  label: z.string().min(1),
  description: z.string().min(1),
  emoji: z.string().min(1),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  matchTags: z.array(z.string()).min(1),
});
export type Mood = z.infer<typeof MoodSchema>;

export const MoodsDataSchema = z.object({
  moods: z.array(MoodSchema).min(1),
});
export type MoodsData = z.infer<typeof MoodsDataSchema>;
