import { Title, Text, Stack } from "@mantine/core";

export function Terms() {
  return (
    <Stack gap="md" mt="md">
      <Title order={2}>利用規約</Title>

      <Title order={3}>免責事項</Title>
      <Text>
        本サイトに掲載されている情報の正確性には万全を期していますが、その完全性・正確性を保証するものではありません。掲載情報の利用により生じた損害について、運営者は一切の責任を負いません。
      </Text>

      <Title order={3}>著作権</Title>
      <Text>
        大会結果データの著作権は各大会主催者に帰属します。本サイト独自のコンテンツ（デザイン、集計ロジック等）の著作権は運営者に帰属します。
      </Text>

      <Title order={3}>禁止事項</Title>
      <Text>
        本サイトのデータを商用目的で無断転載・再配布することを禁止します。個人利用・非営利目的での引用は、出典を明記の上で自由に行えます。
      </Text>

      <Title order={3}>改定</Title>
      <Text>
        本規約は予告なく変更される場合があります。変更後の規約は本ページに掲載した時点で効力を生じます。
      </Text>
    </Stack>
  );
}
