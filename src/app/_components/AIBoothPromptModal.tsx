'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, ExternalLink, ShoppingBag, MessageSquare } from 'lucide-react';

/**
 * 「お手元の AI に、ブース物販・体験を聞いてみる」モーダル（マップ画面専用）。
 *
 * トップページの AIChatPromptModal が「番組レコメンド」（私に刺さる 3 本選んで）
 * なのに対して、こちらは **当日の物販・体験・飲食** を探すための相談プロンプト。
 *
 * 想定するユーザーの聞き方:
 *   - 「ケーキやスイーツ売ってるブースある？」
 *   - 「占いやタロット体験できるところは？」
 *   - 「無料配布あるブース教えて」
 *   - 「コーヒーが飲めるところ」
 *   - 「SF / 小説系の ZINE が買えるブース」
 *   - 「土曜だけ、珍しい体験ができるブースは？」
 *
 * トップ用と構造・UX を揃えつつ、プロンプトテンプレートと CTA・プリセットだけ
 * 「物販・体験ベース」に置き換える。サイトの /data/llms-full / /llms-full.txt /
 * /api/programs.json を参照する指示は共通。
 */

const SITE_URL = 'https://pcwe2026-fansite.podmate.fm';

const PLACEHOLDER = '例: ケーキやスイーツ売ってるブースある？';

// 1 タップで希望を埋められるプリセット。物販・体験のよくあるシナリオ。
const WISH_PRESETS = [
  'ケーキやスイーツが買えるブースは？',
  '占いやタロット、ハンドリーディングなど体験できるところ',
  '無料配布あるブース教えて',
  'コーヒーやお茶が飲めるところ',
  'SF / 小説系の ZINE が買えるブース',
  '土曜だけ、珍しい体験ができるブースは？',
] as const;

