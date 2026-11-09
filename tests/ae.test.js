/* The After Effects export: what reaches the comp is the approved shots and,
   for each one, the picture its check kept — at scene, sequence and board level. */
const { openPage, boards } = require('./harness');

const names = b64 => {
  const buf = Buffer.from(b64, 'base64');
  const out = [];
  for (let i = 0; i + 30 < buf.length; i++) {
    if (buf.readUInt32LE(i) === 0x04034b50) {
      const n = buf.readUInt16LE(i + 26);
      out.push(buf.slice(i + 30, i + 30 + n).toString('utf8'));
    }
  }
  return out;
};
const entry = (b64, name) => {
  const buf = Buffer.from(b64, 'base64');
  for (let i = 0; i + 30 < buf.length; i++) {
    if (buf.readUInt32LE(i) === 0x04034b50) {
      const nl = buf.readUInt16LE(i + 26), sz = buf.readUInt32LE(i + 18);
      if (buf.slice(i + 30, i + 30 + nl).toString('utf8') === name)
        return buf.slice(i + 30 + nl, i + 30 + nl + sz).toString('utf8');
    }
  }
  return '';
};

module.exports = async ({ browser, check }) => {
  const page = await openPage(browser, { seed: boards(['b5']) });
  const at = page.at;

  const seqId = await at(() => state.cols[0].id);
  const codes = await at(i => state.cols.find(c => c.id === i).ids, seqId);
  const code = codes[0];

  // ---------- nothing to build yet ----------
  await at(c => scenePanel(c), code);
  await page.waitForTimeout(250);
  check('a scene with no shots offers no export', await at(() => !document.querySelector('#sect-ae')));

  // two shots, approved, no pictures
  await at(c => { setShots(c, [{ t: 'WIDE', x: 'the gate at night' }, { t: 'INSERT', x: 'one footprint' }]);
    (BY[c].shots || []).forEach((x, i) => setShotAp(c, i, 'a', true)); }, code);
  await page.waitForTimeout(400);
  // an approved shot reveals its prompt before a picture can go on it
  const gen = async i => {
    await page.reply({ text: 'a prompt for shot ' + (i + 1) + ' --ar 21:9 --style raw --v 7' });
    await page.click('[data-mjgen="' + i + '"]');
    await page.waitForTimeout(500);
  };
  await gen(0); await gen(1);
  check('approved shots without pictures explain themselves',
    /still needs a picture its check keeps/.test(await at(() => document.querySelector('#sect-ae').textContent)));
  check('and offer no build button', await at(() => !document.querySelector('[data-ae="scene"]')));

  // ---------- a picture on each shot ----------
  await page.setInputFiles('.shotcard[data-shot="0"] [data-shadd="0"]', page.png('a.png'));
  await page.waitForTimeout(600);
  await page.setInputFiles('.shotcard[data-shot="1"] [data-shadd="1"]', page.png('b.png'));
  await page.waitForTimeout(600);
  check('the build button appears once pictures are on', await at(() => !!document.querySelector('[data-ae="scene"]')));
  check('it counts what is ready', /2 of 2 shots have a picture/.test(await at(() => document.querySelector('#sect-ae').textContent)));

  await page.click('[data-ae="scene"]');
  await page.waitForTimeout(900);
  let saved = await at(() => window.__saved);
  check('a zip is offered to the viewer', !!saved && /_AE\.zip$/.test(saved.filename), saved && saved.filename);
  let inside = names(saved.b64);
  check('it holds the script', inside.includes(code + '.js'), inside);
  check('it holds the pictures in cut order',
    inside.some(n => /^images\/01_WIDE_/.test(n)) && inside.some(n => /^images\/02_INSERT_/.test(n)), inside);
  check('it holds a readme', inside.includes('README.txt'));
  check('one scene needs no master comp', !inside.some(n => /_master\.js$/.test(n)));

  const jsx = entry(saved.b64, code + '.js');
  check('the script targets After Effects', /#target aftereffects/.test(jsx));
  check('it builds a comp', /items\.addComp/.test(jsx));
  check('it carries both shots', (jsx.match(/"label":/g) || []).length === 2);
  check('it finds its pictures beside itself', /new File\(\$\.fileName\)\)\.parent/.test(jsx));
  const shotsJson = t => { const a = t.indexOf('var SHOTS = ') + 12; return JSON.parse(t.slice(a, t.indexOf('\n];', a) + 2)); };
  const rows = shotsJson(jsx);
  check('a wide pushes in and an insert pulls back',
    rows[0].z1 > rows[0].z0 && rows[1].z1 < rows[1].z0, rows.map(r => [r.label, r.z0, r.z1]));
  check('the move is scaled to the shot and the scene', rows.every(r => r.mf >= 0.6 && r.mf <= 2.2));
  check('the longer shot travels further',
    Math.abs(rows[0].z1 - rows[0].z0) > Math.abs(rows[1].z1 - rows[1].z0));
  check('each shot carries its own timecodes', /^\d\d:\d\d\.\d$/.test(rows[0].tcIn) && rows[1].tcIn === rows[0].tcOut,
    [rows[0].tcIn, rows[0].tcOut, rows[1].tcIn]);
  check('the slate, burn-in and dialogue render', /"guides": false/.test(jsx) && /"burnIn": true/.test(jsx) && /"slate": true/.test(jsx));
  check('the burn-in names the shot, its timecodes and the picture',
    /01 · WIDE/.test(rows[0].burn) && rows[0].burn.indexOf(rows[0].tcOut) > 0 && /shot 1 of 2/.test(rows[0].burn), rows[0].burn);
  check('the slate counts the shots, the pictures and the runtime',
    /2 shots/.test(jsx) && /pictures used of 2 uploaded/.test(jsx) && /24 fps/.test(jsx));
  const colName0 = await at(i => colName(state.cols.find(c => c.id === i)), seqId);
  check('the slate says where the scene sits',
    jsx.indexOf(colName0) > 0 && /scene 1 of 3/.test(jsx), colName0);
  check('text layers are built so they render', /t\.guideLayer = CONF\.guides/.test(jsx));
  check('each layer gets the shot text', /the gate at night/.test(jsx) && /one footprint/.test(jsx));
  check('the readme says only approved shots are in it',
    /Only approved shots are here/.test(entry(saved.b64, 'README.txt')));

  // ---------- the check decides which picture ----------
  await at(() => { window.__saved = null; });
  await page.setInputFiles('.shotcard[data-shot="0"] [data-shadd="0"]', page.png('c.png'));
  await page.waitForTimeout(600);
  const second = await at(c => BY[c].shots[0].imgs[1].id, code);
  await page.reply({ best: 2, note: 'the second one is the shot',
    images: [{ n: 1, ok: false, note: 'wrong light' }, { n: 2, ok: true, note: 'that is it' }], prompt: '' });
  await page.click('[data-shcheck="0"]');
  await page.waitForTimeout(900);
  check('the check recorded the second picture', (await at(c => BY[c].shots[0].chk.best, code)) === 1);
  await page.click('[data-ae="scene"]');
  await page.waitForTimeout(900);
  saved = await at(() => window.__saved);
  inside = names(saved.b64);
  check('the export uses the picture the check kept',
    inside.some(n => n.indexOf('images/01_WIDE_' + second.slice(0, 8)) === 0), inside.filter(n => /^images/.test(n)));
  check('and not the one it rejected', inside.filter(n => /^images\/01_/.test(n)).length === 1);
  check('the layer carries why that picture is on screen',
    /"why": "checked: picture 2 of 2 kept"/.test(entry(saved.b64, code + '.js')) &&
    /PICTURE: " \+ s\.why/.test(entry(saved.b64, code + '.js')));

  // ---------- a shot the check turned down entirely ----------
  await at(() => { window.__saved = null; });
  await page.reply({ best: 0, note: 'none of these is the shot',
    images: [{ n: 1, ok: false, note: 'no' }], prompt: 'a better prompt --ar 21:9' });
  await page.click('[data-shcheck="1"]');
  await page.waitForTimeout(900);
  check('the check turned that shot down', (await at(c => BY[c].shots[1].chk.best, code)) === -1);
  await page.click('[data-ae="scene"]');
  await page.waitForTimeout(900);
  saved = await at(() => window.__saved);
  check('the rejected shot brings no picture', !names(saved.b64).some(n => /^images\/02_/.test(n)));
  check('the comp marks the hole in red', /NO PICTURE/.test(entry(saved.b64, code + '.js')));
  check('the readme counts the hole', /1 shot had no picture the check kept/.test(entry(saved.b64, 'README.txt')));
  check('the scene page warns about it too',
    /1 approved shot without a kept picture/.test(await at(() => document.querySelector('#sect-ae').textContent)));

  // ---------- dialogue rides on its shot ----------
  await at(c => { BY[c].shots[0].dlg = 'My Lord! Where are the war chariots?'; reopen(); }, code);
  await page.waitForTimeout(300);
  await at(() => { window.__saved = null; });
  await page.click('[data-ae="scene"]');
  await page.waitForTimeout(900);
  saved = await at(() => window.__saved);
  const dj = entry(saved.b64, code + '.js');
  check('a shot with dialogue gets a subtitle layer', /"DLG " \+ s\.label/.test(dj) && /Where are the war chariots/.test(dj));
  check('the dialogue is on that shot only', /"dlg": "My Lord! Where are the war chariots\?"/.test(dj));
  check('the slate counts the dialogue', /1 shot with dialogue/.test(dj));
  check('the marker carries it too', /DIALOGUE: " \+ s\.dlg/.test(dj));
  await at(c => { delete BY[c].shots[0].dlg; }, code);

  // ---------- the sequence ----------
  await at(() => closeDrawer());
  await at(c => { setShots(c, [{ t: 'CLOSE', x: 'his face' }]); setShotAp(c, 0, 'a', true); }, codes[1]);
  await page.waitForTimeout(400);
  await at(c => scenePanel(c), codes[1]);
  await page.waitForTimeout(250);
  await gen(0);
  await page.setInputFiles('.shotcard[data-shot="0"] [data-shadd="0"]', page.png('d.png'));
  await page.waitForTimeout(600);
  await at(() => closeDrawer());
  await at(i => seqPanel(i), seqId);
  await page.waitForTimeout(300);
  check('the sequence offers a build', await at(() => !!document.querySelector('[data-ae="seq"]')));
  check('it says how many scenes are ready', /2 of 3 scenes ready/.test(await at(() => document.getElementById('drawer').textContent)));
  await at(() => { window.__saved = null; });
  await page.click('[data-ae="seq"]');
  await page.waitForTimeout(1200);
  saved = await at(() => window.__saved);
  inside = names(saved.b64);
  check('every ready scene gets its own folder',
    inside.includes(code + '/' + code + '.js') && inside.includes(codes[1] + '/' + codes[1] + '.js'), inside);
  check('a master comp nests them', inside.some(n => /_master\.js$/.test(n)), inside);
  const master = entry(saved.b64, inside.find(n => /_master\.js$/.test(n)));
  check('the master names both comps in order',
    master.indexOf(code) > 0 && master.indexOf(code) < master.indexOf(codes[1]));
  check('the master marks each scene boundary', /markerProperty\.setValueAtTime/.test(master));
  check('the readme explains the order of running', /master\.js to nest them in order/.test(entry(saved.b64, 'README.txt')));

  // ---------- the whole board ----------
  await at(() => closeDrawer());
  await at(() => { window.__saved = null; });
  await page.click('#btn-ae');
  await page.waitForTimeout(1400);
  saved = await at(() => window.__saved);
  check('the board builds from the header', !!saved && /_AE\.zip$/.test(saved.filename), saved && saved.filename);
  check('it carries every ready scene on the board', names(saved.b64).filter(n => /\.js$/.test(n)).length >= 3);

  // ---------- the viewer can say no ----------
  await at(() => { window.__saved = null; window.__declineSave = true; });
  await page.click('#btn-ae');
  await page.waitForTimeout(1000);
  check('a declined save is not reported as a failure',
    !(await at(() => window.__saved)) && !/Could not build/.test(await at(() => document.getElementById('toast').textContent)));
  await at(() => { window.__declineSave = false; });

  check('no page errors', page.errors.length === 0, page.errors);
  await page.close();
};
