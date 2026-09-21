import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const workspace = new URL("../..", import.meta.url).pathname;
const jarRoot = join(workspace, "jars");
const decompiledRoot = join(workspace, "decompiled");
const outFile = join(root, "docs/data/content.json");

const mods = [
  { id: "irons_spellbooks", jar: "irons-spellbooks.jar", name: "Iron's Spells 'n Spellbooks", version: "3.16.3", source: "https://github.com/iron431/irons-spells-n-spellbooks/tree/v1.21.1-3.16.3", page: "https://www.curseforge.com/minecraft/mc-mods/irons-spells-n-spellbooks/files/8680204", sourceStatus: "exact" },
  { id: "aces_spell_utils", jar: "aces.jar", name: "Ace's Spell Utils", version: "1.2.7.2", source: "https://github.com/AceTheEldritchKing/Aces_Spell_Utils", page: "https://www.curseforge.com/minecraft/mc-mods/aces-spell-utils/files/8789930", sourceStatus: "exact" },
  { id: "cataclysm_spellbooks", jar: "cataclysm-spellbooks.jar", name: "Cataclysm Spellbooks", version: "1.1.14", source: "https://github.com/AceTheEldritchKing/Cataclysm_Spellbooks_1.21.1", page: "https://www.curseforge.com/minecraft/mc-mods/cataclysm-spellbooks/files/8847070", sourceStatus: "jar-exact" },
  { id: "discerning_the_eldritch", jar: "discerning-eldritch.jar", name: "Discerning the Eldritch", version: "1.4.4", source: "https://github.com/AceTheEldritchKing/Discerning_The_Eldritch/tree/1.21", page: "https://www.curseforge.com/minecraft/mc-mods/discerning-the-eldritch/files/8816497", sourceStatus: "jar-exact" },
  { id: "hazentouvelib", jar: "hazen-lib.jar", name: "HazentouveLib", version: "1.0.9", source: "https://github.com/Hazentouvel/HazentouveLib", page: "https://www.curseforge.com/minecraft/mc-mods/hazentouvelib/files/8666581", sourceStatus: "exact" },
  { id: "hazennstuff", jar: "hazen-n-stuff.jar", name: "Hazen N Stuff", version: "1.4.0.14", source: "https://github.com/Hazentouvel/Hazen_N_Stuff", page: "https://www.curseforge.com/minecraft/mc-mods/hazen-n-stuff/files/8277644", sourceStatus: "exact" },
  { id: "iss_magicfromtheeast", jar: "magic-from-east.jar", name: "Iron's Spells: Magic From The East", version: "1.1.5", source: "https://github.com/WarPhan78/ISS_MagicFromTheEast-1.21.x", page: "https://www.curseforge.com/minecraft/mc-mods/irons-spells-magic-from-the-east/files/7385201", sourceStatus: "exact" },
  { id: "darkermagic", jar: "darker-magic.jar", name: "Deeper and Darker Spellbooks", version: "1.3.3-b", source: "https://github.com/RevTheSprout/Deeper-and-Darker-Spellbooks/tree/NeoForge-1.21.1", page: "https://www.curseforge.com/minecraft/mc-mods/deeper-and-darker-spellbooks/files/7897469", sourceStatus: "jar-exact" },
  { id: "darkdoppelganger", jar: "dark-doppelganger.jar", name: "Dark Doppelganger", version: "3.4.0", source: "https://github.com/Bandit-bytes/darkdoppelganger/tree/1.21", page: "https://www.curseforge.com/minecraft/mc-mods/dark-doppelganger/files/8472789", sourceStatus: "exact" },
  { id: "create_wizardry", jar: "create-wizardry.jar", name: "Create: Wizardry", version: "0.5.1-pre1", source: "https://github.com/TTZPlayz/Create-Wizardry", page: "https://www.curseforge.com/minecraft/mc-mods/create-wizardry/files/8334988", sourceStatus: "exact" },
  { id: "somakespells", jar: "somakespells-1.0.8-1.21.1-fix.jar", name: "Somake's Spells", version: "1.0.8-fix", source: null, page: "https://www.curseforge.com/minecraft/mc-mods/somakes-spells/files/8417850", sourceStatus: "jar-only" }
];

