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
  ["eldritch", "Eldritch", "Eldritch", "#0f839c", "abîme", "abyss"], ["ritual", "Occulte", "Occult", "#870b32", "rituel", "ritual"],
  ["hydro", "Hydro", "Hydro", "#36156c", "marée", "tide"], ["technomancy", "Technomancie", "Technomancy", "#b3bec5", "mécanisme", "mechanism"],
  ["abyssal", "Abyssal", "Abyssal", "#36156c", "profondeurs", "depths"], ["sand", "Sable", "Sand", "#facb5c", "dunes", "dunes"],
  ["symmetry", "Symétrie", "Symmetry", "#00a36c", "équilibre", "balance"], ["spirit", "Esprit", "Spirit", "#009dc4", "âme", "soul"],
  ["dune", "Dune", "Dune", "#ff4d00", "désert", "desert"], ["radiance", "Radiance", "Radiance", "#e4a6ea", "aurore", "dawn"],
  ["shadow", "Ombre", "Shadow", "#553a7f", "crépuscule", "twilight"], ["cosmic", "Cosmique", "Cosmic", "#473196", "constellation", "constellation"],
  ["aqua", "Aqua", "Aqua", "#55ffff", "océan", "ocean"]
];
const schools = schoolDefinitions.map(([id, fr, en, color, themeFr, themeEn]) => ({ id, name: { fr, en }, color, theme: { fr: themeFr, en: themeEn } }));

const schoolSymbolItems = {
  fire: "irons_spellbooks:fire_rune", ice: "irons_spellbooks:ice_rune", lightning: "irons_spellbooks:lightning_rune",
  holy: "irons_spellbooks:holy_rune", ender: "irons_spellbooks:ender_rune", blood: "irons_spellbooks:blood_rune",
  evocation: "irons_spellbooks:evocation_rune", nature: "irons_spellbooks:nature_rune",
  eldritch: "discerning_the_eldritch:eldritch_upgrade_orb", ritual: "discerning_the_eldritch:ritual_rune",
  hydro: "hazennstuff:hydro_rune", technomancy: "cataclysm_spellbooks:technomancy_rune",
  abyssal: "cataclysm_spellbooks:abyssal_rune", symmetry: "iss_magicfromtheeast:symmetry_rune",
  spirit: "iss_magicfromtheeast:spirit_rune", radiance: "hazentouvelib:radiance_rune",
  shadow: "hazentouvelib:shadow_rune", cosmic: "hazentouvelib:cosmic_rune", aqua: "somakespells:aqua_rune"
};

const schoolAliases = {
  fire: ["fire", "flame", "pyro", "infernal"], ice: ["ice", "frost", "cryo", "glacial"],
  lightning: ["lightning", "thunder", "storm", "electro"], holy: ["holy", "divine", "sacred", "radiant"],
  ender: ["ender", "end_", "rift", "void"], blood: ["blood", "sanguine"], evocation: ["evocation", "evoker", "spectral"],
  nature: ["nature", "forest", "druid", "poison", "thorn"], eldritch: ["eldritch", "sculk", "warden"],
  ritual: ["ritual", "occult"], hydro: ["hydro", "aquatic"], technomancy: ["technomancy", "techno", "mechanical"],
  abyssal: ["abyssal", "abyss"], symmetry: ["symmetry", "balance", "taiji"], spirit: ["spirit", "soul"],
  radiance: ["radiance", "seraph", "angel"], shadow: ["shadow", "umbra", "night"], cosmic: ["cosmic", "star", "comet"],
  aqua: ["aqua", "water", "sea", "ocean"]
};

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
    [/ModSchools\.AQUA/, "aqua"], [/TunesCompat\.schoolOrEvocation\(\)/, "evocation"]
  ];
  for (const [pattern, school] of rules) if (pattern.test(text)) return school;
  const normalized = file.toLowerCase();
  return schools.find(s => s.id !== "unknown" && normalized.includes(`/${s.id}/`))?.id ?? "unknown";
}

const round = value => Math.round(Number(value) * 100) / 100;
const numericAssignment = (text, name) => {
  const match = text.match(new RegExp(`(?:this\\.)?${name}\\s*=\\s*(-?[\\d.]+)[fFdD]?\\s*;`));
  return match ? Number(match[1]) : 0;
};

