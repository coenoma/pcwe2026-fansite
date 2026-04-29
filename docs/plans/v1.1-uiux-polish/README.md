# v1.1 UI/UX Polish — これ以上ない閲覧・操作・シェア体験へ

> **公開期限**: 2026-05-09（土）朝
> **対象ユーザー体験**: 「もう少し見ていたい」「これ友達に教えたい」「動作止まった？って一度も思わない」
> **位置づけ**: v1 MVP（基盤）の上に、144 番組規模で快適に使える UX を積み上げる

---

## 📊 進捗マトリクス

| # | 施策 | カテゴリ | 状態 | 期限 |
|---|---|---|---|---|
| **A. パフォーマンス** | | | | |
| A1 | ProgramCard を React.memo 化 | 速度 | ⬜ | 4/29 |
| A2 | 検索クエリに useDeferredValue 適用 | 速度 | ⬜ | 4/29 |
| A3 | 画像 DL 時に sharp で 200KB 以下に圧縮 | 速度 | ⬜ | 5/4 |
| A4 | next/image の sizes 属性最適化 | 速度 | ⬜ | 4/29 |
| A5 | 画像の loading="lazy" + decoding="async" | 速度 | ⬜ | 4/29 |
| **B. ローディング体験** | | | | |
| B1 | カードのスケルトン UI（画像読み込み中）| 優しさ | ⬜ | 4/29 |
| B2 | 画像のフェードイン（opacity 0→1）| 優しさ | ⬜ | 4/29 |
| B3 | 検索結果数の数字トランジション | 優しさ | ⬜ | 4/29 |
| **C. カードの番組らしさ** | | | | |
| C1 | vibe 別の背景アクセント（7 色）| 個性 | ⬜ | 4/29 |
| C2 | ジャンルアイコン表示（lucide）| 個性 | ⬜ | 4/29 |
| C3 | タグの 3 軸色分け（雰囲気/シーン/内容）| 個性 | ⬜ | 4/29 |
| C4 | カードホバー時の浮上 + Spotify ボタン出現 | 個性 | ⬜ | 4/29 |
| **D. シェア・拡散** | | | | |
| D1 | ランダムガチャ（ヘッダーに「サイコロ」ボタン）| 拡散 | ⬜ | 4/30 |
| D2 | 気になるリストの URL シェア機能 | 拡散 | ⬜ | 4/30 |
| D3 | 各番組詳細の X 投稿リンク（事前文面）| 拡散 | ⬜ | 4/30 |
| **E. 操作の気持ちよさ** | | | | |
| E1 | 「気になる」トグル時のハートパルス | 気持ちよさ | ⬜ | 4/29 |
| E2 | キーボードショートカット（/ で検索）| 気持ちよさ | ⬜ | 4/30 |
| E3 | スクロール時のスティッキー検索バー | 気持ちよさ | ⬜ | 4/29 |
| **F. レスポンシブ** | | | | |
| F1 | カード密度: SP 1 列 / Tab 2 / PC 3 / Wide 4 | 体験 | ⬜ | 4/29 |
| F2 | スマホでもタップ領域 44px 以上 | 体験 | ⬜ | 4/29 |
| **G. 感動を生む細部** | | | | |
| G1 | ヒーローに「あと N 日 X 時間」カウントダウン | 感動 | ⬜ | 4/29 |
| G2 | 検索クエリのハイライト表示 | 感動 | ⬜ | 4/30 |
| G3 | ヘッダーに「気になる N 件」バッジ | 感動 | ⬜ | 4/29 |

凡例: ⬜ 未着手 / 🟡 進行中 / ✅ 完了

---

## 🎯 設計原則（v1 から継承 + 強化）

1. **Podmate ブランディング** に忠実: 蛍光ペン下線・波・ブロブ・フェードアップ
2. **削ぎ落とす**: 同じ意味の動きを複数入れない（バウンス・スピン・回転禁止は継続）
3. **語りかける**: 「読み込み中…」じゃなく「ちょっと待ってね」
4. **背中を押す**: シェアボタンを「シェア」じゃなく「教えてあげる」

---

## A. パフォーマンス設計

### A1. React.memo で ProgramCard を最適化

検索・フィルタで結果が変わるたびに、再レンダリング対象を最小化。

```tsx
export const ProgramCard = memo(function ProgramCard({ program }: Props) { /* ... */ });
```

