import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Stack,
  Select,
  Table,
  Badge,
  Loader,
  Anchor,
  Group,
} from "@mantine/core";
import { IconMedal } from "@tabler/icons-react";
import { useParams, Link } from "react-router-dom";
import { NationFlag } from "../components/NationFlag";

const medalColor: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

function RankCell({ rank }: { rank: number | null }) {
  if (rank == null) return <Table.Td>-</Table.Td>;
  const color = medalColor[rank];
  return (
    <Table.Td>
      {color ? <IconMedal size={18} color={color} /> : rank}
    </Table.Td>
  );
}

type ScoringCriterion = { id: string; name: string; type: "add" | "deduct" };
type AgeGroup = { id: string; name: string };

type Result = {
  rank: number | null;
  playerId: string;
  playerName: string;
  nationality?: string;
  ageGroup?: string;
  scores?: Record<string, number>;
  totalScore?: number;
  count?: number;
  class?: string;
  note?: string;
  status: string;
};

type Category = {
  categoryId: string;
  name: string;
  nameEn?: string;
  class: string;
  scoringType: "judge" | "endurance" | "challenge";
  scoringCriteria?: ScoringCriterion[];
  ageGroups?: AgeGroup[];
  enduranceUnit?: string;
  hasClass?: boolean;
  results: Result[];
};

type CompetitionData = {
  competitionId: string;
  categories: Category[];
};

type CompetitionMeta = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  venue?: string;
  resultUrl?: string;
};

import "@mantine/charts/styles.css";

function JudgeTable({ cat }: { cat: Category }) {
  const criteria = cat.scoringCriteria ?? [];
  const groups = cat.ageGroups;

  const noHighlight = new Set(["base-score", "special-deduction"]);

  const getBestScores = (results: Result[]) => {
    const best: Record<string, number> = {};
    for (const c of criteria) {
      if (noHighlight.has(c.id)) continue;
      const vals = results
        .filter((r) => r.status !== "dns" && r.scores?.[c.id] != null)
        .map((r) => r.scores![c.id]);
      if (vals.length === 0) continue;
      best[c.id] = c.type === "deduct" ? Math.min(...vals) : Math.max(...vals);
    }
    return best;
  };

  const renderTable = (results: Result[], label?: string) => {
    const best = getBestScores(results);
    return (
      <Stack gap="sm" key={label}>
        {label && (
          <Text fw={500} size="sm">
            {label}
          </Text>
        )}
        <Table.ScrollContainer minWidth={600}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Rank</Table.Th>
                <Table.Th>Player</Table.Th>
                {cat.results[0]?.nationality && <Table.Th>Nationality</Table.Th>}
                {criteria.map((c) => (
                  <Table.Th key={c.id} ta="right">
                    {c.name}
                  </Table.Th>
                ))}
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.map((r, i) => (
                <Table.Tr key={i} c={r.status === "dns" ? "dimmed" : undefined}>
                  <RankCell rank={r.rank} />
                  <Table.Td>
                    <Anchor component={Link} to={`/players/${r.playerId}`} size="sm">
                      {r.playerName}
                    </Anchor>
                  </Table.Td>
                  {cat.results[0]?.nationality && (
                    <Table.Td><NationFlag nationality={r.nationality} /></Table.Td>
                  )}
                  {r.status === "dns" ? (
                    <>
                      {criteria.map((c) => (
                        <Table.Td key={c.id} />
                      ))}
                      <Table.Td ta="right">DNS</Table.Td>
                    </>
                  ) : (
                    <>
                      {criteria.map((c) => {
                        const val = r.scores?.[c.id];
                        const isBest = val != null && val === best[c.id];
                        return (
                          <Table.Td
                            key={c.id}
                            ta="right"
                            fw={isBest ? 700 : undefined}
                            c={isBest ? "blue" : undefined}
                          >
                            {val}
                          </Table.Td>
                        );
                      })}
                      <Table.Td ta="right" fw={600}>
                        {r.totalScore}
                      </Table.Td>
                    </>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    );
  };

  if (groups && groups.length > 0) {
    return (
      <Stack gap="md">
        {groups.map((g) =>
          renderTable(
            cat.results.filter((r) => r.ageGroup === g.id),
            g.name
          )
        )}
      </Stack>
    );
  }

  return renderTable(cat.results);
}

function EnduranceTable({ cat }: { cat: Category }) {
  const hasNationality = cat.results.some((r) => r.nationality);
  const hasClass = cat.results.some((r) => r.class);

  return (
    <Table.ScrollContainer minWidth={400}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Rank</Table.Th>
            <Table.Th>Player</Table.Th>
            {hasNationality && <Table.Th>Nationality</Table.Th>}
            {hasClass && <Table.Th>Class</Table.Th>}
            <Table.Th ta="right">{cat.enduranceUnit ?? "回数"}</Table.Th>
            <Table.Th>Note</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {cat.results.map((r, i) => (
            <Table.Tr key={i}>
              <RankCell rank={r.rank} />
              <Table.Td>
                <Anchor component={Link} to={`/players/${r.playerId}`} size="sm">
                  {r.playerName}
                </Anchor>
              </Table.Td>
              {hasNationality && <Table.Td><NationFlag nationality={r.nationality} /></Table.Td>}
              {hasClass && <Table.Td>{r.class}</Table.Td>}
              <Table.Td ta="right" fw={600}>
                {r.count}
              </Table.Td>
              <Table.Td>
                {r.note && (
                  <Badge variant="light" size="sm">
                    {r.note}
                  </Badge>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function CategoryContent({ cat }: { cat: Category }) {
  if (cat.scoringType === "judge") return <JudgeTable cat={cat} />;
  return <EnduranceTable cat={cat} />;
}

export function Competition() {
  const { id } = useParams();
  const [meta, setMeta] = useState<CompetitionMeta | null>(null);
  const [data, setData] = useState<CompetitionData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/competitions.json`).then((r) => r.json()),
      fetch(`${base}data/results/${id}.json`).then((r) => r.json()),
    ]).then(([comps, result]) => {
      setMeta(comps.find((c: CompetitionMeta) => c.id === id) ?? null);
      setData(result);
      setSelected(result.categories[0]?.categoryId ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loader />;
  if (!meta || !data) return <Text>大会が見つかりません</Text>;

  const classes = ["overall", "specialist", "challenge"] as const;
  const classLabel = { overall: "Overall", specialist: "Specialist", challenge: "Challenge" };

  const selectData = classes.flatMap((cls) => {
    const cats = data.categories.filter((c) => c.class === cls);
    if (cats.length === 0) return [];
    return [
      { group: classLabel[cls], items: cats.map((c) => ({ value: c.categoryId, label: c.name })) },
    ];
  });

  const activeCat = data.categories.find((c) => c.categoryId === selected);

  return (
    <Stack gap="md" mt="md">
      <div>
        <Title order={2}>{meta.name}</Title>
        <Group gap="sm">
          {(meta.venue || meta.location) && (
            <Text size="sm" c="dimmed">{meta.venue ?? meta.location}</Text>
          )}
          {meta.resultUrl && (
            <Anchor href={meta.resultUrl} target="_blank" size="sm">
              公式結果 PDF
            </Anchor>
          )}
        </Group>
      </div>

      <Select
        data={selectData}
        value={selected}
        onChange={setSelected}
        allowDeselect={false}
      />

      {activeCat && <CategoryContent cat={activeCat} />}
    </Stack>
  );
}
