const fs = require('fs');
const L = require('./lib');
const { DEPT, MOD, TIER } = require('./cg_lib');
const { EVENTS } = require('./scene_gen');
const OUT = '/mnt/user-data/outputs/SCENES/';

const base = [1, 2, 3, 4, 5, 6, 7, 8].flatMap(n => require('./sc_e0' + n));
const ext = Object.assign({}, ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => require('./cg_e0' + n)));

// ---- validation
let bad = 0;
const ids = new Set(base.map(s => s.id));
base.forEach(s => {
  const e = ext[s.id];
  if (!e) { console.log('NO CG DATA', s.id); bad++; return; }
  ['story', 'tier', 'why', 'use', 'cg', 'prep', 'gen'].forEach(f => { if (!e[f] || (Array.isArray(e[f]) && !e[f].length)) { console.log('MISSING', s.id, f); bad++; } });
  (e.use || []).forEach(m => { if (!MOD[m]) { console.log('BAD MODULE', s.id, m); bad++; } });
  if (!(e.tier >= 1 && e.tier <= 5)) { console.log('BAD TIER', s.id); bad++; }
  if ((e.gen || []).length < 2) { console.log('FEW GENRES', s.id); bad++; }
  const w = e.story.split(/\s+/).length;
  if (w < 55 || w > 140) console.log('STORY LENGTH', s.id, w);
});
Object.keys(ext).forEach(id => { if (!ids.has(id)) { console.log('ORPHAN CG DATA', id); bad++; } });
console.log('scenes', base.length, 'with CG data', Object.keys(ext).length, 'problems', bad);
if (bad) process.exit(1);

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
const dash = v => (v && String(v).trim()) ? v : '—';
const mins = s => { const p = String(s.mins).split('–').map(Number); return [p[0], p[1] || p[0]]; };
function shots(s, e) {
  const [lo, hi] = mins(s);
  const [a, b] = e.tier >= 4 ? [8, 14] : [6, 10];
  return [Math.max(3, Math.round(lo * a)), Math.max(4, Math.round(hi * b))];
}
function depts(e) { const set = new Set(); e.use.forEach(m => MOD[m].dept.forEach(d => set.add(d))); return [...set]; }

