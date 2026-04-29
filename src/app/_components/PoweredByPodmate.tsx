import { Mic } from 'lucide-react';
import { CREATOR } from '@/lib/constants';

/**
 * 「Powered by Podmate」さりげない動線
 *
 * podmate-next の PoweredByPodmate と同じトーンで、本サイトでは
 * 左下に固定表示するフローティングバッジ。
 * - スクロールに追従、邪魔にならない控えめサイズ
 * - スマホではボトムナビと被らないよう右下に小さく
 */
export function PoweredByPodmate() {
  return (
    <a
      href={CREATOR.serviceUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${CREATOR.serviceName}.fm を開く`}
      className="group fixed bottom-4 right-4 z-30 hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-neutral-600 shadow-md backdrop-blur transition-all active:scale-95 hover:border-primary-300 hover:text-primary-700 hover:shadow-lg lg:inline-flex"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0))' }}
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white transition-transform group-hover:rotate-12"
      >
        <Mic size={11} />
      </span>
      <span className="text-neutral-500 group-hover:text-neutral-700">made with</span>
      <span className="font-extrabold tracking-tight text-neutral-900">{CREATOR.serviceName}</span>
    </a>
  );
}
