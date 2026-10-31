const fs = require('fs');
const path = require('path');
const L = require('./lib');
const OUT = '/mnt/user-data/outputs/scenes/';

const EVENTS = {
  1: ['Event_01_Ksheera_Sagara_Manthana', 'Event 01: Kṣīra Sāgara Manthana'],
  2: ['Event_02_Burden_of_the_Earth', 'Event 02: The Burden of the Earth'],
  3: ['Event_03_Jarasandha_Repeated_Attacks', 'Event 03: Jarasandha’s Repeated Attacks'],
  4: ['Event_04_Founding_of_Dvaraka', 'Event 04: The Founding of Dvārakā'],
  5: ['Event_05_Kalayavana_and_Mucukunda_Cave', 'Event 05: The Kālayavana Trap at Mucukunda’s Cave'],
  6: ['Event_06_Abduction_of_Rukmini', 'Event 06: The Abduction of Rukmini'],
  7: ['Event_07_Final_Episode_Together', 'Event 07: The Final Episode, Together'],
  8: ['Event_08_Source_File_Backstories', 'Backstories from your source files (Śiśupāla)']
};

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
const dash = v => (v && String(v).trim()) ? v : '—';

function sceneDoc(s) {
  const c = [];
  L.titleBlock(c, `SCENE ${s.id}`, s.t, `${EVENTS[s.ev][1]} · ${s.pl}`);
  c.push(L.note(`Status: ${s.st}. Labels: TEXT = Bhāgavata verse checked earlier; SOURCE = your supplied files; TRADITION = other sources, not re-checked; ADAPTATION = invention for the film. Verse numbers may be off by one. This is a scene candidate, not a plot decision: it can be placed, moved, merged or cut when the plot is built.`));

  c.push(L.h1('1. Scene at a glance'));
  c.push(L.tbl(['Item', 'Detail'], [
    ['Scene ID', s.id],
    ['Source beats', s.beats],
    ['Place and time', s.pl],
    ['Viewpoint', s.pov],
    ['Krishna in this scene', s.k],
    ['Rasa · intensity · silent', `${s.rasa} · ${s.int} of 5 · ${s.sil === 'S' ? 'S (works silent)' : s.sil === 'P' ? 'P (partly; needs staging)' : 'D (needs speech)'}`],
    ['Estimated length', `${s.mins} minutes`],
    ['Where it can sit', s.fit]
  ], [2400, 7238]));
  c.push(L.gap());

  c.push(L.h1('2. What happens'));
  s.sum.forEach(t => c.push(L.p(t)));

  c.push(L.h1('3. Scene card'));
  c.push(L.tbl(['Field', 'Fill'], [
    ['Why it is in the film', s.why],
    ['How it reaches Rukmini', s.route],
    ['Who wants what from whom', s.want],
    ['Obstacle', s.obs],
    ['What is at stake and why now', s.stakes],
    ['Value; charge in → out', `${s.val[0]}: ${s.val[1]} → ${s.val[2]}`],
    ['The turn', s.turn],
    ['The gap (expected vs actual)', s.gap],
    ['Krishna handling', s.kn],
    ['World-welfare proof', dash(s.wel)],
    ['Plants', dash(s.plants)],
    ['Payoffs', dash(s.pays)],
    ['Entry', s.in],
    ['Exit', s.out],
    ['Silent version', dash(s.sv)]
  ], [2400, 7238]));
  c.push(L.gap());

  c.push(L.h1('4. Technicalities considered'));
  c.push(L.note('This is the working note for the scene: which measurements from the Story Measurement Framework (document 11) were applied, and how, so the scene can be checked later and re-scored when it is placed.'));
  const rows = [
    ['E1', 'Value turn (McKee): the scene must change a value', `Value is “${s.val[0]}”, going from ${s.val[1]} to ${s.val[2]}. The turn: ${s.turn}`],
    ['E2', 'Three scene questions (Mamet)', `Who wants what from whom: ${s.want} Stakes and why now: ${s.stakes}`],
    ['E3', 'The gap (McKee)', s.gap],
    ['E7', 'Late in, early out', `Enters: ${s.in} Leaves: ${s.out}`],
    ['I1', 'Viewpoint (project rule: Rukmini by default)', s.pov === 'Rukmini' ? 'Rukmini’s viewpoint. Counts toward the 70% target.' : `Not Rukmini’s viewpoint (${s.pov}). Count it against the non-Rukmini budget and give the audience a reason to leave her.`],
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

  const checks = [
    ['1 Value changes', s.val && s.val[1] !== s.val[2]],
    ['2 Want and obstacle', !!(s.want && s.obs)],
    ['3 Turn stated', !!s.turn],
    ['4 Gap stated', !!s.gap],
    ['5 Entry and exit set', !!(s.in && s.out)],
    ['6 Reason to exist stated', !!s.why],
    ['7 Krishna tag set', !!s.k],
    ['8 Carrier and viewpoint set', !!(s.route && s.pov)],
    ['9 Plants or payoffs recorded', !!(s.plants || s.pays)],
    ['10 Silent rating set', !!s.sil]
  ];
  const done = checks.filter(x => x[1]).length;
  const missing = checks.filter(x => !x[1]).map(x => x[0]);
  c.push(L.p(`**Quick-test self-check (document 12, section 10).** ${done} of 10 fields filled${missing.length ? '; missing: ' + missing.join(', ') : ''}. This checks that the card is complete, not that the scene is good; read it aloud and judge it as an audience would.`));

  c.push(L.h1('5. Cautions and open decisions'));
  c.push(L.bl(`**Open:** ${s.open && s.open.trim() ? s.open : 'No scene-specific decision is open; where it sits and whether it merges with a neighbour are decided at plot-building.'}`));
  if (s.src) c.push(L.bl(`**Source care:** ${s.src}`));
  c.push(L.h1('6. Connects to'));
  c.push(L.p(s.ln));
  return L.makeDoc(`Scene ${s.id}`, `Scene ${s.id}: ${s.t}`, c);
}

async function build(all) {
  const idx = [];
  const seen = new Set();
  for (const s of all) {
    if (seen.has(s.id)) throw new Error('dup ' + s.id);
    seen.add(s.id);
    const dir = OUT + EVENTS[s.ev][0] + '/';
    fs.mkdirSync(dir, { recursive: true });
    const f = `${s.id}_${slug(s.t)}.docx`;
    await L.save(sceneDoc(s), dir + f);
    idx.push({ s, f: EVENTS[s.ev][0] + '/' + f });
  }
  return idx;
}

function indexDoc(idx) {
  const c = [];
  L.titleBlock(c, 'SCENES · INDEX', 'Scene Candidates: Index', `${idx.length} scenes, one file each, grouped by event`);
  c.push(L.note('Every scene is a candidate built from the story-event files and catalogues using the Story Measurement Framework. Nothing is placed yet. When you build the plot, pick scenes by the “Where it can sit” column and the Krishna tag, then re-score each in context.'));
  c.push(L.h1('1. How the scene files are built'));
  ['Each file holds: scene at a glance; what happens; the scene card; a **Technicalities considered** note listing the framework measurements applied; a quick-test self-check; cautions; and links.',
    'IDs: E01 to E07 follow the story events; E08 holds backstories from your source files (Śiśupāla). Scenes marked “carrier” show how an earlier event reaches Rukmini in her own world.',
    'Viewpoint R means Rukmini; others are named. Krishna tags follow document 12, section 5.',
    'Minute estimates are my guesses at about 2 to 3 minutes a scene; they are for planning only.'].forEach(t => c.push(L.bl(t)));
  c.push(L.h1('2. Counts'));
  const byEv = {};
  idx.forEach(({ s }) => { (byEv[s.ev] = byEv[s.ev] || []).push(s); });
  const rk = idx.filter(x => x.s.pov === 'Rukmini').length;
  c.push(L.tbl(['Event', 'Scenes', 'Rukmini viewpoint', 'Estimated minutes (sum of mid-points)'],
    Object.keys(byEv).map(e => {
      const a = byEv[e];
      const m = a.reduce((t, x) => { const [lo, hi] = String(x.mins).split('–').map(Number); return t + (lo + (hi || lo)) / 2; }, 0);
      return [EVENTS[e][1], String(a.length), String(a.filter(x => x.pov === 'Rukmini').length), m.toFixed(0)];
    }).concat([['All', String(idx.length), `${rk} (${(rk / idx.length * 100).toFixed(0)}%)`, String(Math.round(idx.reduce((t, x) => { const [lo, hi] = String(x.s.mins).split('–').map(Number); return t + (lo + (hi || lo)) / 2; }, 0)))]]),
    [4300, 1200, 1900, 2238]));
  c.push(L.gap());
  c.push(L.p('The total is far more than a feature runs. That is expected: this is the full menu. The plot will choose, merge and cut.'));
  c.push(L.p(`**Viewpoint warning (framework I1).** Only ${(rk / idx.length * 100).toFixed(0)}% of the full menu is from Rukmini’s viewpoint, below the 70% target. That is by design: Events 01 to 05 are the myth and the history, told from other people’s eyes. A cut that meets the target has to lean on Event 06, Event 07 and the carrier scenes (the ones marked “carrier”), which together give ${rk} Rukmini-viewpoint scenes. In practice, when you choose the Manthana and Event 02 to 05 scenes, prefer the carrier versions, or keep the non-Rukmini ones few and short. Also, the Manthana scenes alone add up to about 34 minutes here; plan to compress them to a few interludes.`));
  c.push(L.h1('3. The scenes'));
  Object.keys(byEv).forEach(e => {
    c.push(L.h2(EVENTS[e][1]));
    c.push(L.tbl(['ID', 'Scene', 'Source', 'View', 'Krishna', 'I', 'Fit'],
      idx.filter(x => x.s.ev == e).map(({ s }) => [s.id, s.t, s.beats.split(' · ')[0], s.pov === 'Rukmini' ? 'R' : s.pov.split(' ')[0], s.k, String(s.int), s.fit.split('.')[0]]),
      [800, 2400, 1500, 900, 1700, 400, 1938]));
    c.push(L.gap());
  });
  c.push(L.h1('4. Using these scenes in the plot'));
  ['Pick the spine first (document 12, section 7 shows the Event 06 spine), then choose carrier scenes from Events 01 to 05 to feed the first two acts.',
    'Check the Krishna tags as you sequence: his face must not appear before E06-18.',
    'Where two scenes do the same job, keep the one with the stronger turn, or merge them (document 12, section 3).',
    'Re-score each placed scene with the scorecard; a scene that scored well alone may fail in position (for example two waiting scenes back to back).'].forEach(t => c.push(L.bl(t)));
  return L.makeDoc('Scene Index', 'Scene Candidates: Index', c);
}

module.exports = { build, indexDoc, EVENTS };
