import { Title, Text, Stack, Anchor } from "@mantine/core";

export function About() {
  return (
    <Stack gap="md" mt="md">
      <Title order={2}>About</Title>
      <Text>
        Diabolife は競技ディアボロの大会結果を集約・閲覧するための Web サイトです。
      </Text>

      <Title order={3}>データの著作権について</Title>
      <Text>
        本サイトに掲載されている大会結果データは、各大会主催者が公式に公開している結果
        PDF に基づいています。大会結果の著作権は各大会主催者に帰属します。
      </Text>
      <ul>
        <li>
          <Anchor href="https://diabolo.jp/OIDC/" target="_blank">
            OIDC (Osaka International Diabolo Competition)
          </Anchor>
        </li>
        <li>
          <Anchor href="https://diabolo.jp/AJDC/" target="_blank">
            AJDC (全日本ディアボロ選手権大会)
          </Anchor>
        </li>
      </ul>

      <Title order={3}>お問い合わせ・掲載情報の削除について</Title>
      <Text>
        本サイトに関するお問い合わせ、掲載されているご自身の情報の削除を希望される場合は、以下のフォームよりご連絡ください。速やかに対応いたします。
      </Text>
      <Anchor href="https://forms.gle/qoyL5nHw3aim4iae7" target="_blank">
        お問い合わせフォーム
      </Anchor>
    </Stack>
  );
}
