const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
const slugName = value => value?.replaceAll("_", " ") ?? "—";

const i18n = {
  fr: {
    nav: ["Accueil", "Écoles", "Sorts", "Équipement", "Bestiaire", "Structures", "Créateur de setup", "Sources"],
    search: "Rechercher un sort, objet, mob…", heroEyebrow: "Grimoire communautaire · Édition 1.21.1",
    heroTitle: "Maîtrisez chaque <span>école de magie</span>.", heroLead: "Le catalogue bilingue d’Iron’s Spells et de ses addons, extrait des versions exactes de votre modpack — avec un créateur de setup à une ou deux écoles.",
    explore: "Explorer les écoles", create: "Créer mon setup", schools: "Écoles", spells: "Sorts", items: "Objets", mods: "Mods audités",
    featured: "Les écoles du grimoire", featuredSub: "Chaque école change l’ambiance et les recommandations du wiki.", seeAll: "Tout afficher",
    catalog: "Catalogue des sorts", catalogLead: "Niveaux, rareté, mana, temps de recharge et provenance issus des classes du JAR exact.",
    allSchools: "Toutes les écoles", allMods: "Tous les mods", allRarities: "Toutes les raretés", results: "résultats", details: "Détails",
    level: "Niveau max", cooldown: "Recharge", mana: "Mana initial", cast: "Incantation", acquisition: "Obtention", source: "Source",
    acquisition_scroll_forge_or_loot: "Forge à parchemins / butin", acquisition_special: "Obtention spéciale", acquisition_craft: "Fabrication", acquisition_loot_or_special: "Butin / progression spéciale",
    gear: "Équipement", gearLead: "Armures, armes, grimoires, curios et matériaux déclarés par les mods concernés.", type: "Type", allTypes: "Tous les types",
    bestiary: "Bestiaire", bestiaryLead: "Créatures, invocations et entités magiques déclarées par les addons.", structures: "Structures", structuresLead: "Structures worldgen déclarées dans les fichiers de données exacts.",
    build: "Créateur de setup", buildLead: "L’assistant propose une combinaison cohérente ; le mode libre vous laisse tout choisir. Maximum : deux écoles.", guided: "Mode guidé", free: "Mode libre",
    role: "1 · Choisissez votre style", schoolsPick: "2 · Choisissez une ou deux écoles", spellPick: "3 · Composez votre grimoire", equipment: "4 · Équipez votre mage",
    suggest: "Générer une recommandation", reset: "Réinitialiser", save: "Sauvegarder", share: "Copier le lien", add: "Ajouter", selected: "sélectionnés", buildName: "Setup sans nom",
    sourceTitle: "Sources et traçabilité", sourceLead: "Le wiki cible votre installation exacte. Les dépôts servent de référence ; si leur version diffère, le JAR installé prime pour les données factuelles.",
    exact: "Source exacte", jarExact: "JAR exact, dépôt en retard", jarOnly: "JAR exact, aucun dépôt trouvé", officialPage: "Page officielle", repository: "Code source", noResult: "Aucun résultat pour ces filtres.",
    translationNotice: "L’interface est entièrement bilingue. Les noms et descriptions FR officiels sont utilisés lorsqu’ils existent ; les addons sans traduction française conservent temporairement leur texte anglais pour éviter d’inventer une traduction technique.",
    searchTitle: "Recherche globale", searchLead: "Résultats dans les sorts, objets, créatures et structures.", copied: "Lien copié", saved: "Setup sauvegardé", maxSchools: "Deux écoles maximum", chooseSchool: "Choisissez au moins une école",
    guideTitle: "Pourquoi cette combinaison ?", slots: "emplacements", provenance: "Provenance", defaultConfig: "Configuration par défaut"
  },
  en: {
    nav: ["Home", "Schools", "Spells", "Gear", "Bestiary", "Structures", "Build creator", "Sources"],
    search: "Search a spell, item, mob…", heroEyebrow: "Community grimoire · 1.21.1 edition",
    heroTitle: "Master every <span>school of magic</span>.", heroLead: "The bilingual catalogue for Iron’s Spells and its addons, extracted from the exact versions in your modpack — with a one or two-school build creator.",
    explore: "Explore schools", create: "Create my build", schools: "Schools", spells: "Spells", items: "Items", mods: "Audited mods",
    featured: "Schools of the grimoire", featuredSub: "Each school changes the wiki atmosphere and recommendations.", seeAll: "View all",
    catalog: "Spell catalogue", catalogLead: "Levels, rarity, mana, cooldown and provenance extracted from the exact JAR classes.",
    allSchools: "All schools", allMods: "All mods", allRarities: "All rarities", results: "results", details: "Details",
    level: "Max level", cooldown: "Cooldown", mana: "Base mana", cast: "Cast", acquisition: "Acquisition", source: "Source",
    acquisition_scroll_forge_or_loot: "Scroll forge / loot", acquisition_special: "Special acquisition", acquisition_craft: "Crafting", acquisition_loot_or_special: "Loot / special progression",
    gear: "Gear", gearLead: "Armor, weapons, spellbooks, curios and materials declared by the relevant mods.", type: "Type", allTypes: "All types",
    bestiary: "Bestiary", bestiaryLead: "Creatures, summons and magical entities declared by the addons.", structures: "Structures", structuresLead: "Worldgen structures declared in the exact data files.",
    build: "Build creator", buildLead: "The assistant suggests a coherent combination; free mode lets you choose everything. Maximum: two schools.", guided: "Guided mode", free: "Free mode",
    role: "1 · Choose your playstyle", schoolsPick: "2 · Choose one or two schools", spellPick: "3 · Assemble your spellbook", equipment: "4 · Equip your mage",
    suggest: "Generate recommendation", reset: "Reset", save: "Save", share: "Copy link", add: "Add", selected: "selected", buildName: "Unnamed build",
    sourceTitle: "Sources and traceability", sourceLead: "The wiki targets your exact installation. Repositories are references; when versions differ, the installed JAR prevails for factual data.",
    exact: "Exact source", jarExact: "Exact JAR, repository behind", jarOnly: "Exact JAR, no repository found", officialPage: "Official page", repository: "Source code", noResult: "No results for these filters.",
    translationNotice: "The interface is fully bilingual. Official French names and descriptions are used when available; addons without a French translation temporarily retain their English text to avoid inventing technical translations.",
    searchTitle: "Global search", searchLead: "Results across spells, items, creatures and structures.", copied: "Link copied", saved: "Build saved", maxSchools: "Two schools maximum", chooseSchool: "Choose at least one school",
    guideTitle: "Why this combination?", slots: "slots", provenance: "Provenance", defaultConfig: "Default configuration"
  }
};

