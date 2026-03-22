# Convert Raw Competition Data to JSON

大会の raw データ（CSV + `_index.md`）を architecture.md のスキーマに沿った JSON に変換する。

## Trigger

ユーザーが新しい大会データの変換を依頼したとき。例:
- 「OIDC_2025 を JSON に変換して」
- 「raw/AJDC_2025 を変換して」

## Input

- `raw/{COMPETITION_ID}/` ディレクトリ
  - `_index.md` — 大会メタデータ（部門一覧、特別賞）
  - `*.csv` — 部門ごとの結果データ

- `player-mappings.json` — 既存の選手名寄せ・国籍マッピング（存在する場合）

- `architecture.md` — データスキーマ定義（Raw Data Convention / Data Schema セクション）

## Steps

### 1. _index.md を読み、大会メタデータを把握する

- 大会正式名称
- クラス分類（overall / specialist / challenge）と部門一覧
- 部門ID ↔ CSV ファイル名の対応
- 特別賞（ベストトリック賞、特別賞）

### 2. 各 CSV を読み、パターンを判別する

architecture.md の Raw Data Convention に基づき、各 CSV が以下のどれかを判別する:

- **ジャッジ採点（国際）**: `名前(漢字/英語)` + `国籍` 列あり
- **ジャッジ採点（国内）**: `名前` のみ、国籍なし、`演技順No`
- **エンデュランス**: `回数` 列あり
- **チャレンジ混合**: `部門` 列あり（複数部門が1ファイル）

### 3. scoringCriteria を CSV ヘッダーから抽出する

ジャッジ採点の場合、ヘッダーの採点項目列を `scoringCriteria` に変換する。

- `演技順` / `演技順No` / `名前` / `国籍` / `最終得点` / `順位` / `年齢区分` は採点項目ではない
- `実施減点` / `特別減点` は `"type": "deduct"`、それ以外は `"type": "add"`
- `基礎点` も `"type": "add"`
- 採点項目の `id` は以下のマッピングで正規化する:

| CSV ヘッダー（揺れあり） | scoringCriteria.id | 備考 |
|---|---|---|
| 難易度 | difficulty | |
| 多彩性 / 多彩性度 | variety | |
| 安定度 / 操作安定度 / 操作安定 | stability | |
| 新奇性 / 新奇性度 | novelty | |
| 構成 / 演技構成 | composition | |
| 同調性 | synchronization | 団体・ペア |
| 基礎点 | base-score | |
| 実施減点 | execution-deduction | deduct |
| 特別減点 | special-deduction | deduct |

未知のヘッダーが出現した場合はユーザーに確認する。

### 4. 年齢区分を検出する

CSV に `年齢区分` 列がある場合（OIDC MI パターン）:
- ユニークな値を `ageGroups` として抽出する
- 各結果に `ageGroup` を付与する

### 5. player-mappings.json と照合する

各選手名について:
- `player-mappings.json` に一致する alias があれば `playerId` を割り当てる
- 一致しない新しい名前はリストアップし、ユーザーに確認を求める
  - 既存選手の新しい表記か？ → alias に追加
  - 新規選手か？ → 新しいエントリを作成（playerId・nationality はユーザーが決定）

ペアの場合（名前に `/` 区切りで2名）:
- 各個人を別々に照合する
- `playerId` は `{player1-id}+{player2-id}` 形式

団体の場合（T 部門）:
- `playerId` は `team:{team-name}` 形式

### 6. JSON を生成する

architecture.md の Data Schema に従い、以下を生成する:

- `data/competitions.json` に大会エントリを追加（既存ファイルがあればマージ）
- `data/results/{competition-id}/{category-id}.json` を部門ごとに新規作成

特殊ケースの処理:
- **DNS**: `"status": "dns"`, スコア系フィールドは省略
- **棄権**（国内大会）: 最終得点が `棄権` → `"status": "dns"`
- **備考**: `note` フィールドに格納（`OIDC Record`, `Japan Record Tie` 等）
- **クラス分け**: `class` フィールドに `"A"` / `"B"` を格納

### 7. ユーザーにレビューを依頼する

生成した JSON をユーザーに提示し、以下を確認してもらう:
- 部門の分類（overall / specialist / challenge）が正しいか
- 採点項目のマッピングが正しいか
- 選手名の名寄せが正しいか
- DNS / 棄権の処理が正しいか

確認が取れたらファイルを書き出す。

### 8. TBD フィールドを補完する

ファイル書き出し後、`data/competitions.json` 内の TBD フィールドについてユーザーに確認する:

- `startDate` / `endDate`: 大会の開催日（`YYYY-MM-DD` 形式）
- `venue`: 会場名
- `location`: 開催地（都市名）
- `resultUrl`: 結果 PDF の URL
- `awards`: ベストトリック賞・特別賞（`_index.md` から取得済みなら確認のみ）

すべて埋まったら `npm run build-data` を実行して統合 JSON と players.json を再生成する。

## Output

- `data/competitions.json`（更新）
- `data/results/{competition-id}/{category-id}.json`（部門ごとに新規作成）
- `player-mappings.json`（更新 — 新しい選手・alias・nationality が追加された場合）

`public/data/` 配下の統合 JSON は `npm run build-data` で自動生成される。スキルが直接書き出すのは `data/` 配下のソースファイルのみ。

## Notes

- `competitions.json` の日付・会場等は初回書き出し時に `"TBD"` で出力し、Step 8 でユーザーに確認して埋める
- `competitions.json` が存在しない場合は新規作成する
- `player-mappings.json` が存在しない場合は新規作成する
