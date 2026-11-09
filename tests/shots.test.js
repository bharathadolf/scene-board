/* Shots, and what an approved shot unlocks: its Midjourney prompt, the
   pictures made from it, and Claude's judgement of them. */
const { openPage, boards } = require('./harness');

const SHOTS = { shots: [
  { type: 'AERIAL', text: 'The hill from above, smoke across the ridge.', te: 'పైనుంచి కొండ.' },
  { type: 'TRACKING', text: 'Running feet through burning grass.', te: 'పొగలో పరుగు.' },
  { type: 'CLOSE', text: 'The leap, held one beat.', te: 'దూకడం.' } ] };
const P1 = 'burning hillside from above at dusk, smoke across a wooded ridge, wide aerial, long lens, photoreal cinematic film still, ancient India --ar 21:9 --style raw --v 7';

module.exports = async ({ browser, check }) => {
  const page = await openPage(browser, { seed: boards(['b5']) });
  const at = page.at;
  const code = await at(() => document.querySelector('#board .card').dataset.c);
  await at(c => scenePanel(c), code);
  await page.waitForTimeout(250);

  // ---- writing the shots ----
  check('the page explains the loop', /paste the prompt into Midjourney/i.test(await at(() => document.getElementById('drawer').textContent)));
  check('it offers a button, not a prompt box', await at(() => !!document.querySelector('[data-mkshots="new"]') && !document.querySelector('#drawer .edp')));
  await page.reply(SHOTS);
  await page.click('[data-mkshots="new"]');
  await page.waitForTimeout(450);
  check('three shots written', (await at(() => (BY[openCode].shots || []).length)) === 3);
  check('each shot is a card', (await at(() => document.querySelectorAll('#drawer .shotcard').length)) === 3);

  // ---- the prompt is behind approval ----
  check('an unapproved shot has no prompt', await at(() => !document.querySelector('[data-mjgen="0"]')));
  check('it says what approving gives you', /Approve this shot and it gets its Midjourney prompt/.test(await at(() => document.getElementById('drawer').textContent)));
  check('no image area either', await at(() => !document.querySelector('.shotcard[data-shot="0"] .shotimg, .shotcard[data-shot="0"] .thumbs')));
  check('no bulk prompt writer yet', await at(() => !document.querySelector('[data-mkprompts]')));

  await at(() => document.querySelector('[data-shap="0"]').click());
  await page.waitForTimeout(350);
  check('a shot can be approved on its own', !!(await at(() => BY[openCode].shots[0].a)));
  check('only the generate button appears', await at(() => {
    const c = document.querySelector('.shotcard[data-shot="0"]');
    return !!c.querySelector('[data-mjgen="0"]') && !c.querySelector('.mjbox') && !c.querySelector('.thumbs');
  }));
  check('approved shots cannot be edited', await at(() => !document.querySelector('[data-shed="0"]') && !document.querySelector('[data-shdel="0"]')));
  check('the bulk writer appears', await at(() => !!document.querySelector('[data-mkprompts]')));
  check('and it says how many shots it will write for', /without one/.test(await at(() => document.querySelector('[data-mkprompts]').textContent)));

  // ---- generating it ----
  await page.reply({ text: P1 });
  await page.click('[data-mjgen="0"]');
  await page.waitForTimeout(450);
  check('the prompt is revealed', (await at(() => BY[openCode].shots[0].mj)) === P1);
  check('it is shown on the card', /--ar 21:9/.test(await at(() => document.querySelector('.shotcard[data-shot="0"] .mjbox').textContent)));
  check('with a copy button', await at(() => !!document.querySelector('.shotcard[data-shot="0"] [data-mjcopy="0"]')));
  check('and a place for the picture', await at(() => !!document.querySelector('.shotcard[data-shot="0"] .shotimg')));
  check('the instruction named Midjourney', /MIDJOURNEY/i.test(await at(() => window.__calls[window.__calls.length - 1])));
  check('it was told how Krishna may be shown', /Never show more of Krishna/i.test(await at(() => window.__calls[window.__calls.length - 1])));

  // ---- the pictures ----
  await page.setInputFiles('.shotcard[data-shot="0"] [data-shadd="0"]', page.png('a.png'));
  await page.waitForTimeout(600);
  check('a picture can be added', (await at(() => (BY[openCode].shots[0].imgs || []).length)) === 1);
  check('it is stored in the asset store', (await at(() => window.__uploads.length)) === 1);
  check('it is shown as a thumbnail', await at(() => !!document.querySelector('.shotcard[data-shot="0"] .thumb img')));
  check('nothing is checked yet', /Not checked yet/.test(await at(() => document.querySelector('.shotcard[data-shot="0"]').textContent)));
  await page.setInputFiles('.shotcard[data-shot="0"] [data-shadd="0"]', page.png('b.png'));
  await page.waitForTimeout(600);
  await page.setInputFiles('.shotcard[data-shot="0"] [data-shadd="0"]', page.png('c.png'));
  await page.waitForTimeout(600);
  check('several pictures can sit on one shot', (await at(() => BY[openCode].shots[0].imgs.length)) === 3);
  check('the check button counts them', /Check all 3/.test(await at(() => document.querySelector('.shotcard[data-shot="0"]').textContent)));

  // ---- Claude picks the best one ----
  await page.reply({ best: 2, note: 'The second has the ridge and the dusk light; the others are too close.',
    images: [{ n: 1, ok: false, note: 'too close for an aerial' }, { n: 2, ok: true, note: 'the ridge reads' }, { n: 3, ok: false, note: 'wrong time of day' }],
    prompt: '' });
  await page.click('[data-shcheck="0"]');
  await page.waitForTimeout(800);
  check('every picture went to Claude', (await at(() => window.__lastImages)) === 3);
  check('the best one is recorded', (await at(() => BY[openCode].shots[0].chk.best)) === 1);
  check('the best one is marked', await at(() => !!document.querySelector('.shotcard[data-shot="0"] .thumb.best')));
  check('the reason is shown', /ridge/.test(await at(() => document.querySelector('.shotcard[data-shot="0"] .verdict').textContent)));
  check('each picture gets a word', (await at(() => BY[openCode].shots[0].chk.per.length)) === 3);
  check('a good batch leaves the prompt alone', (await at(() => BY[openCode].shots[0].mj)) === P1);

  // ---- when none of them will do, the prompt changes ----
  const P2 = 'burning ridge seen from high above at dusk, thin smoke, extreme wide aerial, photoreal cinematic film still --ar 21:9 --style raw --v 7';
  await page.reply({ best: 0, note: 'None of them is an aerial.', images: [{ n: 1, ok: false, note: 'too close' }], prompt: P2 });
  await page.click('[data-shcheck="0"]');
  await page.waitForTimeout(800);
  check('a bad batch is said so', (await at(() => BY[openCode].shots[0].chk.best)) === -1);
  check('and the prompt is rewritten', (await at(() => BY[openCode].shots[0].mj)) === P2);
  check('the card says none fit', /None of these is the shot/.test(await at(() => document.querySelector('.shotcard[data-shot="0"] .verdict').textContent)));

  // ---- replacing and removing ----
  await at(() => document.querySelector('[data-shpick="0_1"]').click());
  await page.waitForTimeout(200);
  check('a picture can be picked', (await at(() => shotSel[openCode + ':0'])) === 1);
  const second = await at(() => BY[openCode].shots[0].imgs[1].id);
  await page.setInputFiles('.shotcard[data-shot="0"] [data-shrep="0_1"]', page.png('d.png'));
  await page.waitForTimeout(600);
  check('the picked one is replaced in place', (await at(() => BY[openCode].shots[0].imgs.length)) === 3 && (await at(() => BY[openCode].shots[0].imgs[1].id)) !== second);
  check('the replaced file is deleted from the store', !(await at(i => window.__uploads.some(u => u.id === i), second)));
  await page.click('[data-shrm="0_1"]');
  await page.waitForTimeout(500);
  check('a picture can be removed', (await at(() => BY[openCode].shots[0].imgs.length)) === 2);
  check('removing clears the old verdict', !(await at(() => BY[openCode].shots[0].chk)));

  // ---- the prompt can be approved and then nothing touches it ----
  await at(() => document.querySelector('[data-mjap="0"]').click());
  await page.waitForTimeout(350);
  check('the prompt can be approved', !!(await at(() => BY[openCode].shots[0].ma)));
  check('an approved prompt cannot be edited', await at(() => !document.querySelector('[data-mjed="0"]') && !document.querySelector('[data-mjgen="0"]')));
  await page.reply({ best: 0, note: 'still wrong', images: [], prompt: 'THIS SHOULD NOT LAND --ar 1:1' });
  await page.click('[data-shcheck="0"]');
  await page.waitForTimeout(800);
  check('a check never rewrites an approved prompt', (await at(() => BY[openCode].shots[0].mj)) === P2);

  // ---- writing the rest in one go ----
  await at(() => { document.querySelector('[data-shap="1"]').click(); });
  await page.waitForTimeout(350);
  await page.reply({ prompts: [{ n: 1, text: 'SHOULD NOT LAND' }, { n: 2, text: 'running feet through burning grass, low tracking shot --ar 21:9 --style raw --v 7' }, { n: 3, text: 'ALSO NOT' }] });
  await page.click('[data-mkprompts]');
  await page.waitForTimeout(500);
  check('the bulk writer fills an approved shot', /running feet/.test(await at(() => BY[openCode].shots[1].mj || '')));
  check('it leaves an approved prompt alone', (await at(() => BY[openCode].shots[0].mj)) === P2);
  check('it skips shots that are not approved', !(await at(() => BY[openCode].shots[2].mj)));

  check('no page errors', page.errors.length === 0, page.errors);
  await page.close();
};
