/* Rebuilds data/boards/b1..b5.json: the five seeded orders of all 115 scenes.
   Each board is a list of sequences; each sequence names the scenes in it by
   their story id (E06-18), which is resolved to the scene code (S-413) here.
   Every board is checked: all 115 scenes exactly once, nothing after the
   final episode, and no sight of Krishna's face before the abduction.
   Run: npm run data:boards */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'scenes.json'), 'utf8'));
const BY = {}; S.forEach(s => { BY[s.src] = s; });
const r = (e, a, b) => { const o = []; for (let i = a; i <= b; i++) o.push('E0' + e + '-' + String(i).padStart(2, '0')); return o; };
const E = (...x) => x.flat();
const B = {};

B.b1={name:'Board 1 · Rukmini’s frame',desc:'Master cut. Rukmini’s present in Kuṇḍina is the spine; the Manthana (mural and bard) and the tales of Krishna reach her in pieces, each one landing where it presses on her choice. First sight of Krishna is the abduction.',
seq:[
['Prologue: the question',E('E06-01','E02-09','E06-02')],
['Mural I: the garland and the fall',E('E01-18',r(1,1,4))],
['Rukmī’s boast',E('E06-03','E03-14','E03-15')],
['The wars of Mathurā, as soldiers tell them',E('E03-01','E03-02','E03-05','E03-04','E03-06','E03-03','E03-07','E03-08','E03-09','E03-10')],
['Mural II: the churning and the poison',E('E01-05','E01-06','E01-17','E01-07','E01-08')],
['The Earth’s burden, as the priest tells it',E('E02-08',r(2,1,7))],
['The chase on foot, as a nursery tale',E(r(3,11,13))],
['The sea city, as sailors tell it',E(r(4,1,6),'E04-08','E04-09','E04-10')],
['Ink',E('E05-16','E05-01','E06-04','E06-05','E06-06')],
['The night ride and the gathering kings',E('E06-07','E06-08','E06-09','E06-10','E06-13')],
['The cave, as the herdsman tells it',E('E05-14','E04-07','E05-02','E05-03','E05-04','E05-05','E05-13',r(5,6,12))],
['Mural III: Lakṣmī chooses',E(r(1,9,11))],
['The waiting',E('E06-11','E06-12','E06-14')],
['Mural IV: the pot and the war',E(r(1,12,16))],
['The eve',E('E01-19','E05-15')],
['The temple',E('E06-15','E06-16','E06-17')],
['The abduction',E('E06-18','E06-19','E06-31','E06-20','E06-21','E06-22')],
['The enemies’ reasons',E('E06-23',r(8,1,5))],
['Duel and mercy',E('E08-07','E08-06','E06-24','E06-25','E06-26','E06-27','E06-28','E06-29','E06-30')],
['Final episode: together',E(r(7,1,8))]]};
B.b2={name:'Board 2 · Chronological reference',desc:'The tale in mythic time, no tricks: Manthana, the Earth’s burden, the wars, Dvārakā, the cave, then Rukmini. The tales Rukmini hears as a girl are gathered just before her own story. Use this to check cause and effect before shuffling.',
seq:[
['Before time: the curse at the gate',E('E08-04')],
['Event 1: the Manthana',E(r(1,1,6),'E01-17',r(1,7,16))],
['Event 2: the Earth’s burden',E(r(2,1,7))],
['The marked child',E(r(8,1,3))],
['Event 3: the attacks on Mathurā',E(r(3,1,10))],
['Event 4: Dvārakā rises',E(r(4,1,6),'E04-08')],
['Event 5: the unarmed man and the cave',E('E04-07',r(5,1,6),'E05-13',r(5,7,12))],
['The hill: the chase on foot',E(r(3,11,13))],
['Kuṇḍina years: what Rukmini hears',E('E02-08','E02-09','E03-14','E03-15','E04-09','E04-10','E05-14','E05-15','E05-16','E01-18')],
['The rivals',E(r(8,5,7))],
['Event 6a: the letter',E(r(6,1,7))],
['Event 6b: the gathering',E(r(6,8,14),'E01-19')],
['Event 6c: the temple and the abduction',E(r(6,15,20))],
['Event 6d: the aftermath',E(r(6,21,31))],
['Final episode: together',E(r(7,1,8))]]};
B.b3={name:'Board 3 · Flight and memory',desc:'Opens inside the flight (wheels, voices, no face). Cuts between the chariot and Kuṇḍina three days earlier. The reason for it all (the Earth’s burden) is held back until after we have seen him.',
seq:[
['Flight I: wheels and voices',E('E06-20')],
['Memory: the telling begins',E('E06-01','E02-09','E06-02','E01-18')],
['Mural: the garland',E(r(1,1,4))],
['Memory: the hall decides',E('E06-03','E03-14','E03-15')],
['Flight II: pursuit against the chase on foot',E('E06-22','E03-11','E03-12','E03-13','E06-31')],
['Memory: ink',E('E05-16','E05-01','E06-04','E06-05','E06-06','E06-07')],
['The sea city, as sailors tell it',E('E04-09','E04-10',r(4,1,6),'E04-08')],
['Memory: the bride and the kings',E('E06-08','E06-09','E06-10','E06-13','E06-11','E06-12','E06-14')],
['The cave, as the herdsman tells it',E('E05-14','E04-07',r(5,2,6),'E05-13',r(5,7,12))],
['Mural: the churning, Lakṣmī chooses',E(r(1,5,6),'E01-17',r(1,7,11))],
['Memory: the temple',E('E05-15','E06-15','E06-16','E06-17')],
['Mural: the pot and the war',E(r(1,12,16),'E01-19')],
['First sight',E('E06-18','E06-19')],
['Why he came: the Earth’s burden',E(r(2,1,8))],
['The kings’ side',E('E06-21','E06-23',r(8,1,5),r(3,1,10))],
['Duel and mercy',E('E08-07','E08-06','E06-24','E06-25','E06-26','E06-27','E06-28','E06-29','E06-30')],
['Final episode: together',E(r(7,1,8))]]};
B.b4={name:'Board 4 · Two worlds converging',desc:'Strict alternation: Kuṇḍina (Rukmini, waiting) and Krishna’s world (told, never seen) take turns until the temple door, where they meet. Good for checking that neither thread starves.',
seq:[
['Kuṇḍina: the question',E('E06-01','E02-09','E06-02')],
['His world: the Earth’s burden',E(r(2,1,7))],
['Kuṇḍina: Rukmī and the soldiers',E('E02-08','E06-03','E03-14','E03-15')],
['His world: the wars of Mathurā',E('E03-01','E03-02','E03-05','E03-04','E03-06','E03-03','E03-07','E03-08','E03-09','E03-10')],
['Kuṇḍina: the mural',E('E01-18')],
['His world: the churning',E(r(1,1,6),'E01-17',r(1,7,16))],
['Kuṇḍina: ink',E('E05-16','E06-04','E06-05','E06-06','E06-07')],
['His world: the sea city',E(r(4,1,6),'E04-08','E04-09','E04-10')],
['Kuṇḍina: the waiting',E('E06-08','E06-09','E06-10','E06-13','E06-11','E06-12','E01-19','E06-14')],
['His world: the unarmed man, the cave, the hill',E('E05-01','E05-14','E04-07',r(5,2,6),'E05-13',r(5,7,12),r(3,11,13))],
['Kuṇḍina: the temple',E('E05-15','E06-15','E06-16','E06-17')],
['Where the worlds meet',E('E06-18','E06-19','E06-31','E06-20','E06-21','E06-22')],
['The enemies’ reasons',E('E06-23',r(8,1,5))],
['Duel and mercy',E('E08-07','E08-06','E06-24','E06-25','E06-26','E06-27','E06-28','E06-29','E06-30')],
['Final episode: together',E(r(7,1,8))]]};
B.b5={name:'Board 5 · The action cut',desc:'The same 115 scenes cut as an action film: a cold open on the burning hill, the sieges up front, the reasons delivered on the move, and the abduction played as the extraction it is. Krishna is still unseen until the temple door, so the set pieces carry the first half and the drama rides between them.',
seq:[
['Cold open: the burning hill',E(r(3,11,13))],
['The enemy’s vow',E('E03-01','E03-05','E03-02')],
['The first siege',E('E03-04','E03-06','E03-07','E03-03','E03-08')],
['Seventeen times',E('E03-09','E03-10','E03-14','E03-15')],
['The oldest war',E(r(1,1,8),'E01-17')],
['Why he lets him live',E(r(2,1,7))],
['The pot is seized',E(r(1,9,12))],
['Two armies, one city',E('E05-01','E04-01','E04-02','E04-03')],
['The city in the sea',E('E04-04','E04-05','E04-06','E04-08','E04-07')],
['The man on foot',E('E05-02','E05-03','E05-04','E05-05')],
['The sleeper',E(r(5,6,11),'E05-13','E05-12')],
['What reaches Kuṇḍina',E('E02-08','E02-09','E04-09','E04-10','E05-14','E01-18','E05-15','E05-16')],
['The letter',E(r(6,1,7))],
['The rivals',E('E08-04','E08-01','E08-02','E08-03','E08-05','E08-07','E08-06','E06-09','E06-10','E06-13')],
['Mohinī and the war',E(r(1,13,16))],
['The night before',E('E06-08','E06-11','E06-12','E06-14','E01-19','E06-31')],
['The extraction',E(r(6,15,22))],
['The duel',E(r(6,23,30))],
['Final episode: together',E(r(7,1,8))]]};