`program.id` は変わらないので、props 比較は浅い比較で十分。

### A2. useDeferredValue で検索の体感速度を上げる

```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => searchPrograms(programs, deferredQuery), [programs, deferredQuery]);
```

ユーザーがタイプしている間は input を即時更新（レスポンス最優先）、検索処理は次フレームに遅延。144 件でも体感ラグが消える。

### A3. 画像 DL 時の sharp 圧縮（公開前バッチ）

`scripts/download-thumbnails.ts` で：

1. 公式から `_thumbnail/XXX.jpeg` を取得
2. **sharp で 600×600 / quality 75 / WebP 派生も生成**
3. `public/thumbnails/{id}.jpeg`（fallback）+ `{id}.webp`（モダンブラウザ）

→ 1 枚 500KB → ~80KB。144 枚で 70MB → 11MB。LCP/総転送量改善。

### A4. next/image の sizes 最適化

カード画像の `sizes` を実レイアウトに合わせる:

```tsx
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

これによりブラウザが適切なサイズの画像のみ DL。

### A5. loading="lazy" + decoding="async"

`next/image` のデフォルトに加え、明示的に指定（priority な Hero のみ priority=true）。

---

## B. ローディング体験設計

### B1. スケルトン UI

カードの画像読み込み中に、**Tailwind の `animate-pulse`** で淡いグレーボックスを表示。

```tsx
{!loaded && <div className="absolute inset-0 animate-pulse bg-neutral-200" />}
<Image onLoad={() => setLoaded(true)} ... />
```

→ 「画像が出るまでカードが空っぽ」を回避。

### B2. 画像のフェードイン

`onLoad` イベントで `opacity: 0 → 1` を CSS transition で 300ms。スケルトンが滑らかに消える。

### B3. 検索結果数の数字トランジション

「{N} 番組」の数字部分に `transition-all` + `transform: scale` を当てて、変化時に微かに脈打たせる。

---

## C. カードの番組らしさ設計

### C1. vibe 別の背景アクセント

`fanGuide.vibe` に応じてカードに薄いトップライン（4px）を入れる:

| vibe | カラー |
|---|---|
| earnest | primary-400 |
| contemplative | neutral-400 |
| energetic | amber-400 |
| conversational | emerald-400 |
| intellectual | sky-400 |
| humorous | amber-300 |
| laid-back | neutral-300 |

→ 一覧でカードが「同じに見える」を回避。

### C2. ジャンルアイコン

`data/genres.json` の `icon` プロパティ（lucide 名）を使ってジャンルバッジに添える：

```tsx
<GenreIcon name={genresMap[genre].icon} className="w-3 h-3" />
{genre}
```

`GenreIcon` コンポーネントで lucide-react の動的インポート。

### C3. タグの 3 軸色分け

タグを 3 種に分類（雰囲気 / シーン / 内容）し、それぞれボーダー色を変える：

| 軸 | 色 |
|---|---|
| 雰囲気（笑える、内省的 等）| amber-300 ボーダー |
| シーン（朝向き、通勤 等）| sky-300 ボーダー |
| 内容（学べる、共感 等）| emerald-300 ボーダー |

`lib/tag-axis.ts` でタグ → 軸を判定する純粋関数。

### C4. ホバー時のカード浮上 + Spotify ボタン

PC でのカード hover:
- `translateY(-2px)` + `shadow-xl`
- Spotify リンクがあれば、画像右上に「🎧」ボタンが fade-in
- transition 300ms cubic-bezier

タッチデバイスは hover ではなく **詳細ページに直接遷移**（誤タップ回避）。

---

## D. シェア・拡散設計

### D1. ランダムガチャ

ヘッダー（or Hero）に「サイコロ」アイコンボタン。クリックで:

1. 全番組から 1 つランダム選択
2. 番組詳細ページへ即遷移
3. ボタンに軽いスピン演出（300ms）

「**今日のおすすめ**」感覚で、知らない番組と出会わせる。

### D2. 気になるリストの URL シェア

`/plan?ids=040,006,072` 形式で URL に状態を持たせる。

- 自分の気になるリストを URL で共有 → 友達が開くと同じリストが見える
- localStorage と同期: URL 優先、なければ localStorage
- 共有ボタンクリック時、URL を `navigator.clipboard.writeText` でコピー + トースト表示

### D3. 各番組の X シェアリンク

詳細ページに「**この番組を X でシェア**」ボタン:

```tsx
const tweet = `${program.shortName ?? program.name}\n${program.fanGuide.catchphrase}\n\n${SITE.url}/booth/${program.id}\n\n#PCWE2026`;
const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
```

事前文面付きなので、ユーザーは押すだけ。Podmate キャッチコピーが拡散される副次効果。

---

## E. 操作の気持ちよさ設計

### E1. 「気になる」トグル時のハートパルス

タップ時:
- ハートが `scale: 1 → 1.4 → 1`（200ms）
- `fill-primary-600` がジワっと染み込む

`@keyframes heart-pulse` を globals.css に定義、`animate-heart-pulse` クラスで適用。

### E2. キーボードショートカット

- `/`: 検索バーにフォーカス
- `Esc`: 検索クエリクリア
- `g h`: トップへ
- `g p`: 気になるリストへ

`useKeyboardShortcut` hook を `lib/` に純粋関数として（副作用 wrapper 別）。

### E3. スティッキー検索バー

スクロールで検索バーが画面上部に sticky。`position: sticky; top: 4rem;` （Header の下）。

スマホでは検索バーの **背景にぼかし** を入れて、上のカードが透けて見える。

---

## F. レスポンシブ設計

### F1. カード密度

| ビューポート | 列数 | カード幅 |
|---|---|---|
| ~640px (SP) | 1 列 | 100% |
| 640-1024px (Tab) | 2 列 | 50% |
| 1024-1280px (PC) | 3 列 | 33% |
| 1280px+ (Wide) | 4 列 | 25% |

### F2. タップ領域

- すべてのボタン・リンクで **min-height: 44px**
- カード全体がタップ可能（詳細遷移）
- カード内の「気になる」「Spotify」ボタンはタップで誤遷移しないよう `e.stopPropagation()`

---

## G. 感動を生む細部設計

### G1. ヒーローのカウントダウン

「**PCWE2026 まで、あと N 日 H 時間**」を Hero 下部に表示。

- クライアント側で計算（SSR では「もうすぐ」と仮表示、ハイドレ後に実数値）
- 5/9 当日は「**今日が初日です** 🎙️」
- 5/10 は「**最終日です**」
- イベント終了後は「**ありがとうございました**」

### G2. 検索クエリのハイライト

検索結果のキャッチコピー・タグ内のヒット部分を `<mark className="bg-amber-200">` で囲む。

`lib/highlight.ts` で安全にエスケープして React Element を生成（`dangerouslySetInnerHTML` 不使用）。

### G3. ヘッダーに「気になる N 件」バッジ

ヘッダーの「気になるリスト」リンクに、件数バッジを表示：

```tsx
気になるリスト
{count > 0 && <span className="ml-1 rounded-full bg-primary-600 px-1.5 text-xs text-white">{count}</span>}
```

ホーム画面起動時のボトムナビにも同様。

---

## 🔬 受け入れ基準

### Tier 1: 公開前必須

- [ ] 144 番組想定で `npm run dev` がスムーズに動く（検索クエリ入力で詰まらない）
- [ ] 画像 LCP < 2.5s（Vercel Edge）
- [ ] 全カードに vibe アクセント色が反映
- [ ] スマホでスクロール → カード → タップ → 詳細遷移が滑らか
- [ ] 「気になる」タップが気持ちいい（ハート脈動）

### Tier 2: 公開後 1 週間

- [ ] ランダムガチャからの番組詳細遷移が動く
- [ ] 気になるリストの URL シェアが動く
- [ ] X シェアボタンから事前文面付きでツイート画面が開く
- [ ] キーボード `/` で検索フォーカス

### Tier 3: 仕上げ

- [ ] Lighthouse Performance 90+
- [ ] Lighthouse Accessibility 95+
- [ ] PWA Lighthouse 100

---

## 🔗 関連

- 親計画: [v1-mvp-launch/README.md](../v1-mvp-launch/README.md)
- ブランディング: [Podmate DESIGN_GUIDELINE_BRANDING](../../../../podmate-next/docs/DESIGN_GUIDELINE_BRANDING.md)
- AGENTS.md: [../../../AGENTS.md](../../../AGENTS.md)

---

## 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-04-29 | 初版作成（A〜G の 23 施策）|
