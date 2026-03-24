import { Title, Text, Stack } from "@mantine/core";

export function Privacy() {
  return (
    <Stack gap="md" mt="md">
      <Title order={2}>プライバシーポリシー</Title>

      <Title order={3}>収集する情報</Title>
      <Text>
        本サイトは、ユーザーの個人情報を直接収集することはありません。アクセス解析のために、ホスティングサービス（Vercel）が自動的に収集するアクセスログ（IPアドレス、ブラウザ情報等）が存在する場合があります。
      </Text>

      <Title order={3}>掲載している選手情報</Title>
      <Text>
        本サイトに掲載されている選手名・成績データは、各大会主催者が公式に公開している結果に基づいています。掲載されているご自身の情報の削除を希望される場合は、お問い合わせフォームよりご連絡ください。
      </Text>

      <Title order={3}>Cookie</Title>
      <Text>
        本サイトはカラーテーマの設定を保存するために localStorage を使用しています。トラッキング目的の Cookie は使用していません。
      </Text>

      <Title order={3}>改定</Title>
      <Text>
        本ポリシーは予告なく変更される場合があります。変更後のポリシーは本ページに掲載した時点で効力を生じます。
      </Text>
    </Stack>
  );
}
