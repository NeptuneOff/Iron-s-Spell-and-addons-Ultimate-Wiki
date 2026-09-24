import {execFileSync} from "node:child_process";
import {readFileSync,writeFileSync,readdirSync,statSync,existsSync} from "node:fs";
import {join,basename} from "node:path";
const root=new URL("..",import.meta.url).pathname, ws=new URL("../..",import.meta.url).pathname;
const file=join(root,"docs/data/content.json"), data=JSON.parse(readFileSync(file,"utf8"));
const jars=Object.fromEntries(data.mods.map(m=>[m.id,join(ws,"jars",m.jar)]));
const zlist=j=>execFileSync("unzip",["-Z1",j],{encoding:"utf8",maxBuffer:67108864}).trim().split("\n");
const zread=(j,p)=>execFileSync("unzip",["-p",j,p],{encoding:"utf8",maxBuffer:67108864});
const walk=d=>existsSync(d)?readdirSync(d).flatMap(n=>{const p=join(d,n);return statSync(p).isDirectory()?walk(p):[p]}):[];
const add=(map,id,v)=>map.set(id,[...(map.get(id)||[]),v]);
const uniq=a=>[...new Map(a.map(x=>[JSON.stringify(x),x])).values()];
const acquisitions=new Map(), tables=new Map(), tableProviders=new Map();
const boostPattern=/(?:AttributeRegistry|ASAttributeRegistry|CSAttributeRegistry|HLAttributeRegistry|ModAttribute)\.([A-Z_]+)[\s\S]{0,100}?(-?\d+(?:\.\d+)?)(?:f)?\s*,\s*AttributeModifier\.Operation\.(ADD_[A-Z_]+)/g;
const boostsFrom=txt=>[...txt.matchAll(boostPattern)].map(m=>({attribute:m[1].toLowerCase(),value:Number(m[2]),operation:m[3]}));
function scan(node,out=[],ctx=[]){if(!node||typeof node!=="object")return out;const next=[...ctx,...(node.conditions||[]),...(node.functions||[])];if(/item$/.test(node.type||"")&&node.name){const c=next.find(x=>/random_chance$/.test(x.condition||""));out.push({item:node.name,...(c?{chance:c.chance}:{})})}if(/loot_table$/.test(node.type||"")&&node.name)out.push({nested:typeof node.name==="string"?node.name:node.name.value});for(const k of ["pools","entries","children"])(node[k]||[]).forEach(x=>scan(x,out,next));return out}
for(const [mod,jar] of Object.entries(jars)){for(const p of zlist(jar)){try{if(/^data\/.+\/loot_tables?\/.+\.json$/.test(p)){const [,ns,path]=p.match(/^data\/([^/]+)\/loot_tables?\/(.+)\.json$/)||[],id=`${ns}:${path}`;tables.set(id,scan(JSON.parse(zread(jar,p))));tableProviders.set(id,mod)}if(/^data\/.+\/loot_modifiers\/.+\.json$/.test(p)&&!p.endsWith("global_loot_modifiers.json")){const j=JSON.parse(zread(jar,p)),target=(j.conditions||[]).find(x=>/loot_table_id$/.test(x.condition||""))?.loot_table_id;if(j.loot_table&&target){tables.set(`@${j.loot_table}`,[{nested:j.loot_table,target}]);tableProviders.set(j.loot_table,mod)}}}catch{}}}
const resolve=(id,seen=new Set())=>seen.has(id)?[]:(seen.add(id),(tables.get(id)||[]).flatMap(x=>x.nested?resolve(x.nested,seen):[x]));
for(const [id,rows] of tables){if(id.startsWith("@"))continue;const red=tables.get(`@${id}`)?.[0],target=red?.target||id,[ns,path=""]=target.split(":"),kind=path.startsWith("entities/")?"mob_drop":path.startsWith("chests/")?"chest":path.startsWith("blocks/")?"block_drop":"loot";for(const r of resolve(id))if(r.item)add(acquisitions,r.item,{kind,target:target.replace(/:(entities|chests|blocks)\//,":"),table:target,chance:r.chance,sourceMod:tableProviders.get(id)||ns})}
// Known code-defined trade pattern, plus generic registry-line attribute extraction.
add(acquisitions,"hazennstuff:thorn_chakram",{kind:"trade",target:"hazennstuff:dryad",sourceMod:"hazennstuff"});
const refMap={Terraria:"Terraria",RodOfDiscord:"Terraria",HonkaiStarRail:"Honkai: Star Rail",MCDungeons:"Minecraft Dungeons",Frieren:"Frieren"};
for(const item of data.items){item.recipes=(item.recipes||[]).map(r=>({...r,sourceMod:(r.source.match(/^data\/([^/]+)/)||[])[1]||item.mod}));item.acquisitionSources=uniq(acquisitions.get(item.id)||[]);item.survivalObtainable=!!(item.recipes.length||item.acquisitionSources.length);item.boosts=[]}
for(const spell of data.spells){const m=(spell.guide?.en||"").match(/(?:an?\s+)?([A-Z][A-Za-z0-9 :'-]{1,35}?)\s+Reference/i);if(m)spell.reference=m[1].replace(/Star-?Rail/i,"Star Rail")}
for(const [mod] of Object.entries(jars)){const dir=join(ws,"decompiled",data.mods.find(m=>m.id===mod).jar.replace(/\.jar$/,""));for(const f of walk(dir).filter(x=>x.endsWith(".java"))){const txt=readFileSync(f,"utf8"),path=f.replaceAll("\\","/");const rk=path.match(/\/Reference\/([^/]+)/)?.[1],ref=refMap[rk];const stem=basename(f,".java").replace(/(?:Item|Model|Renderer)$/i,"").replace(/([a-z])([A-Z])/g,"$1_$2").toLowerCase();const item=data.items.find(i=>i.mod===mod&&(i.id.endsWith(`:${stem}`)||i.id.split(":")[1].replaceAll("_","")===stem.replaceAll("_","")));if(item&&ref)item.reference=ref;if(item)item.boosts=uniq([...item.boosts,...boostsFrom(txt)]);
// Many addon items are anonymous classes declared directly on one registry line.
for(const line of txt.split("\n")){const reg=line.match(/\.register\(\s*"([a-z0-9_]+)"/);if(!reg)continue;const direct=data.items.find(i=>i.id===`${mod}:${reg[1]}`);if(direct)direct.boosts=uniq([...direct.boosts,...boostsFrom(line)])}
}}
for(const e of [...data.entities,...data.structures]){const same=[...data.items,...data.spells].find(x=>x.reference&&x.id.split(":")[1]===e.id.split(":")[1]);if(same)e.reference=same.reference}
const eldritch=data.schools.find(s=>s.id==="eldritch");if(eldritch)eldritch.symbolItem="discerning_the_eldritch:eldritch_rune";
data.meta.schema=3;writeFileSync(file,JSON.stringify(data,null,2)+"\n");
console.log(`Enhanced ${data.items.length} items; ${data.items.filter(i=>i.boosts.length).length} with boosts; ${data.items.filter(i=>i.acquisitionSources.length).length} with sources.`);
