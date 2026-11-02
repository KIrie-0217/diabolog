import { useEffect, useMemo, useState } from "react";
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
  MultiSelect,
  SimpleGrid,
  ColorSwatch,
  Paper,
  Skeleton,
  type ComboboxItem,
  type OptionsFilter,
} from "@mantine/core";
import { RadarChart } from "@mantine/charts";
import "@mantine/charts/styles.css";
import { IconMedal } from "@tabler/icons-react";
import { Link, useSearchParams } from "react-router-dom";
import { RoundedTableContainer } from "../components/RoundedTable";

const MAX_PLAYERS = 5;
const RANK_FLOOR = 10;
const PLAYER_COLORS = ["blue.6", "red.6", "teal.6", "orange.6", "grape.6"];
const medalColor: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

type PlayerResult = {
  competitionId: string;
  competitionName: string;
  date: string;
  categoryId: string;
  categoryName: string;
  categoryClass?: string;
  rank: number | null;
  ageGroup?: string;
  pairWith?: string;
};

type PlayerData = {
  id: string;
  name: string;
  aliases?: string[];
  nationality: string | null;
  results: PlayerResult[];
};

type Axis = { label: string; categoryIds: string[] };

const AXES: Axis[] = [
  { label: "個人総合", categoryIds: ["mi", "wi", "mj", "wj", "mh", "mhi", "mhs", "hmi", "mi-highschool"] },
  { label: "1DF", categoryIds: ["m1dha"] },
  { label: "1DB", categoryIds: ["m1dhb"] },
  { label: "1DV", categoryIds: ["1dv", "m1dv"] },
  { label: "2DF", categoryIds: ["2da"] },
  { label: "2DB", categoryIds: ["2db"] },
  { label: "3D", categoryIds: ["3d", "3da", "3db"] },
  { label: "女子1D", categoryIds: ["w1d"] },
];

const cssColor = (c: string) => `var(--mantine-color-${c.replace(".", "-")})`;

type AxisStat = { best: PlayerResult | null; count: number };

function axisStat(player: PlayerData, axis: Axis): AxisStat {
  let best: PlayerResult | null = null;
  let count = 0;
  for (const r of player.results) {
    if (!axis.categoryIds.includes(r.categoryId)) continue;
    count++;
    if (r.rank != null && (best?.rank == null || r.rank < best.rank)) best = r;
  }
  return { best, count };
}

// 1st -> 10, 10th or lower -> 1, no entry -> 0
const rankScore = (rank: number | null | undefined) =>
  rank == null ? 0 : Math.max(1, RANK_FLOOR + 1 - rank);

type TooltipRow = { axis: string } & Record<string, string | number>;

function RadarTooltip({
  payload,
  players,
  detailKey,
}: {
  payload?: { payload: TooltipRow }[];
  players: PlayerData[];
  detailKey: (id: string) => string;
}) {
  const row = payload?.[0]?.payload;
  if (!row) return null;
  return (
    <Paper withBorder shadow="md" p="xs" radius="md">
      <Text fw={600} size="sm" mb={4}>{row.axis}</Text>
      {players.map((p, i) => (
        <Group key={p.id} gap={6} wrap="nowrap">
          <ColorSwatch color={cssColor(PLAYER_COLORS[i])} size={10} />
          <Text size="xs">{p.name}:</Text>
          <Text size="xs" fw={500}>{row[detailKey(p.id)]}</Text>
        </Group>
      ))}
    </Paper>
  );
}

function RankCell({ rank }: { rank: number | null }) {
  if (rank == null) return <>-</>;
  if (medalColor[rank]) {
    return <IconMedal size={22} color={medalColor[rank]} style={{ display: "inline-block", verticalAlign: "middle" }} />;
  }
  return <>{rank}</>;
}

function TableSkeleton() {
  return (
    <Stack gap="xs">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} h={36} radius="sm" />
      ))}
    </Stack>
  );
}

function CompareSkeleton() {
  return (
    <>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {[0, 1].map((i) => (
          <Card key={i} shadow="xs" padding="md" radius="md" withBorder>
            <Skeleton h={16} w={100} mb="sm" />
            <Group justify="center" h={320}>
              <Skeleton circle h={240} />
            </Group>
          </Card>
        ))}
      </SimpleGrid>
      <Skeleton h={24} w={200} />
      <TableSkeleton />
    </>
  );
}

