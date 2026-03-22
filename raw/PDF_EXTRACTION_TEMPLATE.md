# PDFリザルト処理指示書

提供されたPDFから大会結果データを抽出し、以下のルールに厳密に従ってファイルを生成し、ZIPでダウンロードさせてください。

PDFは2種類提供される場合があります:
- **結果PDF**（必須）: 各部門の競技結果
- **スケジュールPDF**（任意）: 大会の開催要項・タイムテーブル。提供された場合、大会正式名称・開催日・会場名・開催地を抽出して `_index.md` の「大会情報」セクションに記載する。

---

## 1. 出力ファイル構成

```
{大会名}/
  _index.md
  MI.csv
  WI.csv
  ...（部門ごとに1ファイル）
```

---

## 2. _index.md のフォーマット

```markdown
# {大会正式名称}

## 大会情報
- 開催日: {YYYY-MM-DD} ~ {YYYY-MM-DD}
- 会場: {会場名}
- 開催地: {都市名}

## オーバーオールクラス

* MI : 男子個人総合部門
* WI : 女子個人総合部門

## スペシャリストクラス

* 3D : 3ディアボロ部門

## チャレンジクラス

* 4D_low : 4ディアボロロウ部門

## ベストトリック賞
* {受賞者名}

## 特別賞
* {受賞者名}
```

- 「大会情報」セクションはスケジュールPDFが提供された場合のみ記載する。開催日は `YYYY-MM-DD` 形式、複数日は `~` で範囲を示す。開催地は都市名のみ（例: 大阪）
- 実際にPDFに存在する部門のみ記載する
- 賞の該当者がいない場合はセクションごと省略する

---

## 3. 部門略称テンプレート

以下のテンプレートに沿って略称を割り当てる。テンプレートにない新部門は、既存の命名規則（M=男子, W=女子, J=ジュニア, A=固定, B=ベアリング）を組み合わせて論理的な略称を新設する。

### オーバーオールクラス
| 略称 | 部門名 |
|------|--------|
| MI | 男子個人総合部門 |
| WI | 女子個人総合部門 |
| MJ | 男子個人総合ジュニア部門 |
| WJ | 女子個人総合ジュニア部門 |
| PI | ペア部門 |
| T | 団体部門 |

### スペシャリストクラス
| 略称 | 部門名 |
|------|--------|
| M1DHA | 男子1ディアボロ水平軸(固定)部門 |
| M1DHB | 男子1ディアボロ水平軸(ベアリング/ペアリング)部門 |
| 1DV | 男子1ディアボロ垂直軸部門 |
| W1D | 女子1ディアボロ部門 |
| 2DA | 2ディアボロ(固定)部門 |
| 2DB | 2ディアボロ(ベアリング/ペアリング)部門 |
| 3DA | 3ディアボロ(固定)部門 |
| 3DB | 3ディアボロ(ベアリング)部門 |
| 3D | 3ディアボロ部門 |
| 4D | 4ディアボロ部門 |

### チャレンジクラス
| 略称 | 部門名 |
|------|--------|
| 4D_low | 4ディアボロロウ部門 |
| P_pass | 2ディアボロペアパス部門 |
| M_nawatobi | 男子1ディアボロ縄跳び部門 |
| W_nawatobi | 女子1ディアボロ縄跳び部門 |
| M_ashimawari | 男子1ディアボロ足回り部門 |
| W_ashimawari | 女子1ディアボロ足回り部門 |

---

## 4. CSV フォーマット（最重要）

CSVは部門の採点方式によって3パターンに分かれる。ヘッダーは英語の単一キーワードのみ使用する。

### パターン A: ジャッジ採点（国際大会）

国籍列あり、名前は「漢字 英語」形式。

```
order,name,nationality,{scoring_columns...},total,rank
```

例（MI、年齢区分あり）:
```
age_group,order,name,nationality,difficulty,variety,stability,novelty,composition,base_score,execution_deduction,special_deduction,total,rank
16~18,2,津田 真叶,Manato Tsuda,JPN,25.0,7.3,7.3,8.3,15.5,20,2.5,0.0,80.9,1
```