function inferNature(text, guide) {
  const haystack = `${text}\n${guide}`.toLowerCase();
  if (/spellsummonevent|summonedentities|summon|conjure|invoke|spawnhelper/.test(haystack)) return "summon";
  if (/\.heal\(|healing|\bheal\b|restore.{0,16}health|regeneration/.test(haystack)) return "heal";
  if (/ui\.irons_spellbooks\.damage|applydamage|getdamage\(|\.hurt\(|damage|projectile|slash|blast|bolt|beam|strike|attack/.test(haystack)) return "offense";
  if (/barrier|shield|ward|protect|absorption|damage reduction|invulnerab/.test(haystack)) return "defense";
  if (/teleport|dash|leap|flight|mobility|propel|ride a cloud/.test(haystack)) return "mobility";
  if (/slow|stun|root|silence|pull|push|knockback|entangle|blind|debuff|control/.test(haystack)) return "control";
  return "utility";
}

function inferDelivery(text, guide, nature) {
  const haystack = `${text}\n${guide}`.toLowerCase();
  if (nature === "summon") return "summon";
  if (/barrier|wall|field|zone|altar|placed|at the ground|static/.test(haystack)) return "static";
  if (/precasttargethelper|selectedtarget|targetentity|raycastforentity|chosen target|targeted/.test(haystack)) return "target";
  if (/projectile|\.shoot\(|launch|throw|bolt|beam|arrow|missile/.test(haystack)) return "projectile";
  if (/aabb|\.inflate\(|nearby|around you|around the caster|in a radius|area of effect|wave/.test(haystack)) return "area";
  if (/entity\.addeffect|caster\.addeffect|\.heal\(|yourself|self/.test(haystack)) return "self";
  return "direct";
}

function parseLinearReturn(text, methodPattern, powerBase, powerPerLevel, maxLevel) {
  const methods = [...text.matchAll(new RegExp(`(?:float|double|int)\\s+${methodPattern}\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "gi"))];
  for (const method of methods) {
    const body = method[1];
    const factorMatch = body.match(/getSpellPower\([^;]+?\)\s*\*\s*([\d.]+)f?/i) ?? body.match(/([\d.]+)f?\s*\*\s*(?:this\.)?getSpellPower\(/i);
    const divisorMatch = body.match(/getSpellPower\([^;]+?\)\s*\/\s*([\d.]+)f?/i);
    const factor = factorMatch ? Number(factorMatch[1]) : divisorMatch ? 1 / Number(divisorMatch[1]) : /getSpellPower\(/.test(body) ? 1 : null;
    const offset = Number(body.match(/return\s+(?:\(float\))?\s*([\d.]+)f?\s*\+\s*(?:this\.)?getSpellPower/i)?.[1] ?? 0);
    if (factor !== null && powerBase) return { base: round(offset + powerBase * factor), perLevel: round(powerPerLevel * factor), max: round(offset + (powerBase + powerPerLevel * (maxLevel - 1)) * factor), exact: !/getAdditional|weaponDamage|attackDamage/i.test(body) };
    const linear = body.match(/return\s+(?:\(float\))?\s*\(?\s*([\d.]+)\s*\+\s*spellLevel(?:\s*\*\s*([\d.]+))?/i);
    if (linear) {
      const base = Number(linear[1]) + 1;
      const perLevel = Number(linear[2] || 1);
      return { base: round(base), perLevel: round(perLevel), max: round(Number(linear[1]) + maxLevel * perLevel), exact: true };
    }
    const count = body.match(/return\s+spellLevel\s*\+\s*(\d+)/i);
    if (count) return { base: 1 + Number(count[1]), perLevel: 1, max: maxLevel + Number(count[1]), exact: true };
    if (/return\s+spellLevel\s*;/.test(body)) return { base: 1, perLevel: 1, max: maxLevel, exact: true };
  }
  return null;
}

function analyzeSpell(text, guide, maxLevel, baseMana, manaPerLevel) {
  const nature = inferNature(text, guide);
  const delivery = inferDelivery(text, guide, nature);
  const powerBase = numericAssignment(text, "baseSpellPower");
  const powerPerLevel = numericAssignment(text, "spellPowerPerLevel");
  const powerMax = round(powerBase + powerPerLevel * (maxLevel - 1));
  const metrics = [{ kind: "mana", base: baseMana, perLevel: manaPerLevel, max: baseMana + manaPerLevel * (maxLevel - 1), exact: true }];
  const damage = parseLinearReturn(text, "get[A-Za-z0-9_]*Damage", powerBase, powerPerLevel, maxLevel);
  const healing = parseLinearReturn(text, "get[A-Za-z0-9_]*(?:Heal|Healing)[A-Za-z0-9_]*", powerBase, powerPerLevel, maxLevel);
  const summonCount = parseLinearReturn(text, "getSummonCount", powerBase, powerPerLevel, maxLevel);
  const summonHealth = parseLinearReturn(text, "get[A-Za-z0-9_]*Health", powerBase, powerPerLevel, maxLevel);
  const summonDamage = nature === "summon" ? damage : null;
  if (damage) metrics.push({ kind: nature === "summon" ? "summon_damage" : "damage", ...damage });
  if (healing) metrics.push({ kind: "healing", ...healing });
  if (summonCount) metrics.push({ kind: "summon_count", ...summonCount });
  if (summonHealth) metrics.push({ kind: "summon_health", ...summonHealth });
  if (!metrics.some(metric => metric.kind !== "mana") && powerBase) metrics.push({ kind: "spell_power", base: powerBase, perLevel: powerPerLevel, max: powerMax, exact: false });
  const preferredKinds = nature === "summon" ? ["summon_damage", "summon_health", "summon_count", "spell_power"] : nature === "heal" ? ["healing", "spell_power"] : nature === "offense" ? ["damage", "spell_power"] : ["spell_power", "damage", "healing"];
  const primary = preferredKinds.map(kind => metrics.find(metric => metric.kind === kind)).find(Boolean) ?? metrics[0];
  return { nature, delivery, metrics, primaryPower: primary.max ?? 0, powerMetric: primary.kind };
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
    const analysis = analyzeSpell(text, guide, maxLevel, manaBase, manaPerLevel);
    rows.push({
      id: `${namespace}:${id}`, mod: mod.id, school: inferSchool(text, file),
      name: { en: label, fr: mod.id === "irons_spellbooks" ? (readLang(join(jarRoot, mod.jar), mod.id, "fr_fr")[labelKey] ?? label) : label },
      guide: { en: guide, fr: mod.id === "irons_spellbooks" ? (readLang(join(jarRoot, mod.jar), mod.id, "fr_fr")[`${labelKey}.guide`] ?? readLang(join(jarRoot, mod.jar), mod.id, "fr_fr")[`${labelKey}.description`] ?? guide) : guide },
      rarity, maxLevel, cooldown, manaBase, manaPerLevel, castType, craftable, deprecated,
      acquisition: craftable ? "scroll_forge_or_loot" : "special",
      ...analysis,
      sourceFile: relative(decompiledRoot, file).replaceAll("\\", "/")
    });
  }
  const deduped = new Map(rows.map(row => [row.id, row]));
  return [...deduped.values()].sort((a, b) => a.name.en.localeCompare(b.name.en));
}

function deepStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach(entry => deepStrings(entry, out));
  else if (value && typeof value === "object") Object.values(value).forEach(entry => deepStrings(entry, out));
  return out;
}

function recipeResult(json) {
  const result = json?.result;
  if (typeof result === "string") return result;
  return result?.id ?? result?.item ?? result?.result?.id ?? result?.result?.item ?? null;
}

function recipeIngredients(json) {
  const source = json?.key ?? json?.ingredients ?? json?.ingredient ?? json?.base ?? json?.addition ?? json?.template ?? {};
  return [...new Set(deepStrings(source).filter(value => value.includes(":")))].slice(0, 24);
}

function itemShape(id, en) {
  // Never include the namespace here: `irons_spellbooks:*` would otherwise
  // make every item from the base mod look like a spellbook.
  const path = (id.split(":")[1] ?? id).toLowerCase();
  const displayName = en.toLowerCase();
  const value = `${path} ${displayName}`;
  const slotRules = [
    ["helmet", /(helmet|hat|hood|mask|crown|head dress|headdress|visor|horns|hair|circlet|blindfold)$/],
    ["chestplate", /(chestplate|robe|robes|tunic|coat|jacket|cuirass|chest piece)$/],
    ["leggings", /(leggings|pants|trousers|greaves|skirt)$/],
    ["boots", /(boots|shoes|slippers|sabaton|sandals|geta)$/]
  ];
  // The registry path is authoritative for armor slots. Display names often
  // end in thematic words such as “Breeches”, “Tracers” or “Scale Mail”.
  const slot = slotRules.find(([, pattern]) => pattern.test(path) || pattern.test(displayName))?.[0] ?? null;
  let type = slot ? "armor" : "item";
  if (!slot && /(spellbook|spell_book|grimoire|codex|tome|volume)/.test(value)) type = "spellbook";
  else if (!slot && /(sword|staff|dagger|scythe|spear|halberd|hammer|axe|bow|mace|blade|trident|gun|wand|rapier|katana|pike|lance|crossbow|pickaxe)/.test(value)) type = "weapon";
  else if (!slot && /(ring|amulet|necklace|curio|charm|pendant)/.test(value)) type = "curio";
  else if (!slot && /(upgrade_orb|upgrade orb|rune|scroll)/.test(value)) type = "upgrade";
  const affinities = Object.entries(schoolAliases).filter(([, aliases]) => aliases.some(alias => new RegExp(`(^|[_\\s-])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([_\\s-]|$)`, "i").test(value))).map(([school]) => school);
  let setKey = null;
  if (slot) {
    setKey = path
      .replace(/_(helmet|chestplate|leggings|boots|hat|hood|mask|crown|head_dress|headdress|visor|horns|hair|circlet|blindfold|robe|robes|tunic|coat|jacket|cuirass|pants|trousers|greaves|skirt|shoes|slippers|sabaton|sandals|geta)$/i, "")
      .replace(/^(helmet|chestplate|leggings|boots)_/i, "");
  }
  return { type, slot, affinities, setKey };
}

function parseCatalog(mod, lang, entries, jar) {
  const recipes = new Map();
  for (const entry of entries.filter(path => /^data\/.+\/recipes?\/.+\.json$/.test(path))) {
    try {
      const json = JSON.parse(unzipText(jar, entry));
      const result = recipeResult(json);
      if (!result) continue;
      const row = { type: String(json.type ?? "crafting").split(":").at(-1), ingredients: recipeIngredients(json), source: entry };
      recipes.set(result, [...(recipes.get(result) ?? []), row]);
    } catch { /* invalid optional recipe */ }
  }
  const lootTables = entries.filter(path => /^data\/.+\/loot_tables?\/.+\.json$/.test(path)).map(entry => {
    try { return [entry, unzipText(jar, entry)]; } catch { return [entry, ""]; }
  });
  const items = simpleTranslationEntries(lang, `item.${mod.id}.`).map(([key, en]) => {
    const id = key.split(".")[2];
    const fullId = `${mod.id}:${id}`;
    const shape = itemShape(fullId, en);
    const itemRecipes = recipes.get(fullId) ?? [];
    const lootSources = lootTables.filter(([, raw]) => raw.includes(`\"${fullId}\"`)).map(([entry]) => entry).slice(0, 12);
    const acquisition = itemRecipes.length && lootSources.length ? "craft_or_loot" : itemRecipes.length ? "craft" : lootSources.length ? "loot" : "special";
    return { id: fullId, mod: mod.id, ...shape, name: { en, fr: en }, acquisition, recipes: itemRecipes, lootSources };
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

const camelToSnake = value => value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
const genericItemTokens = new Set(["item", "weapon", "staff", "sword", "axe", "mace", "curio", "spellbook", "book", "the", "of", "hazens", "example", "preset"]);

function spellFromConstant(constant, spells) {
  const wanted = constant.toLowerCase().replace(/_(spell|supplier|registry)$/g, "");
  return spells.find(spell => spell.id.split(":")[1] === wanted)
    ?? spells.find(spell => spell.id.split(":")[1].replaceAll("_", "") === wanted.replaceAll("_", ""));
}

function innateEntries(text, spells) {
  const result = [];
  for (const match of text.matchAll(/new SpellDataRegistryHolder\([^\n,]*?\.([A-Z][A-Z0-9_]+)\s*,\s*(\d+)\)/g)) {
    const spell = spellFromConstant(match[1], spells);
    if (!spell) continue;
    const level = Number(match[2]);
    result.push({ spell: spell.id, level, normalMaxLevel: spell.maxLevel, aboveMax: level > spell.maxLevel });
  }
  return [...new Map(result.map(entry => [`${entry.spell}:${entry.level}`, entry])).values()];
}

function affinitiesFromSource(text) {
  const found = new Set();
  for (const school of Object.keys(schoolAliases)) {
    const constant = school === "ritual" ? "RITUAL" : school.toUpperCase();
    if (new RegExp(`${constant}_(?:SPELL|MAGIC)_POWER|${constant}_RARITY|${constant}_RESOURCE`).test(text)) found.add(school);
  }
  return [...found];
}

function attachSourceMetadata(items, spells, sourceDirs) {
  for (const [modId, sourceDir] of sourceDirs) {
    const modItems = items.filter(item => item.mod === modId);
    for (const file of walk(sourceDir).filter(path => path.endsWith(".java"))) {
      const text = readFileSync(file, "utf8");
      if (!/SpellDataRegistryHolder|SPELL_POWER|_RARITY/.test(text)) continue;
      const fileInnates = innateEntries(text, spells);
      const fileAffinities = affinitiesFromSource(text);
      for (const line of text.split("\n").filter(line => line.includes("register(") && /SpellDataRegistryHolder/.test(line))) {
        const id = line.match(/register\(\s*"([a-z0-9_]+)"/)?.[1];
        const item = id ? modItems.find(candidate => candidate.id.endsWith(`:${id}`)) : null;
        if (!item) continue;
        item.innateSpells = innateEntries(line, spells);
        item.affinities = [...new Set([...item.affinities, ...affinitiesFromSource(line), ...item.innateSpells.map(entry => spells.find(spell => spell.id === entry.spell)?.school).filter(Boolean)])];
      }
      if (!fileInnates.length && !fileAffinities.length) continue;
      const stemTokens = camelToSnake(basename(file, ".java").replace(/(?:Item|Spellbook|Weapon|Curio)$/i, "")).split("_").filter(token => token && !genericItemTokens.has(token));
      if (!stemTokens.length) continue;
      const ranked = modItems.map(item => {
        const haystack = `${item.id.split(":")[1]} ${item.name.en}`.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const hits = stemTokens.filter(token => haystack.includes(token)).length;
        return { item, score: hits / stemTokens.length };
      }).sort((a, b) => b.score - a.score);
      if (!ranked[0] || ranked[0].score < 0.66 || ranked[0].score === ranked[1]?.score) continue;
      const item = ranked[0].item;
      if (fileInnates.length) item.innateSpells = [...new Map([...(item.innateSpells ?? []), ...fileInnates].map(entry => [`${entry.spell}:${entry.level}`, entry])).values()];
      item.affinities = [...new Set([...item.affinities, ...fileAffinities, ...(item.innateSpells ?? []).map(entry => spells.find(spell => spell.id === entry.spell)?.school).filter(Boolean)])];
    }
  }
}

function buildArmorSets(items) {
  const groups = new Map();
  for (const item of items.filter(entry => entry.type === "armor" && entry.slot && entry.setKey)) {
    const key = `${item.mod}:${item.setKey}`;
    if (!groups.has(key)) groups.set(key, { id: key, mod: item.mod, name: { en: pretty(item.setKey), fr: pretty(item.setKey) }, affinities: [], pieces: { helmet: [], chestplate: [], leggings: [], boots: [] } });
    const set = groups.get(key);
    set.pieces[item.slot].push(item.id);
    set.affinities.push(...item.affinities);
  }
  return [...groups.values()].map(set => ({ ...set, affinities: [...new Set(set.affinities)], pieceCount: Object.values(set.pieces).filter(entries => entries.length).length })).sort((a, b) => a.name.en.localeCompare(b.name.en));
}

const all = { spells: [], items: [], entities: [], enchantments: [], structures: [] };
const sourceDirs = [];
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
  sourceDirs.push([mod.id, sourceDir]);
  all.spells.push(...parseSpells(mod, lang, sourceDir));
  const catalog = parseCatalog(mod, lang, entries, jar);
  for (const key of ["items", "entities", "enchantments", "structures"]) all[key].push(...catalog[key]);
}

attachSourceMetadata(all.items, all.spells, sourceDirs);
const armorSets = buildArmorSets(all.items);
const unresolvedSchools = [...new Set(all.spells.filter(spell => !schools.some(school => school.id === spell.school)).map(spell => spell.school))];
if (unresolvedSchools.length) throw new Error(`Unresolved schools: ${unresolvedSchools.join(", ")}`);

const content = {
  meta: { minecraft: "1.21.1", loader: "NeoForge 21.1.250", configs: "default", generatedAt: new Date().toISOString(), schema: 1 },
  mods,
  schools: schools.map(school => ({ ...school, symbolItem: schoolSymbolItems[school.id] ?? null, spellCount: all.spells.filter(spell => spell.school === school.id).length })),
  ...all,
  armorSets
};
mkdirSync(join(root, "docs/data"), { recursive: true });
writeFileSync(outFile, JSON.stringify(content, null, 2) + "\n");
console.log(`Wrote ${relative(root, outFile)}: ${content.spells.length} spells, ${content.items.length} items, ${content.entities.length} entities, ${content.structures.length} structures.`);
