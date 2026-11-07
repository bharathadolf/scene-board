/* The language switch: the story turns Telugu, the interface stays English. */
const { openPage, boards } = require('./harness');

module.exports = async ({ browser, check }) => {
  const page = await openPage(browser, { seed: boards(['b1', 'b2']) });
  const at = page.at;
  const te = s => /[ఀ-౿]/.test(s);

  check('two boards listed', (await at(() => document.querySelectorAll('#boards [data-board]').length)) === 2);
  check('all 115 placed', (await at(() => document.getElementById('s-placed').textContent)) === '115/115');

  const enTitle = await at(() => document.querySelector('#board .card .ttl').textContent);
  await at(() => setLang('te'));
  await page.waitForTimeout(250);

  check('scene title in Telugu', te(await at(() => document.querySelector('#board .card .ttl').textContent)));
  check('sequence name in Telugu', te(await at(() => document.querySelector('.cname').value)));
  check('board name in Telugu', te(await at(() => document.querySelector('#boards [data-board]').textContent)));
  check('event filter in Telugu', te(await at(() => document.querySelector('#evf option:nth-child(2)').textContent)));
  check('buttons stay English', !te(await at(() => [...document.querySelectorAll('.tools .btn')].map(b => b.textContent).join(''))));
  check('header stays English', !te(await at(() => document.querySelector('header .sub').textContent)));
  check('stat labels stay English', !te(await at(() => document.querySelector('.stat span').textContent)));

  await at(() => { document.querySelector('#board .card').click(); });
  await page.waitForTimeout(250);
  check('the scene page is in Telugu', te(await at(() => document.querySelector('#drawer .scgrid p').textContent)));
  check('its headings stay English', !te(await at(() => [...document.querySelectorAll('#drawer .sect h4')].map(x => x.textContent).join(''))));
  check('details values in Telugu', te(await at(() => [...document.querySelectorAll('#drawer .kv dd')].map(d => d.textContent).join(''))));
  check('details labels in English', !te(await at(() => [...document.querySelectorAll('#drawer .kv dt')].map(d => d.textContent).join(''))));
  await at(() => closeDrawer());

  await at(() => setLang('en'));
  await page.waitForTimeout(200);
  check('back to English', (await at(() => document.querySelector('#board .card .ttl').textContent)) === enTitle);
  check('the choice is remembered', (await at(() => localStorage.getItem('sceneboard.lang'))) === 'en');

  check('no page errors', page.errors.length === 0, page.errors);
  await page.close();
};
