/* The board, the scene page, editing by prompt, history, the menus and the
   read-through. Shots, prompts and images have their own suite. */
const { openPage, boards } = require('./harness');

module.exports = async ({ browser, check }) => {
  const page = await openPage(browser, { seed: boards(['b1', 'b5']) });
  const at = page.at;

  // ---- the boards ----
  check('the action cut is listed', (await at(() => [...document.querySelectorAll('#boards [data-board]')].map(b => b.textContent).join('|'))).includes('action cut'));
  await at(() => document.querySelector('[data-board="b5"]').click());
  await page.waitForTimeout(300);
  check('it holds every scene', (await at(() => document.getElementById('s-placed').textContent)) === '115/115');
  check('it opens on the hill', (await at(() => document.querySelector('.cname').value)) === 'Cold open: the burning hill');

  const code = await at(() => document.querySelector('#board .card').dataset.c);
  await at(c => document.querySelector('.card[data-c="' + c + '"]').click(), code);
  await page.waitForTimeout(250);

  // ---- one page, nothing hidden ----
  check('every part is on one page', await at(() => {
    const t = document.getElementById('drawer').textContent;
    return /The scene/.test(t) && /Shots, prompts and images/.test(t) && /Options/.test(t) && /History/.test(t);
  }));
  check('nothing is behind a tab', await at(() => !document.querySelector('#drawer [data-dtab]')));
  check('the story text has no controls among it', await at(() => {
    const first = document.querySelector('#drawer .sect.first');
    return !first.querySelector('[data-mv]') && !first.querySelector('[data-setcat]') && !first.querySelector('#dcol2');
  }));
  check('the controls are under Options', await at(() => {
    const s = [...document.querySelectorAll('#drawer .sect')].find(x => /^Options/.test(x.textContent));
    return !!(s && s.querySelector('[data-setcat]') && (s.querySelector('[data-mv]') || s.querySelector('[data-place]')));
  }));
  check('approve sits in the top bar', await at(() => !!document.querySelector('.sbar .btn.ap')));
  check('it says what approving needs first', /Write its shots first/.test(await at(() => document.querySelector('#drawer .sect.first').textContent)));
  check('where it comes from is on the page', await at(() => !!document.querySelector('#drawer details.srcd')));
  check('it links to the text', /vedabase/.test(await at(() => { const a = document.querySelector('#drawer details.srcd a'); return a ? a.href : ''; })));

  // ---- rewriting a scene ----
  const before = await at(() => document.querySelector('#drawer h1').textContent);
  await page.fill('.edp[data-k^="s:"]', 'sharpen the turn');
  await page.reply({ t: 'The leap into fire', sum: 'They jump from the burning peak and vanish into the smoke below.',
    why: 'A false victory for the antagonist.', turn: 'He sees no bodies and calls it a win.',
    story: 'The camera follows one silhouette against the flames.', mins: '2', tier: 4, rasa: 'Adbhuta',
    pov: 'Jarasandha', pl: 'The burning peak', k: 'Effect', carrier: false, cat: 'A', gen: ['Thriller'],
    te: { t: 'మంటల్లోకి దూకడం', sum: 'వాళ్లు దూకుతారు.', why: 'తప్పుడు విజయం.', turn: 'శరీరాలు కనబడవు.', story: 'సిల్హౌట్.' } });
  await page.click('[data-go^="s:"]');
  await page.waitForTimeout(450);
  check('the scene is rewritten', (await at(() => document.querySelector('#drawer h1').textContent)) === 'The leap into fire');
  check('it is marked as edited', await at(() => !!document.querySelector('.sbar .edflag')));
  check('the new runtime shows', /2 min/.test(await at(() => [...document.querySelectorAll('#drawer .kv dd')].map(d => d.textContent).join(' '))));

  // ---- history and diff ----
  await at(() => { histOpen = true; reopen(); });
  await page.waitForTimeout(200);
  check('the earlier version is kept', (await at(() => document.querySelectorAll('#drawer .vrows .vrow').length)) === 1);
  check('it is the original', /The original/.test(await at(() => document.querySelector('#drawer .vrows .vrow:last-child').textContent)));
  check('the diff marks both sides', (await at(() => document.querySelectorAll('#drawer del').length)) > 0 && (await at(() => document.querySelectorAll('#drawer ins').length)) > 0);
  check('what else changed is listed', /CG tier/.test(await at(() => document.getElementById('drawer').textContent)));
  await page.click('[data-restore="0"]');
  await page.waitForTimeout(450);
  check('a version can be restored', (await at(() => document.querySelector('#drawer h1').textContent)) === before);
  check('the restore is itself a version', (await at(() => { histOpen = true; reopen(); return document.querySelectorAll('#drawer .vrows .vrow').length; })) >= 2);

  // ---- a bad answer from Claude ----
  await page.fill('.edp[data-k^="s:"]', 'break it');
  await at(() => { window.__reply = 'not json'; });
  await page.click('[data-go^="s:"]');
  await page.waitForTimeout(400);
  check('a failure is reported', !!(await at(() => { const e = document.querySelector('#drawer .err'); return e && e.textContent; })));
  check('the instruction is kept', (await at(() => document.querySelector('.edp[data-k^="s:"]').value)) === 'break it');
  await at(() => closeDrawer());

  // ---- the menus are ways in, not a second copy of the page ----
  await at(c => { const el = document.querySelector('.card[data-c="' + c + '"]'); const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: r.left + 20, clientY: r.top + 10 })); }, code);
  await page.waitForTimeout(150);
  check('the scene menu opens', !(await at(() => document.getElementById('ctx').hidden)));
  check('it offers the ways in', (await at(() => [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx).join(','))).includes('rename'));
  check('it does not repeat the page', await at(() => {
    const cx = [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx);
    return !cx.includes('cat') && !cx.includes('up') && !cx.includes('copy');
  }), await at(() => [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx)));
  await at(() => document.querySelector('#ctx [data-cx="rename"]').click());
  await page.waitForTimeout(150);
  await page.fill('#ctxin', 'A renamed scene');
  await page.click('#ctx [data-cx="rsave"]');
  await page.waitForTimeout(350);
  check('renaming from the menu works', (await at(c => document.querySelector('.card[data-c="' + c + '"] .ttl').textContent, code)) === 'A renamed scene');

  const cols = await at(() => document.querySelectorAll('#board .col').length);
  await at(() => { const el = document.querySelector('.col'); const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: r.left + 30, clientY: r.top + 8 })); });
  await page.waitForTimeout(150);
  check('the sequence menu opens', (await at(() => [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx).join(','))).includes('after'));
  await at(() => document.querySelector('#ctx [data-cx="after"]').click());
  await page.waitForTimeout(300);
  check('a sequence can be added after another', (await at(() => document.querySelectorAll('#board .col').length)) === cols + 1);
  await at(() => { state.cols.splice(1, 1); persist(); render(); });
  await page.waitForTimeout(250);

  // ---- editing a sequence ----
  await at(() => document.querySelector('[data-seq]').click());
  await page.waitForTimeout(250);
  check('the sequence opens as a page', /The sequence/.test(await at(() => document.getElementById('drawer').textContent)));
  const ids = await at(() => state.cols.find(c => c.id === openSeq).ids);
  await page.fill('.edp[data-k^="q:"]', 'rename it and reverse the order');
  await page.reply({ name: 'Ink and the letter', note: 'This run turns the letter into a decision.',
    te: { name: 'సిరా, లేఖ', note: 'ఈ భాగం లేఖను నిర్ణయంగా మారుస్తుంది.' }, order: ids.slice().reverse() });
  await page.click('[data-go^="q:"]');
  await page.waitForTimeout(450);
  check('the sequence is renamed', (await at(() => document.querySelector('#drawer h1').textContent)) === 'Ink and the letter');
  check('its scenes are reordered', (await at(() => state.cols.find(c => c.id === openSeq).ids[0])) === ids[ids.length - 1]);
  check('its context shows on the board', /turns the letter/.test(await at(() => document.querySelector('.cnote').textContent)));
  await at(() => closeDrawer());

  // ---- the hover preview ----
  await at(() => { const el = document.querySelector('#board .card'); el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
  await page.waitForTimeout(700);
  check('the preview waits', await at(() => document.getElementById('peek').hidden));
  await at(() => { const el = document.querySelector('#board .card'); showPeek(el.dataset.c, el); });
  await page.waitForTimeout(150);
  check('it shows the whole scene', (await at(() => document.getElementById('peek').textContent)).length > 150);
  check('it stays on screen', await at(() => { const r = document.getElementById('peek').getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1; }));
  await at(() => hidePeek());

  // ---- the read-through ----
  await page.click('#btn-read');
  await page.waitForTimeout(400);
  check('the read-through opens', !(await at(() => document.getElementById('read').hidden)));
  check('every scene is in it', (await at(() => document.querySelectorAll('#read .rsc').length)) === 115);
  check('the sequences are headings', (await at(() => document.querySelectorAll('#read .rseq').length)) >= 19);
  check('the body is marked for printing', await at(() => document.body.classList.contains('reading')));
  await at(() => setLang('te'));
  await page.waitForTimeout(450);
  check('it follows the language', /[ఀ-౿]/.test(await at(() => [...document.querySelectorAll('#read .rsc h3')].map(h => h.textContent).join(''))));
  check('its own buttons stay English', /Print/.test(await at(() => document.querySelector('.rbar').textContent)));
  await at(() => setLang('en'));
  await page.waitForTimeout(300);
  await page.click('#rclose');
  await page.waitForTimeout(200);
  check('it closes', await at(() => document.getElementById('read').hidden));

  // ---- deleting a board ----
  await page.click('#delboard');
  await page.waitForTimeout(150);
  check('deleting asks first', /Click × again/.test(await at(() => document.getElementById('toast').textContent)));
  await page.click('#delboard');
  await page.waitForTimeout(450);
  check('the board is deleted', (await at(() => document.querySelectorAll('#boards [data-board]').length)) === 1);
  check('and deleted in the database', (await at(() => (window.__deleted || []).join(','))).includes('boards/'));
  await page.click('#delboard');
  await page.waitForTimeout(200);
  check('the last board is kept', /only board/.test(await at(() => document.getElementById('toast').textContent)));

  check('no page errors', page.errors.length === 0, page.errors);
  await page.close();
};
