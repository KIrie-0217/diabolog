import {
  AppShell,
  Group,
  Anchor,
  Container,
  Title,
  Burger,
  Stack,
  ActionIcon,
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
              <Title order={4}>Diabolife</Title>
            </Anchor>
            <Group gap="md" visibleFrom="sm">
              <Anchor component={Link} to="/competitions">
                Competitions
              </Anchor>
              <Anchor component={Link} to="/players">
                Players
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
          <ActionIcon variant="subtle" onClick={toggleColorScheme} size="lg">
            {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
