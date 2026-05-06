# 02. データ構造と SVG 戦略

要件 #1（2 日間対応）#2（SVG 化）#6（JSON 再整備）に対する設計。

---

## 1. テント ↔ 番組のマッピング問題

### 1-1. 何が問題か

`data/programs.json` の `exhibition.boothNumber` は **論理ブース ID（pcwe-XXX の XXX、001〜144）** で、**物理ブース位置（テント 14 の A 区画）とは別概念**。

| 概念 | 例 | 用途 |
|---|---|---|
| 論理ブース ID | `041`, `122`, `139` | 公式の番組識別子。詳細ページ URL や API キーに使う |
| 物理ブース位置 | `14-A`, `25-D`, `7` | マップ上で「どこにあるか」を表す |
| 出展日 | `sat`, `sun`, `両日` | どの日のマップに出すか |

公式マップ JPEG（[Day1] / [Day2]）には **物理ブース位置は描かれているが、そこに座る論理ブース ID は描かれていない**。つまり「14-A の土曜は pcwe-XXX」「14-A の日曜は pcwe-YYY」というマッピング表が必要。

### 1-2. マッピング表の起こし方

#### 手段 A: 公式に問い合わせ
PCWE 公式（podcastexpo.jp）に「ブース配置データを CSV / JSON で頂けないか」依頼するのがベスト。手動コストゼロ。**コエノマ運営として依頼してみる価値あり**。

#### 手段 B: 公式ブースページの目視 + 出展日だけで推定（限定的）
`https://podcastexpo.jp/booth/pcwe-XXX/` には現状 `物理ブース位置` の記載がないようだ（要確認）。

#### 手段 C: 公式の「ブース番号付きフロアマップ画像」を OCR + 目視確認
公式が **`14-A: 番組X / 14-B: 番組Y` 表記入りのマップ** を発行していれば、それを画像 OCR + 手動補正でマッピング表を起こす。**最も現実的**。

#### 手段 D: 現地確認
当日 5/9 朝に会場で配布される紙パンフレットに記載されているはず。**当日確定でも OK な情報** として割り切る運用も可能。

### 1-3. データ表現

論理 ↔ 物理マッピングは **マッピング JSON ファイルで別管理**。

`data/booth-positions.json`:

```json
{
  "version": "1.0",
  "lastUpdated": "2026-05-08",
  "tents": [
    {
      "id": 1,
      "label": "1",
      "shape": "single",  // single | quad
      "polygon": [[12, 580], [60, 580], [60, 628], [12, 628]],
      "slots": {
        "sat": [{ "position": "1", "programId": "pcwe-001" }],
        "sun": [{ "position": "1", "programId": "pcwe-007" }]
      }
    },
    {
      "id": 14,
      "label": "14",
      "shape": "quad",
      "polygon": [[612, 712], [684, 712], [684, 784], [612, 784]],
      "slots": {
        "sat": [
          { "position": "14-A", "programId": "pcwe-014" },
          { "position": "14-B", "programId": "pcwe-068" },
          { "position": "14-C", "programId": "pcwe-122" },
          { "position": "14-D", "programId": "pcwe-130" }
        ],
        "sun": [
          { "position": "14-A", "programId": "pcwe-021" },
          { "position": "14-B", "programId": "pcwe-099" },
          { "position": "14-C", "programId": "pcwe-129" },
          { "position": "14-D", "programId": "pcwe-141" }
        ]
      }
    }
  ]
}
```

**設計のポイント**:
- `shape: 'single' | 'quad'` でテント形状を表現（公式マップを見ると 1〜7 と 18〜19, 28〜29, 30〜31 は single、その他は quad の模様）
- `polygon` は SVG ビューポート上の絶対座標 (4 点で矩形を表現)
- `slots[day]` は **その日のブース割当**。両日同番組なら `sat` と `sun` で同じ `programId`
- A/B/C/D の 4 区画は `quad` テントで `slots.sat` `slots.sun` が最大 4 件入る配列

### 1-4. programs.json との関係

両方向の参照を可能にする:

- `programs.json[].exhibition.position`（新規追加）: 物理位置を表す `'14-A' | 'sat:14-A,sun:25-C' | ...`
- `booth-positions.json` の `slots[day][i].programId`: 論理 ID

