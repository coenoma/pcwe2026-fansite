/**
 * 番組診断（クイズ）ロジック v2 — 100 点化版
 *
 * 改善点（v1 → v2）:
 *   - 質問: 3 問 → **5 問**（聴き方 / 密度 を追加して識別力アップ）
 *   - 重み: vibe=5 / genre=3 / tag=1.5 と軸別に差別化
 *   - **マッチ理由（reasons）を返す**：UI で「なぜこの番組？」を可視化
 *   - **多様性制御**：上位 3 件で vibe / genre が連続しないように調整
 *   - **同点近接でランダム揺らぎ**：「もう一度」で結果が変わる
 *   - **派生計算**：hostStyle (solo/duo/group)、density を Program から推定して活用
 *
 * 純粋関数（UI から切り離されているのでテスト容易）
 */

import type { Program, Genre, Vibe } from './types';

// ============================================================
// 派生計算（既存 Program から「裏側情報」を推定）
// ============================================================

/** 話し方の構成（ホスト人数から推定）*/
export type HostStyle = 'solo' | 'duo' | 'group';

export function inferHostStyle(program: Program): HostStyle {
  const n = program.official.hosts?.length ?? 0;
  if (n <= 1) return 'solo';
  if (n === 2) return 'duo';
  return 'group';
}

/** 密度・テンポ（タグから推定）*/
export type Density = 'light' | 'deep' | 'commute' | 'unknown';

export function inferDensity(program: Program): Density {
  const tags = new Set(program.fanGuide.tags);
  // 軽快タグがあれば light
  if (tags.has('軽快') || tags.has('笑える')) return 'light';
  // じっくり / 寝る前 / 内省的なら deep
  if (tags.has('じっくり') || tags.has('内省的') || tags.has('寝る前')) return 'deep';
  // 朝向き / 通勤 / 作業 BGM なら commute
  if (tags.has('朝向き') || tags.has('通勤') || tags.has('作業 BGM')) return 'commute';
  return 'unknown';
}

// ============================================================
// 重み定義
// ============================================================

interface Weights {
  /** タグごとの加点 */
  tags?: Record<string, number>;
  /** ジャンル一致での加点 */
  genres?: Partial<Record<Genre, number>>;
  /** vibe 一致での加点 */
  vibes?: Partial<Record<Vibe, number>>;
  /** ホスト構成一致での加点 */
  hostStyles?: Partial<Record<HostStyle, number>>;
  /** 密度・テンポ一致での加点 */
  densities?: Partial<Record<Density, number>>;
}

export interface QuizChoice {
  id: string;
  label: string;
  emoji?: string;
  weights: Weights;
  /** マッチ理由のラベル（結果に「あなたが選んだ：◯◯」と表示する用）*/
  pickedLabel: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  hint?: string;
  choices: QuizChoice[];
}

// 軸別の基本重み（番組のフィールド一致でこの値を加算）
const W_VIBE = 5;
const W_GENRE = 3;
const W_TAG = 1.5;
const W_HOST = 2;
const W_DENSITY = 1;

