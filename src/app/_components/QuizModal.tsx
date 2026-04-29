'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, X, ArrowLeft, RotateCcw } from 'lucide-react';
import type { Program } from '@/lib/types';
import {
  QUIZ_QUESTIONS,
  pickTopMatches,
  type QuizAnswer,
} from '@/lib/program-quiz';
import { dayLabel } from '@/lib/format';
import { vibeStyle } from '@/lib/vibe-style';

interface Props {
  programs: Program[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 番組診断モーダル（5 問 → 上位 3 番組）
 *
 * - <dialog> + showModal() で a11y / フォーカストラップ対応
 * - 質問は 1 問ずつ表示、進捗バー付き
 * - 結果画面でカードをふわっと表示（GachaModal と同じ animate-float-in）
 */
export function QuizModal({ programs, isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [results, setResults] = useState<Program[] | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // open / close と showModal / close を同期
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // 開くたびにリセット
      setStep(0);
      setAnswers([]);
      setResults(null);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Escape などで dialog が閉じた時に親 state を同期
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleSelect = (questionId: string, choiceId: string) => {
    const next = [
      ...answers.filter((a) => a.questionId !== questionId),
      { questionId, choiceId },
    ];
    setAnswers(next);

    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // 最終問: 結果計算
      setResults(pickTopMatches(programs, next, 3));
    }
  };

  const handleBack = () => {
    if (results !== null) {
      // 結果画面 → 最終問題に戻る
      setResults(null);
      return;
    }
    if (step > 0) setStep(step - 1);
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers([]);
    setResults(null);
  };

  const totalSteps = QUIZ_QUESTIONS.length;
  const currentQuestion = QUIZ_QUESTIONS[step];
  const progress = results !== null
    ? 100
    : Math.round(((step + 0) / totalSteps) * 100);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="
        fixed inset-0 m-auto h-fit max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl
        overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0 shadow-2xl
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
      "
      aria-label="番組診断"
    >
      <div className="flex max-h-[92vh] flex-col">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold text-neutral-700">
              <Sparkles
                size={18}
                className="flex-none text-primary-600"
                aria-hidden="true"
              />
              {results === null ? (
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="truncate">30 秒、ぼくの番組診断</span>
                  <span className="text-xs font-normal text-neutral-500">
                    {step + 1} / {totalSteps}
                  </span>
                </span>
              ) : (
                <span className="truncate">あなたに、刺さりそうなのは</span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X size={18} />
            </button>
          </div>
          {/* 進捗バー */}
          <div
            aria-hidden="true"
            className="h-1 w-full bg-neutral-100"
          >
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 本体 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          {results === null ? (
            <QuestionView
              key={currentQuestion.id}
              question={currentQuestion}
              selectedChoiceId={
                answers.find((a) => a.questionId === currentQuestion.id)?.choiceId
              }
              onSelect={(choiceId) =>
                handleSelect(currentQuestion.id, choiceId)
              }
            />
          ) : (
            <ResultView results={results} />
          )}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleBack}
            disabled={results === null && step === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {results === null ? '前の質問' : '質問に戻る'}
          </button>
          {results !== null && (
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary-600 bg-white px-4 py-1.5 text-sm font-bold text-primary-700 transition-all active:scale-95 hover:bg-primary-50"
            >
              <RotateCcw size={14} aria-hidden="true" />
              もう一度診断する
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

function QuestionView({
  question,
  selectedChoiceId,
  onSelect,
}: {
  question: (typeof QUIZ_QUESTIONS)[number];
  selectedChoiceId: string | undefined;
  onSelect: (choiceId: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-extrabold leading-snug text-neutral-900 sm:text-2xl">
        {question.prompt}
      </h3>
      {question.hint !== undefined && (
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{question.hint}</p>
      )}
      {/*
        選択肢グリッド
        - SP: 2 カラムで横並び（短ラベル前提）
        - PC: 2 カラム
        - 各ボタンの高さは min-h で揃え、文字長が違ってもズレない
        - flex items-center で emoji と label の縦中央揃え
        - label は break-words で日本語の途中改行を許容、長文でも崩れない
      */}
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
        {question.choices.map((choice) => {
          const selected = selectedChoiceId === choice.id;
          return (
            <li key={choice.id}>
              <button
                type="button"
                onClick={() => onSelect(choice.id)}
                aria-pressed={selected}
                className={
                  selected
                    ? 'flex h-full min-h-[88px] w-full items-center gap-2 rounded-xl border-2 border-primary-600 bg-primary-50 px-3 py-3 text-left transition-all active:scale-[0.99] sm:gap-3 sm:px-4 sm:py-4'
                    : 'flex h-full min-h-[88px] w-full items-center gap-2 rounded-xl border-2 border-neutral-200 bg-white px-3 py-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50/40 active:scale-[0.99] sm:gap-3 sm:px-4 sm:py-4'
                }
              >
                {choice.emoji !== undefined && (
                  <span
                    aria-hidden="true"
                    className="flex-none text-2xl leading-none sm:text-3xl"
                  >
                    {choice.emoji}
                  </span>
                )}
                <span className="min-w-0 break-words text-sm font-bold leading-snug text-neutral-900 sm:text-base">
                  {choice.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ResultView({ results }: { results: Program[] }) {
  return (
    <div>
      <p className="text-sm text-neutral-700 sm:text-base">
        いまの気分にハマりそうな、3 番組です。
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        ※ AI の独断と偏見です。当たらなくても、笑って許してください。
      </p>
      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        {results.map((program, index) => (
          <ResultCard key={program.id} program={program} delay={index * 180} />
        ))}
      </ul>
    </div>
  );
}

function ResultCard({ program, delay }: { program: Program; delay: number }) {
  const vibe = vibeStyle(program.fanGuide.vibe);
  const themeColor = program.fanGuide.themeColor ?? vibe.defaultThemeColor;

  return (
    <li>
      <Link
        href={`/booth/${program.id}`}
        className="animate-float-in group flex h-full min-h-[300px] flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
        style={{
          borderColor: `${themeColor}40`,
          animationDelay: `${delay}ms`,
        }}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          <Image
            src={program.thumbnail}
            alt={`${program.name} のロゴ画像`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-15 mix-blend-multiply"
            style={{ backgroundColor: themeColor }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span
              className="rounded-full px-2 py-0.5 font-bold"
              style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}
            >
              {program.fanGuide.genre}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-bold text-neutral-600">
              {dayLabel(program.exhibition.days)}
            </span>
          </div>
          <h4 className="text-sm font-extrabold leading-snug text-neutral-900 group-hover:text-primary-700">
            {program.shortName ?? program.name}
          </h4>
          <p className="text-xs leading-relaxed text-neutral-700">
            {program.fanGuide.catchphrase}
          </p>
        </div>
      </Link>
    </li>
  );
}
