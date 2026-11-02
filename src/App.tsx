import {
  AppShell,
  Group,
  Anchor,
  Container,
  Burger,
  Stack,
  ActionIcon,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconMoon,
  IconTrophy,
  IconUsers,
  IconPodium,
  IconChartRadar,
} from "@tabler/icons-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/competitions", label: "Competitions", icon: IconTrophy },
  { to: "/players", label: "Players", icon: IconUsers },
  { to: "/rankings", label: "Rankings", icon: IconPodium },
  { to: "/compare", label: "Compare", icon: IconChartRadar },
];

export function App() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
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
            <Group gap="xs" visibleFrom="sm">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Tooltip key={to} label={label} withArrow>
                  <ActionIcon
                    component={Link}
                    to={to}
                    variant={isActive(to) ? "light" : "subtle"}
                    size="lg"
                    aria-label={label}
                  >
                    <Icon size={20} />
                  </ActionIcon>
                </Tooltip>
              ))}
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
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Anchor key={to} onClick={() => handleNav(to)} fw={isActive(to) ? 600 : undefined}>
              <Group gap={8} wrap="nowrap">
                <Icon size={18} />
                {label}
              </Group>
            </Anchor>
          ))}
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