const schoolDefinitions = [
  ["fire", "Feu", "Fire", "#e45b2c", "brasier", "blaze"], ["ice", "Glace", "Ice", "#91dcf2", "givre", "frost"],
  ["lightning", "Foudre", "Lightning", "#4fdcff", "orage", "storm"], ["holy", "Sacré", "Holy", "#ffe9a6", "sanctuaire", "sanctuary"],
  ["ender", "Ender", "Ender", "#a36bf2", "faille", "rift"], ["blood", "Sang", "Blood", "#a51f35", "sacrifice", "sacrifice"],
  ["evocation", "Évocation", "Evocation", "#dedee8", "invocation", "conjuration"], ["nature", "Nature", "Nature", "#72bd63", "bosquet", "grove"],
  ["eldritch", "Eldritch", "Eldritch", "#0f839c", "abîme", "abyss"], ["ritual", "Rituel", "Ritual", "#870b32", "cercle", "circle"],
  ["hydro", "Hydro", "Hydro", "#36156c", "marée", "tide"], ["technomancy", "Technomancie", "Technomancy", "#b3bec5", "mécanisme", "mechanism"],
  ["abyssal", "Abyssal", "Abyssal", "#36156c", "profondeurs", "depths"], ["sand", "Sable", "Sand", "#facb5c", "dunes", "dunes"],
  ["symmetry", "Symétrie", "Symmetry", "#00a36c", "équilibre", "balance"], ["spirit", "Esprit", "Spirit", "#009dc4", "âme", "soul"],
  ["dune", "Dune", "Dune", "#ff4d00", "désert", "desert"], ["radiance", "Radiance", "Radiance", "#e4a6ea", "aurore", "dawn"],
  ["shadow", "Ombre", "Shadow", "#553a7f", "crépuscule", "twilight"], ["cosmic", "Cosmique", "Cosmic", "#473196", "constellation", "constellation"],
  ["aqua", "Aqua", "Aqua", "#55ffff", "océan", "ocean"], ["unknown", "Inconnue", "Unknown", "#8d8996", "mystère", "mystery"]
];
const schools = schoolDefinitions.map(([id, fr, en, color, themeFr, themeEn]) => ({ id, name: { fr, en }, color, theme: { fr: themeFr, en: themeEn } }));