// ============================================================
// 5 問の質問定義
// ============================================================

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Q1 気分
  {
    id: 'mood',
    prompt: 'いまの気分は、どれ？',
    choices: [
      {
        id: 'laugh',
        label: '笑いたい',
        emoji: '🤣',
        pickedLabel: '気分: 笑いたい',
        weights: {
          tags: { 笑える: W_TAG, 熱量高い: W_TAG },
          vibes: { humorous: W_VIBE, energetic: W_VIBE * 0.6 },
        },
      },
      {
        id: 'calm',
        label: '静かに沈みたい',
        emoji: '🌙',
        pickedLabel: '気分: 静かに沈みたい',
        weights: {
          tags: { 内省的: W_TAG, 癒し: W_TAG, じっくり: W_TAG },
          vibes: { contemplative: W_VIBE, 'laid-back': W_VIBE * 0.6 },
        },
      },
      {
        id: 'learn',
        label: '頭を刺激したい',
        emoji: '🧠',
        pickedLabel: '気分: 頭を刺激したい',
        weights: {
          tags: { 学べる: W_TAG, 知的: W_TAG, 考えさせる: W_TAG },
          vibes: { intellectual: W_VIBE, earnest: W_VIBE * 0.6 },
        },
      },
      {
        id: 'empathy',
        label: '寄り添ってほしい',
        emoji: '🫶',
        pickedLabel: '気分: 寄り添ってほしい',
        weights: {
          tags: { 共感: W_TAG, 寄り添う: W_TAG, マイノリティ: W_TAG * 0.7 },
          vibes: { conversational: W_VIBE },
        },
      },
    ],
  },

  // Q2 シーン
  {
    id: 'scene',
    prompt: 'いつ聴く？',
    choices: [
      {
        id: 'morning',
        label: '朝・通勤',
        emoji: '☀️',
        pickedLabel: 'シーン: 朝・通勤',
        weights: {
          tags: { 朝向き: W_TAG, 通勤: W_TAG, 軽快: W_TAG * 0.7 },
          densities: { commute: W_DENSITY },
        },
      },
      {
        id: 'work',
        label: '作業中の BGM',
        emoji: '🎧',
        pickedLabel: 'シーン: 作業中',
        weights: {
          tags: { '作業 BGM': W_TAG, 軽快: W_TAG, 通勤: W_TAG * 0.5 },
          densities: { commute: W_DENSITY * 0.7, light: W_DENSITY * 0.5 },
        },
      },
      {
        id: 'night',
        label: '夜・寝る前',
        emoji: '🛏️',
        pickedLabel: 'シーン: 夜・寝る前',
        weights: {
          tags: { 寝る前: W_TAG, 夜向き: W_TAG, 内省的: W_TAG, 癒し: W_TAG * 0.5 },
          densities: { deep: W_DENSITY },
        },
      },
      {
        id: 'weekend',
        label: '休日にじっくり',
        emoji: '🛋️',
        pickedLabel: 'シーン: 休日じっくり',
        weights: {
          tags: { じっくり: W_TAG, 癒し: W_TAG },
          densities: { deep: W_DENSITY },
        },
      },
    ],
  },

  // Q3 テーマ
  {
    id: 'topic',
    prompt: '惹かれるのは？',
    choices: [
      {
        id: 'culture',
        label: '本・映画・カルチャー',
        emoji: '📚',
        pickedLabel: 'テーマ: カルチャー',
        weights: {
          genres: { 'カルチャー': W_GENRE, '文芸・読書': W_GENRE, '映画': W_GENRE * 0.7, '音楽': W_GENRE * 0.7 },
          tags: { ニッチ: W_TAG * 0.5 },
        },
      },
      {
        id: 'news',
        label: 'ニュース・社会',
        emoji: '📰',
        pickedLabel: 'テーマ: ニュース・社会',
        weights: {
          genres: { 'ニュース・社会': W_GENRE },
          tags: { 学べる: W_TAG * 0.6, 知的: W_TAG * 0.6 },
        },
      },
      {
        id: 'life',
        label: '人間関係・暮らし',
        emoji: '💌',
        pickedLabel: 'テーマ: 人間関係・暮らし',
        weights: {
          genres: { '恋愛・ジェンダー': W_GENRE, '暮らし': W_GENRE * 0.8 },
          tags: { 共感: W_TAG, 寄り添う: W_TAG },
        },
      },
      {
        id: 'niche',
        label: 'ニッチに、深く',
        emoji: '🔍',
        pickedLabel: 'テーマ: ニッチに深く',
        weights: {
          tags: { ニッチ: W_TAG * 1.5, 考えさせる: W_TAG, 知的: W_TAG * 0.5, '一人語り': W_TAG * 0.5 },
        },
      },
    ],
  },

  // Q4 聴き方（NEW）
  {
    id: 'voice',
    prompt: 'どんな話し方が好き？',
    choices: [
      {
        id: 'solo',
        label: '一人で、深く',
        emoji: '🎙️',
        pickedLabel: '話し方: 一人語りが好み',
        weights: {
          hostStyles: { solo: W_HOST },
          tags: { 一人語り: W_TAG, 内省的: W_TAG * 0.5 },
          vibes: { contemplative: W_VIBE * 0.4, earnest: W_VIBE * 0.4 },
        },
      },
      {
        id: 'duo',
        label: '二人以上の温度感',
        emoji: '🗣️',
        pickedLabel: '話し方: 掛け合いが好み',
        weights: {
          hostStyles: { duo: W_HOST, group: W_HOST * 0.8 },
          tags: { 二人以上の掛け合い: W_TAG, 笑える: W_TAG * 0.4 },
          vibes: { conversational: W_VIBE * 0.4, energetic: W_VIBE * 0.4 },
        },
      },
      {
        id: 'expert',
        label: '専門家の解説',
        emoji: '🎓',
        pickedLabel: '話し方: 専門家解説が好み',
        weights: {
          tags: { 学べる: W_TAG, 知的: W_TAG, 考えさせる: W_TAG * 0.5 },
          vibes: { intellectual: W_VIBE * 0.6, earnest: W_VIBE * 0.4 },
        },
      },
      {
        id: 'either',
        label: 'こだわらない',
        emoji: '🤷',
        pickedLabel: '話し方: こだわらない',
        weights: {},
      },
    ],
  },

  // Q5 密度・テンポ（NEW）
  {
    id: 'density',
    prompt: 'どんなテンポがいい？',
    choices: [
      {
        id: 'light',
        label: '軽快に、短く',
        emoji: '⚡',
        pickedLabel: 'テンポ: 軽快に短く',
        weights: {
          densities: { light: W_DENSITY * 1.5 },
          tags: { 軽快: W_TAG, 笑える: W_TAG * 0.4 },
        },
      },
      {
        id: 'deep',
        label: 'じっくり、腰を据えて',
        emoji: '🌊',
        pickedLabel: 'テンポ: じっくり腰を据えて',
        weights: {
          densities: { deep: W_DENSITY * 1.5 },
          tags: { じっくり: W_TAG, 考えさせる: W_TAG * 0.5, 内省的: W_TAG * 0.5 },
        },
      },
      {
        id: 'commute',
        label: '隙間時間で',
        emoji: '🚃',
        pickedLabel: 'テンポ: 隙間時間で',
        weights: {
          densities: { commute: W_DENSITY * 1.5 },
          tags: { 通勤: W_TAG, 朝向き: W_TAG * 0.5 },
        },
      },
      {
        id: 'any',
        label: 'こだわらない',
        emoji: '🤷',
        pickedLabel: 'テンポ: こだわらない',
        weights: {},
      },
    ],
  },
];

