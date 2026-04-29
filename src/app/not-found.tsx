import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          ページが見つかりません
        </h1>
        <p className="mt-4 text-base text-neutral-600">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-primary-700 hover:shadow-md"
        >
          トップへ戻る
        </Link>
      </div>
    </section>
  );
}
