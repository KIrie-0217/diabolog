import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Stack,
  Table,
  Loader,
  Anchor,
  SegmentedControl,
  Select,
  Badge,
  Group,
} from "@mantine/core";
import { IconMedal } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { RoundedTableContainer } from "../components/RoundedTable";

const medalColor: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
const MIN_PLAYERS_FOR_CATEGORY = 15;
const PAGE_SIZE = 50;

type MedalEntry = { playerId: string; name: string; gold: number; silver: number; bronze: number; total: number };
type EnduranceEntry = { playerId: string; name: string; count: number; competitionId: string; competitionName: string; note?: string; class?: string; gender?: string };
type AppearanceEntry = { playerId: string; name: string; entries: number; competitions: number };

type RankingsData = {
  medals: {
    byCategory: Record<string, MedalEntry[]>;
    byClass: Record<string, MedalEntry[]>;
    overall: MedalEntry[];
  };
  endurance: Record<string, EnduranceEntry[]>;
  appearances: {
    byEntries: AppearanceEntry[];
    byCompetitions: AppearanceEntry[];
  };
};

type CatInfo = { id: string; name: string; class: string };

function RankCell({ rank }: { rank: number }) {
  return medalColor[rank] ? (
    <IconMedal size={22} color={medalColor[rank]} style={{ display: "inline-block" }} />
  ) : (
    <>{rank}</>
  );
}

type MedalSortKey = "total" | "gold" | "silver" | "bronze";

