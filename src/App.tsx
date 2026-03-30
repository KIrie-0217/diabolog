import {
  AppShell,
  Group,
  Anchor,
  Container,
  Burger,
  Stack,
  ActionIcon,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { Link, Outlet, useNavigate } from "react-router-dom";

export function App() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleNav = (to: string) => {
    navigate(to);
    close();
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 200,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Anchor component={Link} to="/" underline="never">
              <Group gap={8} align="center">
                <img
                  src={`${import.meta.env.BASE_URL}${colorScheme === "dark" ? "favicon-dark.svg" : "favicon-blue.svg"}`}
                  alt=""
                  height={32}
                />
                <Text fw={700} size="lg" c={colorScheme === "dark" ? "white" : "blue"} style={{ letterSpacing: "0.1em" }}>Diabolife</Text>
              </Group>
            </Anchor>
            <Group gap="md" visibleFrom="sm">
              <Anchor component={Link} to="/competitions">
                Competitions
              </Anchor>
              <Anchor component={Link} to="/players">
                Players
              </Anchor>
              <Anchor component={Link} to="/rankings">
                Rankings
              </Anchor>
              <ActionIcon variant="subtle" onClick={toggleColorScheme} size="lg">
                {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="sm">
          <Anchor onClick={() => handleNav("/competitions")}>
            Competitions
          </Anchor>
          <Anchor onClick={() => handleNav("/players")}>Players</Anchor>
          <Anchor onClick={() => handleNav("/rankings")}>Rankings</Anchor>
          <ActionIcon variant="subtle" onClick={toggleColorScheme} size="lg">
            {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">
          <Outlet />
          <Group justify="center" gap="md" mt="xl" mb="xs">
            <Anchor component={Link} to="/about" size="xs" c="dimmed">About</Anchor>
            <Anchor component={Link} to="/privacy" size="xs" c="dimmed">プライバシーポリシー</Anchor>
            <Anchor component={Link} to="/terms" size="xs" c="dimmed">利用規約</Anchor>
            <Anchor href="https://forms.gle/qoyL5nHw3aim4iae7" target="_blank" size="xs" c="dimmed">お問い合わせ</Anchor>
          </Group>
          <Text ta="center" size="xs" c="dimmed" mb="md">© 2025 Diabolife</Text>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