**どちらが正？**: `booth-positions.json` を一次データ。`programs.json.exhibition.position` は派生フィールドとしてビルド時に自動同期（`scripts/sync-booth-positions.ts` を新規作成）。

両日で位置が変わる番組への対応:

```json
"exhibition": {
  "days": ["sat", "sun"],
  "boothNumber": "002",
  "positionBySatSun": {
    "sat": "11-B",
    "sun": "11-B"  // 両日同位置の場合は同じ
  }
}
```

両日で別位置になる番組があるかは要確認。あれば `positionBySatSun` で吸収、なければ単一 `position` フィールドで OK。

---

## 2. SVG 戦略

### 2-1. なぜ SVG 自作か（要件 #2）

公式 JPEG をそのまま使う案を否定する理由:

| 評価軸 | JPEG | SVG（自作） |
|---|---|---|
| インタラクション | × タップ位置に対応するピンが取れない | ◎ パスごとにイベント |
| 拡大時の鮮明さ | × ぼやける | ◎ ベクター |
| ダーク対応 | × 固定色 | ◎ CSS で色変更可 |
| アクセシビリティ | × 画像 alt のみ | ◎ ARIA + tabindex |
| ファイルサイズ | △ 1.5 MB（縮小しても重い） | ◎ 数十 KB |
| ブランド統一感 | × 公式の色そのまま | ◎ コエノマの primary 色に統一 |
| メンテ性 | × 来年もまた起こす必要 | ◎ JSON 更新で済む |

### 2-2. SVG 生成戦略

**選択肢 A: 完全手動で SVG 作成（推奨）**

公式 JPEG を背景に置いた状態で、Figma / Illustrator で:
1. テントごとに矩形を描く
2. 番号テキストを配置
3. 各テントに `data-tent-id="14"` を付与
4. SVG エクスポート

→ 派生データとして `booth-positions.json` の `polygon` 座標を取り出せる
→ コエノマブランドの色 (`primary-500` 等) に書き換え

**選択肢 B: 完全プログラマティック生成**

JSON で定義したテント情報から React コンポーネントで `<rect>` を生成。

```tsx
{tents.map(tent => (
  <rect
    key={tent.id}
    x={tent.polygon[0][0]}
    y={tent.polygon[0][1]}
    width={tent.polygon[2][0] - tent.polygon[0][0]}
    height={tent.polygon[2][1] - tent.polygon[0][1]}
    role="button"
    tabIndex={0}
    aria-label={`テント ${tent.label}`}
    onClick={() => openSheet(tent)}
  />
))}
```

→ 公式マップとの位置合わせは目視 + 微調整
→ ロゴ・装飾文字（`PODCAST WEEKEND 2026`）は別途 SVG `<text>` で配置

**結論**: **A → B のハイブリッド**
- 装飾（ロゴ・文字・周囲の枠）は Figma で SVG 化して 1 ファイルに固定
- ブースのテント矩形・ピンは React で動的生成（フィルタ・ホバー・選択状態を CSS で制御するため）

### 2-3. SVG ビューポート設計

公式マップアスペクト比から:
- 公式 JPEG: 約 2000×1700 px
- SVG `viewBox`: `0 0 1000 850`（半分にスケール）
- レスポンシブ: `width="100%" height="auto"`、CSS で max-width 制御

主要要素:

```svg
<svg viewBox="0 0 1000 850" role="application" aria-label="PCWE2026 会場マップ">
  <title>PCWE2026 会場マップ（5月9日 土曜日）</title>
  <desc>HOME/WORK VILLAGE のブース配置。タップで番組情報。</desc>

  <!-- 背景・装飾 -->
  <g id="decoration">
    <rect ... /> <!-- 会場の外枠 -->
    <text ... >PODCAST WEEKEND 2026</text>
    <path ... /> <!-- メインゲート矢印 -->
  </g>

  <!-- テント・ブース（動的生成） -->
  <g id="booths">
    {/* React で各テント */}
  </g>

  <!-- ピン（フィルタで制御） -->
  <g id="pins">
    {/* 番組ピン */}
  </g>
</svg>
```

### 2-4. ズームとパン

