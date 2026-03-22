import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join, basename } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(import.meta.url), "../..");
const srcDir = join(root, "data/results");
const outDir = join(root, "public/data/results");

mkdirSync(outDir, { recursive: true });

const classOrder = { overall: 0, specialist: 1, challenge: 2 };

for (const comp of readdirSync(srcDir)) {
  const compDir = join(srcDir, comp);
  const stat = readdirSync(compDir);
  if (!stat.length) continue;

  const categories = stat
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(compDir, f), "utf8")))
    .sort((a, b) => (classOrder[a.class] ?? 9) - (classOrder[b.class] ?? 9));

  const result = { competitionId: comp, categories };
  writeFileSync(join(outDir, comp + ".json"), JSON.stringify(result, null, 2) + "\n");
  console.log(`${comp}.json: ${categories.length} categories`);
}
