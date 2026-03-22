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
  useMantineColorScheme,
  SegmentedControl,
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import "@mantine/charts/styles.css";
import { IconMedal } from "@tabler/icons-react";
import { useParams, Link } from "react-router-dom";
import { NationFlag } from "../components/NationFlag";
import { RoundedTableContainer } from "../components/RoundedTable";

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
  const { colorScheme } = useMantineColorScheme();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [compNames, setCompNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<string>("competition");

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/players.json`).then((r) => r.json()),
      fetch(`${base}data/competitions.json`).then((r) => r.json()),
    ]).then(([players, comps]: [PlayerData[], { id: string; shortName?: string }[]]) => {
      setPlayer(players.find((p) => p.id === id) ?? null);
      setCompNames(Object.fromEntries(comps.filter((c) => c.shortName).map((c) => [c.id, c.shortName!])));
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

  // group results by category
  const byCat = new Map<string, { name: string; results: PlayerResult[] }>();
  for (const r of player.results) {
    if (!byCat.has(r.categoryId)) {
      byCat.set(r.categoryId, { name: r.categoryName, results: [] });
    }
    byCat.get(r.categoryId)!.results.push(r);
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
          {(() => {
            const r = player.stats.bestRank;
            const dark = colorScheme === "dark";
            const medalStyle: Record<number, { color: string; textShadow?: string }> = {
              1: { color: dark ? "#FFD700" : "#B8860B", textShadow: dark ? "0 0 10px #FFD700" : undefined },
              2: { color: dark ? "#C0C0C0" : "#708090", textShadow: dark ? "0 0 10px #C0C0C0" : undefined },
              3: { color: dark ? "#CD7F32" : "#8B4513", textShadow: dark ? "0 0 10px #CD7F32" : undefined },
            };
            const style = r != null ? medalStyle[r] : undefined;
            return (
              <Text fw={700} size="xl" style={style}>
                {r ?? "-"}
              </Text>
            );
          })()}
        </Card>
        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed">Avg Rank</Text>
          <Text fw={700} size="xl">{player.stats.averageRank ?? "-"}</Text>
        </Card>
      </Group>

      {/* TODO: Enable when more competition data is available
      {trendChart}
      */}

      <Group justify="space-between" align="center">
        <Title order={3}>Results</Title>
        <SegmentedControl
          size="xs"
          value={viewMode}
          onChange={setViewMode}
          data={[
            { label: "By Competition", value: "competition" },
            { label: "By Category", value: "category" },
          ]}
        />
      </Group>

      {viewMode === "competition" ? (
        [...byComp.entries()].reverse().map(([compId, comp]) => (
        <Card key={compId} shadow="xs" padding="md" radius="md" withBorder>
          <Anchor component={Link} to={`/competitions/${compId}`} fw={500}>
            <Text fw={500} visibleFrom="sm">{comp.name}</Text>
            <Text fw={500} hiddenFrom="sm">{compNames[compId] ?? comp.name}</Text>
          </Anchor>
          <Text size="xs" c="dimmed" mb="sm">{comp.date}</Text>

          <RoundedTableContainer minWidth={400}>
            <Table highlightOnHover style={{ tableLayout: "fixed" }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={60} ta="center">Rank</Table.Th>
                  <Table.Th w={80} ta="right">Score</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Note</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {comp.results.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td ta="center" style={{ verticalAlign: "middle" }}>
                      {r.rank != null && medalColor[r.rank] ? (
                        <IconMedal size={26} color={medalColor[r.rank]} style={{ display: "inline-block" }} />
                      ) : (
                        r.rank ?? "-"
                      )}
                    </Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {r.totalScore ?? r.count ?? "-"}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Text visibleFrom="sm" size="sm">{r.categoryName}</Text>
                        <Text hiddenFrom="sm" size="sm">{r.categoryId.toUpperCase()}</Text>
                        {r.ageGroup && (
                          <Badge variant="light" size="xs">{r.ageGroup}</Badge>
                        )}
                      </Group>
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
          </RoundedTableContainer>
        </Card>
      ))
      ) : (
        [...byCat.entries()].map(([catId, cat]) => (
          <Card key={catId} shadow="xs" padding="md" radius="md" withBorder>
            <Text fw={500} visibleFrom="sm">{cat.name}</Text>
            <Text fw={500} hiddenFrom="sm">{catId.toUpperCase()}</Text>

            <RoundedTableContainer minWidth={400}>
              <Table highlightOnHover style={{ tableLayout: "fixed" }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={60} ta="center">Rank</Table.Th>
                    <Table.Th w={80} ta="right">Score</Table.Th>
                    <Table.Th>Competition</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[...cat.results].reverse().map((r, i) => (
                    <Table.Tr key={i}>
                      <Table.Td ta="center" style={{ verticalAlign: "middle" }}>
                        {r.rank != null && medalColor[r.rank] ? (
                          <IconMedal size={26} color={medalColor[r.rank]} style={{ display: "inline-block" }} />
                        ) : (
                          r.rank ?? "-"
                        )}
                      </Table.Td>
                      <Table.Td ta="right" fw={600}>
                        {r.totalScore ?? r.count ?? "-"}
                      </Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/competitions/${r.competitionId}?category=${r.categoryId}`} size="sm">
                          <Text visibleFrom="sm" size="sm">{r.competitionName}</Text>
                          <Text hiddenFrom="sm" size="sm">{compNames[r.competitionId] ?? r.competitionId.toUpperCase()}</Text>
                        </Anchor>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </RoundedTableContainer>
          </Card>
        ))
      )}
    </Stack>
  );
}