const routeDefs = [
  ["home", "⌂"], ["schools", "✦"], ["spells", "⌁"], ["gear", "⚔"], ["bestiary", "♜"], ["structures", "◇"], ["build", "⚙"], ["sources", "↗"]
];
const rarityRank = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1, unknown: 0 };
const roleSchools = {
  battlemage: ["fire", "lightning", "blood", "shadow"], warden: ["nature", "holy", "ice", "radiance"],
  controller: ["eldritch", "ender", "evocation", "ritual"], summoner: ["eldritch", "blood", "evocation", "spirit"],
  mobility: ["ender", "lightning", "symmetry", "spirit"], technomancer: ["technomancy", "cosmic", "aqua", "abyssal"]
};
const roleLabels = {
  battlemage: ["Mage de bataille", "Battlemage", "Dégâts directs et pression", "Direct damage and pressure"],
  warden: ["Gardien", "Warden", "Défense, soin et contrôle", "Defense, healing and control"],
  controller: ["Arcaniste", "Arcanist", "Entraves et magie complexe", "Disruption and complex magic"],
  summoner: ["Invocateur", "Summoner", "Alliés et terrain", "Allies and battlefield"],
  mobility: ["Duelliste", "Duelist", "Mobilité et tempo", "Mobility and tempo"],
  technomancer: ["Technomancien", "Technomancer", "Machines et utilitaire", "Machines and utility"]
};

let data;
let lang = localStorage.getItem("irons-wiki-lang") || "fr";
let build = JSON.parse(localStorage.getItem("irons-wiki-build") || "null") || { mode: "guided", role: "battlemage", schools: [], spells: [], gear: {}, name: "" };
const t = key => i18n[lang][key] ?? key;
const schoolById = id => data.schools.find(s => s.id === id) || data.schools.at(-1);
const modById = id => data.mods.find(m => m.id === id);
const localName = entry => entry?.name?.[lang] || entry?.name?.en || "—";
const paramsForHash = () => new URLSearchParams(location.hash.split("?")[1] || "");
const route = () => (location.hash.slice(1).split("?")[0] || "home");

