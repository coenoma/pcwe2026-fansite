import type { Metadata } from 'next';
import { CREATOR, EVENT, FORM_FIX_URL, FORM_TAKEDOWN_URL, SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'このサイトについて',
  description: '非公式スタンス、削除依頼方法、情報修正依頼の受付。',
};

export const dynamic = 'force-static';

export default function AboutPage() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          このサイトについて
        </h1>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-neutral-700">
          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">非公式ファンガイドです</h2>
            <p className="mt-3">
              このサイトは <a href={EVENT.officialUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 hover:opacity-70">{EVENT.name}（{EVENT.shortName}）</a> の出展番組を、ファンの視点でまとめた <strong>非公式</strong> のガイドサイトです。公式とは無関係に、{CREATOR.company} のファウンダー（{CREATOR.founder}）がファン活動として制作しました。
            </p>
            <p className="mt-3">
              番組情報・画像は各番組制作者と公式に帰属します。本サイトのキャッチコピー・タグ・ジャンル分類は、ファンとしてのキュレーションです（公式情報の引用ではなく、独自に書き起こしています）。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">作った理由</h2>
            <p className="mt-3">
              144 番組という規模に対して、公式の「番組名 + ロゴ + 概要」だけでは、行く前に「これ刺さる」を見つけにくい。配信者側からも「リスナー以外に番組を知ってもらう機会」がもっとあっていい。
            </p>
            <p className="mt-3">
              そう思って、勝手に作りました。当日が、もっと楽しみになりますように。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">掲載取り下げのご依頼</h2>
            <p className="mt-3">
              番組制作者の方で「載せないでほしい」というご要望があれば、すぐに削除します。下記フォームからご連絡ください。
              <br />
              <span className="text-sm text-neutral-500">受付後、24 時間以内に削除し、ご連絡先にご返信します。</span>
            </p>
            <FormButton url={FORM_TAKEDOWN_URL} label="掲載取り下げ依頼フォーム" />
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">情報修正・追加依頼</h2>
            <p className="mt-3">
              情報の誤り・配信先 URL の追加・キャッチコピーへの違和感など、修正したい点があればこちら。番組制作者の方もリスナーの方も大歓迎です。
              <br />
              <span className="text-sm text-neutral-500">内容を確認のうえ、可能なものから順次反映します（数日〜1 週間目安）。</span>
            </p>
            <FormButton url={FORM_FIX_URL} label="情報修正・追加依頼フォーム" />
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">その他のご質問・ご感想</h2>
            <p className="mt-3">
              X DM（<a href={CREATOR.twitterUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 hover:opacity-70">{CREATOR.twitterHandle}</a>）までお気軽にどうぞ。
            </p>
          </section>

          <section className="rounded-xl bg-neutral-50 p-6 text-sm text-neutral-600">
            <p className="font-bold text-neutral-700">制作</p>
            <p className="mt-2">
              {CREATOR.company} ファウンダー: {CREATOR.founder}
              <br />
              <a href={CREATOR.serviceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">
                Podmate.fm — ポッドキャスト運営の、おとも。
              </a>
            </p>
            <p className="mt-3 text-xs text-neutral-500">{SITE.unofficialNotice}</p>
          </section>
        </div>
      </div>
    </section>
  );
}

function FormButton({ url, label }: { url: string; label: string }) {
  if (url === '') {
    return (
      <p className="mt-4 inline-flex rounded-xl bg-neutral-200 px-5 py-3 text-sm font-bold text-neutral-500">
        {label}（フォーム準備中）
      </p>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
    >
      {label} →
    </a>
  );
}
