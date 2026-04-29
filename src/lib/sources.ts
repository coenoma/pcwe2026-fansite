/**
 * データソース分離: official（自動取得）+ fan-guide（手動執筆）
 *
 * - 公式情報は scripts/fetch-booth-info.ts で機械的に取得 → data/sources/official/{id}.json
 * - ファンガイドは手動執筆 → data/sources/fan-guide/{id}.json
 * - scripts/build-programs.ts で両者をマージして data/programs.json を生成
 */

import { z } from 'zod';
import {
  AreaSchema,
  DaySchema,
  FanGuideSchema,
  LinksSchema,
  OfficialInfoSchema,
} from './types';

/** data/sources/official/{id}.json のスキーマ */
export const OfficialSourceSchema = z.object({
  id: z.string().regex(/^pcwe-\d{3}$/),
  name: z.string().min(1),
  shortName: z.string().optional(),
  thumbnail: z
    .string()
    .regex(/^\/thumbnails\/\d{3}\.(jpeg|jpg|png|webp)$/),
  boothUrl: z.string().url(),
  fetchedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'fetchedAt は ISO 日付'),

  official: OfficialInfoSchema,
  exhibition: z.object({
    days: z.array(DaySchema).min(1),
    hours: z.string(),
    area: AreaSchema,
    boothNumber: z.string().regex(/^\d{3}$/),
  }),
  links: LinksSchema,
});
export type OfficialSource = z.infer<typeof OfficialSourceSchema>;

/** data/sources/fan-guide/{id}.json のスキーマ（fanGuide だけを保持）*/
export const FanGuideSourceSchema = z.object({
  id: z.string().regex(/^pcwe-\d{3}$/),
  fanGuide: FanGuideSchema,
});
export type FanGuideSource = z.infer<typeof FanGuideSourceSchema>;