function setTheme(schoolId) {
  const color = schoolById(schoolId)?.color || "#a36bf2";
  document.documentElement.style.setProperty("--accent", color);
  const rgb = color.match(/\w\w/g)?.map(x => parseInt(x, 16)).join(",") || "163,107,242";
  document.documentElement.style.setProperty("--accent-rgb", rgb);
}

function renderNav() {
  $("#main-nav").innerHTML = routeDefs.map(([id, icon], index) => `<a class="nav-link ${route() === id ? "active" : ""}" href="#${id}"><span class="nav-icon">${icon}</span>${t("nav")[index]}</a>`).join("");
  $("#global-search").placeholder = t("search");
  document.documentElement.lang = lang;
}

function pageHeader(eyebrow, title, lead) {
  return `<header><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p></header>`;
}

function stats() {
  return `<div class="stats">
    <div class="stat"><strong>${data.schools.filter(s => s.spellCount).length}</strong><span>${t("schools")}</span></div>
    <div class="stat"><strong>${data.spells.length}</strong><span>${t("spells")}</span></div>
    <div class="stat"><strong>${data.items.length.toLocaleString(lang)}</strong><span>${t("items")}</span></div>
    <div class="stat"><strong>${data.mods.length}</strong><span>${t("mods")}</span></div>
  </div>`;
}

function schoolCards(list = data.schools.filter(s => s.spellCount), selectable = false) {
  return `<div class="grid schools">${list.map(s => `<article class="card school-card ${build.schools.includes(s.id) ? "selected" : ""}" style="--school:${s.color}" data-school="${s.id}" data-selectable="${selectable}" data-rune="${esc(localName(s).slice(0,1))}" tabindex="0">
    <div class="sigil"><span>${esc(localName(s).slice(0,1))}</span></div><h3>${esc(localName(s))}</h3>
    <p>${s.spellCount} ${t("spells").toLowerCase()} · ${esc(s.theme[lang])}</p>
  </article>`).join("")}</div>`;
}

function homePage() {
  setTheme(build.schools[0]);
  return `<section class="hero"><div class="hero-content"><div class="eyebrow">${t("heroEyebrow")}</div><h1>${t("heroTitle")}</h1><p class="lead">${t("heroLead")}</p><div class="hero-actions"><a class="button primary" href="#build">${t("create")} →</a><a class="button ghost" href="#schools">${t("explore")}</a></div></div></section>
    <div class="page">${stats()}<div class="section-head"><div><h2>${t("featured")}</h2><p>${t("featuredSub")}</p></div><a href="#schools">${t("seeAll")} →</a></div>${schoolCards(data.schools.filter(s => s.spellCount).slice(0,10))}
    <div class="section-head"><div><h2>${t("provenance")}</h2><p>${t("defaultConfig")}</p></div></div><div class="notice">${t("translationNotice")}</div></div>`;
}

function schoolsPage() {
  setTheme(paramsForHash().get("school"));
  return `<div class="page">${pageHeader(t("nav")[1], t("featured"), t("featuredSub"))}${stats()}${schoolCards()}</div>`;
}

function options(list, selected, allLabel, value = x => x, label = x => x) {
  return `<option value="">${esc(allLabel)}</option>${list.map(x => `<option value="${esc(value(x))}" ${selected === value(x) ? "selected" : ""}>${esc(label(x))}</option>`).join("")}`;
}

function spellRow(spell, allowAdd = false) {
  const school = schoolById(spell.school);
  return `<article class="catalog-row" style="--school:${school.color}"><div><h3>${esc(localName(spell))}</h3><p>${esc(spell.guide?.[lang] || spell.guide?.en || spell.id)}</p></div><div class="catalog-cell"><span class="pill school" style="--school:${school.color}">${esc(localName(school))}</span></div><div class="catalog-cell">${esc(slugName(spell.rarity))} · ${spell.maxLevel}</div><div class="catalog-cell">${spell.manaBase} + ${spell.manaPerLevel}/lvl</div><button class="detail-button" data-spell="${spell.id}" ${allowAdd ? 'data-add="true"' : ""}>${allowAdd ? (build.spells.includes(spell.id) ? "✓" : `+ ${t("add")}`) : `${t("details")} →`}</button></article>`;
}

