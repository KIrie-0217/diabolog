# Diabolife - Architecture & Data Schema

Diabolo 競技の大会結果をまとめるサイトの設計ドキュメント。

## Architecture Decision

### 結論: 静的JSON + 静的サイト（バックエンド不要）

#### データ規模の見積もり

| 項目 | 値 |
|------|-----|
| 大会数/年 | 6 |
| 対象年数 | 10年 |
| 総大会数 | 約60 |
| 部門数/大会 | 約10 |
| 参加者数/部門 | 平均10人（最大20人） |
| 総結果レコード | 約6,000件（最大12,000件） |
| ユニーク競技者数 | 数百人規模 |

#### 静的JSONを選択した理由

- データ全量が数百KBに収まり、クライアントサイドでの集計も数msで完了する
- 年間増分が約600件と微小で、10年後も桁が変わらない
- サーバー維持費ゼロ、障害対応不要（GitHub Pages / Cloudflare Pages 等で無料ホスティング可能）
- バックエンドが必要になる条件（不特定多数のユーザー投稿、リアルタイム更新、数十万件超のデータ）に該当しない

## Data Flow

```
[正データ（手動管理）]
raw/*.csv + _index.md          大会結果の生データ（大会ごとのCSV + メタデータ）
player-mappings.json            選手名寄せ・国籍マッピング（手動確認済み）

        ↓  Agent skill（HIL: 新大会追加時に1回だけ実行、人間がレビュー）

[ソースデータ（コミット対象）]
data/competitions.json         大会メタデータ一覧
data/results/{id}/{category}.json  部門ごとの定義 + 結果

        ↓  npm run build-data（決定的処理、prebuild で自動実行）

[自動生成データ（.gitignore、public/data/ 配下）]
public/data/competitions.json       コピー
public/data/results/{id}.json       部門別JSONを統合
public/data/players.json            競技者別集計
```

### なぜ raw → JSON を Agent skill にしたか

- CSV のヘッダー名が大会ごとに異なる（`操作安定` vs `操作安定度` vs `安定度`）
- 採点方式が3パターン（ジャッジ / エンデュランス / チャレンジ）で CSV 構造が全く違う
- 年齢区分が列に埋まっている部門がある（MI の `16~18` / `19~`）
- `_index.md` のパース（部門名↔ファイル名対応、特別賞抽出）が必要
- AJDC の `challenge.csv` のように複数部門が1ファイルにまとまるケースがある
- スクリプトで吸収しようとすると大会ごとの設定ファイルが必要になり、保守コストが Agent 利用と変わらない
- 大会ごとに1回だけの作業なので、HIL で品質を担保できる

### なぜ players.json 生成をスクリプトにしたか

- 入力が正規化済み JSON なので決定的に処理できる
- CI に組み込んで `data/results/` 変更時に自動再生成できる
- 再現性が必要（同じ入力 → 常に同じ出力）

## Player Name Resolution

### 課題

同一選手が大会ごとに異なる表記で登場する：

- `谷岡 翔人 / Kaketo Tanioka` (OIDC) ↔ `タニオカ カケト` (AJDC) ↔ `タニオカカケト` (AJDC 1DV)
- `綿貫 峻介 / Shunsuke Watanuki` (OIDC) ↔ `ワタヌキ シュンスケ` (AJDC)

### ワークフロー

```
raw/*.csv
    ↓ (1) Agent skill: 全CSVから名前を抽出し、類似名をグルーピング候補として提示
    ↓
  候補リスト（人間がレビュー・修正）
    ↓
  player-mappings.json（コミット対象）
    ↓ (2) raw → JSON 変換時に参照して playerId を統一
    ↓
  data/results/*.json
```

### `player-mappings.json`

```json
{
  "tanioka-kaketo": {
    "canonicalName": "谷岡 翔人 / Kaketo Tanioka",
    "nationality": "Japan",
    "aliases": [
      "谷岡 翔人 / Kaketo Tanioka",
      "タニオカ カケト",
      "タニオカカケト"
    ]
  },
  "team:fly": {
    "canonicalName": "FLY",
    "nationality": "Taiwan",
    "aliases": ["FLY"]
  }
}
```

