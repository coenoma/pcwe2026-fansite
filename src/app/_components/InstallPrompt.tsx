'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Share, MoreVertical, Plus, Check } from 'lucide-react';
import { detectPlatform, isStandaloneDisplay, type Platform } from '@/lib/pwa';

/**
 * 「ホーム画面に追加してアプリっぽく使う」プロモのバナー
 *
 * 設計判断:
 * - SSR 互換: 初期は描画しない（dismissed=true）。useEffect 内で初めて環境判定
 * - 表示タイミング: マウント直後ではなく、ページに 5 秒滞在してから（直帰の邪魔をしない）
 * - 永続化: localStorage で「閉じた」or「インストール承諾」を 30 日保存
 * - in-app-webview / other / firefox は表示しない（PWA 不可なので意味なし）
 * - standalone（既にインストール / PWA で開いている）も非表示
 * - PoweredByPodmate（PC 右下フローティング）と被らないよう、PC では中央寄せの幅広バナー
 * - モバイルでは BottomNav（bottom-0 高さ 64px）の上に積む（bottom-16）
 *
 * UI:
 * - Chromium / Android: beforeinstallprompt イベントが拾えれば「追加する」ボタンが
 *   ネイティブのインストール ダイアログを起動。拾えなければ手動案内テキスト
 * - iOS: 「共有 → ホーム画面に追加」を絵的に説明
 * - macOS Safari: 「ファイル → Dock に追加」を一行で案内
 */

const STORAGE_KEY = 'pcwe2026-install-prompt-state-v1';
const REPROMPT_DAYS = 30;
const SHOW_AFTER_MS = 5_000;

interface BeforeInstallPromptEvent extends Event {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface DismissState {
  /** ISO 文字列。これから REPROMPT_DAYS 経つまで再表示しない */
  dismissedAt: string;
  /** ユーザーがインストールを承諾したかどうか（true なら再表示しない）*/
  installed: boolean;
}

function readDismissState(): DismissState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return JSON.parse(raw) as DismissState;
  } catch (error) {
    console.warn('⚠️ インストール プロモ状態の読み込みに失敗', error);
    return null;
  }
}

function writeDismissState(installed: boolean): void {
  try {
    const state: DismissState = { dismissedAt: new Date().toISOString(), installed };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('⚠️ インストール プロモ状態の保存に失敗（プライベートモードの可能性）', error);
  }
}

function shouldShowAgain(state: DismissState | null): boolean {
  if (state === null) return true;
  if (state.installed) return false;
  const elapsed = Date.now() - new Date(state.dismissedAt).getTime();
  return elapsed > REPROMPT_DAYS * 24 * 60 * 60 * 1000;
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  // 初期化（クライアントのみ）
  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const p = detectPlatform(navigator.userAgent);
    // PWA インストール案内が無意味な環境は早期リターン
    if (p === 'in-app-webview' || p === 'desktop-firefox' || p === 'other') return;

    if (!shouldShowAgain(readDismissState())) return;

    setPlatform(p);

    // 5 秒後に表示（ファーストビューの邪魔をしない）
    const showTimer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);

    // beforeinstallprompt（Chromium 系のみ発火）
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // インストール完了したらバナー閉じる + 永続化
    const installedHandler = () => {
      writeDismissState(true);
      setVisible(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    writeDismissState(false);
    setVisible(false);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (installEvent === null) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      writeDismissState(choice.outcome === 'accepted');
      setVisible(false);
    } catch (error) {
      console.warn('⚠️ インストール プロンプトの起動に失敗', error);
    }
  }, [installEvent]);

  if (!visible || platform === null) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-desc"
      className="fixed inset-x-2 bottom-[calc(theme(space.16)+theme(space.2))] z-40 mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:inset-x-4 lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 flex-shrink-0 rounded-xl shadow-sm"
        />

        <div className="min-w-0 flex-1">
          <p
            id="install-prompt-title"
            className="text-sm font-extrabold tracking-tight text-neutral-900 sm:text-base"
          >
            ホーム画面に追加して、アプリのように使う
          </p>
          <p
            id="install-prompt-desc"
            className="mt-1 text-xs text-neutral-600 sm:text-sm"
          >
            <PromptMessage platform={platform} hasInstallEvent={installEvent !== null} />
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <PromptCta
              platform={platform}
              installEvent={installEvent}
              onInstall={handleInstallClick}
              onDismiss={handleDismiss}
            />
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              あとで
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="閉じる"
          className="flex-shrink-0 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PromptMessage({ platform, hasInstallEvent }: { platform: Platform; hasInstallEvent: boolean }) {
  // Chromium 系で beforeinstallprompt が拾えた場合は OS ネイティブのダイアログが出る
  if (hasInstallEvent && (platform === 'desktop-chromium' || platform === 'android')) {
    return <>下のボタンから 1 タップでホーム画面に追加できます。当日も素早く呼び出せて便利。</>;
  }

  switch (platform) {
    case 'ios':
      return (
        <>
          画面下の <Share size={12} className="inline align-middle" aria-label="共有ボタン" /> から「ホーム画面に追加」を選ぶと、当日も素早く開けます。
        </>
      );
    case 'android':
      return (
        <>
          ブラウザのメニュー <MoreVertical size={12} className="inline align-middle" aria-label="メニュー" /> から「ホーム画面に追加」or「アプリをインストール」を選択。
        </>
      );
    case 'desktop-chromium':
      return (
        <>
          アドレスバー右端の <Plus size={12} className="inline align-middle" aria-label="インストール" /> アイコンから、デスクトップアプリとして追加できます。
        </>
      );
    case 'desktop-safari':
      return (
        <>
          メニューバーの「ファイル」→「Dock に追加」で、Mac のアプリとして追加できます（macOS Sonoma 以降）。
        </>
      );
    default:
      return null;
  }
}

function PromptCta({
  platform,
  installEvent,
  onInstall,
}: {
  platform: Platform;
  installEvent: BeforeInstallPromptEvent | null;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  // beforeinstallprompt が拾えた = ネイティブ ダイアログを起動できる
  if (installEvent !== null && (platform === 'desktop-chromium' || platform === 'android')) {
    return (
      <button
        type="button"
        onClick={onInstall}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md active:scale-95"
      >
        <Check size={14} aria-hidden="true" />
        ホームに追加する
      </button>
    );
  }
  // それ以外（iOS / 手動 Chromium / Safari）はテキスト案内のみ
  return null;
}