function spellsPage() {
  const p = paramsForHash();
  const q = p.get("q") || ""; const school = p.get("school") || ""; const mod = p.get("mod") || ""; const rarity = p.get("rarity") || "";
  if (school) setTheme(school); else setTheme(build.schools[0]);
  const filtered = data.spells.filter(s => (!q || `${localName(s)} ${s.id} ${s.guide?.[lang] || s.guide?.en}`.toLowerCase().includes(q.toLowerCase())) && (!school || s.school === school) && (!mod || s.mod === mod) && (!rarity || s.rarity === rarity));
  return `<div class="page">${pageHeader(t("nav")[2], t("catalog"), t("catalogLead"))}
    <div class="toolbar"><input class="input filter" data-filter="q" value="${esc(q)}" placeholder="${esc(t("search"))}"><select class="select filter" data-filter="school">${options(data.schools.filter(s => s.spellCount), school, t("allSchools"), s => s.id, localName)}</select><select class="select filter" data-filter="mod">${options(data.mods, mod, t("allMods"), m => m.id, m => m.name)}</select><select class="select filter" data-filter="rarity">${options(Object.keys(rarityRank).filter(r => r !== "unknown"), rarity, t("allRarities"), x => x, slugName)}</select></div>
    <div class="section-head"><span class="result-count">${filtered.length} ${t("results")}</span></div><div class="catalog-list">${filtered.slice(0,150).map(s => spellRow(s)).join("") || `<div class="empty">${t("noResult")}</div>`}</div>${filtered.length > 150 ? `<div class="notice">150 / ${filtered.length} — affinez les filtres pour voir les autres résultats.</div>` : ""}</div>`;
}

function catalogPage(kind) {
  const configs = {
    gear: [data.items, t("gear"), t("gearLead"), "type", ["armor", "weapon", "spellbook", "curio", "item"]],
    bestiary: [data.entities, t("bestiary"), t("bestiaryLead"), "kind", ["mob", "summon", "spell_entity"]],
    structures: [data.structures, t("structures"), t("structuresLead"), null, []]
  };
  const [list, title, lead, field, types] = configs[kind]; const p = paramsForHash(); const q = p.get("q") || ""; const type = p.get("type") || ""; const mod = p.get("mod") || "";
  const filtered = list.filter(x => (!q || `${localName(x)} ${x.id}`.toLowerCase().includes(q.toLowerCase())) && (!type || x[field] === type) && (!mod || x.mod === mod));
  return `<div class="page">${pageHeader(t("nav")[routeDefs.findIndex(x => x[0] === kind)], title, lead)}<div class="toolbar"><input class="input filter" data-filter="q" value="${esc(q)}" placeholder="${esc(t("search"))}">${field ? `<select class="select filter" data-filter="type">${options(types, type, t("allTypes"), x => x, slugName)}</select>` : ""}<select class="select filter" data-filter="mod">${options(data.mods, mod, t("allMods"), m => m.id, m => m.name)}</select></div><div class="section-head"><span class="result-count">${filtered.length} ${t("results")}</span></div><div class="grid cards">${filtered.slice(0,180).map(x => `<article class="card"><span class="pill">${esc(slugName(x[field] || kind))}</span><h3 style="margin-top:.75rem">${esc(localName(x))}</h3><p class="catalog-cell">${esc(modById(x.mod)?.name)} · ${esc(x.id)}</p>${x.acquisition ? `<p class="catalog-cell">${t(`acquisition_${x.acquisition}`)}</p>` : ""}</article>`).join("") || `<div class="empty">${t("noResult")}</div>`}</div></div>`;
}

function sourcesPage() {
  return `<div class="page">${pageHeader(t("nav")[7], t("sourceTitle"), t("sourceLead"))}<div class="notice">${t("translationNotice")}</div><div class="catalog-list" style="margin-top:1rem">${data.mods.map(mod => `<article class="card source-row"><div><h3>${esc(mod.name)}</h3><p class="catalog-cell">${esc(mod.id)}</p></div><span class="pill">${esc(mod.version)}</span><span class="source-status ${mod.sourceStatus}">${t(mod.sourceStatus === "exact" ? "exact" : mod.sourceStatus === "jar-exact" ? "jarExact" : "jarOnly")}</span><div>${mod.source ? `<a class="detail-button" href="${esc(mod.source)}" target="_blank" rel="noreferrer">${t("repository")} ↗</a>` : ""} <a class="detail-button" href="${esc(mod.page)}" target="_blank" rel="noreferrer">${t("officialPage")} ↗</a></div></article>`).join("")}</div></div>`;
}

