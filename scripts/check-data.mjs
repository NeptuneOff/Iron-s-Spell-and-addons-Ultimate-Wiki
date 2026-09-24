import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("../docs/data/content.json", import.meta.url), "utf8"));
const ids = list => new Set(list.map(x => x.id));
for (const key of ["spells", "items", "entities", "structures"]) {
  if (ids(data[key]).size !== data[key].length) throw new Error(`Duplicate ${key}`);
}
if (data.spells.length < 200) throw new Error(`Unexpected spell count: ${data.spells.length}`);
if (!data.schools.some(s => s.id === "shadow") || !data.schools.some(s => s.id === "eldritch")) throw new Error("Missing key schools");
const shadow = data.spells.filter(s => s.school === "shadow");
if (shadow.length !== 4) throw new Error(`Unexpected Shadow spell count: ${shadow.length}`);
if (data.spells.some(s => s.school === "unknown")) throw new Error("Unresolved spell schools remain");
const occult = data.schools.find(s => s.id === "ritual");
if (occult?.name?.en !== "Occult" || occult?.name?.fr !== "Occulte") throw new Error("Occult school label is incorrect");
if (!Array.isArray(data.armorSets) || data.armorSets.length < 100) throw new Error("Armor-set grouping is missing");
if (!data.meta?.itemAtlas || data.meta.itemAtlas.total !== data.items.length) throw new Error("Item atlas is incomplete");
if (data.items.some(i => i.iconIndex == null)) throw new Error("An item has no visual");
if (data.meta?.schema !== 3) throw new Error("Enhanced data missing");
if (data.schools.find(s=>s.id==="eldritch")?.symbolItem!=="discerning_the_eldritch:eldritch_rune") throw new Error("Wrong Eldritch symbol");
if(data.items.some(i=>!Array.isArray(i.boosts)||!Array.isArray(i.acquisitionSources)))throw new Error("Item metadata missing");
console.log(`OK — ${data.spells.length} spells across ${data.schools.filter(s => s.spellCount).length} active schools.`);