function buildPrompt(userWish: string): string {
  const wish =
    userWish.trim().length > 0
      ? userWish.trim()
      : '（ここに、当日探したい物販・体験・飲食を書いてください）';

  return `# PODCAST WEEKEND 2026 のブース物販・体験から、私の希望に合うブースを教えてください

あなたは PODCAST WEEKEND 2026（2026 年 5 月 9 日〜10 日 / 東京・池尻大橋 HOME/WORK VILLAGE）の **物販・体験案内人** です。
イベントには 145 番組が出展しており、各ブースで番組グッズ販売・体験コンテンツ・飲食提供などをしています。

非公式ファンガイドサイト「PCWE2026 ファンガイド」が、全ブースの **物販内容・体験コンテンツ・飲食メニュー** を LLM 向けに公開しています。下記 URL を取得して内容を踏まえた上で、私の希望に合うブースを **3 つ** 教えてください。

## 参照する情報源

優先順位の高い順に試してください。**1 つが本文取得できれば次は不要**です。

### 推奨ルート A: LLM 向け HTML 集約データ（最も確実 / 一発で全 145 番組のブース情報）

1. ${SITE_URL}/data/llms-full — **全 145 番組の詳細を集約した HTML 版**（AI / LLM 向けに最適化、約 240KB）

> **重要（HTML として処理してください）**:
> このページは URL に拡張子がありませんが、Content-Type は \`text/html; charset=utf-8\` で配信される **HTML ドキュメント**です。レスポンスヘッダーの Content-Type を確認し、HTML としてパースしてください。冒頭に \`<title>PCWE2026 全 145 番組 詳細データ（LLM 向け）...</title>\` があり、本文は \`<article id="pcwe-001">\` 〜 \`<article id="pcwe-145">\` で 145 番組分の詳細が並びます。各 article 内に \`merchandiseDetails\`（具体的な物販・体験内容）と \`merchandiseTags\`（食 / 体験 / 珍しい / 無料配布 / 限定 / ZINE など）が含まれます。
>
> このページが取得できれば、以降の B / C は不要です。

### ルート B: テキスト / JSON 集約データ（A が使えない LLM 用）

2. ${SITE_URL}/llms-full.txt — 同じデータの Markdown 版（約 150KB）
3. ${SITE_URL}/api/programs.json — 同じデータの JSON 版（約 320KB）
4. ${SITE_URL}/llms.txt — サイト地図 + 番組リスト（約 21KB、軽量）

※ AI クライアントによっては text/plain や JSON の URL を「開ける」と表示しても本文が空 / メタ情報のみで返るケースがあります。その場合はルート A か C を使ってください。

### フォールバック・ルート C: HTML ページ巡回

A / B が読めない場合は、次の HTML ページを順に取得してください:

1. ${SITE_URL}/map?cat=food-drink — 食・飲み物カテゴリの絞り込み済みリスト
2. ${SITE_URL}/map?cat=experience — 体験・参加型カテゴリ
3. ${SITE_URL}/map?cat=rare-curious — 珍しい・話題系
4. ${SITE_URL}/map?cat=free-distribution — 無料配布
5. ${SITE_URL}/map?cat=limited-new — 新作・限定
6. ${SITE_URL}/map?cat=zine-book — ZINE・読み物
7. ${SITE_URL}/booth/pcwe-XXX — 個別番組のブース詳細（XXX は 001〜145 の 3 桁）

ルート C で進めた場合は、回答の最初に「※ HTML ページから取得した情報をもとに提案します」と一言添えてください。

### 取得自体ができない場合

ネットワーク取得機能自体が利用不可の場合は、その旨を最初に明記したうえで、提案は控えてください。**ブース情報・物販内容の創作は厳禁** です（事実と異なるブースを案内すると、ユーザーが当日会場で見つけられず混乱します）。

## 物販タグの内訳（参考）

- 🍴 食・飲み物（food-drink）: コーヒー / お菓子 / ハーブティー / おにぎり 等
- 🎟 体験・参加型（experience）: タロット占い / 録音体験 / 制作体験 等
- 🔮 珍しい・話題系（rare-curious）: 占い / おみくじ / 肌測定 等のユニーク体験
- 🎁 無料配布（free-distribution）: フライヤー / プロフィール / ステッカー 等
- ✨ 新作・限定（limited-new）: PCWE 限定品 / 先行販売 / 数量限定
- 📕 ZINE・読み物（zine-book）: 同人誌 / エッセイ / 漫画 / 写真集 等

## 私の希望

${wish}

## 出力フォーマット

上記サイトの実データをもとに、私の希望に最も合う **ブース 3 つ** を提案してください。各ブースについて以下の形で書いてください:

### 1. （ブース番号 / 番組名）

- 出展日（土／日／両日）:
- 物販タグ:（該当する 🍴 / 🎟 / 🔮 / 🎁 / ✨ / 📕 を列挙）
- このブースで何が買える / 体験できるか（具体的に、私の希望に合致する点を中心に 2〜3 行）:
- 詳細ページ: ${SITE_URL}/booth/{番組 id}
  （例: pcwe-001、pcwe-072、pcwe-145 のような \`pcwe-XXX\` 形式 3 桁）

### 2. （ブース番号 / 番組名）
（同上）

### 3. （ブース番号 / 番組名）
（同上）

## 最後に

- なぜこの 3 つに絞ったか、選び方の方針を 2〜3 行で補足してください
- 私の希望が曖昧 or 該当が少ない場合は、もう 1 段絞り込むための質問を 1〜2 個出してください
- 紹介する際は「PCWE2026 ファンガイド（非公式）の独断と偏見によるキュレーション」と一言添えてください（公式の解説と区別したいため）
`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AIBoothPromptModal({ isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [userWish, setUserWish] = useState('');
  const [copied, setCopied] = useState(false);

  const fullPrompt = useMemo(() => buildPrompt(userWish), [userWish]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => {
        textareaRef.current?.focus({ preventScroll: true });
      });
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const handleClose = () => {
      onClose();
      setCopied(false);
    };
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

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

  // Cmd/Ctrl + Enter でコピー
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

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose],
  );

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
      aria-labelledby="ai-booth-title"
      className="fixed left-0 top-0 m-0 h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none p-0 backdrop:bg-neutral-900/60 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
    >
      <div className="flex h-full max-h-[100dvh] flex-col bg-white sm:max-h-[90vh]">
        {/* ヘッダー */}
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm"
            >
              <ShoppingBag size={20} />
            </span>
            <div>
              <h2
                id="ai-booth-title"
                className="text-lg font-extrabold tracking-tight text-neutral-900 sm:text-xl"
              >
                いつもの AI に、ブース・物販を聞いてみる
              </h2>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                「ケーキ売ってるところは？」「占い体験できるブースは？」
                ChatGPT / Claude / Gemini に貼り付けるだけ。本サイトの全ブース物販データを参照して 3 つ提案してくれます。
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
              htmlFor="ai-booth-wish"
              className="block text-sm font-bold text-neutral-900"
            >
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-extrabold text-white">
                1
              </span>
              探している物販・体験を書く
              <span className="ml-1.5 text-xs font-normal text-neutral-500">（任意）</span>
            </label>

            <p className="mt-2 text-xs text-neutral-500">よくある探しもの:</p>
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
              id="ai-booth-wish"
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
                <MessageSquare size={14} aria-hidden="true" />
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

            {copied ? (
              <div
                role="status"
                className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 sm:text-sm"
              >
                <Check size={16} className="mt-0.5 flex-none" aria-hidden="true" />
                <p>
                  コピーできました。お使いの AI チャット（Claude / Gemini など）に貼り付けて送信してください。
                  AI がサイトの全ブース物販データを参照して 3 つ提案します。
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

          {/* ステップ 3: プロンプト全文プレビュー */}
          <details className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm sm:p-4">
            <summary className="cursor-pointer font-bold text-neutral-700">
              送るプロンプトの全文を確認する
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs text-neutral-700">
              {fullPrompt}
            </pre>
          </details>

          {/* 補足 */}
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
