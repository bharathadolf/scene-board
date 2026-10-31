/* Rebuilds data/scenes.json from story/events/.
   Scene codes are deliberately NOT in story order: they are drawn from a
   seeded shuffle of 100..999 so that no code implies a position. Changing
   SEED renumbers every scene and breaks saved boards — don't.
   Run: npm run data:scenes */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const EV = path.join(ROOT, 'story', 'events');

const SEED = 20261031;

/* The 22 scenes played as action; everything else is drama. The board can
   override this per scene (meta/cats in the artifact database). */
const ACTION = new Set(['E01-05', 'E01-06', 'E01-07', 'E01-12', 'E01-15',
  'E03-02', 'E03-04', 'E03-06', 'E03-07', 'E03-09', 'E03-11', 'E03-12', 'E03-13',
  'E05-03', 'E05-05', 'E05-12', 'E06-05', 'E06-07', 'E06-19', 'E06-20', 'E06-22', 'E06-25']);

const EVN = { 1: 'Churning', 2: 'Earth’s burden', 3: 'Jarasandha', 4: 'Dvārakā',
  5: 'Mucukunda', 6: 'Abduction', 7: 'Final episode', 8: 'Backstories' };

let seed = SEED;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const nums = [];
for (let i = 100; i < 1000; i++) nums.push(i);
for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = nums[i]; nums[i] = nums[j]; nums[j] = t; }

const out = [];
let k = 0;
for (let e = 1; e <= 8; e++) {
  const s = require(path.join(EV, 'sc_e0' + e + '.js'));
  const c = require(path.join(EV, 'cg_e0' + e + '.js'));
  for (const x of (Array.isArray(s) ? s : Object.values(s))) {
    const g = c[x.id] || {};
    const m = String(x.mins).split(/[–-]/).map(Number);
    out.push({
      c: 'S-' + nums[k++],
      src: x.id,
      t: x.t.replace(/ \(carrier\)| \(told scene\)/, ''),
      carrier: /carrier|told scene/.test(x.t),
      ev: e,
      evn: EVN[e],
      cat: ACTION.has(x.id) ? 'A' : 'D',
      tier: g.tier,
      mins: String(x.mins),
      mid: m.length > 1 ? (m[0] + m[1]) / 2 : m[0],
      rasa: x.rasa, pov: x.pov, pl: x.pl, k: x.k,
      sum: [].concat(x.sum).join(' '),
      why: x.why,
      turn: x.turn,
      story: g.story,
      gen: (g.gen || []).map(a => a[0]),
    });
  }
}

fs.writeFileSync(path.join(ROOT, 'data', 'scenes.json'), JSON.stringify(out));
console.log(out.length + ' scenes, ' + out.filter(o => o.cat === 'A').length + ' action, ' +
  new Set(out.map(o => o.c)).size + ' distinct codes');
