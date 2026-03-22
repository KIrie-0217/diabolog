import { Title, Text, Stack, Card, ActionIcon, Group } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <Stack gap="xl" mt="xl">
      <Stack gap="xs" ta="center">
        <Title order={1}>Diabolife</Title>
        <Text size="lg" c="dimmed">
          競技ディアボロの情報集約サイト
        </Text>
      </Stack>

      <Stack mt="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder component={Link} to="/competitions" style={{ textDecoration: "none", color: "inherit" }}>
          <Title order={3} mb="xs">
            Results
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            国内外の大会結果一覧
          </Text>
          <Group justify="flex-end"><ActionIcon variant="light" size="lg" radius="xl">
            <IconArrowRight size={18} />
          </ActionIcon></Group>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder component={Link} to="/players" style={{ textDecoration: "none", color: "inherit" }}>
          <Title order={3} mb="xs">
            Player Data
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            選手ごとの成績・大会履歴
          </Text>
          <Group justify="flex-end"><ActionIcon variant="light" size="lg" radius="xl">
            <IconArrowRight size={18} />
          </ActionIcon></Group>
        </Card>
      </Stack>
    </Stack>
  );
}
