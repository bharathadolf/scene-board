/* What may be approved, and what an approval holds underneath it:
   a shot on its own, a scene only once all its shots are approved,
   a sequence only once all its scenes are. */
const { openPage, boards } = require('./harness');

module.exports = async ({ browser, check }) => {
  const page = await openPage(browser, { seed: boards(['b5']) });
  const at = page.at;

  /* give a scene two shots, and approve them if asked */
  const prepare = (codes, approveShots) => at(({ codes, approveShots }) => {
    codes.forEach(c => {
      setShots(c, [{ t: 'WIDE', x: 'the first shot of ' + c }, { t: 'CLOSE', x: 'the second shot of ' + c }]);
      if (approveShots) (BY[c].shots || []).forEach((x, i) => setShotAp(c, i, 'a', true));
    });
  }, { codes, approveShots });

  const seqId = await at(() => state.cols[0].id);
  const codes = await at(i => state.cols.find(c => c.id === i).ids, seqId);
  const code = codes[0];

  // ---------- a scene is not ready until its shots are ----------
  await at(c => scenePanel(c), code);
  await page.waitForTimeout(250);
  check('a scene with no shots cannot be approved', await at(() => !!document.querySelector('.sbar .btn.ap[disabled]')));
  check('and it says why', /Write its shots first/.test(await at(() => document.getElementById('drawer').textContent)));
  await at(c => setSceneAp(c, true), code);
  await page.waitForTimeout(250);
  check('approving it anyway is refused', !(await at(c => sceneAp(c), code)));

  await prepare([code], false);
  await page.waitForTimeout(350);
  check('with shots unapproved it is still not ready', /Approve all of its shots first — 0 of 2/.test(await at(() => document.getElementById('drawer').textContent)));
  await at(() => document.querySelector('[data-shap="0"]').click());
  await page.waitForTimeout(350);
  check('the count follows along', /1 of 2 are approved/.test(await at(() => document.getElementById('drawer').textContent)));
  check('the card shows the count', /1\/2 shots/.test(await at(c => document.querySelector('.card[data-c="' + c + '"] .meta').textContent, code)));
  await at(() => document.querySelector('[data-shap="1"]').click());
  await page.waitForTimeout(350);
  check('with every shot approved it is ready', /ready to approve/.test(await at(() => document.getElementById('drawer').textContent)));
  check('and the button is live', await at(() => !document.querySelector('.sbar .btn.ap[disabled]')));

  await page.click('.sbar [data-sceneap]');
  await page.waitForTimeout(400);
  check('the scene is approved', await at(c => sceneAp(c), code));
  check('the card says so', await at(c => !!document.querySelector('.card[data-c="' + c + '"] .apchip'), code));
  check('the board counts it', (await at(() => document.getElementById('s-appr').textContent)).startsWith('1'));

  // ---------- an approved scene holds its shots ----------
  check('its shots cannot be unapproved', await at(() => { const n = BY[openCode].shots.filter(x => x.a).length; setShotAp(openCode, 0, 'a', false); return BY[openCode].shots.filter(x => x.a).length === n; }));
  check('no shot buttons are offered', await at(() => !document.querySelector('[data-shed="0"]') && !document.querySelector('[data-shap="0"]')));
  check('no way to rewrite the shots', await at(() => !document.querySelector('[data-mkshots]') && !document.querySelector('[data-mkprompts]')));
  check('the shots section says why', /take that approval off first/i.test(await at(() => document.querySelector('#sect-shots').textContent)));
  const shotCount = await at(() => BY[openCode].shots.length);
  await at(() => setShots(openCode, [{ t: 'X', x: 'should not land' }]));
  await page.waitForTimeout(250);
  check('its shots cannot be replaced', (await at(() => BY[openCode].shots.length)) === shotCount);
  check('the scene text is locked too', await at(() => !document.querySelector('#drawer .edp') && !document.querySelector('#addshot')));
  await at(() => closeDrawer());

  // ---------- a sequence is not ready until its scenes are ----------
  await at(i => seqPanel(i), seqId);
  await page.waitForTimeout(250);
  check('a sequence with unapproved scenes is not ready', /Approve all of its scenes first — 1 of 3/.test(await at(() => document.getElementById('drawer').textContent)),
    await at(() => document.querySelector('#drawer .sect.first').textContent.slice(0, 200)));
  check('its approve button is held', await at(() => !!document.querySelector('.sbar .btn.ap[disabled]')));
  await at(i => setSeqAp(i, true), seqId);
  await page.waitForTimeout(250);
  check('approving it anyway is refused', !(await at(i => seqApId(i), seqId)));

  await prepare(codes.slice(1), true);
  await page.waitForTimeout(450);
  await at(cs => cs.forEach(c => setSceneAp(c, true)), codes.slice(1));
  await page.waitForTimeout(450);
  check('every scene in it is approved now', (await at(cs => cs.every(c => sceneAp(c)), codes)) === true);
  await at(i => seqPanel(i), seqId);
  await page.waitForTimeout(250);
  check('the sequence is ready', /ready to approve/.test(await at(() => document.getElementById('drawer').textContent)));
  await page.click('.sbar [data-seqap]');
  await page.waitForTimeout(400);
  check('the sequence is approved', await at(i => seqApId(i), seqId));
  check('its header is marked', await at(() => !!document.querySelector('.col.apd .apmark')));
  check('its name is read-only', await at(() => document.querySelector('.col.apd .cname').readOnly));
  check('no prompt box on it', await at(() => !document.querySelector('.edp[data-k^="q:"]')));

  // ---------- an approved sequence holds its scenes ----------
  await at(c => setSceneAp(c, false), code);
  await page.waitForTimeout(300);
  check('its scenes cannot be unapproved', await at(c => sceneAp(c), code));
  check('and it says which approval to take off', /sequence is approved/i.test(await at(() => document.getElementById('toast').textContent)));
  const seqName = await at(i => state.cols.find(c => c.id === i).name, seqId);
  await at(i => renameSeq(i, 'should not happen'), seqId);
  await page.waitForTimeout(250);
  check('renaming it is refused', (await at(i => state.cols.find(c => c.id === i).name, seqId)) === seqName);
  const nCols = await at(() => state.cols.length);
  await at(i => delSeq(i), seqId);
  await page.waitForTimeout(250);
  check('deleting it is refused', (await at(() => state.cols.length)) === nCols);
  const order = await at(i => state.cols.find(c => c.id === i).ids.join(), seqId);
  await at(c => move(c, 1), code);
  await page.waitForTimeout(250);
  check('its scenes cannot be moved', (await at(i => state.cols.find(c => c.id === i).ids.join(), seqId)) === order);

  // ---------- and taken off from the top down ----------
  await at(i => seqPanel(i), seqId);
  await page.waitForTimeout(250);
  await page.click('.sbar [data-seqap]');
  await page.waitForTimeout(400);
  check('the sequence approval comes off', !(await at(i => seqApId(i), seqId)));
  await at(c => setSceneAp(c, false), code);
  await page.waitForTimeout(300);
  check('then the scene approval comes off', !(await at(c => sceneAp(c), code)));
  await at(c => scenePanel(c), code);
  await page.waitForTimeout(250);
  check('and the shots are free again', await at(() => !!document.querySelector('[data-shap="0"]')));
  await at(() => setShotAp(openCode, 0, 'a', false));
  await page.waitForTimeout(300);
  check('a shot approval comes off too', !(await at(() => BY[openCode].shots[0].a)));
  check('which takes its prompt away again', await at(() => !document.querySelector('.shotcard[data-shot="0"] .mjbox') && !document.querySelector('[data-mjgen="0"]')));

  check('no page errors', page.errors.length === 0, page.errors);
  await page.close();
};
