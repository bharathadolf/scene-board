/* Previz: the entity layer, the shotspec contract, identity that survives a
   re-order, the authority rule, and the hand-over to Blender and back. */
const { execFileSync } = require('child_process');
const path = require('path');
const { openPage, boards, ROOT } = require('./harness');
const ShotSpec = require('../src/shotspec.js');
const cli = require('../scripts/shotspec.js');

const names = b64 => {
  const buf = Buffer.from(b64, 'base64'), out = [];
  for (let i = 0; i + 30 < buf.length; i++)
    if (buf.readUInt32LE(i) === 0x04034b50) out.push(buf.slice(i + 30, i + 30 + buf.readUInt16LE(i + 26)).toString('utf8'));
  return out;
};
const entry = (b64, name) => {
  const buf = Buffer.from(b64, 'base64');
  for (let i = 0; i + 30 < buf.length; i++)
    if (buf.readUInt32LE(i) === 0x04034b50) {
      const nl = buf.readUInt16LE(i + 26), sz = buf.readUInt32LE(i + 18);
      if (buf.slice(i + 30, i + 30 + nl).toString('utf8') === name) return buf.slice(i + 30 + nl, i + 30 + nl + sz).toString('utf8');
    }
  return '';
};

module.exports = async ({ browser, check }) => {
  // ---------- the contract, outside the page ----------
  const shots = [{ t: 'WIDE', x: 'The gate at night, the guard under a torch', a: true },
    { t: 'INSERT', x: "A man's hands hang open, a lotus garland at his wrists", a: true },
    { t: 'CLOSE', x: 'The guard says nothing', a: true }];
  const { by, ents, sceneEnts, board } = cli.load({ board: 'b7', db: 'tests/none' });
  const rec = Object.assign({}, by['S-719'], { shots });
  const one = ShotSpec.scene('S-719', rec, sceneEnts['S-719'], ents, {});
  check('a shot resolves to a set', one.shots.every(s => s.set === 'dvaraka_city/gate'));
  check('and to who is in frame, from its own words', JSON.stringify(one.shots.map(s => s.cast)) === '[["gate_guard"],["krishna"],["gate_guard"]]', one.shots.map(s => s.cast));
  check('a withheld man is found by how the shots point at him', one.shots[1].withheld && one.shots[1].withheld.krishna === 'hands');
  check('and it finds the prop the story hangs on', one.shots[1].props.join() === 'lotus_garland');
  check('every shot has a lens, a height and a length', one.shots.every(s => s.camera.lens_mm > 0 && s.camera.height_m > 0 && s.camera.duration_s > 0));
  check('a length nobody set is marked as a guess', one.shots.every(s => s.camera.duration_src === 'derived'));
  check('the guesses fill the scene exactly', Math.abs(one.duration_s - rec.mid * 60) < 1e-4, one.duration_s);
  const set = ShotSpec.scene('S-719', Object.assign({}, rec, { shots: shots.map((x, i) => i === 1 ? Object.assign({ cam: { dur: 4, lens: 135 } }, x) : x) }), sceneEnts['S-719'], ents, {});
  check('a length that was set is kept and marked', set.shots[1].camera.duration_s === 4 && set.shots[1].camera.duration_src === 'authored' && set.shots[1].camera.lens_mm === 135);
  check('and the others share what is left', Math.abs(set.duration_s - rec.mid * 60) < 1e-4);
  check('changing a shot changes its fingerprint', set.shots[1].rev !== one.shots[1].rev && set.shots[1].id === one.shots[1].id);
  check('an untouched shot keeps its fingerprint when a neighbour’s length is set', set.shots[0].rev === one.shots[0].rev && set.shots[0].camera.duration_s !== one.shots[0].camera.duration_s);
  check('ids do not depend on the order of shots',
    ShotSpec.scene('S-719', Object.assign({}, rec, { shots: shots.slice().reverse() }), sceneEnts['S-719'], ents, {}).shots.map(s => s.id).sort().join() === one.shots.map(s => s.id).sort().join());

  // ---------- identity survives a re-order (the act-one change in MODIFICATION_PLAN) ----------
  const before = cli.make({ board: 'b7', db: 'tests/fixtures/db', every: true, now: 'x' });
  const moved = JSON.parse(JSON.stringify(board));
  const a = moved.cols[0].ids, b2 = moved.cols[1].ids;
  b2.unshift(a.shift());                       // the opening scene leaves its sequence
  moved.cols[2].ids.reverse();                 // and another sequence is re-cut
  moved.cols.push(moved.cols.shift());         // and the first sequence goes last
  const after = cli.make({ board: 'b7', db: 'tests/fixtures/db', boardData: moved, every: true, now: 'x' });
  const idsOf = d => d.scenes.flatMap(s => s.shots.map(x => x.id + ':' + x.rev)).sort().join();
  check('there are shots in three sequences to test the re-order on', before.scenes.length === 3, before.scenes.length);
  check('a re-order changes no shot id and no fingerprint', idsOf(before) === idsOf(after));
  check('it does change the board version', before.provenance.board_version !== after.provenance.board_version);
  check('and where a scene falls, which lives only under view',
    JSON.stringify(before.scenes.map(s => s.view)) !== JSON.stringify(after.scenes.map(s => s.view)));
  const noView = d => JSON.stringify(d.scenes.map(s => Object.assign({}, s, { view: null })).sort((x, y) => x.code < y.code ? -1 : 1));
  check('nothing outside view knows the order', noView(before) === noView(after));

  // ---------- the authority rule ----------
  const ok = { shot_id: 'S-719_abcde', app: 'blender', status: 'rendered', version: 1, files: { block: 'renders/x.png' } };
  check('a report of status, files and version is taken', ShotSpec.checkReport(ok).length === 0, ShotSpec.checkReport(ok));
  for (const k of ['cast', 'camera', 'set', 'duration_s', 'lens_mm', 'text'])
    check('a report that carries “' + k + '” is refused', /board’s to say/.test(ShotSpec.checkReport(Object.assign({ [k]: 1 }, ok)).join(' ')));
  check('an unknown application is refused', ShotSpec.checkReport(Object.assign({}, ok, { app: 'maya' })).length > 0);
  const py = JSON.parse(execFileSync('python3', ['-c',
    'import json,sys;sys.path.insert(0,"pipeline");import dcc_bridge as b;print(json.dumps([b.REPORT_FIELDS,b.REPORT_STATUS,b.APPS,b.STRUCTURE]))'], { cwd: ROOT }).toString());
  check('the bridge and the board hold the same rule',
    JSON.stringify(py) === JSON.stringify([ShotSpec.REPORT_FIELDS, ShotSpec.REPORT_STATUS, ShotSpec.APPS, ShotSpec.STRUCTURE]));

  // ---------- in the board ----------
  const page = await openPage(browser, { seed: boards(['b7']) });
  const at = page.at;
  const code = 'S-719';
  await at(c => scenePanel(c), code);
  await page.waitForTimeout(250);
  let txt = await at(() => document.querySelector('#sect-pv').textContent);
  check('a scene says what set it is built on', /Dvārakā, the city › The gate and the road outside/.test(txt), txt.slice(0, 300));
  check('who is in frame, and how much of him', /Krishna \(hands only\)/.test(txt) && /The gate guard/.test(txt));
  check('and its props', /lotus garland/.test(txt));
  check('with no approved shot there is nothing to block', !(await at(() => document.querySelector('[data-pv="scene"]'))));

  await at(([c, sh]) => { setShots(c, sh.map(x => ({ t: x.t, x: x.x }))); (BY[c].shots || []).forEach((x, i) => setShotAp(c, i, 'a', true)); }, [code, shots]);
  await page.waitForTimeout(400);
  const ids = await at(c => specScene(c).shots.map(x => x.id), code);
  check('the page and the command line give a shot the same id', ids.join() === one.shots.map(s => s.id).join(), ids);
  check('ids are stored on the shots once made', (await at(c => ov[c].shots.every(x => /^[a-z0-9]{5}$/.test(x.sid)), code)));
  check('each approved shot is listed with its camera', (await at(() => document.querySelectorAll('.pvrow').length)) === 3);
  txt = await at(() => document.querySelector('#sect-pv').textContent);
  check('guessed lengths are said to be guesses', /3 of 3 shot lengths are guesses/.test(txt), txt.slice(-600));

  // editing the words keeps the id
  await at(c => { const a2 = BY[c].shots.slice(); setShotAp(c, 2, 'a', false); }, code);
  await at(c => { const a2 = BY[c].shots.slice(); a2[2] = Object.assign({}, a2[2], { x: 'The guard, silent, a long time' }); setShots(c, a2); setShotAp(c, 2, 'a', true); }, code);
  await page.waitForTimeout(300);
  check('rewording a shot keeps its id', (await at(c => specScene(c).shots.map(x => x.id).join(), code)) === ids.join());

  // the hand-over
  await page.click('[data-pv="scene"]');
  await page.waitForTimeout(700);
  let saved = await at(() => window.__saved);
  check('a previz zip is offered', !!saved && /S_719_previz\.zip$/.test(saved.filename), saved && saved.filename);
  const inside = names(saved.b64);
  check('it holds the shotspec, the script and how to run it',
    ['shotspec.json', 'blender_blocking.py', 'README.txt'].every(n => inside.includes('S_719_previz/' + n)), inside);
  const doc = JSON.parse(entry(saved.b64, 'S_719_previz/shotspec.json'));
  check('the shotspec says what it was made from', doc.spec === 'shotspec/1' && /^b7@/.test(doc.provenance.board_version) && !!doc.provenance.generator_version);
  check('and carries only the entities it uses', Object.keys(doc.entities.sets).join() === 'dvaraka_city' && !!doc.entities.characters.gate_guard);
  check('the script is the one in the repository', entry(saved.b64, 'S_719_previz/blender_blocking.py').indexOf('def run(spec_path') > 0);

  // setting a camera
  await page.click('[data-camed="' + ids[0] + '"]');
  await page.fill('#camlens', '32'); await page.fill('#camdur', '9.5');
  await page.click('[data-camsave="' + ids[0] + '"]');
  await page.waitForTimeout(350);
  const cam = await at(c => specScene(c).shots[0].camera, code);
  check('a camera set on the board is the camera', cam.lens_mm === 32 && cam.duration_s === 9.5 && cam.duration_src === 'authored', cam);
  check('After Effects follows the same length', (await at(c => aeShots(c)[0].dur, code)) === 9.5);
  check('and one fewer length is a guess', /2 of 3 shot lengths are guesses/.test(await at(() => document.querySelector('#sect-pv').textContent)));

  // what comes back
  const revs = await at(c => specScene(c).shots.map(x => x.rev), code);
  const report = { report: 'shotspec-report/1', reports: ids.map((id, i) => ({ shot_id: id, app: 'blender', status: 'rendered', version: 1,
    shot_rev: revs[i], files: { block: 'renders/' + id + '_block_v001.png', depth: 'renders/' + id + '_depth_v001.png' }, at: '2026-11-12T00:00:00Z' })) };
  const file = (name, body) => ({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(body)) });
  await page.setInputFiles('#sect-pv [data-pvin]', [file('report.json', report), Object.assign(page.png(ids[0] + '_block_v001.png'))]);
  await page.waitForTimeout(900);
  check('a report marks its shots as blocked', (await at(() => document.querySelectorAll('.pvchip.rendered').length)) === 3);
  check('and the picture that came with it sits beside its shot', (await at(() => document.querySelectorAll('img.pvimg').length)) === 1);
  check('what was reported is kept with the shot', (await at(c => ov[c].shots[0].pv.blender.v, code)) === 1);

  const bad = JSON.parse(JSON.stringify(report)); bad.reports[1].camera = { lens_mm: 50 };
  await page.setInputFiles('#sect-pv [data-pvin]', [file('report.json', bad)]);
  await page.waitForTimeout(500);
  check('a report that tries to set a camera is refused, all of it',
    /Refused/.test(await at(() => document.getElementById('toast').textContent)) && (await at(c => specScene(c).shots[1].camera.lens_mm, code)) === 100);

  // the shot moves on: what was built from it is stale
  await page.click('[data-camed="' + ids[1] + '"]');
  await page.fill('#camdur', '3');
  await page.click('[data-camsave="' + ids[1] + '"]');
  await page.waitForTimeout(350);
  check('change a shot and its blocking is marked out of date', (await at(() => document.querySelectorAll('.pvchip.stale').length)) >= 1);
  check('a shot whose own camera did not change stays current',
    (await at(() => document.querySelector('.pvrow .pvchip').classList.contains('rendered'))));

  // approval locks the cameras, but a report is not a change to the shot
  await at(c => setSceneAp(c, true), code);
  await page.waitForTimeout(300);
  check('an approved scene locks its cameras', !(await at(() => document.querySelector('[data-camed]'))));
  const v2 = JSON.parse(JSON.stringify(report)); v2.reports.forEach(r => { r.version = 2; });
  await page.setInputFiles('#sect-pv [data-pvin]', [file('report.json', v2), page.png(ids[0] + '_block_v001.png')]);
  await page.waitForTimeout(600);
  check('but status still comes back to an approved scene', (await at(c => ov[c].shots[0].pv.blender.v, code)) === 2);
  check('and the approval is untouched', await at(c => sceneAp(c), code));

  // sequence and board
  const seqId = await at(c => state.cols[where(c).ci].id, code);
  await at(i => seqPanel(i), seqId);
  await page.waitForTimeout(250);
  check('a sequence says which sets it needs and what is blocked', /built on \d+ sets?/.test(await at(() => document.querySelector('#drawer').textContent)) && !!(await at(() => document.querySelector('[data-pv="seq"]'))));
  await at(() => { window.__saved = null; closeDrawer(); });
  await page.click('#btn-pv');
  await page.waitForTimeout(700);
  saved = await at(() => window.__saved);
  check('the whole board can be handed over', !!saved && /_previz\.zip$/.test(saved.filename) &&
    JSON.parse(entry(saved.b64, names(saved.b64).find(n => /shotspec\.json$/.test(n)))).scope.kind === 'board');

  // ---------- back up, lose everything, restore ----------
  const snap = await at(() => JSON.stringify({ ov, cols: state.cols }));
  await at(() => { window.__saved = null; });
  await page.click('#btn-backup');
  await page.waitForTimeout(900);
  saved = await at(() => window.__saved);
  const bnames = names(saved.b64);
  check('a backup is one zip', /^sceneboard_backup_\d{4}-\d\d-\d\d\.zip$/.test(saved.filename), saved.filename);
  check('holding the boards, every scene and the pictures', bnames.includes('backup.json') && bnames.includes('db/scenes/S-719.json') &&
    bnames.includes('db/boards/b7.json') && bnames.filter(n => /^pictures\//.test(n)).length === 1, bnames);
  const bdoc = JSON.parse(entry(saved.b64, 'backup.json'));
  check('with shots, cameras and what was reported inside', bdoc.scenes['S-719'].shots[0].cam.dur === 9.5 && bdoc.scenes['S-719'].shots[0].pv.blender.v === 2);
  // wipe: other order, no shots
  await at(c => { delete ov[c]; applyOv(); state.cols[0].ids.reverse(); render(); }, code);
  check('the work is gone', (await at(c => (BY[c].shots || []).length, code)) === 0);
  await page.setInputFiles('#in-restore', { name: 'backup.zip', mimeType: 'application/zip', buffer: Buffer.from(saved.b64, 'base64') });
  await page.waitForTimeout(500);
  check('a backup is described before anything is put back', /Restore now/.test(await at(() => document.getElementById('btn-restore').textContent)) &&
    (await at(c => (BY[c].shots || []).length, code)) === 0);
  await page.click('#btn-restore');
  await page.waitForTimeout(900);
  check('restore puts back exactly what was backed up', (await at(() => JSON.stringify({ ov, cols: state.cols }))) === snap);
  await page.setInputFiles('#in-restore', { name: 'x.zip', mimeType: 'application/zip', buffer: Buffer.from('not a zip at all, just words') });
  await page.waitForTimeout(400);
  check('a file that is not a backup is turned away', /could not be read|not a backup/.test(await at(() => document.getElementById('toast').textContent)));
  check('nothing on the page threw', page.errors.length === 0, page.errors);
  await page.close();
};