// ============================================================
// 採点・マッチ理由抽出
// ============================================================

export interface QuizAnswer {
  questionId: string;
  choiceId: string;
}

export interface MatchReason {
  /** マッチした軸 */
  axis: 'vibe' | 'genre' | 'tag' | 'host' | 'density';
  /** 表示用ラベル（例: 「同じ温度感（contemplative）」「ジャンル: 文芸・読書」「タグ: 寝る前」）*/
  label: string;
  /** 加算スコア */
  weight: number;
}

export interface ScoredProgram {
  program: Program;
  score: number;
  /** ユーザーの選択肢に対する一致点 */
  reasons: MatchReason[];
  /** 一致率（0〜100、最大スコアに対する相対値）*/
  matchPercent: number;
}

interface AggregatedWeights {
  tags: Record<string, number>;
  genres: Record<string, number>;
  vibes: Record<string, number>;
  hostStyles: Record<string, number>;
  densities: Record<string, number>;
}

function mergeRecord(
  target: Record<string, number>,
  source: Readonly<Record<string, number | undefined>> | undefined,
): void {
  if (source === undefined) return;
  for (const key in source) {
    const value = source[key];
    if (value === undefined) continue;
    target[key] = (target[key] ?? 0) + value;
  }
}

function aggregateWeights(answers: QuizAnswer[]): AggregatedWeights {
  const total: AggregatedWeights = {
    tags: {},
    genres: {},
    vibes: {},
    hostStyles: {},
    densities: {},
  };
  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
    const choice = question?.choices.find((c) => c.id === answer.choiceId);
    if (choice === undefined) continue;
    mergeRecord(total.tags, choice.weights.tags);
    mergeRecord(total.genres, choice.weights.genres);
    mergeRecord(total.vibes, choice.weights.vibes);
    mergeRecord(total.hostStyles, choice.weights.hostStyles);
    mergeRecord(total.densities, choice.weights.densities);
  }
  return total;
}

/** vibe → 表示用ラベル（UI と統一）*/
const VIBE_LABEL_JP: Record<Vibe, string> = {
  earnest: '誠実な対話',
  contemplative: '内省・静けさ',
  energetic: '熱量・テンポ',
  conversational: '共感・掛け合い',
  intellectual: '知的・解像度',
  humorous: '軽妙・遊び',
  'laid-back': 'ゆるさ・くつろぎ',
};

const HOST_STYLE_LABEL: Record<HostStyle, string> = {
  solo: '一人語り',
  duo: '掛け合い（2 人）',
  group: '掛け合い（3 人以上）',
};

const DENSITY_LABEL: Record<Density, string> = {
  light: '軽快テンポ',
  deep: 'じっくり腰を据えて',
  commute: '隙間時間で聴ける',
  unknown: '',
};