- キー（`playerId`）は英語名ベースで人間が決定
- `canonicalName` がサイト上の表示名
- `nationality` が選手の国籍（`players.json` 生成時に使用）
- `aliases` が CSV 上に出現する全表記
- 新大会追加時に Agent が新しい名前を既存エイリアスと照合し、候補を提示

### playerId の命名規則

| 参加形態 | playerId | 例 |
|----------|----------|-----|
| 個人 | `{lastname}-{firstname}` | `tanioka-kaketo` |
| ペア | `{player1-id}+{player2-id}` | `huang-shih-wei+huang-shih-rong` |
| 団体 | `team:{team-name}` | `team:fly`, `team:adc-flare` |

- ペアは必ず2名で構成されるため、個人IDの `+` 結合で表現する。各個人の `players.json` にもペア部門の結果が紐づく
- 団体はメンバー構成が不明なため、チーム名ベースの固有IDとする。個人ページへの紐づけは行わない

## Raw Data Convention

人間が大会ごとに用意するファイル群の規約。

### ディレクトリ構造

```
raw/
  {COMPETITION_ID}/
    _index.md              # 大会メタデータ（部門一覧、特別賞等）
    {CATEGORY_ID}.csv      # 部門ごとの結果（ファイル名 = _index.md の部門ID）
    challege.csv           # チャレンジ部門が混合の場合（AJDC パターン）
```

- `COMPETITION_ID` は `{大会略称}_{年}` 形式（例: `OIDC_2025`, `AJDC_2025`）
- CSV ファイル名は `_index.md` で定義した部門IDと一致させる

### `_index.md` のフォーマット

```markdown
# <大会正式名称>

## <クラス名>

* <部門ID> : <部門名（日本語）> (<部門名（英語）>)

## ベストトリック賞
* <受賞者名>

## 特別賞
* <受賞者名>
```

- 部門IDとCSVファイル名が対応する（`MI` → `MI.csv`）
- 英語名は国際大会のみ。国内大会は日本語名のみでよい
- ベストトリック賞・特別賞は該当者がいる場合のみ記載

### CSV のパターン

CSV のヘッダーは大会・部門ごとに異なるが、以下の3パターンに分類される。Agent skill がヘッダーから自動判別する。

#### パターン1: ジャッジ採点（国際大会）

```
演技順,名前(漢字/英語),国籍,<採点項目...>,最終得点,順位
```

- 年齢区分がある場合は先頭列に `年齢区分` が追加される（OIDC MI）
- 特別減点がある部門とない部門がある
- DNS の場合、採点列が空で末尾に `DNS` が入る

#### パターン2: ジャッジ採点（国内大会）

```
演技順No,名前,<採点項目...>,特別減点,最終得点,順位
```

- 国籍列なし、名前はカタカナ表記
- 棄権の場合、最終得点が `棄権`、順位が `-`

#### パターン3: エンデュランス

```
名前(漢字/英語),国籍,回数,順位[,クラス][,備考]
```

- 国内大会では国籍列なし
- クラス（A/B）がある部門とない部門がある
- 備考は記録更新等（`OIDC Record`, `Japan Record Tie` 等）

#### パターン4: チャレンジ混合（AJDC）

```
部門,名前,記録（回数）,順位,備考
```

- 複数部門が1ファイルにまとまっている

## Data Schema

### データ構造の概要

```
competition
  └── category                # 部門（大会ごとに異なる）
        ├── scoringType       # "judge" | "endurance" | "challenge"
        ├── ageGroups?        # 年齢区分（該当する部門のみ）
        ├── scoringCriteria[] # 採点項目（judge の場合）
        └── results[]         # 選手ごとの成績
```

### 採点方式（scoringType）

| Type | 説明 | 例 |
|------|------|-----|
| `judge` | 複数項目のジャッジ採点 → 最終得点で順位 | MI, WI, PI, T, 3DA, M1DHA... |
| `endurance` | 回数で順位決定 | 4D_low, P_pass, M_nawatobi, M_ashimawari |
| `challenge` | エンデュランス系だが複数部門が混合 | AJDC challenge |

