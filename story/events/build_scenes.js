const G = require('./scene_gen');
const L = require('./lib');
const all = [1,2,3,4,5,6,7,8].flatMap(n => require('./sc_e0' + n));
const req = ['id','ev','t','beats','st','pl','pov','sum','why','route','k','kn','want','obs','stakes','val','turn','gap','rasa','int','sil','in','out','mins','fit','craft','watch','ln'];
const ids = new Set(all.map(s => s.id));
let bad = 0;
all.forEach(s => {
  req.forEach(f => { if (s[f] === undefined || s[f] === '') { console.log('MISSING', s.id, f); bad++; } });
  const txt = JSON.stringify(s);
  (txt.match(/E0\d-\d\d/g) || []).forEach(r => { if (!ids.has(r)) { console.log('BADREF', s.id, '->', r); bad++; } });
});
console.log('scenes', all.length, 'problems', bad);
if (bad) process.exit(1);
G.build(all).then(async idx => {
  await L.save(G.indexDoc(idx), '/mnt/user-data/outputs/scenes/00_Scene_Index.docx');
  console.log('built', idx.length);
});
