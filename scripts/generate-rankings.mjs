import { readFileSync, writeFileSync, readdirSync } from "fs";

const dataDir = new URL("../public/data/", import.meta.url);
const mappings = JSON.parse(readFileSync(new URL("../player-mappings.json", import.meta.url), "utf8"));
const competitions = JSON.parse(readFileSync(new URL("competitions.json", dataDir), "utf8"));
const compMap = Object.fromEntries(competitions.map((c) => [c.id, c]));

// Collect all results
const allCategories = [];
for (const file of readdirSync(new URL("results/", dataDir))) {
  if (!file.endsWith(".json")) continue;
  const data = JSON.parse(readFileSync(new URL(`results/${file}`, dataDir), "utf8"));
  const comp = compMap[data.competitionId];
  if (!comp) continue;
  for (const cat of data.categories) {
    allCategories.push({ comp, cat });
  }
}

const name = (id) => mappings[id]?.canonicalName || id;

// --- Medals ---
// Exclude team (team:*), include pairs as-is
const medalCounts = {}; // playerId -> { byCategory: { catId: {g,s,b} }, byClass: { cls: {g,s,b} } }

for (const { cat } of allCategories) {
  for (const r of cat.results) {
    if (r.status === "dns" || r.status === "dsq") continue;
    if (r.rank == null || r.rank > 3) continue;
    if (r.playerId.startsWith("team:")) continue;

    const pid = r.playerId;
    if (!medalCounts[pid]) medalCounts[pid] = {};
    const m = medalCounts[pid];

    for (const key of [cat.categoryId, `class:${cat.class}`]) {
      if (!m[key]) m[key] = { gold: 0, silver: 0, bronze: 0 };
      if (r.rank === 1) m[key].gold++;
      else if (r.rank === 2) m[key].silver++;
      else m[key].bronze++;
    }
  }
}

function toSorted(entries) {
  return entries
    .map(([pid, m]) => ({ playerId: pid, name: name(pid), ...m, total: m.gold + m.silver + m.bronze }))
    .sort((a, b) => b.total - a.total || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
}

// byCategory
const categoryIds = new Set(allCategories.map(({ cat }) => cat.categoryId));
const byCategory = {};
for (const catId of categoryIds) {
  const entries = Object.entries(medalCounts)
    .filter(([, m]) => m[catId])
    .map(([pid, m]) => [pid, m[catId]]);
  if (entries.length) byCategory[catId] = toSorted(entries);
}

// byClass
const byClass = {};
for (const cls of ["overall", "specialist", "challenge"]) {
  const key = `class:${cls}`;
  const entries = Object.entries(medalCounts)
    .filter(([, m]) => m[key])
    .map(([pid, m]) => [pid, m[key]]);
  if (entries.length) byClass[cls] = toSorted(entries);
}

// overall medals (all classes combined)
const overallEntries = Object.entries(medalCounts).map(([pid, m]) => {
  const sum = { gold: 0, silver: 0, bronze: 0 };
  for (const [k, v] of Object.entries(m)) {
    if (k.startsWith("class:")) continue;
    sum.gold += v.gold; sum.silver += v.silver; sum.bronze += v.bronze;
  }
  return [pid, sum];
}).filter(([, m]) => m.gold + m.silver + m.bronze > 0);
const overallMedals = toSorted(overallEntries);

// --- Endurance records ---
const mergeEndurance = {
  "m-ashimawari": "ashimawari", "w-ashimawari": "ashimawari",
  "1d-ashimawari-q": "ashimawari", "1d-ashimawari-f": "ashimawari",
  "m-nawatobi": "nawatobi", "w-nawatobi": "nawatobi",
  "p-pass-q": "p-pass", "p-pass-f": "p-pass",
};
const genderFromCatId = (id) => id.startsWith("m-") || id.startsWith("m1") ? "M" : id.startsWith("w-") || id.startsWith("w1") ? "F" : null;
const endurance = {};
for (const { comp, cat } of allCategories) {
  if (cat.scoringType !== "endurance") continue;
  const key = mergeEndurance[cat.categoryId] || cat.categoryId;
  if (!endurance[key]) endurance[key] = [];
  const gender = genderFromCatId(cat.categoryId);
  for (const r of cat.results) {
    if (r.status === "dns" || r.status === "dsq" || r.count == null) continue;
    endurance[key].push({
      playerId: r.playerId,
      name: name(r.playerId),
      count: r.count,
      competitionId: comp.id,
      competitionName: comp.shortName || comp.name,
      ...(gender && { gender }),
      ...(r.note && { note: r.note }),
      ...(r.class && { class: r.class }),
    });
  }
}
for (const catId of Object.keys(endurance)) {
  endurance[catId].sort((a, b) => b.count - a.count);
}

// --- Appearances (overall + specialist only, exclude dns/dsq, exclude team:*) ---
const appByEntry = {}; // playerId -> count of category entries
const appByComp = {};  // playerId -> Set of competitionIds

for (const { comp, cat } of allCategories) {
  if (cat.class !== "overall" && cat.class !== "specialist") continue;
  for (const r of cat.results) {
    if (r.status === "dns" || r.status === "dsq") continue;
    if (r.playerId.startsWith("team:")) continue;

    const pid = r.playerId;
    appByEntry[pid] = (appByEntry[pid] || 0) + 1;
    if (!appByComp[pid]) appByComp[pid] = new Set();
    appByComp[pid].add(comp.id);
  }
}

const appearancesByEntries = Object.entries(appByEntry)
  .map(([pid, count]) => ({ playerId: pid, name: name(pid), entries: count, competitions: appByComp[pid].size }))
  .sort((a, b) => b.entries - a.entries);

const appearancesByCompetitions = Object.entries(appByComp)
  .map(([pid, set]) => ({ playerId: pid, name: name(pid), competitions: set.size, entries: appByEntry[pid] }))
  .sort((a, b) => b.competitions - a.competitions || b.entries - a.entries);

// --- Output ---
const rankings = {
  medals: { byCategory, byClass, overall: overallMedals },
  endurance,
  appearances: { byEntries: appearancesByEntries, byCompetitions: appearancesByCompetitions },
};

writeFileSync(new URL("rankings.json", dataDir), JSON.stringify(rankings, null, 2) + "\n");
console.log(`Generated rankings.json: ${overallMedals.length} medalists, ${appearancesByEntries.length} players`);
