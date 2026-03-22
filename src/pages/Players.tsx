import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Stack,
  Card,
  Group,
  TextInput,
  Chip,
  Loader,
  SimpleGrid,
  Pagination,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { NationFlag } from "../components/NationFlag";

type PlayerData = {
  id: string;
  name: string;
  aliases?: string[];
  nationality: string | null;
  stats: {
    totalCompetitions: number;
    bestRank: number | null;
    averageRank: number | null;
  };
};

export function Players() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const isMobile = window.innerWidth < 768;
  const perPage = isMobile ? 5 : 15;

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/players.json`)
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader />;

  const allNationalities = [...new Set(players.map((p) => p.nationality).filter(Boolean))] as string[];

  const filtered = players.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.aliases ?? []).some(a => a.toLowerCase().includes(search.toLowerCase()))) return false;
    if (nationalities.length > 0 && !nationalities.includes(p.nationality ?? "")) return false;
    return true;
  });

  return (
    <Stack gap="md" mt="md">
      <Title order={2}>Players</Title>

      <TextInput
        placeholder="Search by name..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
      />

      <Chip.Group multiple value={nationalities} onChange={(v) => { setNationalities(v); setPage(1); }}>
        <Group gap="xs">
          {allNationalities.map((n) => (
            <Chip key={n} value={n} size="xs">
              {n}
            </Chip>
          ))}
        </Group>
      </Chip.Group>

      <Text size="sm" c="dimmed">{filtered.length} players</Text>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="sm">
        {filtered.slice((page - 1) * perPage, page * perPage).map((p) => (
          <Card
            key={p.id}
            shadow="xs"
            padding="sm"
            radius="md"
            withBorder
            component={Link}
            to={`/players/${p.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Text fw={500} lineClamp={1}>{p.name}</Text>
            <Group gap="xs" mt={4}>
              {p.nationality && (
                <NationFlag nationality={p.nationality} />
              )}
              <Text size="xs" c="dimmed">
                {p.stats.totalCompetitions} comp · best #{p.stats.bestRank ?? "-"}
              </Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {filtered.length > perPage && (
        <Pagination total={Math.ceil(filtered.length / perPage)} value={page} onChange={setPage} mt="md" mx="auto" />
      )}
    </Stack>
  );
}
