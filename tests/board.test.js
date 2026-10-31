/* Sources, shots, prompt editing, history and diff, the context menu,
   the hover preview and the read-through. */
const { openPage, boards } = require('./harness');

module.exports = async ({ browser, check }) => {
  const page = await openPage(browser, { seed: boards(['b1', 'b5']) });
  const at = page.at;

  // ---- board 5 ----
  check('action cut listed', (await at(() => [...document.querySelectorAll('#boards [data-board]')].map(b => b.textContent).join('|'))).includes('action cut'));
  await at(() => document.querySelector('[data-board="b5"]').click());
  await page.waitForTimeout(250);
  check('action cut holds every scene', (await at(() => document.getElementById('s-placed').textContent)) === '115/115');
  check('action cut opens on the hill', (await at(() => document.querySelector('.cname').value)) === 'Cold open: the burning hill');

  const code = await at(() => document.querySelector('#board .card').dataset.c);
  await at(c => document.querySelector('.card[data-c="' + c + '"]').click(), code);
  await page.waitForTimeout(150);

  // ---- where a scene comes from ----
  check('source section present', await at(() => !!document.querySelector('#drawer details.srcd')));
  check('source links to the text', /vedabase/.test(await at(() => { const a = document.querySelector('#drawer details.srcd a'); return a ? a.href : ''; })));
  check('panel has three tabs', (await at(() => document.querySelectorAll('#drawer [data-dtab]').length)) === 3);

  // ---- shots by hand ----
  await at(() => document.querySelector('[data-dtab="shots"]').click());
  await page.waitForTimeout(120);
  check('starts with no shots', /No shots yet/.test(await at(() => document.getElementById('drawer').textContent)));
  await page.click('#addshot');
  await page.fill('#sht', 'wide');
  await page.fill('#shx', 'The hill burns; two silhouettes at the edge.');
  await page.click('[data-shsave="-1"]');
  await page.waitForTimeout(250);
  check('shot added', (await at(() => document.querySelectorAll('#drawer .shot').length)) === 1);
  check('shot type normalised', (await at(() => document.querySelector('#drawer .shot .st').textContent)) === 'WIDE');
  check('shot saved to the database', (await at(() => JSON.stringify(Object.values(window.__store.scenes)))).includes('burns'));
  check('card shows a shot count', /shot/.test(await at(c => document.querySelector('.card[data-c="' + c + '"] .meta').textContent, code)));
  await page.click('#addshot');
  await page.fill('#sht', 'CU');
  await page.fill('#shx', 'Her hand on the rail.');
  await page.click('[data-shsave="-1"]');
  await page.waitForTimeout(250);
  await page.click('[data-shup="1"]');
  await page.waitForTimeout(250);
  check('shot moved up', (await at(() => document.querySelector('#drawer .shot .st').textContent)) === 'CU');
  await page.click('[data-shdel="1"]');
  await page.waitForTimeout(250);
  check('shot deleted', (await at(() => document.querySelectorAll('#drawer .shot').length)) === 1);

  // ---- shots by prompt ----
  await page.fill('#edp', 'break it into three shots');
  await at(() => { window.__reply = JSON.stringify({ shots: [
    { type: 'AERIAL', text: 'The hill from above.', te: 'పైనుంచి కొండ.' },
    { type: 'TRACKING', text: 'Running feet through smoke.', te: 'పొగలో పరుగు.' },
    { type: 'CLOSE', text: 'The leap.', te: 'దూకడం.' }] }); });
  await page.click('#edgo');
  await page.waitForTimeout(400);
  check('prompt wrote the shot list', (await at(() => document.querySelectorAll('#drawer .shot').length)) === 3);
  check('the prompt asked for shots', /shot list/i.test(await at(() => window.__calls[0])));

  // ---- editing a scene by prompt ----
  await at(() => document.querySelector('[data-dtab="scene"]').click());
  await page.waitForTimeout(120);
  const before = await at(() => document.querySelector('#drawer h3').textContent);
  await page.fill('#edp', 'sharpen the turn');
  await at(() => { window.__reply = JSON.stringify({
    t: 'The leap into fire', sum: 'They jump from the burning peak and vanish into the smoke below.',
    why: 'A false victory for the antagonist.', turn: 'He sees no bodies and calls it a win.',
    story: 'The camera follows one silhouette against the flames.', mins: '2', tier: 4,
    rasa: 'Adbhuta', pov: 'Jarasandha', pl: 'The burning peak', k: 'Effect', carrier: false,
    cat: 'A', gen: ['Thriller'],
    te: { t: 'మంటల్లోకి దూకడం', sum: 'వాళ్లు దూకుతారు.', why: 'తప్పుడు విజయం.', turn: 'శరీరాలు కనబడవు.', story: 'సిల్హౌట్.' } }); });
  await page.click('#edgo');
  await page.waitForTimeout(400);
  check('scene rewritten', (await at(() => document.querySelector('#drawer h3').textContent)) === 'The leap into fire');
  check('marked as edited', await at(() => !!document.querySelector('#drawer .edflag')));
  check('new runtime in the details', /2 min/.test(await at(() => [...document.querySelectorAll('#drawer .kv dd')].map(d => d.textContent).join(' '))));

  // ---- history and diff ----
  await at(() => document.querySelector('[data-dtab="hist"]').click());
  await page.waitForTimeout(150);
  check('two versions kept', (await at(() => document.querySelectorAll('#drawer .vrow').length)) === 2,
    await at(() => [...document.querySelectorAll('#drawer .vrow')].map(v => v.textContent)));
  check('the oldest is the original', /The original/.test(await at(() => document.querySelector('#drawer .vrow:last-of-type').textContent)));
  check('diff marks removals and additions',
    (await at(() => document.querySelectorAll('#drawer del').length)) > 0 && (await at(() => document.querySelectorAll('#drawer ins').length)) > 0);
  check('meta changes listed', /CG tier/.test(await at(() => document.getElementById('drawer').textContent)));
  await page.click('[data-restore="0"]');
  await page.waitForTimeout(400);
  check('restored the earlier wording', (await at(() => document.querySelector('#drawer h3').textContent)) === before,
    await at(() => document.querySelector('#drawer h3').textContent));
  check('shots survive a restore', /shot/.test(await at(c => document.querySelector('.card[data-c="' + c + '"] .meta').textContent, code)));
  check('the restore is itself a version', (await at(() => document.querySelectorAll('#drawer .vrow').length)) >= 3);
  await page.click('#dclose');

  // ---- right-click menus ----
  await at(c => { const el = document.querySelector('.card[data-c="' + c + '"]'); const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: r.left + 20, clientY: r.top + 10 })); }, code);
  await page.waitForTimeout(120);
  check('scene menu opens', !(await at(() => document.getElementById('ctx').hidden)));
  check('scene menu has the actions', (await at(() => [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx).join(',')))
    .includes('rename') && (await at(() => [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx).join(','))).includes('hist'));
  await at(() => document.querySelector('#ctx [data-cx="rename"]').click());
  await page.waitForTimeout(120);
  await page.fill('#ctxin', 'A renamed scene');
  await page.click('#ctx [data-cx="rsave"]');
  await page.waitForTimeout(300);
  check('renamed from the menu', (await at(c => document.querySelector('.card[data-c="' + c + '"] .ttl').textContent, code)) === 'A renamed scene');

  const cols = await at(() => document.querySelectorAll('#board .col').length);
  await at(() => { const el = document.querySelector('.col'); const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: r.left + 30, clientY: r.top + 8 })); });
  await page.waitForTimeout(120);
  check('sequence menu opens', (await at(() => [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx).join(','))).includes('after'));
  await at(() => document.querySelector('#ctx [data-cx="after"]').click());
  await page.waitForTimeout(250);
  check('sequence added after', (await at(() => document.querySelectorAll('#board .col').length)) === cols + 1);
  await at(() => { state.cols.splice(1, 1); persist(); render(); });
  await page.waitForTimeout(200);

  // ---- editing a sequence by prompt ----
  await at(() => document.querySelector('[data-seq]').click());
  await page.waitForTimeout(150);
  const ids = await at(() => state.cols.find(c => c.id === openSeq).ids);
  await page.fill('#edp', 'rename it and reverse the order');
  await at(o => { window.__reply = JSON.stringify({ name: 'Ink and the letter', note: 'This run turns the letter into a decision.',
    te: { name: 'సిరా, లేఖ', note: 'ఈ భాగం లేఖను నిర్ణయంగా మారుస్తుంది.' }, order: o }); }, ids.slice().reverse());
  await page.click('#edgo');
  await page.waitForTimeout(400);
  check('sequence renamed', (await at(() => document.querySelector('#drawer h3').textContent)) === 'Ink and the letter');
  check('sequence reordered', (await at(() => state.cols.find(c => c.id === openSeq).ids[0])) === ids[ids.length - 1]);
  check('story context shown on the board', /turns the letter/.test(await at(() => document.querySelector('.cnote').textContent)));
  await page.click('#dclose');

  // ---- a bad answer from Claude ----
  await at(() => document.querySelector('#board .card').click());
  await page.waitForTimeout(150);
  await page.fill('#edp', 'break it');
  await at(() => { window.__reply = 'not json'; });
  await page.click('#edgo');
  await page.waitForTimeout(350);
  check('failure is reported', !!(await at(() => { const e = document.querySelector('#drawer .err'); return e && e.textContent; })));
  check('the instruction is kept', (await at(() => document.getElementById('edp').value)) === 'break it');
  await page.click('#dclose');

  // ---- hover preview ----
  await at(() => { const el = document.querySelector('#board .card'); el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
  await page.waitForTimeout(700);
  check('preview waits', await at(() => document.getElementById('peek').hidden));
  await at(() => { const el = document.querySelector('#board .card'); showPeek(el.dataset.c, el); });
  await page.waitForTimeout(120);
  check('preview shows the whole scene', (await at(() => document.getElementById('peek').textContent)).length > 150);
  check('preview stays on screen', await at(() => { const r = document.getElementById('peek').getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1; }));
  await at(() => hidePeek());

  // ---- read-through ----
  await page.click('#btn-read');
  await page.waitForTimeout(350);
  check('read-through opens', !(await at(() => document.getElementById('read').hidden)));
  check('every scene is in it', (await at(() => document.querySelectorAll('#read .rsc').length)) === 115);
  check('sequences are headings', (await at(() => document.querySelectorAll('#read .rseq').length)) >= 19);
  check('shots are printed', (await at(() => document.querySelectorAll('#read .rshots li').length)) === 3);
  check('body marked for printing', await at(() => document.body.classList.contains('reading')));
  await at(() => setLang('te'));
  await page.waitForTimeout(400);
  check('read-through follows the language', /[ఀ-౿]/.test(await at(() => [...document.querySelectorAll('#read .rsc h3')].map(h => h.textContent).join(''))));
  check('its own buttons stay English', /Print/.test(await at(() => document.querySelector('.rbar').textContent)));
  await at(() => setLang('en'));
  await page.waitForTimeout(250);
  await page.click('#rclose');
  await page.waitForTimeout(150);
  check('read-through closes', await at(() => document.getElementById('read').hidden));

  // ---- deleting a board ----
  await page.click('#delboard');
  await page.waitForTimeout(100);
  check('delete asks first', /Click × again/.test(await at(() => document.getElementById('toast').textContent)));
  await page.click('#delboard');
  await page.waitForTimeout(400);
  check('board deleted', (await at(() => document.querySelectorAll('#boards [data-board]').length)) === 1);
  check('deleted in the database', (await at(() => (window.__deleted || []).join(','))).includes('boards/'));
  await page.click('#delboard');
  await page.waitForTimeout(150);
  check('the last board is kept', /only board/.test(await at(() => document.getElementById('toast').textContent)));

  check('no page errors', page.errors.length === 0, page.errors);
  await page.close();
};
