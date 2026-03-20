import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Anchor,
  Timeline,
  Loader,
} from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import { Link } from "react-router-dom";

type Competition = {
  id: string;
  name: string;
  shortName?: string;
  startDate?: string;
  location?: string;
  venue?: string;
  resultUrl?: string;
  categories: { id: string; class: string }[];
};

export function Competitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/competitions.json`)
      .then((r) => r.json())
      .then((data) => {
        setCompetitions(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader />;

  // group by year (from id like "ajdc-2025")
  const byYear = new Map<string, Competition[]>();
  for (const c of competitions) {
    const year = c.id.match(/\d{4}/)?.[0] ?? "Unknown";
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(c);
  }
  // sort within each year by startDate descending
  for (const comps of byYear.values()) {
    comps.sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
  }
  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <Stack gap="xl" mt="md">
      <Title order={2}>Competitions</Title>

      <Timeline active={-1} bulletSize={28} lineWidth={2}>
        {years.map((year) => (
          <Timeline.Item
            key={year}
            bullet={<IconTrophy size={14} />}
            title={<Title order={3}>{year}</Title>}
          >
            <Stack gap="sm" mt="xs">
              {byYear.get(year)!.map((comp) => (
                <Card
                  key={comp.id}
                  shadow="xs"
                  padding="md"
                  radius="md"
                  withBorder
                >
                  <Stack gap={4}>
                    <Anchor
                      component={Link}
                      to={`/competitions/${comp.id}`}
                    >
                      <Text fw={500} visibleFrom="sm">{comp.name}</Text>
                      <Text fw={500} hiddenFrom="sm">{comp.shortName ?? comp.name}</Text>
                    </Anchor>
                    {comp.location && (
                      <>
                        <Text size="xs" c="dimmed" visibleFrom="sm">{comp.venue ?? comp.location}</Text>
                        <Text size="xs" c="dimmed" hiddenFrom="sm">{comp.location}</Text>
                      </>
                    )}
                    <Group gap="xs">
                      <Badge variant="light" size="xs">
                        {comp.categories.filter((c) => c.class === "overall").length} overall
                      </Badge>
                      <Badge variant="light" size="xs" color="teal">
                        {comp.categories.filter((c) => c.class === "specialist").length} specialist
                      </Badge>
                      <Badge variant="light" size="xs" color="orange">
                        {comp.categories.filter((c) => c.class === "challenge").length} challenge
                      </Badge>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Timeline.Item>
        ))}
      </Timeline>
    </Stack>
  );
}
