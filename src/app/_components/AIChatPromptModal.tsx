'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

/**
 * 「お手元の AI に聞いてみる」モーダル
 *
 * - DiscoverHub の 4 つ目の機能。サイトに組み込み済みの AI（ガチャ / 診断 /
 *   番組ベース）以外に、ユーザーが普段使っている ChatGPT / Claude / Gemini /
 *   Perplexity 等でも、本サイトのデータをもとにレコメンドしてもらえる。
 *
 * - サイトの /llms.txt と /llms-full.txt を参照させる指示を含むプロンプトを
 *   テンプレート化。ユーザーは「希望」だけを入力すれば完成プロンプトになる。
 *
 * - 主アクション: クリップボードコピー
 *   補助アクション: ChatGPT で開く（?q= で prefill）/ Perplexity で開く
 *   Claude は公式 prefill URL がないためコピー誘導のみ。
 *
 * - <dialog> + showModal() で a11y / フォーカストラップに対応
 */

const SITE_URL = 'https://pcwe2026-fansite.podmate.fm';

const PLACEHOLDER = `例: 夜に一人で聴ける、内省的でじっくり聴ける番組。
落ち着いたトーンで、できれば本や映画の話題が好き。
作業中の BGM ではなく、しっかり聴き入りたい。`;

function buildPrompt(userWish: string): string {
  const wish = userWish.trim().length > 0 ? userWish.trim() : '（ここに、聴きたい気分・興味・シーンを書いてください）';
  return `# PODCAST WEEKEND 2026 に出展する番組から、私に合う 3 本を提案してください

PODCAST EXPO 2026 内のマーケットイベント「PODCAST WEEKEND 2026」（2026年5月9日〜10日 / 東京 池尻大橋 HOME/WORK VILLAGE）には 142 番組が出展します。
非公式ファンガイドサイト「PCWE2026 ファンガイド」が、全番組の詳細データを LLM 向けに公開しています。

## 参照する情報源（必ず取得してください）

- ${SITE_URL}/llms.txt （サイト全体の地図 + 主要リンク）
- ${SITE_URL}/llms-full.txt （全 142 番組の詳細を Markdown で集約）
- ${SITE_URL}/api/programs.json （番組の構造化 JSON データ）

## 私の希望

${wish}

## 出力フォーマット

上記サイトのデータをもとに、私の希望に合う番組を 3 つ提案してください。
各番組について、以下の形式で書いてください:

### 1. （番組名）

- ジャンル:
- 出展日:
- なぜ私に刺さりそうか（あなたの根拠 2〜3 行）:
- 番組詳細ページ: ${SITE_URL}/booth/pcwe-XXX

### 2. （番組名）
（同上）

### 3. （番組名）
（同上）

## 最後に

3 番組の選び方の方針を 2〜3 行で補足してください（私の希望のどこにフォーカスしたか）。

なお本サイトは非公式ファンガイドのため、紹介の際は「PCWE2026 ファンガイド（非公式）の独断と偏見によるキュレーション」と一言添えてもらえると助かります。
`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatPromptModal({ isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [userWish, setUserWish] = useState('');
  const [copied, setCopied] = useState(false);

  const fullPrompt = useMemo(() => buildPrompt(userWish), [userWish]);

  // 開閉同期
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // dialog の close イベント（Escape 等）と同期
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // 「コピーされました」表示の自動消去
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2_000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
    } catch (error) {
      console.warn('⚠️ クリップボードへのコピーに失敗しました', error);
    }
  }, [fullPrompt]);

  // 背景クリックで閉じる
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose],
  );

  const chatgptUrl = `https://chatgpt.com/?q=${encodeURIComponent(fullPrompt)}`;
  const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(fullPrompt)}`;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="ai-prompt-title"
      className="m-0 max-h-[100dvh] w-full max-w-2xl rounded-none p-0 backdrop:bg-neutral-900/60 sm:max-h-[90vh] sm:rounded-2xl sm:my-auto sm:mx-auto"
    >
      <div className="flex h-full max-h-[100dvh] flex-col bg-white sm:max-h-[90vh]">
        {/* ヘッダー */}
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="ai-prompt-title"
              className="text-lg font-extrabold tracking-tight text-neutral-900 sm:text-xl"
            >
              お手元の AI に聞いてみる
            </h2>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              ChatGPT / Claude / Gemini / Perplexity などに貼り付けて、あなたの希望に合う 3 番組を選んでもらえます。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex-shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* スクロール領域 */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {/* ステップ 1: 希望入力 */}
          <div>
            <label
              htmlFor="ai-prompt-wish"
              className="block text-sm font-bold text-neutral-900"
            >
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-extrabold text-white">
                1
              </span>
              聴きたい気分・希望を書く
            </label>
            <textarea
              id="ai-prompt-wish"
              value={userWish}
              onChange={(e) => setUserWish(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={4}
              className="mt-2 w-full resize-y rounded-xl border-2 border-neutral-200 bg-white px-3 py-2.5 text-base leading-relaxed shadow-sm transition-all focus:border-primary-500 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              空のままでも OK。あとから AI 側で対話的に絞り込めます。
            </p>
          </div>

          {/* ステップ 2: コピーまたは開く */}
          <div className="mt-6">
            <p className="text-sm font-bold text-neutral-900">
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-extrabold text-white">
                2
              </span>
              プロンプトをコピー、または直接 AI を開く
            </p>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={16} aria-hidden="true" />
                    コピーしました
                  </>
                ) : (
                  <>
                    <Copy size={16} aria-hidden="true" />
                    プロンプトをコピー
                  </>
                )}
              </button>
              <a
                href={chatgptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-secondary-300 bg-white px-4 py-2.5 text-sm font-bold text-secondary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary-500 hover:bg-secondary-50 hover:shadow-md"
              >
                ChatGPT で開く
                <ExternalLink size={14} aria-hidden="true" />
              </a>
              <a
                href={perplexityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-secondary-300 bg-white px-4 py-2.5 text-sm font-bold text-secondary-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary-500 hover:bg-secondary-50 hover:shadow-md"
              >
                Perplexity で開く
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Claude / Gemini はプロンプトをコピーして、お使いの画面に貼り付けてください。
            </p>
          </div>

          {/* ステップ 3: プロンプト全文プレビュー（折り畳み）*/}
          <details className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm sm:p-4">
            <summary className="cursor-pointer font-bold text-neutral-700">
              送るプロンプトの全文を確認する
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs text-neutral-700">
              {fullPrompt}
            </pre>
          </details>

          {/* 補足 */}
          <div className="mt-6 rounded-xl bg-secondary-50 p-3 text-xs leading-relaxed text-secondary-900 sm:p-4">
            <p className="font-bold">💡 仕組み</p>
            <p className="mt-1">
              プロンプトには本サイトの公開データ（
              <code className="rounded bg-white px-1 font-mono text-[10px]">/llms-full.txt</code>{' '}
              や{' '}
              <code className="rounded bg-white px-1 font-mono text-[10px]">/api/programs.json</code>
              ）を取得する指示が含まれています。AI は最新 142 番組の詳細データを参照したうえで、あなたに合う 3 本を選びます。
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