function sceneDoc(s) {
  const e = ext[s.id];
  const c = [];
  L.titleBlock(c, `SCENE ${s.id}`, s.t, `${EVENTS[s.ev][1]} · ${s.pl}`);
  c.push(L.note(`Status: ${s.st}. Labels: TEXT = Bhāgavata verse checked earlier; SOURCE = your supplied files; TRADITION = other sources, not re-checked; ADAPTATION = invention for the film. Verse numbers may be off by one. This is a scene candidate, not a plot decision: it can be placed, moved, merged or cut when the plot is built.`));

  // 1
  c.push(L.h1('1. Scene information'));
  c.push(L.tbl(['Item', 'Detail'], [
    ['Scene ID', s.id],
    ['Event', EVENTS[s.ev][1]],
    ['Source beats', s.beats],
    ['Place and time', s.pl],
    ['Viewpoint', s.pov],
    ['Krishna in this scene', s.k],
    ['Rasa · intensity · silent', `${s.rasa} · ${s.int} of 5 · ${s.sil === 'S' ? 'S (works silent)' : s.sil === 'P' ? 'P (partly; needs staging)' : 'D (needs speech)'}`],
    ['Estimated length', `${s.mins} minutes`],
    ['Where it can sit', s.fit],
    ['Why it is in the film', s.why],
    ['How it reaches Rukmini', s.route],
    ['Who wants what from whom', s.want],
    ['Obstacle', s.obs],
    ['What is at stake and why now', s.stakes],
    ['Value; charge in → out', `${s.val[0]}: ${s.val[1]} → ${s.val[2]}`],
    ['The turn', s.turn],
    ['The gap (expected vs actual)', s.gap],
    ['World-welfare proof', dash(s.wel)],
    ['Plants', dash(s.plants)],
    ['Payoffs', dash(s.pays)],
    ['Entry', s.in],
    ['Exit', s.out],
    ['Silent version', dash(s.sv)]
  ], [2600, 7038]));
  c.push(L.gap());

  // 2
  c.push(L.h1('2. Story of the scene'));
  c.push(L.p(e.story, { after: 140 }));
  c.push(L.p('**In the event files:** ' + s.sum.join(' '), { after: 120 }));

  // 3
  const [sl, sh] = shots(s, e);
  const ds = depts(e);
  c.push(L.h1('3. Technical requirements if the scene is made fully in CG'));
  c.push(L.note('Planning guide, independent of any one tool. Examples of tools (Blender, Maya, Houdini, Unreal) are not requirements. Shot counts and tiers are HEURISTIC: use them to compare scenes, not to price them.'));
  c.push(L.tbl(['Measure', 'Value'], [
    ['Complexity tier (1 to 5)', `${e.tier}. ${TIER[e.tier]} ${e.why}`],
    ['Estimated shots (HEURISTIC)', `${sl} to ${sh} (at ${e.tier >= 4 ? '8 to 14' : '6 to 10'} shots a minute over ${s.mins} minutes)`],
    ['Departments involved', ds.map(d => DEPT[d]).join('; ')],
    ['Reusable modules', e.use.map(m => MOD[m].name).join('; ')]
  ], [2600, 7038]));
  c.push(L.gap());
  c.push(L.h2('3.1 What this scene needs'));
  c.push(L.tbl(['Area', 'Requirement'], e.cg, [2600, 7038]));
  c.push(L.gap());
  c.push(L.h2('3.2 Shared modules this scene draws on'));
  c.push(L.tbl(['Module', 'What it needs'], e.use.map(m => [MOD[m].name, MOD[m].req]), [2600, 7038]));
  c.push(L.gap());

  // 4
  c.push(L.h1('4. Technicalities considered and prepared'));
  c.push(L.h2('4.1 Production preparation for this scene'));
  const seen = new Set();
  const prep = [...e.prep];
  e.use.forEach(m => MOD[m].prep.forEach(p => { if (!seen.has(p)) { seen.add(p); prep.push(p); } }));
  prep.forEach(t => c.push(L.bl(t)));
  c.push(L.h2('4.2 Story-craft technicalities (Story Measurement Framework)'));
  c.push(L.note('Which measurements from the Story Measurement Framework (document 11) were applied, and how, so the scene can be checked and re-scored when it is placed.'));
  const rows = [
    ['E1', 'Value turn (McKee): the scene must change a value', `Value is “${s.val[0]}”, going from ${s.val[1]} to ${s.val[2]}. The turn: ${s.turn}`],
    ['E2', 'Three scene questions (Mamet)', `Who wants what from whom: ${s.want} Stakes and why now: ${s.stakes}`],
    ['E3', 'The gap (McKee)', s.gap],
    ['E7', 'Late in, early out', `Enters: ${s.in} Leaves: ${s.out}`],
    ['I1', 'Viewpoint (project rule: Rukmini by default)', s.pov === 'Rukmini' ? 'Rukmini’s viewpoint. Counts toward the 70% target.' : `Not Rukmini’s viewpoint (${s.pov}). Count it against the non-Rukmini budget.`],
    ['I2, H4', 'Krishna routing and talk about the unseen', `${s.k}. ${s.kn}`],
    ['I3', 'Carrier (how the event reaches Rukmini)', s.route],
    ['G1, G2, G4', 'Rasa, intensity curve, silent-capable', `${s.rasa}; intensity ${s.int}; silent rating ${s.sil}. ${s.sv ? 'Silent version: ' + s.sv : 'No separate silent version noted.'}`],
    ['D9, E4', 'Placement and runtime', `Estimated ${s.mins} minutes. ${s.fit}`]
  ];
  if (s.wel && s.wel.trim()) rows.push(['I4', 'World-welfare proof', s.wel]);
  if (s.plants || s.pays) rows.push(['E5', 'Plants and payoffs', `Plants: ${dash(s.plants)} Payoffs: ${dash(s.pays)}`]);
  if (s.par && s.par.trim()) rows.push(['F4, I5', 'Mythic parallel kept planted, not explained', s.par]);
  rows.push(['Craft', 'Scene-specific technique', s.craft]);
  rows.push(['Red flags', 'Checked against the framework red-flag list', s.watch]);
  c.push(L.tbl(['ID', 'Measurement', 'How it is applied in this scene'], rows, [900, 2800, 5938]));
  c.push(L.gap());
  const checks = [s.val && s.val[1] !== s.val[2], !!(s.want && s.obs), !!s.turn, !!s.gap, !!(s.in && s.out), !!s.why, !!s.k, !!(s.route && s.pov), !!(s.plants || s.pays), !!s.sil];
  c.push(L.p(`**Quick-test self-check (document 12, section 10).** ${checks.filter(Boolean).length} of 10 fields filled. This checks that the card is complete, not that the scene is good; read it aloud and judge it as an audience would.`));

  // 5
  c.push(L.h1('5. Genres this scene comes close to'));
  c.push(L.p('The first row is the closest. These describe the scene on its own; the film’s genre is decided when the plot and any variant are built (a thriller or silent variant would favour different scenes).'));
  c.push(L.tbl(['Genre', 'Why this scene fits it'], e.gen, [2600, 7038]));
  c.push(L.gap());

  // 6
  c.push(L.h1('6. Cautions and open decisions'));
  c.push(L.bl(`**Open:** ${s.open && s.open.trim() ? s.open : 'No scene-specific decision is open; where it sits and whether it merges with a neighbour are decided at plot-building.'}`));
  if (s.src) c.push(L.bl(`**Source care:** ${s.src}`));
  c.push(L.h2('Connects to'));
  c.push(L.p(s.ln));
  return L.makeDoc(`Scene ${s.id}`, `Scene ${s.id}: ${s.t}`, c);
}

