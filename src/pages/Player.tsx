import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Stack,
  Table,
  Badge,
  Loader,
  Anchor,
  Group,
  Card,
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import "@mantine/charts/styles.css";
import { IconMedal } from "@tabler/icons-react";
import { useParams, Link } from "react-router-dom";
import { NationFlag } from "../components/NationFlag";

const medalColor: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

type PlayerResult = {
  competitionId: string;
  competitionName: string;
  date: string;
  categoryId: string;
  categoryName: string;
  rank: number | null;
  ageGroup?: string;
  totalScore?: number;
  count?: number;
  pairWith?: string;
};

type PlayerData = {
  id: string;
  name: string;
  nationality: string | null;
  results: PlayerResult[];
  stats: {
    totalCompetitions: number;
    bestRank: number | null;
    averageRank: number | null;
  };
};

export function Player() {
  const { id } = useParams();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/players.json`)
      .then((r) => r.json())
      .then((players: PlayerData[]) => {
        setPlayer(players.find((p) => p.id === id) ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Loader />;
  if (!player) return <Text>Player not found</Text>;

  // group results by competition
  const byComp = new Map<string, { name: string; date: string; results: PlayerResult[] }>();
  for (const r of player.results) {
    if (!byComp.has(r.competitionId)) {
      byComp.set(r.competitionId, { name: r.competitionName, date: r.date, results: [] });
    }
    byComp.get(r.competitionId)!.results.push(r);
  }

  // build rank trend data: group by categoryId across competitions
  const trendCategories = new Map<string, { name: string; points: { compId: string; comp: string; rank: number }[] }>();
  for (const r of player.results) {
    if (r.rank == null || r.pairWith) continue;
    if (!trendCategories.has(r.categoryId)) {
      trendCategories.set(r.categoryId, { name: r.categoryName, points: [] });
    }
    trendCategories.get(r.categoryId)!.points.push({
      compId: r.competitionId,
      comp: r.competitionId.toUpperCase().replace(/-/g, " "),
      rank: r.rank,
    });
  }
  // only show categories with 2+ data points
  const trendData = [...trendCategories.entries()].filter(([, v]) => v.points.length >= 2);

  const trendColors = ["blue.6", "red.6", "teal.6", "orange.6", "grape.6", "cyan.6"];

  // @ts-expect-error: trendChart will be used when more data is available
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let trendChart = null;
  if (trendData.length > 0) {
    // build unified data keyed by compId (preserving order)
    const compOrder: string[] = [];
    const compLabels = new Map<string, string>();
    const dataMap = new Map<string, Record<string, number | string>>();
    for (const [, { points }] of trendData) {
      for (const p of points) {
        if (!dataMap.has(p.compId)) {
          compOrder.push(p.compId);
          compLabels.set(p.compId, p.comp);
          dataMap.set(p.compId, { competition: p.comp });
        }
      }
    }
    for (const [catId, { points }] of trendData) {
      for (const p of points) {
        dataMap.get(p.compId)![catId] = p.rank;
      }
    }
    const chartData = compOrder.map((c) => dataMap.get(c)!);
    const series = trendData.map(([catId], i) => ({
      name: catId,
      label: catId.toUpperCase(),
      color: trendColors[i % trendColors.length],
    }));

    trendChart = (
      <Card shadow="xs" padding="md" radius="md" withBorder>
        <Text fw={500} mb="sm">Rank Trend</Text>
        <LineChart
          h={250}
          data={chartData}
          dataKey="competition"
          series={series}
          yAxisProps={{ reversed: true, domain: [1, "auto"] }}
          curveType="monotone"
          connectNulls
        />
      </Card>
    );
  }

  return (
    <Stack gap="md" mt="md">
      <div>
        <Title order={2}>{player.name}</Title>
        {player.nationality && (
          <NationFlag nationality={player.nationality} />
        )}
      </div>

      <Group gap="md">
        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">Competitions</Text>
          <Text fw={700} size="xl">{player.stats.totalCompetitions}</Text>
        </Card>
        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">Best Rank</Text>
          <Text fw={700} size="xl">{player.stats.bestRank ?? "-"}</Text>
        </Card>
        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">Avg Rank</Text>
          <Text fw={700} size="xl">{player.stats.averageRank ?? "-"}</Text>
        </Card>
      </Group>

      {/* TODO: Enable when more competition data is available
      {trendChart}
      */}

      <Title order={3}>Results</Title>

      {[...byComp.entries()].reverse().map(([compId, comp]) => (
        <Card key={compId} shadow="xs" padding="md" radius="md" withBorder>
          <Anchor component={Link} to={`/competitions/${compId}`} fw={500}>
            {comp.name}
          </Anchor>
          <Text size="xs" c="dimmed" mb="sm">{comp.date}</Text>

          <Table.ScrollContainer minWidth={400}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Rank</Table.Th>
                  <Table.Th ta="right">Score</Table.Th>
                  <Table.Th>Note</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {comp.results.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      {r.categoryName}
                      {r.ageGroup && (
                        <Badge variant="light" size="xs" ml="xs">{r.ageGroup}</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {r.rank != null && medalColor[r.rank] ? (
                        <IconMedal size={18} color={medalColor[r.rank]} />
                      ) : (
                        r.rank ?? "-"
                      )}
                    </Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {r.totalScore ?? r.count ?? "-"}
                    </Table.Td>
                    <Table.Td>
                      {r.pairWith && (
                        <Anchor component={Link} to={`/players/${r.pairWith}`} size="xs">
                          w/ {r.pairWith}
                        </Anchor>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      ))}
    </Stack>
  );
}
