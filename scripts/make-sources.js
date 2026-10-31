/* Rebuilds data/sources.json: for every scene, where it comes from.
   Reads the `beats` and `st` fields of story/events/sc_e0*.js, turns the
   Bhāgavata references in them into vedabase.net links, and marks the scenes
   that were written for the film and have no source.
   Run: npm run data:sources */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const EV = path.join(ROOT, 'story', 'events');

const U = (canto, ch, v) => 'https://vedabase.net/sb/' + canto + '/' + ch + '/' + (v ? v : 'index') + '.htm';

/* Event 8 cites research files rather than verses, so these are mapped by hand. */
const E8 = {
  'E08-01': ['SB 10.74; Mahābhārata, Sabhā Parva 40–45', U(10, 74)],
  'E08-02': ['SB 10.74; Mahābhārata, Sabhā Parva 40–45', U(10, 74)],
  'E08-03': ['Mahābhārata, Sabhā Parva 41–45; SB 10.74', U(10, 74)],
  'E08-04': ['SB 3.15–16; SB 7.1; SB 10.74.46', U(3, 15)],
  'E08-05': ['SB 10.53–10.54; Mahābhārata, Sabhā Parva 45', U(10, 53)],
  'E08-06': ['SB 10.54.29–10.54.40', U(10, 54, 29)],
  'E08-07': ['SB 10.54.18–10.54.47; SB 10.61.26–38', U(10, 54, 18)],
};

const scenes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'scenes.json'), 'utf8'));
const CODE = {};
scenes.forEach(s => { CODE[s.src] = s.c; });

const out = {};
const unmapped = [];
for (let e = 1; e <= 8; e++) {
  require(path.join(EV, 'sc_e0' + e + '.js')).forEach(s => {
    const code = CODE[s.id];
    if (!code) return;
    const beats = s.beats || '', st = s.st || '';
    const kind = (st.split(/[;(]/)[0] || '').trim() || 'TEXT';
    const note = /TRADITION/.test(st) ? st.replace(/^[^;]*;\s*/, '') : '';
    let cite = '', url = '';
    if (E8[s.id]) { cite = E8[s.id][0]; url = E8[s.id][1]; }
    else {
      const nums = beats.match(/\b\d+\.\d+(?:\.\d+)?\b/g) || [];
      if (nums.length) {
        const a = nums[0].split('.').map(Number);
        cite = 'SB ' + nums[0] + (nums.length > 1 ? '–' + nums[nums.length - 1].replace(/^\d+\.\d+\./, '') : '');
        url = U(a[0], a[1], a[2]);
      }
    }
    if (!cite && /ADAPTATION/.test(st)) cite = 'Written for this film';
    if (!cite) unmapped.push(s.id);
    out[code] = note ? { k: kind, c: cite, u: url, n: note } : { k: kind, c: cite, u: url };
  });
}

if (unmapped.length) { console.error('no citation for:', unmapped.join(', ')); process.exit(1); }
fs.writeFileSync(path.join(ROOT, 'data', 'sources.json'), JSON.stringify(out));
const v = Object.values(out);
console.log(v.length + ' scenes, ' + v.filter(x => x.u).length + ' with a link, ' +
  v.filter(x => !x.u).length + ' written for the film');