function indexDoc(items) {
  const c = [];
  const byEv = {};
  items.forEach(x => (byEv[x.s.ev] = byEv[x.s.ev] || []).push(x));
  L.titleBlock(c, 'SCENES · INDEX', 'Scene Candidates: Index', `${items.length} scenes, one file each, grouped by event`);
  c.push(L.note('Every scene is a candidate built from the story-event files and catalogues using the Story Measurement Framework. Nothing is placed yet. Each file now holds: scene information; the story of the scene; the technical requirements if made fully in CG; the preparation and story-craft technicalities; the genres it comes close to; and cautions.'));

  c.push(L.h1('1. Counts'));
  const tot = [0, 0];
  const shotTot = [0, 0];
  const evRows = Object.keys(byEv).map(k => {
    const a = byEv[k];
    let lo = 0, hi = 0, sl = 0, sh = 0;
    a.forEach(({ s, e }) => { const m = mins(s); lo += m[0]; hi += m[1]; const q = shots(s, e); sl += q[0]; sh += q[1]; });
    tot[0] += lo; tot[1] += hi; shotTot[0] += sl; shotTot[1] += sh;
    return [EVENTS[k][1], String(a.length), String(a.filter(x => x.s.pov === 'Rukmini').length), `${lo} to ${hi}`, `${sl} to ${sh}`, (a.reduce((t, x) => t + x.e.tier, 0) / a.length).toFixed(1)];
  });
  evRows.push(['All', String(items.length), String(items.filter(x => x.s.pov === 'Rukmini').length), `${tot[0]} to ${tot[1]}`, `${shotTot[0]} to ${shotTot[1]}`, (items.reduce((t, x) => t + x.e.tier, 0) / items.length).toFixed(1)]);
  c.push(L.tbl(['Event', 'Scenes', 'Rukmini view', 'Minutes (sum of ranges)', 'Shots (HEURISTIC)', 'Average tier'], evRows, [3100, 900, 1200, 1700, 1500, 1238]));
  c.push(L.gap());
  c.push(L.p('The totals are far more than a feature runs. This is the full menu; the plot will choose, merge and cut. Shot counts are planning figures only.'));

  c.push(L.h1('2. Complexity tiers'));
  const tc = [1, 2, 3, 4, 5].map(t => [String(t), TIER[t], String(items.filter(x => x.e.tier === t).length), items.filter(x => x.e.tier === t).map(x => x.s.id).join(', ')]);
  c.push(L.tbl(['Tier', 'Meaning', 'Scenes', 'Which'], tc, [600, 3400, 800, 4838]));
  c.push(L.gap());
  c.push(L.p('Tier 5 scenes are the ones to previs and test first. They are also the scenes to question hardest when the plot is built: each is expensive, so each must earn its place.'));

  c.push(L.h1('3. Shared modules'));
  c.push(L.p('Modules are built once and reused. A module that serves many scenes is worth building early; one that serves a single scene is a candidate for simplifying or cutting.'));
  const mu = Object.keys(MOD).map(m => [MOD[m].name, String(items.filter(x => x.e.use.includes(m)).length), MOD[m].dept.map(d => DEPT[d]).join('; ')]).sort((a, b) => Number(b[1]) - Number(a[1]));
  c.push(L.tbl(['Module', 'Scenes', 'Departments'], mu, [3600, 900, 5138]));
  c.push(L.gap());

  c.push(L.h1('4. Department load'));
  const dl = Object.keys(DEPT).map(d => [DEPT[d], String(items.filter(x => depts(x.e).includes(d)).length)]).sort((a, b) => Number(b[1]) - Number(a[1]));
  c.push(L.tbl(['Department', 'Scenes touched'], dl, [6000, 3638]));
  c.push(L.gap());

  c.push(L.h1('5. The scenes'));
  Object.keys(byEv).forEach(k => {
    c.push(L.h2(EVENTS[k][1]));
    c.push(L.tbl(['ID', 'Scene', 'View', 'Krishna', 'I', 'Tier', 'Closest genre'],
      byEv[k].map(({ s, e }) => [s.id, s.t, s.pov === 'Rukmini' ? 'R' : s.pov.split(' ')[0], s.k, String(s.int), String(e.tier), e.gen[0][0]]),
      [800, 3000, 800, 1900, 400, 600, 2138]));
    c.push(L.gap());
  });

  c.push(L.h1('6. Using these scenes in the plot'));
  ['Pick the spine first (document 12, section 7 shows the Event 06 spine), then choose carrier scenes from Events 01 to 05 to feed the first two acts.',
    'Check the Krishna tags as you sequence: his face must not appear before E06-18.',
    'Choose with the tier in mind: a few tier 5 scenes and many tier 1 to 3 scenes make a film that can be made.',
    'Where two scenes do the same job, keep the one with the stronger turn, or merge them (document 12, section 3). Examples noted in the files: E06-06 and E06-12; E02-09 and E06-02; E06-28 and E08-06.',
    'Use the genre column to choose scenes for a variant (a thriller cut favours the chases and the waiting; a silent cut favours the S-rated scenes).',
    'Re-score each placed scene with the scorecard; a scene that scored well alone may fail in position.'].forEach(t => c.push(L.bl(t)));
  return L.makeDoc('Scene Index', 'Scene Candidates: Index', c);
}

