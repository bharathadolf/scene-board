#!/usr/bin/env node
/* Writes the trailer's shotspec from data/trailer, using the board's own
   ShotSpec module so the trailer is the same kind of object as any sequence.

     node scripts/trailer-spec.js
     node scripts/trailer-spec.js --unit T-18 --out previz/trailer/T-18.json

   The trailer is a board of its own: data/trailer/scenes.json holds one record
   per cut unit, data/trailer/scene_entities.json its set and cast, and
   data/trailer/db/scenes/<code>.json the shots. Entities come from the film's
   own data/entities.json — the trailer invents no characters, sets or props. */
const fs = require('fs');
const path = require('path');
const ShotSpec = require('../src/shotspec.js');
const ROOT = path.join(__dirname, '..');
const json = (...p) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));

function load() {
  const scenes = json('data', 'trailer', 'scenes.json');
  const ents = json('data', 'entities.json');
  const sceneEnts = json('data', 'trailer', 'scene_entities.json');
  const board = json('data', 'trailer', 'board.json');
  const by = {};
  scenes.forEach(s => { by[s.c] = Object.assign({}, s); });
  const dir = path.join(ROOT, 'data', 'trailer', 'db', 'scenes');
  fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
    const code = path.basename(f, '.json');
    const o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (by[code] && Array.isArray(o.shots)) by[code].shots = o.shots;
  });
  return { by, ents, sceneEnts, board };
}

function make(opts) {
  opts = opts || {};
  const { by, ents, sceneEnts, board } = load();
  const order = board.cols.flatMap(c => c.ids);
  const ids = opts.unit ? [opts.unit] : order;
  const scope = opts.unit
    ? { kind: 'scene', id: opts.unit, title: opts.unit + ' · ' + (by[opts.unit] || {}).t }
    : { kind: 'board', id: 'trailer', title: board.name };
  const view = code => {
    const ci = board.cols.findIndex(c => c.ids.indexOf(code) >= 0);
    if (ci < 0) return null;
    const col = board.cols[ci];
    return { board: board.name, sequence: col.name, sequence_index: ci + 1,
      scene_in_sequence: col.ids.indexOf(code) + 1, scenes_in_sequence: col.ids.length,
      cut: order.indexOf(code) + 1, cuts: order.length };
  };
  const scenes = ids.filter(c => by[c]).map(c => ShotSpec.scene(c, by[c], sceneEnts[c], ents,
    { all: true, pick: ShotSpec.pick, view: view(c) }));
  return ShotSpec.build({ entities: ents, scenes, scope, now: opts.now,
    board: { id: 'trailer', name: board.name },
    boardVersion: ShotSpec.boardVersion('trailer', board) });
}

if (require.main === module) {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
  const spec = make(o);
  const out = o.out || path.join('previz', 'trailer', 'shotspec.json');
  fs.mkdirSync(path.dirname(path.resolve(ROOT, out)), { recursive: true });
  fs.writeFileSync(path.resolve(ROOT, out), JSON.stringify(spec, null, 1) + '\n');
  const n = spec.scenes.reduce((x, s) => x + s.shots.length, 0);
  const secs = spec.scenes.reduce((x, s) => x + s.duration_s, 0);
  console.log(`${out} — ${spec.scenes.length} unit(s), ${n} shot(s), ${secs.toFixed(1)}s, board ${spec.provenance.board_version}`);
}
module.exports = { make, load };
