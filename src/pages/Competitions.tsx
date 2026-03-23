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
import {
  IconTrophy,
  IconCalendar,
  IconFileText,
  IconInfoCircle,
  IconAward,
  IconStar,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";

type Award = {
  type: string;
  playerName: string;
  awardName?: string;
};

type Competition = {
  id: string;
  name: string;
  shortName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  venue?: string;
  resultUrl?: string;
  infoUrl?: string;
  awards?: Award[];
  categories: { id: string; class: string }[];
};

function formatDateRange(start?: string, end?: string): string | null {
  if (!start) return null;
  const fmt = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${y}/${parseInt(m)}/${parseInt(day)}`;
  };
  if (!end || start === end) return fmt(start);
  // same year+month → compact
  const [sy, sm] = start.split("-");
  const [ey, em] = end.split("-");
  if (sy === ey && sm === em)
    return `${fmt(start)}–${parseInt(end.split("-")[2])}`;
  return `${fmt(start)}–${fmt(end)}`;
}

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

  const byYear = new Map<string, Competition[]>();
  for (const c of competitions) {
    const year = c.id.match(/\d{4}/)?.[0] ?? "Unknown";
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(c);
  }
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
                    <Anchor component={Link} to={`/competitions/${comp.id}`}>
                      <Text fw={500} visibleFrom="sm">
                        {comp.name}
                      </Text>
                      <Text fw={500} hiddenFrom="sm">
                        {comp.shortName ?? comp.name}
                      </Text>
                    </Anchor>

                    <Group gap="xs" wrap="wrap">
                      {formatDateRange(comp.startDate, comp.endDate) && (
                        <Group gap={4}>
                          <IconCalendar size={14} color="gray" />
                          <Text size="xs" c="dimmed">
                            {formatDateRange(comp.startDate, comp.endDate)}
                          </Text>
                        </Group>
                      )}
                      {comp.location && (
                        <>
                          <Text size="xs" c="dimmed" visibleFrom="sm">
                            {comp.venue ?? comp.location}
                          </Text>
                          <Text size="xs" c="dimmed" hiddenFrom="sm">
                            {comp.location}
                          </Text>
                        </>
                      )}
                    </Group>

                    <Group gap="xs">
                      <Badge variant="light" size="xs">
                        {
                          comp.categories.filter((c) => c.class === "overall")
                            .length
                        }{" "}
                        overall
                      </Badge>
                      <Badge variant="light" size="xs" color="teal">
                        {
                          comp.categories.filter(
                            (c) => c.class === "specialist"
                          ).length
                        }{" "}
                        specialist
                      </Badge>
                      <Badge variant="light" size="xs" color="orange">
                        {
                          comp.categories.filter(
                            (c) => c.class === "challenge"
                          ).length
                        }{" "}
                        challenge
                      </Badge>
                    </Group>

                    {comp.awards && comp.awards.length > 0 && (
                      <Stack gap={2}>
                        {comp.awards
                          .filter((a) => a.type === "best-trick")
                          .map((a, i) => (
                            <Group gap={4} key={`bt-${i}`}>
                              <IconAward size={14} color="orange" />
                              <Text size="xs">
                                Best Trick: {a.playerName}
                              </Text>
                            </Group>
                          ))}
                        {comp.awards
                          .filter((a) => a.type === "special" || a.type === "judges-special")
                          .map((a, i) => (
                            <Group gap={4} key={`sp-${i}`}>
                              <IconStar size={14} color="teal" />
                              <Text size="xs">
                                {a.awardName ?? "特別賞"}: {a.playerName}
                              </Text>
                            </Group>
                          ))}
                      </Stack>
                    )}

                    <Group gap="xs" mt={2}>
                      {comp.resultUrl && (
                        <Anchor
                          href={comp.resultUrl}
                          target="_blank"
                          size="xs"
                        >
                          <Group gap={4}>
                            <IconFileText size={14} />
                            Results PDF
                          </Group>
                        </Anchor>
                      )}
                      {comp.infoUrl && (
                        <Anchor
                          href={comp.infoUrl}
                          target="_blank"
                          size="xs"
                        >
                          <Group gap={4}>
                            <IconInfoCircle size={14} />
                            Info
                          </Group>
                        </Anchor>
                      )}
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