function MedalTable({ data, limit }: { data: MedalEntry[]; limit?: number }) {
  const [sortKey, setSortKey] = useState<MedalSortKey>("total");
  const sorted = [...data].sort((a, b) => {
    const diff = b[sortKey] - a[sortKey];
    if (diff !== 0) return diff;
    return b.total - a.total || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze;
  });
  const rows = limit ? sorted.slice(0, limit) : sorted;
  const thStyle = (key: MedalSortKey) => ({
    cursor: "pointer" as const,
    textDecoration: sortKey === key ? "underline" : undefined,
    fontWeight: sortKey === key ? 800 : undefined,
  });
  return (
    <RoundedTableContainer minWidth={400}>
      <Table highlightOnHover style={{ tableLayout: "fixed" }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={50} ta="center">#</Table.Th>
            <Table.Th>Player</Table.Th>
            <Table.Th w={55} ta="center" style={thStyle("total")} onClick={() => setSortKey("total")}>Total</Table.Th>
            <Table.Th w={50} ta="center" style={thStyle("gold")} onClick={() => setSortKey("gold")}><IconMedal size={18} color="#FFD700" style={{ display: "inline-block" }} /></Table.Th>
            <Table.Th w={50} ta="center" style={thStyle("silver")} onClick={() => setSortKey("silver")}><IconMedal size={18} color="#C0C0C0" style={{ display: "inline-block" }} /></Table.Th>
            <Table.Th w={50} ta="center" style={thStyle("bronze")} onClick={() => setSortKey("bronze")}><IconMedal size={18} color="#CD7F32" style={{ display: "inline-block" }} /></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((m, i) => (
            <Table.Tr key={m.playerId}>
              <Table.Td ta="center"><RankCell rank={i + 1} /></Table.Td>
              <Table.Td>
                <Anchor component={Link} to={`/players/${m.playerId}`} size="sm">{m.name}</Anchor>
              </Table.Td>
              <Table.Td ta="center" fw={sortKey === "total" ? 700 : 400}>{m.total}</Table.Td>
              <Table.Td ta="center" fw={sortKey === "gold" ? 700 : 400}>{m.gold || "-"}</Table.Td>
              <Table.Td ta="center" fw={sortKey === "silver" ? 700 : 400}>{m.silver || "-"}</Table.Td>
              <Table.Td ta="center" fw={sortKey === "bronze" ? 700 : 400}>{m.bronze || "-"}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </RoundedTableContainer>
  );
}

type AppSortKey = "entries" | "competitions";

function AppearancesTable({ data, limit }: { data: RankingsData["appearances"]; limit?: number }) {
  const [sortKey, setSortKey] = useState<AppSortKey>("entries");
  const sorted = [...data.byEntries].sort((a, b) => {
    const diff = b[sortKey] - a[sortKey];
    if (diff !== 0) return diff;
    return b.entries - a.entries || b.competitions - a.competitions;
  });
  const rows = limit ? sorted.slice(0, limit) : sorted;
  const thStyle = (key: AppSortKey) => ({
    cursor: "pointer" as const,
    textDecoration: sortKey === key ? "underline" : undefined,
    fontWeight: sortKey === key ? 800 : undefined,
  });
  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">Overall + Specialist categories only</Text>
      <RoundedTableContainer minWidth={400}>
        <Table highlightOnHover style={{ tableLayout: "fixed" }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50} ta="center">#</Table.Th>
              <Table.Th>Player</Table.Th>
              <Table.Th w={80} ta="center" style={thStyle("entries")} onClick={() => setSortKey("entries")}>Entries</Table.Th>
              <Table.Th w={120} ta="center" style={thStyle("competitions")} onClick={() => setSortKey("competitions")}>Comps</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((a, i) => (
              <Table.Tr key={a.playerId}>
                <Table.Td ta="center">{i + 1}</Table.Td>
                <Table.Td>
                  <Anchor component={Link} to={`/players/${a.playerId}`} size="sm">{a.name}</Anchor>
                </Table.Td>
                <Table.Td ta="center" fw={sortKey === "entries" ? 700 : 400}>{a.entries}</Table.Td>
                <Table.Td ta="center" fw={sortKey === "competitions" ? 700 : 400}>{a.competitions}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </RoundedTableContainer>
    </Stack>
  );
}

export function Rankings() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [catMap, setCatMap] = useState<Record<string, CatInfo>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("medals");
  const [medalScope, setMedalScope] = useState("all");
  const [medalCat, setMedalCat] = useState<string | null>(null);
  const [enduranceCat, setEnduranceCat] = useState<string | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/rankings.json`).then((r) => r.json()),
      fetch(`${base}data/competitions.json`).then((r) => r.json()),
    ]).then(([rankings, comps]: [RankingsData, { categories: { id: string; name: string; class: string }[] }[]]) => {
      setData(rankings);
      // build category name map from all competitions
      const map: Record<string, CatInfo> = {};
      for (const c of comps) for (const cat of c.categories) if (!map[cat.id]) map[cat.id] = cat;
      // merged endurance labels
      map["ashimawari"] = { id: "ashimawari", name: "1ディアボロ足回り部門", class: "challenge" };
      map["nawatobi"] = { id: "nawatobi", name: "1ディアボロ縄跳び部門", class: "challenge" };
      setCatMap(map);
      setLoading(false);
    });
  }, []);

  if (loading || !data) return <Loader />;

  // Filter categories with enough medalists
  const validCats = Object.entries(data.medals.byCategory)
    .filter(([, v]) => v.length >= MIN_PLAYERS_FOR_CATEGORY)
    .map(([id]) => id)
    .sort((a, b) => (catMap[a]?.name ?? a).localeCompare(catMap[b]?.name ?? b));

  const enduranceCats = Object.keys(data.endurance)
    .filter((id) => data.endurance[id].length > 0)
    .sort((a, b) => (catMap[a]?.name ?? a).localeCompare(catMap[b]?.name ?? b));

  if (!medalCat && validCats.length) setMedalCat(validCats[0]);
  if (!enduranceCat && enduranceCats.length) setEnduranceCat(enduranceCats[0]);

  return (
    <Stack gap="md" mt="md">
      <Title order={2}>Rankings</Title>

      <SegmentedControl
        value={tab}
        onChange={setTab}
        data={[
          { label: "🏅 Medals", value: "medals" },
          { label: "⏱ Endurance", value: "endurance" },
          { label: "📊 Appearances", value: "appearances" },
        ]}
      />

      {tab === "medals" && (
        <Stack gap="sm">
          <Select
            value={medalScope}
            onChange={(v) => setMedalScope(v ?? "all")}
            data={[
              { group: "All", items: [{ value: "all", label: "All Classes" }] },
              { group: "By Class", items: [
                { value: "class:overall", label: "Individual" },
                { value: "class:specialist", label: "Specialist" },
                { value: "class:challenge", label: "Challenge" },
              ]},
              { group: "By Category - Individual", items: validCats.filter((id) => catMap[id]?.class === "overall").map((id) => ({ value: `cat:${id}`, label: catMap[id]?.name ?? id })) },
              { group: "By Category - Specialist", items: validCats.filter((id) => catMap[id]?.class === "specialist").map((id) => ({ value: `cat:${id}`, label: catMap[id]?.name ?? id })) },
              { group: "By Category - Challenge", items: validCats.filter((id) => catMap[id]?.class === "challenge").map((id) => ({ value: `cat:${id}`, label: catMap[id]?.name ?? id })) },
            ]}
            searchable
          />

          {medalScope === "all" && <MedalTable data={data.medals.overall} limit={PAGE_SIZE} />}
          {medalScope.startsWith("class:") && <MedalTable data={data.medals.byClass[medalScope.slice(6)] ?? []} limit={PAGE_SIZE} />}
          {medalScope.startsWith("cat:") && <MedalTable data={data.medals.byCategory[medalScope.slice(4)] ?? []} limit={PAGE_SIZE} />}
        </Stack>
      )}

      {tab === "endurance" && (
        <Stack gap="sm">
          <Select
            value={enduranceCat}
            onChange={setEnduranceCat}
            data={enduranceCats.map((id) => ({ value: id, label: catMap[id]?.name ?? id }))}
            placeholder="Select category"
            searchable
          />
          {enduranceCat && (() => {
            const rows = (data.endurance[enduranceCat] ?? []).slice(0, PAGE_SIZE);
            const hasGender = rows.some((e) => e.gender);
            return (
            <RoundedTableContainer key={enduranceCat} minWidth={400}>
              <Table highlightOnHover style={{ tableLayout: "fixed" }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={50} ta="center">#</Table.Th>
                    <Table.Th>Player</Table.Th>
                    {hasGender && <Table.Th w={60} ta="center">Gender</Table.Th>}
                    <Table.Th w={80} ta="right">Count</Table.Th>
                    <Table.Th>Competition</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((e, i) => (
                    <Table.Tr key={`${e.playerId}-${e.competitionId}`}>
                      <Table.Td ta="center"><RankCell rank={i + 1} /></Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/players/${e.playerId}`} size="sm">{e.name}</Anchor>
                      </Table.Td>
                      {hasGender && (
                        <Table.Td ta="center">
                          {e.gender && <Badge variant="light" size="xs" color={e.gender === "M" ? "blue" : "pink"}>{e.gender}</Badge>}
                        </Table.Td>
                      )}
                      <Table.Td ta="right" fw={600}>
                        <Group gap={4} justify="flex-end">
                          {e.count}
                          {e.note && <Badge variant="light" size="xs" color="orange">{e.note}</Badge>}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/competitions/${e.competitionId}`} size="sm">
                          {e.competitionName}
                        </Anchor>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </RoundedTableContainer>
            );
          })()}
        </Stack>
      )}

      {tab === "appearances" && (
        <AppearancesTable data={data.appearances} limit={PAGE_SIZE} />
      )}
    </Stack>
  );
}