### ファイル構成

```
data/                              # ソースデータ（コミット対象）
  competitions.json                # 大会メタデータ一覧
  results/
    {competition-id}/
      {category-id}.json           # 部門ごとの定義 + 結果
player-mappings.json               # 選手名寄せ（手動管理）
raw/                               # 大会結果の生データ（CSV + _index.md）

public/data/                       # 自動生成（.gitignore）
  competitions.json                # data/ からコピー
  results/
    {competition-id}.json          # 部門別JSONを統合
  players.json                     # 競技者別集計
```

### `data/competitions.json`

```json
[
  {
    "id": "oidc-2025",
    "name": "Osaka International Diabolo Competition 2025",
    "startDate": "2025-XX-XX",
    "endDate": "2025-XX-XX",
    "location": "大阪",
    "resultUrl": "https://diabolo.jp/OIDC/wp-content/uploads/OIDC2025_result.pdf",
    "awards": [
      { "type": "best-trick", "playerName": "タカハシ レンショウ" },
      { "type": "special", "playerName": "FLY" },
      { "type": "special", "playerName": "李翊華" }
    ]
  }
]
```

- `class`: `"overall"` | `"specialist"` | `"challenge"` — 大会内のクラス分類
- `ageGroups`: 年齢区分がある部門のみ。各年齢区分内で独立して順位がつく
- `scoringCriteria[].type`: `"add"` は加点項目、`"deduct"` は減点項目
- `hasClass`: nawatobi/ashimawari のようにクラス A/B 分けがある部門
- `enduranceUnit`: エンデュランス部門の計測単位

### `data/results/{competition-id}.json`

```json
{
  "competitionId": "oidc-2025",
  "categories": [
    {
      "categoryId": "mi",
      "name": "男子個人総合部門",
      "nameEn": "Men's Individual Division",
      "class": "overall",
      "scoringType": "judge",
      "ageGroups": [
        { "id": "junior", "name": "16~18" },
        { "id": "senior", "name": "19~" }
      ],
      "scoringCriteria": [
        { "id": "difficulty", "name": "難易度", "type": "add" },
        { "id": "variety", "name": "多彩性", "type": "add" },
        { "id": "stability", "name": "安定度", "type": "add" },
        { "id": "novelty", "name": "新奇性", "type": "add" },
        { "id": "composition", "name": "構成", "type": "add" },
        { "id": "base-score", "name": "基礎点", "type": "add" },
        { "id": "execution-deduction", "name": "実施減点", "type": "deduct" }
      ],
      "results": [
        {
          "rank": 1,
          "playerId": "tanioka-kaketo",
          "playerName": "谷岡 翔人 / Kaketo Tanioka",
          "nationality": "Japan",
          "ageGroup": "junior",
          "scores": {
            "difficulty": 26.5,
            "variety": 8.3,
            "stability": 9.0,
            "novelty": 7.5,
            "composition": 13.5,
            "base-score": 20,
            "execution-deduction": 0.2
          },
          "totalScore": 84.6,
          "status": "completed"
        }
      ]
    },
    {
      "categoryId": "4d-low",
      "name": "4ディアボロロウ部門",
      "nameEn": "4diabolo low endurance Division",
      "class": "challenge",
      "scoringType": "endurance",
      "enduranceUnit": "回数",
      "results": [
        {
          "rank": 1,
          "playerId": "chen-shuo-chen",
          "playerName": "陳辰碩 / Chen Shuo Chen",
          "nationality": "Taiwan",
          "count": 1304,
          "note": "OIDC Record",
          "status": "completed"
        }
      ]
    },
    {
      "categoryId": "m-nawatobi",
      "name": "男子1ディアボロ縄跳び部門",
      "nameEn": "Men's 1diabolo jump rope Division",
      "class": "challenge",
      "scoringType": "endurance",
      "enduranceUnit": "回数",
      "hasClass": true,
      "results": [
        {
          "rank": 1,
          "playerId": "chen-ying-jhen",
          "playerName": "陳穎禎 / CHEN YING JHEN",
          "nationality": "Taiwan",
          "count": 85,
          "class": "B",
          "status": "completed"
        }
      ]
    },
    {
      "categoryId": "t",
      "name": "団体部門",
      "nameEn": "Team Division",
      "class": "overall",
      "scoringType": "judge",
      "scoringCriteria": [
        { "id": "difficulty", "name": "難易度", "type": "add" },
        { "id": "synchronization", "name": "同調性", "type": "add" },
        { "id": "composition", "name": "演技構成", "type": "add" },
        { "id": "execution-deduction", "name": "実施減点", "type": "deduct" },
        { "id": "special-deduction", "name": "特別減点", "type": "deduct" }
      ],
      "results": [
        {
          "rank": 1,
          "playerId": "team:fly",
          "playerName": "FLY",
          "nationality": "Taiwan",
          "scores": {
            "difficulty": 36.5,
            "synchronization": 25.5,
            "composition": 27.3,
            "execution-deduction": 3.8,
            "special-deduction": 0.0
          },
          "totalScore": 85.5,
          "status": "completed"
        },
        {
          "rank": null,
          "playerId": "team:diabolosaid",
          "playerName": "鈴云 / Diabolosaid",
          "nationality": "Taiwan",
          "status": "dns"
        }
      ]
    }
  ]
}
```