function csv(items) {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['ID', 'Event', 'Title', 'Beats', 'Viewpoint', 'Krishna', 'Rasa', 'Intensity', 'Silent', 'Minutes', 'Tier', 'Shots_low', 'Shots_high', 'Modules', 'Departments', 'Genres', 'Where_it_can_sit', 'File'];
  const rows = items.map(({ s, e, f }) => { const sh = shots(s, e); return [s.id, EVENTS[s.ev][1], s.t, s.beats, s.pov, s.k, s.rasa, s.int, s.sil, s.mins, e.tier, sh[0], sh[1], e.use.join('; '), depts(e).join('; '), e.gen.map(g => g[0]).join('; '), s.fit, f].map(q).join(','); });
  return '﻿' + [head.map(q).join(','), ...rows].join('\n');
}

(async () => {
  const items = [];
  for (const s of base) {
    const dir = OUT + EVENTS[s.ev][0] + '/';
    fs.mkdirSync(dir, { recursive: true });
    const f = `${s.id}_${slug(s.t)}.docx`;
    await L.save(sceneDoc(s), dir + f);
    items.push({ s, e: ext[s.id], f: EVENTS[s.ev][0] + '/' + f });
  }
  await L.save(indexDoc(items), OUT + '00_Scene_Index.docx');
  fs.writeFileSync(OUT + '00_Scene_Index.csv', csv(items));
  console.log('built', items.length);
})();