function guideText() {
  if (!build.schools.length) return t("chooseSchool");
  const names = build.schools.map(id => localName(schoolById(id)));
  const themes = build.schools.map(id => schoolById(id).theme[lang]);
  return lang === "fr"
    ? `${names.join(" + ")} construit un profil ${roleLabels[build.role]?.[0]?.toLowerCase() || "personnalisé"} autour de ${themes.join(" et de ")}. La sélection favorise des temps de recharge complémentaires et plusieurs niveaux de rareté.`
    : `${names.join(" + ")} creates a ${roleLabels[build.role]?.[1]?.toLowerCase() || "custom"} profile around ${themes.join(" and ")}. The selection favors complementary cooldowns and multiple rarity tiers.`;
}

function gearSelect(slot, label, items) {
  const selected = build.gear[slot] || "";
  return `<label class="catalog-cell">${esc(label)}<select class="select gear-select" data-slot="${slot}"><option value="">—</option>${items.map(item => `<option value="${item.id}" ${selected === item.id ? "selected" : ""}>${esc(localName(item))} · ${esc(modById(item.mod)?.name)}</option>`).join("")}</select></label>`;
}

function buildPage() {
  setTheme(build.schools[0]);
  const recommendedSchools = roleSchools[build.role] || [];
  const schoolList = data.schools.filter(s => s.spellCount && (build.mode === "free" || recommendedSchools.includes(s.id) || build.schools.includes(s.id)));
  const available = data.spells.filter(s => build.schools.includes(s.school) && !s.deprecated).sort((a,b) => rarityRank[a.rarity] - rarityRank[b.rarity] || a.cooldown - b.cooldown);
  const selectedSpells = build.spells.map(id => data.spells.find(s => s.id === id)).filter(Boolean);
  const armor = data.items.filter(i => i.type === "armor"); const weapons = data.items.filter(i => i.type === "weapon"); const curios = data.items.filter(i => i.type === "curio");
  return `<div class="page">${pageHeader(t("nav")[6], t("build"), t("buildLead"))}<div class="build-shell"><section class="build-panel"><div class="mode-tabs"><button class="mode-tab ${build.mode === "guided" ? "active" : ""}" data-mode="guided">${t("guided")}</button><button class="mode-tab ${build.mode === "free" ? "active" : ""}" data-mode="free">${t("free")}</button></div>
    <div class="step"><div class="step-label">${t("role")}</div><div class="choice-grid">${Object.entries(roleLabels).map(([id, label]) => `<button class="choice ${build.role === id ? "active" : ""}" data-role="${id}"><strong>${label[lang === "fr" ? 0 : 1]}</strong><small>${label[lang === "fr" ? 2 : 3]}</small></button>`).join("")}</div></div>
    <div class="step"><div class="step-label">${t("schoolsPick")} · ${build.schools.length}/2</div>${schoolCards(schoolList, true)}</div>
    <div class="step"><div class="step-label">${t("spellPick")} · ${selectedSpells.length}/10</div><div class="catalog-list">${available.slice(0,80).map(s => spellRow(s, true)).join("") || `<div class="empty">${t("chooseSchool")}</div>`}</div></div>
    <div class="step"><div class="step-label">${t("equipment")}</div><div class="grid cards">${gearSelect("weapon", lang === "fr" ? "Arme" : "Weapon", weapons)}${gearSelect("helmet", lang === "fr" ? "Casque" : "Helmet", armor.filter(i => i.id.endsWith("helmet")))}${gearSelect("chestplate", lang === "fr" ? "Plastron" : "Chestplate", armor.filter(i => i.id.endsWith("chestplate")))}${gearSelect("leggings", lang === "fr" ? "Jambières" : "Leggings", armor.filter(i => i.id.endsWith("leggings")))}${gearSelect("boots", lang === "fr" ? "Bottes" : "Boots", armor.filter(i => i.id.endsWith("boots")))}${gearSelect("curio", "Curio", curios)}</div></div>
    </section><aside class="build-panel sticky"><div class="eyebrow">${t("build")}</div><input class="input" id="build-name" value="${esc(build.name)}" placeholder="${t("buildName")}" style="margin:.75rem 0"><h2 class="build-title">${build.schools.map(id => localName(schoolById(id))).join(" + ") || "—"}</h2><div class="progress"><span style="width:${Math.min(100, build.schools.length * 25 + selectedSpells.length * 5)}%"></span></div><h3>${t("guideTitle")}</h3><p class="build-summary">${esc(guideText())}</p><div class="selected-spells">${selectedSpells.map(s => `<div class="selected-spell" style="--school:${schoolById(s.school).color}"><span>${esc(localName(s))}</span><button data-remove-spell="${s.id}">×</button></div>`).join("")}</div><div class="hero-actions"><button class="button primary" id="recommend">${t("suggest")}</button><button class="button" id="save-build">${t("save")}</button><button class="button ghost" id="share-build">${t("share")}</button><button class="button ghost" id="reset-build">${t("reset")}</button></div></aside></div></div>`;
}

