import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("../docs/data/content.json", import.meta.url), "utf8"));
const ids = list => new Set(list.map(x => x.id));
for (const key of ["spells", "items", "entities", "structures"]) {
  if (ids(data[key]).size !== data[key].length) throw new Error(`Duplicate ${key}`);
}
if (data.spells.length < 200) throw new Error(`Unexpected spell count: ${data.spells.length}`);
if (!data.schools.some(s => s.id === "shadow") || !data.schools.some(s => s.id === "eldritch")) throw new Error("Missing key schools");
console.log(`OK — ${data.spells.length} spells across ${data.schools.filter(s => s.spellCount).length} active schools.`);