export function Compare() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [compNames, setCompNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/players.json`).then((r) => r.json()),
      fetch(`${base}data/competitions.json`).then((r) => r.json()),
    ]).then(([ps, comps]: [PlayerData[], { id: string; shortName?: string }[]]) => {
      setPlayers(ps.filter((p) => !p.id.startsWith("team:")));
      setCompNames(Object.fromEntries(comps.filter((c) => c.shortName).map((c) => [c.id, c.shortName!])));
      setLoading(false);
    });
  }, []);

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const selectedIds = useMemo(
    () =>
      (searchParams.get("ids") ?? "")
        .split(",")
        .filter((id) => id && playerMap.has(id))
        .filter((id, i, arr) => arr.indexOf(id) === i)
        .slice(0, MAX_PLAYERS),
    [searchParams, playerMap],
  );
  const selected = selectedIds.map((id) => playerMap.get(id)!);

  const setSelected = (ids: string[]) => {
    const next = new URLSearchParams(searchParams);
    if (ids.length) next.set("ids", ids.join(","));
    else next.delete("ids");
    setSearchParams(next, { replace: true });
  };

  const selectData = useMemo(() => players.map((p) => ({ value: p.id, label: p.name })), [players]);
  const searchIndex = useMemo(
    () => new Map(players.map((p) => [p.id, [p.name, ...(p.aliases ?? [])].join("\n").toLowerCase()])),
    [players],
  );
  const filterOptions: OptionsFilter = ({ options, search }) => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return (options as ComboboxItem[]).filter((o) => searchIndex.get(o.value)?.includes(q));
  };

  const compLabel = (r: PlayerResult) => compNames[r.competitionId] ?? r.competitionId.toUpperCase();

  // ---- Radar data ----
  // Only axes where at least one selected player has entered
  const axes = AXES.filter((a) => selected.some((p) => axisStat(p, a).count > 0));

  const rankData: TooltipRow[] = axes.map((axis) => {
    const row: TooltipRow = { axis: axis.label };
    for (const p of selected) {
      const { best } = axisStat(p, axis);
      row[p.id] = rankScore(best?.rank);
      row[`${p.id}__detail`] = best?.rank != null
        ? `${best.rank}位（${compLabel(best)} ${best.categoryName}）`
        : "出場なし";
    }
    return row;
  });

  const countData: TooltipRow[] = axes.map((axis) => {
    const row: TooltipRow = { axis: axis.label };
    for (const p of selected) {
      const { count } = axisStat(p, axis);
      row[p.id] = count;
      row[`${p.id}__detail`] = count > 0 ? `${count}回` : "出場なし";
    }
    return row;
  });
  const maxCount = Math.max(1, ...countData.flatMap((row) => selected.map((p) => row[p.id] as number)));

  const series = selected.map((p, i) => ({
    name: p.id,
    label: p.name,
    color: PLAYER_COLORS[i],
    opacity: 0.15,
  }));
  const detailKey = (id: string) => `${id}__detail`;

  // ---- Common categories (competition × category × ageGroup) ----
  type Row = {
    key: string;
    competitionId: string;
    competitionName: string;
    date: string;
    categoryId: string;
    categoryName: string;
    ageGroup?: string;
    entries: Map<string, PlayerResult>;
  };
  const rowMap = new Map<string, Row>();
  for (const p of selected) {
    for (const r of p.results) {
      const key = `${r.competitionId}|${r.categoryId}|${r.ageGroup ?? ""}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          key,
          competitionId: r.competitionId,
          competitionName: r.competitionName,
          date: r.date,
          categoryId: r.categoryId,
          categoryName: r.categoryName,
          ageGroup: r.ageGroup,
          entries: new Map(),
        });
      }
      const entries = rowMap.get(key)!.entries;
      const prev = entries.get(p.id);
      if (!prev || (r.rank != null && (prev.rank == null || r.rank < prev.rank))) entries.set(p.id, r);
    }
  }
  const commonRows = [...rowMap.values()]
    .filter((row) => row.entries.size >= 2)
    .sort((a, b) => b.date.localeCompare(a.date) || a.categoryId.localeCompare(b.categoryId));

  if (loading) return <Loader />;

  return (
    <Stack gap="md" mt="md">
      <Title order={2}>Compare</Title>

      <Stack gap={4}>
        <Group justify="space-between">
          <Text size="sm" fw={500}>Players</Text>
          {selectedIds.length > 0 && (
            <Text size="sm" c={selectedIds.length === MAX_PLAYERS ? "blue" : "dimmed"}>
              {selectedIds.length}/{MAX_PLAYERS}
            </Text>
          )}
        </Group>
        <MultiSelect
          aria-label="Players"
          placeholder={selectedIds.length < MAX_PLAYERS ? "Search by name..." : undefined}
          data={selectData}
          value={selectedIds}
          onChange={setSelected}
          maxValues={MAX_PLAYERS}
          filter={filterOptions}
          limit={30}
          searchable
          clearable
          hidePickedOptions
          nothingFoundMessage="Not found"
        />
      </Stack>

      {selected.length === 0 ? (
        <CompareSkeleton />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card shadow="xs" padding="md" radius="md" withBorder>
              <Text fw={500} mb="sm">Best Rank</Text>
              <RadarChart
                h={320}
                data={rankData}
                dataKey="axis"
                series={series}
                withLegend
                withTooltip
                withPolarRadiusAxis
                polarRadiusAxisProps={{ domain: [0, RANK_FLOOR], tick: false, axisLine: false, tickCount: RANK_FLOOR + 1 }}
                tooltipProps={{
                  content: ({ payload }) => (
                    <RadarTooltip payload={payload as never} players={selected} detailKey={detailKey} />
                  ),
                }}
              />
            </Card>
            <Card shadow="xs" padding="md" radius="md" withBorder>
              <Text fw={500} mb="sm">Appearances</Text>
              <RadarChart
                h={320}
                data={countData}
                dataKey="axis"
                series={series}
                withLegend
                withTooltip
                withPolarRadiusAxis
                polarRadiusAxisProps={{ domain: [0, maxCount], tick: false, axisLine: false }}
                tooltipProps={{
                  content: ({ payload }) => (
                    <RadarTooltip payload={payload as never} players={selected} detailKey={detailKey} />
                  ),
                }}
              />
            </Card>
          </SimpleGrid>

          <Title order={3}>Common Categories</Title>
          {selected.length < 2 ? (
            <TableSkeleton />
          ) : commonRows.length === 0 ? (
            <Text c="dimmed">No common categories</Text>
          ) : (
            <RoundedTableContainer minWidth={480 + selected.length * 100}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Competition</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th ta="center">Entries</Table.Th>
                    {selected.map((p, i) => (
                      <Table.Th key={p.id} ta="center">
                        <Group gap={6} justify="center" wrap="nowrap">
                          <ColorSwatch color={cssColor(PLAYER_COLORS[i])} size={10} />
                          <Anchor component={Link} to={`/players/${p.id}`} size="sm" lineClamp={1}>
                            {p.name}
                          </Anchor>
                        </Group>
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {commonRows.map((row) => {
                    const ranks = [...row.entries.values()].map((r) => r.rank).filter((r): r is number => r != null);
                    const bestRank = ranks.length ? Math.min(...ranks) : null;
                    return (
                      <Table.Tr key={row.key}>
                        <Table.Td>
                          <Anchor component={Link} to={`/competitions/${row.competitionId}`} size="sm">
                            {compNames[row.competitionId] ?? row.competitionName}
                          </Anchor>
                          <Text size="xs" c="dimmed">{row.date}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} wrap="nowrap">
                            <Anchor
                              component={Link}
                              to={`/competitions/${row.competitionId}?category=${row.categoryId}`}
                              size="sm"
                            >
                              {row.categoryName}
                            </Anchor>
                            {row.ageGroup && <Badge variant="light" size="xs">{row.ageGroup}</Badge>}
                          </Group>
                        </Table.Td>
                        <Table.Td ta="center">
                          <Text size="sm" c="dimmed">{row.entries.size}/{selected.length}</Text>
                        </Table.Td>
                        {selected.map((p) => {
                          const r = row.entries.get(p.id);
                          if (!r) return <Table.Td key={p.id} ta="center" c="dimmed">-</Table.Td>;
                          const isBest = r.rank != null && r.rank === bestRank;
                          const pairInSelection = r.pairWith && selectedIds.includes(r.pairWith);
                          return (
                            <Table.Td key={p.id} ta="center" fw={isBest ? 700 : undefined}>
                              <RankCell rank={r.rank} />
                              {r.pairWith && (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {pairInSelection ? (
                                    "ペア"
                                  ) : (
                                    <Anchor component={Link} to={`/players/${r.pairWith}`} size="xs">
                                      w/ {playerMap.get(r.pairWith)?.name ?? r.pairWith}
                                    </Anchor>
                                  )}
                                </Text>
                              )}
                            </Table.Td>
                          );
                        })}
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </RoundedTableContainer>
          )}
        </>
      )}
    </Stack>
  );
}