function searchPage() {
  const q = paramsForHash().get("q") || ""; const normalized = q.toLowerCase();
  const groups = [
    [t("spells"), data.spells.filter(x => `${localName(x)} ${x.id}`.toLowerCase().includes(normalized)).slice(0,12)],
    [t("items"), data.items.filter(x => `${localName(x)} ${x.id}`.toLowerCase().includes(normalized)).slice(0,12)],
    [t("bestiary"), data.entities.filter(x => `${localName(x)} ${x.id}`.toLowerCase().includes(normalized)).slice(0,12)],
    [t("structures"), data.structures.filter(x => `${localName(x)} ${x.id}`.toLowerCase().includes(normalized)).slice(0,12)]
  ];
  return `<div class="page">${pageHeader("⌕", t("searchTitle"), t("searchLead"))}${groups.map(([title, list]) => `<div class="section-head"><h2>${title}</h2><span class="result-count">${list.length}</span></div><div class="grid cards">${list.map(x => `<article class="card"><h3>${esc(localName(x))}</h3><p class="catalog-cell">${esc(x.id)} · ${esc(modById(x.mod)?.name)}</p></article>`).join("") || `<div class="empty">${t("noResult")}</div>`}</div>`).join("")}</div>`;
}

function showSpell(id) {
  const spell = data.spells.find(s => s.id === id); if (!spell) return;
  const school = schoolById(spell.school); const mod = modById(spell.mod);
  const backdrop = document.createElement("div"); backdrop.className = "modal-backdrop";
  const modal = document.createElement("article"); modal.className = "modal-card"; modal.style.setProperty("--accent", school.color);
  modal.innerHTML = `<div class="modal-top"><div><span class="pill school" style="--school:${school.color}">${esc(localName(school))}</span><h2 style="margin-top:.7rem">${esc(localName(spell))}</h2><p class="catalog-cell">${esc(spell.id)} · ${esc(mod.name)}</p></div><button aria-label="Close">×</button></div><div class="detail-grid"><div><small>${t("level")}</small><strong>${spell.maxLevel}</strong></div><div><small>${t("cooldown")}</small><strong>${spell.cooldown}s</strong></div><div><small>${t("mana")}</small><strong>${spell.manaBase}</strong></div><div><small>${t("cast")}</small><strong>${esc(slugName(spell.castType))}</strong></div><div><small>${t("acquisition")}</small><strong>${t(`acquisition_${spell.acquisition}`)}</strong></div><div><small>Rareté</small><strong>${esc(slugName(spell.rarity))}</strong></div></div><p class="guide">${esc(spell.guide?.[lang] || spell.guide?.en || "—")}</p><a class="button ghost" href="${esc(mod.source || mod.page)}" target="_blank" rel="noreferrer">${t("source")} ↗</a>`;
  document.body.append(backdrop, modal); const close = () => { backdrop.remove(); modal.remove(); }; backdrop.onclick = close; $("button", modal).onclick = close;
}

function saveBuild() { localStorage.setItem("irons-wiki-build", JSON.stringify(build)); toast(t("saved")); }
function recommendBuild() {
  if (!build.schools.length) build.schools = (roleSchools[build.role] || []).slice(0,2);
  const candidates = data.spells.filter(s => build.schools.includes(s.school) && !s.deprecated && s.id !== "irons_spellbooks:none");
  const bySchool = build.schools.flatMap(id => candidates.filter(s => s.school === id).sort((a,b) => a.cooldown - b.cooldown || rarityRank[a.rarity] - rarityRank[b.rarity]).slice(0,5));
  build.spells = [...new Set(bySchool.map(s => s.id))].slice(0,10); saveBuild(); render();
}
function shareBuild() {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(build))));
  const url = `${location.origin}${location.pathname}#build?setup=${encodeURIComponent(payload)}`;
  navigator.clipboard.writeText(url).then(() => toast(t("copied")));
}
function toast(message) { const node = $("#toast"); node.textContent = message; node.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove("show"), 1800); }