const unzipList = jar => execFileSync("unzip", ["-Z1", jar], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim().split("\n").filter(Boolean);
const unzipText = (jar, entry) => execFileSync("unzip", ["-p", jar, entry], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const walk = dir => existsSync(dir) ? readdirSync(dir).flatMap(name => { const path = join(dir, name); return statSync(path).isDirectory() ? walk(path) : [path]; }) : [];
const pretty = id => id.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
const simpleTranslationEntries = (lang, prefix) => Object.entries(lang).filter(([key]) => key.startsWith(prefix) && key.split(".").length === 3);

function readLang(jar, modId, locale = "en_us") {
  const wanted = `assets/${modId}/lang/${locale}.json`;
  try { return JSON.parse(unzipText(jar, wanted)); } catch { return {}; }
}

function inferSchool(text, file) {
  const rules = [
    [/SchoolRegistry\.FIRE_RESOURCE/, "fire"], [/SchoolRegistry\.ICE_RESOURCE/, "ice"], [/SchoolRegistry\.LIGHTNING_RESOURCE/, "lightning"],
    [/SchoolRegistry\.HOLY_RESOURCE/, "holy"], [/SchoolRegistry\.ENDER_RESOURCE/, "ender"], [/SchoolRegistry\.BLOOD_RESOURCE/, "blood"],
    [/SchoolRegistry\.EVOCATION_RESOURCE/, "evocation"], [/SchoolRegistry\.NATURE_RESOURCE/, "nature"], [/SchoolRegistry\.ELDRITCH_RESOURCE/, "eldritch"],
    [/(?:AS|DTE)SchoolRegistry\.RITUAL_RESOURCE/, "ritual"], [/ASSchoolRegistry\.(?:HYDRO|ABYSSAL)_RESOURCE/, "hydro"],
    [/ASSchoolRegistry\.TECHNOMANCY_RESOURCE/, "technomancy"], [/CSSchoolRegistry\.ABYSSAL_RESOURCE/, "abyssal"],
    [/CSSchoolRegistry\.SAND_RESOURCE/, "sand"], [/MFTESchoolRegistries\.SYMMETRY_RESOURCE/, "symmetry"],
    [/MFTESchoolRegistries\.SPIRIT_RESOURCE|this\.spiritSchool/, "spirit"], [/MFTESchoolRegistries\.DUNE_RESOURCE/, "dune"],
    [/HLSchoolRegistry\.RADIANCE_RESOURCE/, "radiance"], [/HLSchoolRegistry\.SHADOW_RESOURCE/, "shadow"], [/HLSchoolRegistry\.COSMIC_RESOURCE/, "cosmic"],
    [/ModSchools\.AQUA/, "aqua"]
  ];
  for (const [pattern, school] of rules) if (pattern.test(text)) return school;
  const normalized = file.toLowerCase();
  return schools.find(s => s.id !== "unknown" && normalized.includes(`/${s.id}/`))?.id ?? "unknown";
}

function parseSpells(mod, lang, sourceDir) {
  const rows = [];
  for (const file of walk(sourceDir).filter(path => path.endsWith(".java"))) {
    const text = readFileSync(file, "utf8");
    if (!text.includes("DefaultConfig") || !text.includes("getSpellResource")) continue;
    const fullIdMatch = text.match(/ResourceLocation\.fromNamespaceAndPath\([^\n]*?"([a-z0-9_]+)"[^\n]*?"([a-z0-9_]+)"/)
      ?? text.match(/new ResourceLocation\("([a-z0-9_]+)",\s*"([a-z0-9_]+)"\)/);
    const helperIdMatch = text.match(/(?:[A-Za-z0-9_]+\.)?id\((?:\(String\))?"([a-z0-9_]+)"\)/);
    if (!fullIdMatch && !helperIdMatch) continue;
    const namespace = fullIdMatch?.[1] ?? mod.id;
    const id = fullIdMatch?.[2] ?? helperIdMatch[1];
    const labelKey = `spell.${namespace}.${id}`;
    const fallbackKey = Object.keys(lang).find(key => key.split(".").length === 3 && key.endsWith(`.${id}`) && key.startsWith("spell."));
    const label = lang[labelKey] ?? lang[fallbackKey];
    if (!label || id === "none") continue;
    const guide = lang[`${labelKey}.guide`] ?? lang[`${labelKey}.description`] ?? (fallbackKey ? lang[`${fallbackKey}.guide`] : undefined) ?? "";
    const rarity = text.match(/setMinRarity\(SpellRarity\.([A-Z_]+)\)/)?.[1]?.toLowerCase() ?? "unknown";
    const maxLevel = Number(text.match(/setMaxLevel\((\d+)\)/)?.[1] ?? 1);
    const cooldown = Number(text.match(/setCooldownSeconds\(([\d.]+)\)/)?.[1] ?? 0);
    const manaBase = Number(text.match(/baseManaCost\s*=\s*(\d+)/)?.[1] ?? 0);
    const manaPerLevel = Number(text.match(/manaCostPerLevel\s*=\s*(\d+)/)?.[1] ?? 0);
    const castType = text.match(/return CastType\.([A-Z_]+)/)?.[1]?.toLowerCase() ?? "instant";
    const craftable = !/setAllowCrafting\(false\)/.test(text);
    const deprecated = /setDeprecated\(true\)/.test(text);
    rows.push({
      id: `${namespace}:${id}`, mod: mod.id, school: inferSchool(text, file),
      name: { en: label, fr: mod.id === "irons_spellbooks" ? (readLang(join(jarRoot, mod.jar), mod.id, "fr_fr")[labelKey] ?? label) : label },
      guide: { en: guide, fr: mod.id === "irons_spellbooks" ? (readLang(join(jarRoot, mod.jar), mod.id, "fr_fr")[`${labelKey}.guide`] ?? readLang(join(jarRoot, mod.jar), mod.id, "fr_fr")[`${labelKey}.description`] ?? guide) : guide },
      rarity, maxLevel, cooldown, manaBase, manaPerLevel, castType, craftable, deprecated,
      acquisition: craftable ? "scroll_forge_or_loot" : "special",
      sourceFile: relative(decompiledRoot, file).replaceAll("\\", "/")
    });
  }
  const deduped = new Map(rows.map(row => [row.id, row]));
  return [...deduped.values()].sort((a, b) => a.name.en.localeCompare(b.name.en));
}

function parseCatalog(mod, lang, entries) {
  const recipeIds = new Set(entries.filter(e => /data\/.+\/recipes?\/.+\.json$/.test(e)).map(e => basename(e, ".json")));
  const items = simpleTranslationEntries(lang, `item.${mod.id}.`).map(([key, en]) => {
    const id = key.split(".")[2];
    let type = "item";
    if (/(helmet|chestplate|leggings|boots)$/.test(id)) type = "armor";
    else if (/(sword|staff|dagger|scythe|spear|halberd|hammer|axe|bow|mace|blade|trident|gun|wand)/.test(id)) type = "weapon";
    else if (/(spellbook|spell_book|grimoire|codex|tome)/.test(id)) type = "spellbook";
    else if (/(ring|amulet|necklace|curio|charm)/.test(id)) type = "curio";
    return { id: `${mod.id}:${id}`, mod: mod.id, type, name: { en, fr: en }, acquisition: recipeIds.has(id) ? "craft" : "loot_or_special" };
  });
  const entities = simpleTranslationEntries(lang, `entity.${mod.id}.`).map(([key, en]) => {
    const id = key.split(".")[2];
    const kind = /(projectile|beam|slash|aoe|orb|arrow|missile|laser|portal|wave|bolt)/.test(id) ? "spell_entity" : /(summon|phantom|minion)/.test(id) ? "summon" : "mob";
    return { id: `${mod.id}:${id}`, mod: mod.id, kind, name: { en, fr: en } };
  });
  const enchantments = Object.entries(lang).filter(([key]) => /^(enchantment|item\.minecraft\.enchanted_book)/.test(key) && key.includes(`.${mod.id}.`)).map(([key, en]) => ({ id: key, mod: mod.id, name: { en, fr: en } }));
  const structures = entries.filter(e => new RegExp(`^data/${mod.id}/worldgen/structure/.+\\.json$`).test(e)).map(e => {
    const id = basename(e, ".json"); return { id: `${mod.id}:${id}`, mod: mod.id, name: { en: pretty(id), fr: pretty(id) } };
  });
  return { items, entities, enchantments, structures };
}

const all = { spells: [], items: [], entities: [], enchantments: [], structures: [] };
for (const mod of mods) {
  const jar = join(jarRoot, mod.jar);
  if (!existsSync(jar)) throw new Error(`Missing exact JAR: ${jar}`);
  const entries = unzipList(jar);
  const lang = readLang(jar, mod.id);
  const decompiledDir = join(decompiledRoot, mod.jar.replace(/\.jar$/, ""));
  const sourceDir = existsSync(decompiledDir) ? decompiledDir : join(decompiledRoot, ({
    "irons-spellbooks.jar": "irons-spellbooks", "magic-from-east.jar": "magic-from-east", "darker-magic.jar": "darker-magic",
    "dark-doppelganger.jar": "dark-doppelganger", "hazen-n-stuff.jar": "hazen-n-stuff", "hazen-lib.jar": "hazen-lib",
    "cataclysm-spellbooks.jar": "cataclysm-spellbooks", "discerning-eldritch.jar": "discerning-eldritch", "aces.jar": "aces",
    "create-wizardry.jar": "create-wizardry"
  })[mod.jar] ?? "");
  all.spells.push(...parseSpells(mod, lang, sourceDir));
  const catalog = parseCatalog(mod, lang, entries);
  for (const key of ["items", "entities", "enchantments", "structures"]) all[key].push(...catalog[key]);
}

const content = {
  meta: { minecraft: "1.21.1", loader: "NeoForge 21.1.250", configs: "default", generatedAt: new Date().toISOString(), schema: 1 },
  mods,
  schools: schools.map(school => ({ ...school, spellCount: all.spells.filter(spell => spell.school === school.id).length })),
  ...all
};
mkdirSync(join(root, "docs/data"), { recursive: true });
writeFileSync(outFile, JSON.stringify(content, null, 2) + "\n");
console.log(`Wrote ${relative(root, outFile)}: ${content.spells.length} spells, ${content.items.length} items, ${content.entities.length} entities, ${content.structures.length} structures.`);
