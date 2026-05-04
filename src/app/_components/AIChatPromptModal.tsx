'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, ExternalLink, Sparkles, MessageSquare } from 'lucide-react';

/**
 * 「いつもの AI に相談してみる」モーダル
 *
 * - DiscoverHub の 4 つ目の機能。サイトに組み込み済みの AI（ガチャ / 診断 /
 *   番組ベース）以外に、ユーザーが普段使っている ChatGPT / Claude / Gemini /
 *   Perplexity 等でも、本サイトのデータをもとにレコメンドしてもらえる。
 *
 * - サイトの /llms.txt と /llms-full.txt /api/programs.json を参照させる
 *   指示を含むプロンプトをテンプレート化。ユーザーは「希望」だけを入力すれば
 *   完成プロンプトになる。
 *
 * - 100 点化のための工夫:
 *   1. 開いた瞬間に textarea へ自動フォーカス（即書き始められる）
 *   2. プリセットチップで「思考コスト 0」で希望を埋められる
 *   3. プロンプト全文を最初から見える化（折り畳みではなく ScrollArea で常時可視）
 *   4. コピー後の next step ヒントを動的表示
 *   5. Cmd/Ctrl+Enter でコピー（パワーユーザー向けショートカット）
 *   6. プロンプト本体にロール指定・フォールバック指示・id 実例を含めて
 *      AI 側の動作を安定化
 */

const SITE_URL = 'https://pcwe2026-fansite.podmate.fm';

const PLACEHOLDER = '例: 夜にひとりで聴ける、内省的でじっくり聴けるやつ。';

// 1 タップで希望を埋められるプリセット。よくある希望シーンを網羅。
const WISH_PRESETS = [
  '夜にひとりで聴ける、内省的でじっくり聴けるやつ',
  '通勤・通学のお供。15-30 分でテンポよく聴けるやつ',
  '初めて PCWE に行くので、まず聴いておくべき定番',
  '軽くて笑える、肩の力を抜いて聴けるやつ',
  '考えさせられる、知的な対話が聴けるやつ',
  '土曜だけ会場に行くので、土曜出展の中から選んで',
] as const;