- `status`: `"completed"` | `"dns"` (Did Not Start) | `"dsq"` (Disqualified)
- `scores`: judge 部門のみ。キーは `scoringCriteria[].id` に対応
- `count`: endurance 部門のみ
- `class`: クラス分けがある部門のみ（`"A"` / `"B"`）
- `ageGroup`: 年齢区分がある部門のみ。同部門の `ageGroups[].id` に対応
- `note`: 記録更新等の備考
- `nationality`: 国際大会のみ。国内大会（AJDC 等）では省略

### `data/players.json`（スクリプトで自動生成）

```json
[
  {
    "id": "tanioka-kaketo",
    "name": "谷岡 翔人 / Kaketo Tanioka",
    "results": [
      {
        "competitionId": "oidc-2025",
        "competitionName": "Osaka International Diabolo Competition 2025",
        "date": "2025-XX-XX",
        "categoryId": "mi",
        "categoryName": "男子個人総合部門",
        "ageGroup": "junior",
        "rank": 1,
        "totalScore": 84.6
      },
      {
        "competitionId": "ajdc-2025",
        "competitionName": "第十四回全日本ディアボロ選手権大会",
        "date": "2025-XX-XX",
        "categoryId": "mi",
        "categoryName": "男子個人総合部門",
        "rank": 2,
        "totalScore": 80.6
      }
    ],
    "stats": {
      "totalCompetitions": 2,
      "bestRank": 1,
      "averageRank": 1.5
    }
  }
]
```

- 各 `results` エントリは最終ラウンド（決勝があれば決勝）の代表値
- 大会名・部門名を非正規化して保持（結合不要にする）
- `stats` で基本集計値を事前計算
- endurance 部門の場合は `totalScore` の代わりに `count` を格納
- ペア部門の結果は両方の個人ページに紐づく（`pairWith` で相方を示す）
- 団体部門の結果は個人ページには紐づかない

## Frontend Display Logic

### 大会結果ページ

1. `competitions.json` から該当大会のメタデータを取得
2. `results/{id}.json` から部門定義と結果データを取得
3. 各部門の `scoringType` に応じてテーブル構造を切り替え:
   - `judge`: `scoringCriteria` の定義順にヘッダーを動的生成、`scores` から値を表示
   - `endurance`: 回数 + 順位のシンプルなテーブル
4. `ageGroups` がある場合、年齢区分ごとにテーブルを分割
5. `status: "dns"` の選手はスコア列を空にして表示

### 競技者ページ

`players.json` から該当選手のデータを取得し、大会履歴を時系列で表示。

## Open Questions

- [ ] 大会の日付（`date`）の正確な値 — オーナーが後日記入
- [ ] フロントエンドのフレームワーク選定
- [ ] ホスティング先（GitHub Pages / Cloudflare Pages / Vercel）
