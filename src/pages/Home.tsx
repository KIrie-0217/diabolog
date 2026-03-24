import { Title, Text, Stack, Card, ActionIcon, Group, useMantineColorScheme } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export function Home() {
  const { colorScheme } = useMantineColorScheme();
  return (
    <Stack gap="xl" mt="xl">
      <Stack gap="xs" align="center">
        <Group gap={12} align="center">
          <img
            src={`${import.meta.env.BASE_URL}${colorScheme === "dark" ? "favicon-dark.svg" : "favicon-blue.svg"}`}
            alt=""
            height={56}
          />
          <Title order={1} c={colorScheme === "dark" ? undefined : "blue"} style={{ letterSpacing: "0.1em" }}>Diabolife</Title>
        </Group>
        <Text size="lg" c="dimmed">
          競技ディアボロの情報集約サイト
        </Text>
      </Stack>

      <Stack mt="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder component={Link} to="/competitions" style={{ textDecoration: "none", color: "inherit" }}>
          <Title order={3} mb="xs">
            Competitions
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