/** 1 番組のスコア + マッチ理由を計算 */
function scoreProgramWithReasons(
  program: Program,
  weights: AggregatedWeights,
): { score: number; reasons: MatchReason[] } {
  let score = 0;
  const reasons: MatchReason[] = [];

  // vibe
  const vibeScore = weights.vibes[program.fanGuide.vibe] ?? 0;
  if (vibeScore > 0) {
    score += vibeScore;
    reasons.push({
      axis: 'vibe',
      label: `温度感「${VIBE_LABEL_JP[program.fanGuide.vibe]}」`,
      weight: vibeScore,
    });
  }

  // genre
  const genreScore = weights.genres[program.fanGuide.genre] ?? 0;
  if (genreScore > 0) {
    score += genreScore;
    reasons.push({
      axis: 'genre',
      label: `ジャンル「${program.fanGuide.genre}」`,
      weight: genreScore,
    });
  }

  // tags（重複加算ではなく、一致したタグだけ表示）
  const matchedTags: string[] = [];
  let tagScoreTotal = 0;
  for (const tag of program.fanGuide.tags) {
    const w = weights.tags[tag] ?? 0;
    if (w > 0) {
      score += w;
      tagScoreTotal += w;
      matchedTags.push(tag);
    }
  }
  if (matchedTags.length > 0) {
    reasons.push({
      axis: 'tag',
      label: `タグ「${matchedTags.join(' / ')}」`,
      weight: tagScoreTotal,
    });
  }

  // hostStyle
  const hostStyle = inferHostStyle(program);
  const hostScore = weights.hostStyles[hostStyle] ?? 0;
  if (hostScore > 0) {
    score += hostScore;
    reasons.push({
      axis: 'host',
      label: `話し方「${HOST_STYLE_LABEL[hostStyle]}」`,
      weight: hostScore,
    });
  }

  // density
  const density = inferDensity(program);
  if (density !== 'unknown') {
    const densityScore = weights.densities[density] ?? 0;
    if (densityScore > 0) {
      score += densityScore;
      reasons.push({
        axis: 'density',
        label: `テンポ「${DENSITY_LABEL[density]}」`,
        weight: densityScore,
      });
    }
  }

  return { score, reasons };
}

/** 全番組をスコアリング（理由付き）*/
export function scorePrograms(
  programs: Program[],
  answers: QuizAnswer[],
): ScoredProgram[] {
  const weights = aggregateWeights(answers);
  // 最大スコア（=全 weights が一致した時の理論値）を計算しておく
  const maxPossible =
    Math.max(0, ...Object.values(weights.vibes)) +
    Math.max(0, ...Object.values(weights.genres)) +
    Object.values(weights.tags).reduce((s, v) => s + v, 0) +
    Math.max(0, ...Object.values(weights.hostStyles)) +
    Math.max(0, ...Object.values(weights.densities));

  return programs
    .map((program) => {
      const { score, reasons } = scoreProgramWithReasons(program, weights);
      const matchPercent =
        maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;
      return { program, score, reasons, matchPercent };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * 上位 N 件を多様性制御 + 同点近接ランダム揺らぎ付きで返す。
 *
 * - 多様性: 1 件目のあと、同 vibe / 同 genre が連続しないよう優先度を下げて選ぶ
 * - 揺らぎ: 最高点から 1.5 ポイント以内のグループはランダムシャッフル
 *   → 「もう一度」で結果が入れ替わる
 */
export function pickTopMatches(
  programs: Program[],
  answers: QuizAnswer[],
  count: number = 3,
): ScoredProgram[] {
  const scored = scorePrograms(programs, answers);
  if (scored.length === 0) return [];

  // 全部 0 点（こだわらない×全問など）→ ランダム返す
  if (scored[0].score === 0) {
    return [...scored].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // 同点近接（max ± 1.5）グループをランダム化
  const topScore = scored[0].score;
  const nearTop: ScoredProgram[] = [];
  const others: ScoredProgram[] = [];
  for (const s of scored) {
    if (topScore - s.score <= 1.5) nearTop.push(s);
    else others.push(s);
  }
  const shuffledNearTop = [...nearTop].sort(() => Math.random() - 0.5);
  const candidates = [...shuffledNearTop, ...others];

  // 多様性制御で上位 count 件を選ぶ
  const picked: ScoredProgram[] = [];
  const usedVibes = new Set<Vibe>();
  const usedGenres = new Set<Genre>();

  // Pass 1: vibe / genre が被らないものを優先
  for (const s of candidates) {
    if (picked.length >= count) break;
    const vibe = s.program.fanGuide.vibe;
    const genre = s.program.fanGuide.genre;
    if (usedVibes.has(vibe) && usedGenres.has(genre)) continue;
    picked.push(s);
    usedVibes.add(vibe);
    usedGenres.add(genre);
  }

  // Pass 2: 足りなければ残りから補充
  if (picked.length < count) {
    for (const s of candidates) {
      if (picked.length >= count) break;
      if (picked.includes(s)) continue;
      picked.push(s);
    }
  }

  return picked;
}