**ライブラリ: `react-zoom-pan-pinch`** ([npm](https://www.npmjs.com/package/react-zoom-pan-pinch))
- タッチピンチ・スクロールホイール・ダブルタップ対応
- カスタム ズーム範囲（例: 0.5x 〜 4x）
- `disableDoubleClick={false}` で詳細ジャンプ

ズームレベル別の表示制御は CSS で:

```css
.tent-label { display: none; }
[data-zoom-level="medium"] .tent-label { display: block; }
[data-zoom-level="close"] .booth-quadrant { display: block; }
```

### 2-5. アクセシビリティとキーボードナビ

[01-best-practices §2-7](./01-best-practices.md#2-7-アクセシビリティ最初から) の実装:

- `<g role="list">` でブース全体をグループ
- 各テント `<g role="listitem" tabindex="0">` で Tab 可
- `aria-label="テント 14、4 つの番組: 14-A 〇〇、14-B △△..."`
- Enter/Space キーで `onClick` と同等のボトムシート起動
- Esc で閉じる
- アクセシブル代替: `/map?view=list` で **同じ情報がリストとして取れる** ように

---

## 3. データ拡張（programs.json への変更）

### 3-1. exhibition フィールド拡張

現状:
```json
"exhibition": {
  "days": ["sat"],
  "hours": "10:00 - 18:00",
  "area": "free",
  "boothNumber": "041"
}
```

拡張後:
```json
"exhibition": {
  "days": ["sat"],
  "hours": "10:00 - 18:00",
  "area": "free",
  "boothNumber": "041",
  "position": {
    "tent": 14,
    "slot": "B",
    "label": "14-B"
  },
  "positionBySatSun": null  // 両日で位置が変わる場合のみ {sat: ..., sun: ...}
}
```

### 3-2. 物販タクソノミーの追加（要件 #6）

`merchandiseDetails[i]` への追加 or 番組レベルでの集約:

**案A: 各 merchandiseDetail に categories**
```json
{
  "name": "薬膳茶",
  "categories": ["food-drink"],
  ...
}
```

**案B: 番組レベルで `merchandiseTags` 集約**
```json
"official": {
  ...
  "merchandiseDetails": [...],
  "merchandiseTags": ["food-drink", "experience-fortune"]
}
```

→ **案B 採用**（フィルタは番組単位なので、UI も番組単位の集約でよい）。詳細は [03-merchandise-taxonomy.md](./03-merchandise-taxonomy.md)。

### 3-3. 後方互換性

既存の `boothNumber` は維持（既存ページが参照中）。新規 `position` を追加。`positionBySatSun` がない場合は `position` を両日同じとして扱うフォールバック。

---

## 4. ファイル構成

```
data/
├── programs.json                # 既存。位置・タグ拡張
├── booth-positions.json         # 新規。テント形状 + 日別ブース割当
├── merchandise-taxonomy.json    # 新規。グッズ分類定義
└── sources/
    └── booth-map/
        ├── pcwe2026-day1.png    # 公式 JPEG（参照用）
        ├── pcwe2026-day2.png
        └── tent-positions.csv    # 手起こしの中間データ（OCR 結果）

public/
└── images/
    └── map/
        ├── decoration.svg       # 装飾レイヤー（ロゴ・枠・ゲート矢印）
        └── ...

src/
├── app/
│   └── map/
│       └── page.tsx             # /map ルート
└── components/
    └── map/
        ├── VenueMap.tsx          # SVG マップ全体
        ├── BoothPin.tsx          # 個別ブースピン
        ├── BoothBottomSheet.tsx  # ボトムシート
        ├── MapFilterChips.tsx    # フィルタチップ
        ├── MapSearchBar.tsx      # 検索バー
        └── DayToggle.tsx         # 土日切替
```

---

## 5. ライセンス・引用

公式 JPEG マップを **そのまま再配布する場合** はライセンス確認が必要。

ただし:
- **公式の配置情報を独自 SVG として再描画する** のは事実情報の利用にあたり、創作的表現の複製ではない（と整理）
- 公式の **デザイン要素（ロゴ・タイポ）は再利用しない**、独自デザインで構築
- マップ下部に「Based on PCWE2026 公式会場マップ／©PODCAST WEEKEND 2026」明記

→ 安全策として **公式 podcastexpo.jp に「公式マップを参考にした独自 SVG マップを fansite で公開してよいか」確認** を、コエノマ側から事前に依頼するのが最善。
