# Diabolife

競技ディアボロの大会結果を集約・閲覧するための Web サイトです。

## セットアップ

```bash
npm install
npm run dev
```

## データ構造

```
data/                          ソースデータ（手動管理）
  competitions.json            大会メタデータ
  results/{competition-id}/    部門ごとの結果 JSON
player-mappings.json           選手名寄せマッピング

    ↓ npm run build-data

public/data/                   自動生成（UI が参照）
  competitions.json
  results/{competition-id}.json
  players.json
```

## データの著作権について

本サイトに掲載されている大会結果データは、各大会主催者が公式に公開している結果 PDF に基づいています。大会結果の著作権は各大会主催者に帰属します。

- OIDC (Osaka International Diabolo Competition): https://diabolo.jp/OIDC/
- AJDC (全日本ディアボロ選手権大会): https://diabolo.jp/AJDC/

## 掲載情報の削除について

本サイトに掲載されているご自身の情報の削除を希望される場合は、GitHub Issue または以下の連絡先までご連絡ください。速やかに対応いたします。

- GitHub Issues: https://github.com/KIrie-0217/diabolog/issues