function bind() {
  $$(".school-card").forEach(card => {
    const activate = () => {
      const id = card.dataset.school;
      if (card.dataset.selectable === "true") {
        if (build.schools.includes(id)) { build.schools = build.schools.filter(x => x !== id); build.spells = build.spells.filter(spellId => { const spell = data.spells.find(s => s.id === spellId); return spell && build.schools.includes(spell.school); }); }
        else if (build.schools.length < 2) build.schools.push(id); else return toast(t("maxSchools"));
        render();
      } else location.hash = `spells?school=${id}`;
    };
    card.onclick = activate; card.onkeydown = e => { if (e.key === "Enter" || e.key === " ") activate(); };
  });
  $$(".filter").forEach(input => input.onchange = input.oninput = () => {
    const p = paramsForHash(); input.value ? p.set(input.dataset.filter, input.value) : p.delete(input.dataset.filter);
    clearTimeout(input._timer); input._timer = setTimeout(() => { location.hash = `${route()}?${p}`; render(); }, input.tagName === "INPUT" ? 160 : 0);
  });
  $$('[data-spell]').forEach(button => button.onclick = () => {
    if (button.dataset.add) {
      const id = button.dataset.spell;
      build.spells = build.spells.includes(id) ? build.spells.filter(x => x !== id) : build.spells.length < 10 ? [...build.spells, id] : build.spells;
      render();
    } else showSpell(button.dataset.spell);
  });
  $$('[data-remove-spell]').forEach(button => button.onclick = () => { build.spells = build.spells.filter(x => x !== button.dataset.removeSpell); render(); });
  $$('[data-mode]').forEach(button => button.onclick = () => { build.mode = button.dataset.mode; render(); });
  $$('[data-role]').forEach(button => button.onclick = () => { build.role = button.dataset.role; if (build.mode === "guided") build.schools = []; build.spells = []; render(); });
  $$(".gear-select").forEach(select => select.onchange = () => { build.gear[select.dataset.slot] = select.value; });
  if ($("#build-name")) $("#build-name").oninput = e => build.name = e.target.value;
  if ($("#recommend")) $("#recommend").onclick = recommendBuild;
  if ($("#save-build")) $("#save-build").onclick = saveBuild;
  if ($("#share-build")) $("#share-build").onclick = shareBuild;
  if ($("#reset-build")) $("#reset-build").onclick = () => { build = { mode: "guided", role: "battlemage", schools: [], spells: [], gear: {}, name: "" }; saveBuild(); render(); };
}

function loadSharedBuild() {
  const setup = paramsForHash().get("setup"); if (!setup) return;
  try { build = JSON.parse(decodeURIComponent(escape(atob(setup)))); history.replaceState(null, "", "#build"); } catch { /* malformed links are ignored */ }
}

function render() {
  loadSharedBuild(); renderNav();
  const pages = { home: homePage, schools: schoolsPage, spells: spellsPage, gear: () => catalogPage("gear"), bestiary: () => catalogPage("bestiary"), structures: () => catalogPage("structures"), build: buildPage, sources: sourcesPage, search: searchPage };
  $("#content").innerHTML = (pages[route()] || homePage)(); bind(); window.scrollTo({ top: 0, behavior: "instant" });
}

async function init() {
  data = await fetch("./data/content.json").then(response => { if (!response.ok) throw new Error(response.statusText); return response.json(); });
  $("#language-button").onclick = () => { lang = lang === "fr" ? "en" : "fr"; localStorage.setItem("irons-wiki-lang", lang); render(); };
  $("#menu-button").onclick = () => $("#sidebar").classList.toggle("open");
  $("#global-search").onkeydown = event => { if (event.key === "Enter" && event.target.value.trim()) location.hash = `search?q=${encodeURIComponent(event.target.value.trim())}`; };
  document.addEventListener("keydown", event => { if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); $("#global-search").focus(); } });
  window.addEventListener("hashchange", () => { $("#sidebar").classList.remove("open"); render(); });
  render();
}

init().catch(error => { $("#content").innerHTML = `<div class="page"><h1>Impossible de charger le grimoire</h1><p class="lead">${esc(error.message)}</p></div>`; });
