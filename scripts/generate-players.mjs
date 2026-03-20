import { readFileSync, writeFileSync, readdirSync } from "fs";

const dataDir = new URL("../public/data/", import.meta.url);
const mappings = JSON.parse(
  readFileSync(new URL("../player-mappings.json", import.meta.url), "utf8")
);
const competitions = JSON.parse(
  readFileSync(new URL("competitions.json", dataDir), "utf8")
);
const compMap = Object.fromEntries(competitions.map((c) => [c.id, c]));
const playerResults = {};

function addResult(playerId, entry) {
  if (!playerResults[playerId]) playerResults[playerId] = [];
  playerResults[playerId].push(entry);
}

for (const file of readdirSync(new URL("results/", dataDir))) {
  if (!file.endsWith(".json")) continue;
  const data = JSON.parse(
    readFileSync(new URL(`results/${file}`, dataDir), "utf8")
  );
  const comp = compMap[data.competitionId];
  if (!comp) continue;

  for (const cat of data.categories) {
    for (const r of cat.results) {
      if (r.status === "dns" || r.status === "dsq") continue;
      if (r.playerId.startsWith("team:")) continue;

      const entry = {
        competitionId: data.competitionId,
        competitionName: comp.name,
        date: comp.startDate,
        categoryId: cat.categoryId,
        categoryName: cat.name,
        categoryClass: cat.class,
        rank: r.rank,
      };
      if (r.ageGroup) entry.ageGroup = r.ageGroup;
      if (r.totalScore != null) entry.totalScore = r.totalScore;
      if (r.count != null) entry.count = r.count;

      if (r.playerId.includes("+")) {
        const [p1, p2] = r.playerId.split("+");
        addResult(p1, { ...entry, pairWith: p2 });
        addResult(p2, { ...entry, pairWith: p1 });
      } else {
        addResult(r.playerId, entry);
      }
    }
  }
}

const players = Object.entries(playerResults).map(([id, results]) => {
  const mapping = mappings[id] || {};
  const ranks = results
    .filter((r) => r.rank != null && r.categoryClass !== "challenge")
    .map((r) => r.rank);
  return {
    id,
    name: mapping.canonicalName || id,
    nationality: mapping.nationality || null,
    results,
    stats: {
      totalCompetitions: new Set(results.map((r) => r.competitionId)).size,
      bestRank: ranks.length ? Math.min(...ranks) : null,
      averageRank: ranks.length
        ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) /
          10
        : null,
    },
  };
});

players.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(
  new URL("players.json", dataDir),
  JSON.stringify(players, null, 2) + "\n"
);
console.log(`Generated players.json: ${players.length} players`);