let failed = false;
for (const id of Object.keys(B)) {
  const b = B[id];
  const flat = b.seq.flatMap(s => s[1]);
  const cnt = {}; flat.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; });
  const dup = Object.keys(cnt).filter(k => cnt[k] > 1);
  const miss = Object.keys(BY).filter(k => !cnt[k]);
  const bad = flat.filter(k => !BY[k]);
  const pos = k => flat.indexOf(k);
  const face = flat.slice(0, pos('E06-18')).filter(k => /face/i.test(BY[k].k) && !/Reflection/.test(BY[k].k));
  const endsRight = flat.slice(-8).join() === r(7, 1, 8).join();
  let rd = 0, ra = 0, md = 0, ma = 0;
  flat.forEach(k => { if (BY[k].cat === 'D') { rd++; ra = 0; } else { ra++; rd = 0; } md = Math.max(md, rd); ma = Math.max(ma, ra); });
  const problems = [];
  if (flat.length !== S.length) problems.push(flat.length + ' scenes, expected ' + S.length);
  if (dup.length) problems.push('repeated: ' + dup.join(','));
  if (miss.length) problems.push('missing: ' + miss.join(','));
  if (bad.length) problems.push('unknown: ' + bad.join(','));
  if (face.length) problems.push('face shown before the abduction: ' + face.join(','));
  if (!endsRight) problems.push('does not end on the final episode');
  const cols = b.seq.map((s, i) => ({ id: 's' + (i + 1), name: s[0], ids: s[1].map(k => BY[k].c) }));
  const doc = { name: b.name, desc: b.desc, cols, order: cols.flatMap(c => c.ids), updated: new Date().toISOString() };
  fs.writeFileSync(path.join(ROOT, 'data', 'boards', id + '.json'), JSON.stringify(doc));
  console.log(id.padEnd(3) + ' ' + String(flat.length).padStart(3) + ' scenes · ' + b.seq.length + ' sequences · longest run drama ' + md + ' action ' + ma +
    (problems.length ? '  FAILED: ' + problems.join(' | ') : '  ok'));
  if (problems.length) failed = true;
}
if (failed) process.exit(1);
