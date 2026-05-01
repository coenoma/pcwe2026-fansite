import type { Metadata } from 'next';
import Link from 'next/link';
import { CREATOR, EVENT, SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'プライバシーと取り扱いについて',
  description: '本サイトの個人情報・localStorage・番組情報の取り扱いと削除依頼について。',
  alternates: { canonical: '/privacy' },
};

export const dynamic = 'force-static';

export default function PrivacyPage() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          プライバシーと取り扱いについて
        </h1>
        <p className="mt-3 text-sm text-neutral-500">最終更新: 2026-04-29</p>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-neutral-700">
          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">1. 個人情報を扱いません</h2>
            <p className="mt-3">
              本サイトには会員登録機能・ログイン機能はありません。
              氏名・メールアドレス・住所等の個人情報を、サーバー側に送信・保存することはありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">2. localStorage の使用</h2>
            <p className="mt-3">
              「気になる」リストの管理のために、ブラウザの localStorage に <strong>番組 ID（例: pcwe-040）</strong> のみを保存します。
              この情報はお使いの端末内に留まり、サーバー側へ送信されません。別端末での自動同期もありません。
            </p>
            <p className="mt-3">
              localStorage の内容を消去したい場合、ブラウザの設定から本サイトのストレージを削除してください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">3. Service Worker のキャッシュ</h2>
            <p className="mt-3">
              本サイトは Progressive Web App（PWA）として動作します。Service Worker により、
              HTML / 画像 / JavaScript / JSON 等をブラウザにキャッシュし、オフライン時や通信状態が悪いときにも
              基本機能を使えるようにしています。
            </p>
            <p className="mt-3">
              キャッシュをクリアしたい場合は、ブラウザのキャッシュをクリアするか、ホーム画面に追加した PWA を一旦削除してください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">4. 番組情報の出典</h2>
            <p className="mt-3">
              番組名・概要・ロゴ画像・配信プラットフォームへのリンクは、
              <a href={EVENT.officialUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600">
                {EVENT.parentName}（{EVENT.name} / {EVENT.shortName}）公式サイト
              </a>
              および各番組の公開情報から引用しています。著作権は各番組制作者・公式に帰属します。
            </p>
            <p className="mt-3">
              本サイト独自に書き起こしている <strong>キャッチコピー / サブキャッチ / タグ / ジャンル分類 / ターゲットリスナー</strong> は、
              {CREATOR.company}（{CREATOR.representative}）によるファンとしてのキュレーションであり、公式情報の引用ではありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">5. 外部リンク</h2>
            <p className="mt-3">
              番組詳細ページから Spotify / Apple Podcasts / X / Instagram 等の外部サイトへリンクしていますが、
              本サイトは外部サイトの内容・プライバシーポリシーについて責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">6. 掲載取り下げ・修正のご依頼</h2>
            <p className="mt-3">
              番組制作者の方からの掲載取り下げ依頼、誤情報の修正依頼は、
              <Link href="/about" className="font-bold text-primary-600 underline decoration-transparent transition-colors hover:decoration-primary-600">
                このサイトについて
              </Link>
              ページのフォーム経由でお受けしています。24 時間以内（取り下げ）または 1 週間以内（修正）に対応します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-neutral-900">7. このサイトについて</h2>
            <p className="mt-3">
              本サイトは <strong>非公式</strong> のファンガイドであり、{EVENT.parentName} / {EVENT.name}（{EVENT.shortName}）公式とは無関係に
              {CREATOR.company} の代表（{CREATOR.representative}）がファン活動として制作・運営しています。
            </p>
          </section>

          <section className="rounded-xl bg-neutral-50 p-6 text-sm text-neutral-600">
            <p className="font-bold text-neutral-700">お問い合わせ</p>
            <p className="mt-2">
              本ページに関するお問い合わせは、X DM（
              <a href={CREATOR.twitterUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-transparent transition-colors hover:text-primary-600 hover:decoration-primary-600">
                {CREATOR.twitterHandle}
              </a>
              ）までお願いします。
            </p>
            <p className="mt-3 text-xs text-neutral-500">{SITE.unofficialNotice}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
