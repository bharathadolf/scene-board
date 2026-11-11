#!/usr/bin/env node
/* Writes a shotspec from the repository's data, outside the page.

     node scripts/shotspec.js --board b7 --scene S-719 --out previz/S-719/shotspec.json
     node scripts/shotspec.js --board b7 --seq s1
     node scripts/shotspec.js --board b7 --all

   --db <dir>   where scene overrides live as scenes/<code>.json — the shots,
                prompts, pictures and checks the board holds. Defaults to out/db.
                An export of the board database works here too.
   --every      include shots that are not approved yet                       */
const fs = require('fs');
const path = require('path');
const ShotSpec = require('../src/shotspec.js');
const ROOT = path.join(__dirname, '..');
const json = (...p) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));

function load(opts) {
  const scenes = json('data', 'scenes.json');
  const ents = json('data', 'entities.json');
  const sceneEnts = json('data', 'scene_entities.json');
  const board = opts.boardData || json('data', 'boards', (opts.board || 'b7') + '.json');
  const by = {};
  scenes.forEach(s => { by[s.c] = Object.assign({}, s); });
  const db = path.resolve(ROOT, opts.db || 'out/db');
  const dir = path.join(db, 'scenes');
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
      const code = path.basename(f, '.json');
      const o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (by[code] && Array.isArray(o.shots)) by[code].shots = o.shots;
      if (by[code] && typeof o.t === 'string' && o.t.trim()) by[code].t = o.t.trim();
    });
  }
  return { by, ents, sceneEnts, board };
}

/* where a scene falls on a board — a view, never an identity */
function viewOf(board, code) {
  const order = board.cols.flatMap(c => c.ids);
  const ci = board.cols.findIndex(c => c.ids.indexOf(code) >= 0);
  if (ci < 0) return null;
  const col = board.cols[ci];
  return { board: board.name, sequence: col.name, sequence_index: ci + 1,
    scene_in_sequence: col.ids.indexOf(code) + 1, scenes_in_sequence: col.ids.length,
    cut: order.indexOf(code) + 1, cuts: order.length };
}

function make(opts) {
  const { by, ents, sceneEnts, board } = load(opts);
  let ids, scope;
  if (opts.scene) { ids = [opts.scene]; scope = { kind: 'scene', id: opts.scene, title: opts.scene + ' · ' + by[opts.scene].t }; }
  else if (opts.seq) {
    const col = board.cols.find(c => c.id === opts.seq);
    if (!col) throw new Error('no sequence ' + opts.seq + ' on this board');
    ids = col.ids.slice(); scope = { kind: 'sequence', id: col.id, title: col.name };
  } else { ids = board.cols.flatMap(c => c.ids); scope = { kind: 'board', id: opts.board || 'b7', title: board.name }; }
  const scenes = ids.filter(c => by[c]).map(c => ShotSpec.scene(c, by[c], sceneEnts[c], ents,
    { all: !!opts.every, pick: ShotSpec.pick, view: viewOf(board, c) }))
    .filter(s => s.shots.length || opts.empty);
  return ShotSpec.build({ entities: ents, scenes, scope, now: opts.now,
    board: { id: opts.board || 'b7', name: board.name },
    boardVersion: ShotSpec.boardVersion(opts.board || 'b7', board) });
}

if (require.main === module) {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) {
    const k = a[i].replace(/^--/, '');
    if (['every', 'all', 'empty'].includes(k)) o[k] = true; else o[k] = a[++i];
  }
  const spec = make(o);
  const out = o.out || path.join('previz', (o.scene || o.seq || o.board || 'b7'), 'shotspec.json');
  fs.mkdirSync(path.dirname(path.resolve(ROOT, out)), { recursive: true });
  fs.writeFileSync(path.resolve(ROOT, out), JSON.stringify(spec, null, 1) + '\n');
  const n = spec.scenes.reduce((x, s) => x + s.shots.length, 0);
  console.log(`${out} — ${spec.scenes.length} scene(s), ${n} shot(s), board ${spec.provenance.board_version}`);
}
module.exports = { make, load, viewOf };