function buildPrompt(userWish: string): string {
  const wish =
    userWish.trim().length > 0
      ? userWish.trim()
      : '（ここに、聴きたい気分・興味・シーンを書いてください）';

  return `# PODCAST WEEKEND 2026 出展番組から、私に刺さる 3 本を選んでください

あなたは音声番組に詳しい案内人です。
PODCAST EXPO 2026 内のマーケットイベント「PODCAST WEEKEND 2026」（2026 年 5 月 9 日〜10 日 / 東京・池尻大橋 HOME/WORK VILLAGE）には 142 番組が出展します。

非公式ファンガイドサイト「PCWE2026 ファンガイド」が、全番組の詳細データを LLM 向けに公開しています。下記 URL を取得して内容を踏まえた上で、私の希望に合う番組を 3 本選んでください。

## 参照する情報源

優先順位の高い順に試してください。**1 つが本文取得できれば次は不要**です。

### 推奨ルート A: LLM 向け HTML 集約データ（最も確実 / 一発で全 142 番組）

1. ${SITE_URL}/data/llms-full — **全 142 番組の詳細を集約した HTML 版**（AI / LLM 向けに最適化、約 220KB）

> **重要（HTML として処理してください）**:
> このページは URL に拡張子がありませんが、Content-Type は \`text/html; charset=utf-8\` で配信される **HTML ドキュメント**です。レスポンスヘッダーの Content-Type を確認し、HTML としてパースしてください。冒頭に \`<title>PCWE2026 全 142 番組 詳細データ（LLM 向け）...</title>\` があり、本文は \`<article id="pcwe-001">\` 〜 \`<article id="pcwe-142">\` で 142 番組分の詳細が並びます。
>
> このページが取得できれば、以降の B / C は不要です。

### ルート B: テキスト / JSON 集約データ（A が使えない LLM 用）

2. ${SITE_URL}/llms-full.txt — 同じデータの Markdown 版（約 260KB）
3. ${SITE_URL}/api/programs.json — 同じデータの JSON 版（約 320KB）
4. ${SITE_URL}/llms.txt — サイト地図 + 番組リスト（約 36KB、軽量）

※ AI クライアントによっては text/plain や JSON の URL を「開ける」と表示しても本文が空 / メタ情報のみで返るケースがあります。その場合はルート A か C を使ってください。

### フォールバック・ルート C: HTML ページ巡回（A も B も使えない時）

A / B が読めない場合は、次の HTML ページを順に取得してください:

1. ${SITE_URL}/ — トップページ（全 142 番組への ItemList JSON-LD 構造化データを含む）
2. ${SITE_URL}/genre/{ジャンル名} — ジャンル別の番組一覧（カルチャー / 食 / 音楽 / 旅 など）
3. ${SITE_URL}/booth/pcwe-XXX — 個別番組詳細（XXX は 001〜142 の 3 桁）

ルート C で進めた場合は、回答の最初に「※ HTML ページから取得した情報をもとに提案します」と一言添えてください（情報源の透明性のため）。

### 取得自体ができない場合

ネットワーク取得機能自体が利用不可の場合は、その旨を最初に明記したうえで、一般的な「ポッドキャストの選び方」だけを提案してください。**番組名・内容の創作は厳禁** です（事実と異なる出展番組を紹介すると、ユーザーが当日会場で見つけられず混乱します）。

## 私の希望

${wish}

## 出力フォーマット

上記サイトの実データをもとに、私の希望に最も合う番組を 3 本提案してください。各番組について以下の形で書いてください:

### 1. （番組名）

- ジャンル:
- 出展日（土／日／両日）:
- なぜ私に刺さりそうか（あなたの根拠を 2〜3 行、具体的に）:
- 詳細ページ: ${SITE_URL}/booth/{番組 id}
  （例: pcwe-001、pcwe-072、pcwe-142 のような \`pcwe-XXX\` 形式 3 桁）

### 2. （番組名）
（同上）

### 3. （番組名）
（同上）

## 最後に

- なぜこの 3 本に絞ったか、選び方の方針を 2〜3 行で補足してください
- 私の希望が曖昧だと感じたら、もう 1 段階絞り込むための質問を 1〜2 個出してください
- 紹介する際は「PCWE2026 ファンガイド（非公式）の独断と偏見によるキュレーション」と一言添えてもらえると助かります（公式の解説と区別したいため）
`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatPromptModal({ isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [userWish, setUserWish] = useState('');
  const [copied, setCopied] = useState(false);

  const fullPrompt = useMemo(() => buildPrompt(userWish), [userWish]);

  // 開閉同期 + 開いた直後に textarea へ focus（即書き始められる）
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // dialog の表示完了を待ってから focus（モバイルでキーボードが立ち上がりすぎないよう preventScroll）
      requestAnimationFrame(() => {
        textareaRef.current?.focus({ preventScroll: true });
      });
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // dialog の close イベント（Escape 等）と同期
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const handleClose = () => {
      onClose();
      // 閉じた後は希望をリセット（次回開いた時にクリーンに）
      setCopied(false);
    };
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // 「コピーされました」表示の自動消去
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 3_000);
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

  // Cmd/Ctrl + Enter でコピー（パワーユーザー向け）
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCopy();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleCopy]);

  // 背景クリックで閉じる
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose],
  );

  // プリセットチップを押した時: 希望にセット（既存の入力に上書き）
  const handlePresetClick = useCallback((preset: string) => {
    setUserWish(preset);
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  const chatgptUrl = `https://chatgpt.com/?q=${encodeURIComponent(fullPrompt)}`;
  const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(fullPrompt)}`;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="ai-prompt-title"
      className="m-0 max-h-[100dvh] w-full max-w-2xl rounded-none p-0 backdrop:bg-neutral-900/60 sm:my-auto sm:mx-auto sm:max-h-[90vh] sm:rounded-2xl"
    >
      <div className="flex h-full max-h-[100dvh] flex-col bg-white sm:max-h-[90vh]">
        {/* ヘッダー */}
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm"
            >
              <MessageSquare size={20} />
            </span>
            <div>
              <h2
                id="ai-prompt-title"
                className="text-lg font-extrabold tracking-tight text-neutral-900 sm:text-xl"
              >
                いつもの AI に、相談してみる
              </h2>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                ChatGPT / Claude / Gemini に貼り付けるだけ。本サイトの 142 番組データを参照して、3 本提案してくれます。
              </p>
            </div>
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
              <span className="ml-1.5 text-xs font-normal text-neutral-500">（任意）</span>
            </label>

            {/* プリセットチップ: 1 タップで希望を埋める */}
            <p className="mt-2 text-xs text-neutral-500">よくある希望から選ぶ:</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {WISH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                    userWish === preset
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-primary-400 hover:text-primary-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              id="ai-prompt-wish"
              ref={textareaRef}
              value={userWish}
              onChange={(e) => setUserWish(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={3}
              className="mt-3 w-full resize-y rounded-xl border-2 border-neutral-200 bg-white px-3 py-2.5 text-base leading-relaxed shadow-sm transition-all focus:border-primary-500 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              空のままでも OK。自由に書き加えれば、AI が対話的に絞り込んでくれます。
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
                <Sparkles size={14} aria-hidden="true" />
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

            {/* コピー後の next step ヒント（動的表示）*/}
            {copied ? (
              <div
                role="status"
                className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 sm:text-sm"
              >
                <Check size={16} className="mt-0.5 flex-none" aria-hidden="true" />
                <p>
                  コピーできました。お使いの AI チャット（Claude / Gemini など）に貼り付けて送信してください。
                  AI がサイトの番組データを参照して 3 本提案します。
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">
                Claude / Gemini はコピーしてお使いの画面に貼り付けてください。
                <span className="ml-2 hidden sm:inline">
                  <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600">
                    {typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘' : 'Ctrl'}
                  </kbd>{' '}
                  +{' '}
                  <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600">
                    Enter
                  </kbd>{' '}
                  でも コピーできます
                </span>
              </p>
            )}
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

          {/* 補足（より控えめに）*/}
          <p className="mt-6 text-center text-xs text-neutral-500">
            プロンプトには本サイトの公開データ
            （
            <a
              href="/llms-full.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-secondary-700 underline decoration-transparent transition-colors hover:decoration-secondary-500"
            >
              llms-full.txt
            </a>
            ・
            <a
              href="/api/programs.json"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-secondary-700 underline decoration-transparent transition-colors hover:decoration-secondary-500"
            >
              programs.json
            </a>
            ）を AI に取得させる指示が含まれています。
          </p>
        </div>
      </div>
    </dialog>
  );
}