例（3D、年齢区分なし）:
```
order,name,nationality,difficulty,stability,novelty,composition,execution_deduction,special_deduction,total,rank
4,曹子宏,CHO TZU HUNG,TWN,42.3,12.8,24.0,8.0,1.3,0.0,85.8,1
```

### パターン B: ジャッジ採点（国内大会）

国籍列なし、名前はカタカナ。

```
order,name,{scoring_columns...},total,rank
```

例:
```
order,name,difficulty,variety,stability,novelty,composition,total,rank
8,アゴウテンセイ,25.0,8.3,9.0,7.3,18.5,86.9,1
```

### パターン C: エンデュランス

```
name,nationality,count,rank,class
```

国内大会では nationality 列を省略:
```
name,count,rank,class
```

例:
```
name,nationality,count,rank,class
解梓翎,HSIEH TZU LING,TWN,607,1,
```

---

## 5. CSV ヘッダーの採点項目名ルール

PDFに記載された日本語の採点項目名を、以下の対応表で英語キーワードに変換してヘッダーに使用する。

| PDF上の日本語表記（揺れあり） | CSVヘッダー |
|------|------|
| 難易度 / 難易度点数 | difficulty |
| 多彩性 / 多彩性度 / 多彩性点数 | variety |
| 安定度 / 操作安定度 / 操作安定 / 操作安定点数 | stability |
| 新奇性 / 新奇性度 / 新奇性点数 | novelty |
| 構成 / 演技構成 / 演技構成点数 | composition |
| 同調性 | synchronization |
| 基礎点 | base_score |
| 実施減点 | execution_deduction |
| 特別減点 | special_deduction |
| 最終得点 / 最終得点点数 | total |
| 順位 | rank |
| 演技順 | order |
| 回数 | count |
| クラス | class |
| 年齢区分 | age_group |

この表にない採点項目がPDFに出現した場合は、英語の snake_case で論理的な名前をつける。

---

## 6. 名前の表記ルール

- **国際大会**: `name` 列に漢字名、`nationality` の直前に英語名を別列にせず、カンマ区切りの1セルに `漢字名` のみ記載する。英語名は nationality 列の直前の列として `name_en` 列を追加する。
  - 例: `...,津田 真叶,Manato Tsuda,JPN,...`
  - つまり: `name,name_en,nationality`
- **国内大会**: `name` 列にカタカナ名のみ。
- **ペア**: 2名を `/` で区切る。`name` と `name_en` 両方。
  - 例: `杜曼禎/陳巧薰,DU MAN-JHEN/CHEN CHIAO HSUN,TWN`
- **団体**: チーム名を記載。
  - 例: `臺灣鈴漾,Taiwan Ling Yang,TWN`

---

## 7. 特殊ケースの処理

| ケース | 処理 |
|--------|------|
| 棄権 / DNS / Did Not Start | rank を空、採点列をすべて空、total を `DNS` と記載 |
| 同点（同順位） | PDFに記載された順位をそのまま使用 |
| 備考（OIDC Record 等） | 末尾に `note` 列を追加して記載 |
| 国籍が混合チーム | nationality に `Mixed` と記載 |

棄権の例:
```
2,アマノ コウタ,,,,,,DNS,
```

---

## 8. 禁止事項

- ヘッダーに日本語を含めない
- ヘッダーを `"項目名,ItemName"` のような二重形式にしない
- 各項目の順位列（difficulty_rank 等）を含めない — 最終順位の `rank` 列のみ
- 参照記号、ハイパーリンク、ソース番号を含めない
- AIによる解説文、導入文、結びの言葉をファイル内に含めない
- BOM を付けない（UTF-8 BOMなし）

---

## 9. 出力

Python (Code Interpreter) で全ファイルを生成し、1つのZIPアーカイブとしてダウンロードリンクを提供する。
