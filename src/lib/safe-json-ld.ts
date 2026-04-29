/**
 * JSON-LD を <script type="application/ld+json"> にインライン埋め込みするときの
 * XSS 防御エスケープ（純粋関数）。
 *
 * `</script>` 等が JSON 値に含まれていると HTML パーサが script タグ終了と
 * 誤認する可能性があるため、`<` `>` `&` を Unicode エスケープに置換する。
 * Unicode エスケープしてあれば JSON 仕様を保ったまま HTML として安全。
 *
 * 参照: https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements
 */

export function safeJsonLd<T>(data: T): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
