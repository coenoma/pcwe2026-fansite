/**
 * 番組診断（クイズ）ロジック
 *
 * 5 問の選択肢それぞれに、タグ・ジャンル・vibe への重みを持たせる。
 * 全番組をスコアリングして上位 3 件を返す。
 *
 * - 純粋関数（UI から切り離されているのでテスト容易）
 * - 重みは「ぼくのセンス」で決め打ち（API 不使用）
 */

import type { Program, Genre, Vibe } from './types';

interface Weights {
  /** タグごとの加点（部分一致ではなく完全一致）*/
  tags?: Record<string, number>;
  /** ジャンル一致での加点 */
  genres?: Partial<Record<Genre, number>>;
  /** vibe 一致での加点 */
  vibes?: Partial<Record<Vibe, number>>;
}

export interface QuizChoice {
  id: string;
  label: string;
  emoji?: string;
  weights: Weights;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  hint?: string;
  choices: QuizChoice[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'mood',
    prompt: 'いまの気分は、どれ？',
    choices: [
      {
        id: 'laugh',
        label: '笑いたい',
        emoji: '🤣',
        weights: {
          tags: { 笑える: 3, 熱量高い: 2 },
          vibes: { humorous: 3, energetic: 2 },
        },
      },
      {
        id: 'calm',
        label: '静かに沈みたい',
        emoji: '🌙',
        weights: {
          tags: { 内省的: 3, 癒し: 2, じっくり: 2 },
          vibes: { contemplative: 3, 'laid-back': 2 },
        },
      },
      {
        id: 'learn',
        label: '頭を刺激したい',
        emoji: '🧠',
        weights: {
          tags: { 学べる: 3, 知的: 3, 考えさせる: 2 },
          vibes: { intellectual: 3, earnest: 2 },
        },
      },
      {
        id: 'empathy',
        label: '寄り添ってほしい',
        emoji: '🫶',
        weights: {
          tags: { 共感: 3, 寄り添う: 3, マイノリティ: 2 },
          vibes: { conversational: 3 },
        },
      },
    ],
  },
  {
    id: 'scene',
    prompt: 'いつ聴く？',
    choices: [
      {
        id: 'morning',
        label: '朝・通勤',
        emoji: '☀️',
        weights: { tags: { 朝向き: 3, 通勤: 3, 軽快: 2 } },
      },
      {
        id: 'work',
        label: '作業中の BGM',
        emoji: '🎧',
        weights: { tags: { '作業 BGM': 3, 軽快: 2, 通勤: 1 } },
      },
      {
        id: 'night',
        label: '夜・寝る前',
        emoji: '🛏️',
        weights: { tags: { 寝る前: 3, 夜向き: 3, 内省的: 2, 癒し: 1 } },
      },
      {
        id: 'weekend',
        label: '休日にじっくり',
        emoji: '🛋️',
        weights: { tags: { じっくり: 3, 癒し: 2 } },
      },
    ],
  },
  {
    id: 'topic',
    prompt: '惹かれるのは？',
    choices: [
      {
        id: 'culture',
        label: '本・映画・カルチャー',
        emoji: '📚',
        weights: {
          genres: { 'カルチャー': 3, '文芸・読書': 3, '映画': 2, '音楽': 2 },
          tags: { ニッチ: 1 },
        },
      },
      {
        id: 'news',
        label: 'ニュース・社会',
        emoji: '📰',
        weights: {
          genres: { 'ニュース・社会': 3 },
          tags: { 学べる: 1, 知的: 1 },
        },
      },
      {
        id: 'life',
        label: '人間関係・暮らし',
        emoji: '💌',
        weights: {
          genres: { '恋愛・ジェンダー': 3, '暮らし': 2 },
          tags: { 共感: 2, 寄り添う: 2 },
        },
      },
      {
        id: 'niche',
        label: 'ニッチに、深く',
        emoji: '🔍',
        weights: { tags: { ニッチ: 3, 考えさせる: 2, 知的: 1, '一人語り': 1 } },
      },
    ],
  },
];

export interface QuizAnswer {
  questionId: string;
  choiceId: string;
}

export interface ScoredProgram {
  program: Program;
  score: number;
}

/** 合算後の中間構造（キー型は string で扱い、値が必ず存在することを保証）*/
interface AggregatedWeights {
  tags: Record<string, number>;
  genres: Record<string, number>;
  vibes: Record<string, number>;
}

/**
 * Partial<Record<K, V>>（K extends string）を Record<string, V | undefined> として
 * 安全に走査して合算する。Partial<Record<K, V>> は構造的に
 * Record<string, V | undefined> を満たすため、追加のキャスト無しで受け取れる。
 */
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

/** 回答リストから全 Weights を合算 */
function aggregateWeights(answers: QuizAnswer[]): AggregatedWeights {
  const total: AggregatedWeights = { tags: {}, genres: {}, vibes: {} };

  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
    const choice = question?.choices.find((c) => c.id === answer.choiceId);
    if (choice === undefined) continue;

    mergeRecord(total.tags, choice.weights.tags);
    mergeRecord(total.genres, choice.weights.genres);
    mergeRecord(total.vibes, choice.weights.vibes);
  }
  return total;
}

/** スコアリング: タグ一致 / ジャンル一致 / vibe 一致を加算 */
export function scorePrograms(
  programs: Program[],
  answers: QuizAnswer[],
): ScoredProgram[] {
  const weights = aggregateWeights(answers);
  return programs
    .map((program) => {
      let score = 0;

      for (const tag of program.fanGuide.tags) {
        score += weights.tags[tag] ?? 0;
      }
      score += weights.genres[program.fanGuide.genre] ?? 0;
      score += weights.vibes[program.fanGuide.vibe] ?? 0;

      return { program, score };
    })
    .sort((a, b) => b.score - a.score);
}

/** 上位 N 件を返す（同点はランダムに 1 件選ぶことで「もう一度」で揺らぎを出せる）*/
export function pickTopMatches(
  programs: Program[],
  answers: QuizAnswer[],
  count: number = 3,
): Program[] {
  const scored = scorePrograms(programs, answers);
  const max = scored[0]?.score ?? 0;
  // 全部 0 点なら（回答が「こだわらない」しかない等）ランダム返す
  if (max === 0) {
    return [...programs].sort(() => Math.random() - 0.5).slice(0, count);
  }
  return scored.slice(0, count).map((s) => s.program);
}
