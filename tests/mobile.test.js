/* The mobile layout, and the switch between the two layouts. */
const { openPage, boards } = require('./harness');

module.exports = async ({ browser, check }) => {
  const seed = boards(['b1', 'b5']);

  // ---------- on a phone ----------
  const phone = await openPage(browser, { seed, context: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } });
  const at = phone.at;

  check('phone gets the mobile layout', (await at(() => document.body.dataset.view)) === 'mobile', await at(() => document.body.dataset.view));
  check('bin and board are tabbed', (await at(() => getComputedStyle(document.querySelector('.tabs')).display)) === 'flex');
  check('nothing scrolls sideways', await at(() => document.documentElement.scrollWidth <= innerWidth + 1),
    await at(() => [document.documentElement.scrollWidth, innerWidth]));
  check('one pane at a time', (await at(() => getComputedStyle(document.getElementById('pane-board')).display)) === 'none');

  await at(() => document.getElementById('tab-board').click());
  await phone.waitForTimeout(300);
  check('board pane appears', (await at(() => getComputedStyle(document.getElementById('pane-board')).display)) !== 'none');
  check('sequences are full width', await at(() => document.querySelector('.col').getBoundingClientRect().width > innerWidth * 0.8));
  check('sequences stack', await at(() => { const c = document.querySelectorAll('.col'); return c[1].getBoundingClientRect().top > c[0].getBoundingClientRect().top; }));
  check('cards carry a ⋯ button', (await at(() => getComputedStyle(document.querySelector('.card .more')).display)) !== 'none');
  check('⋯ is a real touch target', (await at(() => document.querySelector('.card .more').getBoundingClientRect().height)) >= 32);
  check('sequences fold', (await at(() => getComputedStyle(document.querySelector('.fold')).display)) !== 'none');
  check('the drag handle is gone', (await at(() => getComputedStyle(document.querySelector('.grip')).display)) === 'none');
  check('the hint matches the layout', /Tap/.test(await at(() => document.querySelector('[data-i="dragHint"]').textContent)),
    await at(() => document.querySelector('[data-i="dragHint"]').textContent));

  await at(() => document.querySelector('.fold').click());
  await phone.waitForTimeout(250);
  check('folded away', (await at(() => getComputedStyle(document.querySelector('.col .cards')).display)) === 'none');
  await at(() => document.querySelector('.fold').click());
  await phone.waitForTimeout(250);
  check('folds back open', (await at(() => getComputedStyle(document.querySelector('.col .cards')).display)) !== 'none');

  await at(() => document.querySelector('.card .more').click());
  await phone.waitForTimeout(200);
  check('⋯ opens the menu', !(await at(() => document.getElementById('ctx').hidden)));
  check('menu fits the screen', await at(() => { const r = document.getElementById('ctx').getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1; }),
    await at(() => JSON.stringify(document.getElementById('ctx').getBoundingClientRect())));
  await at(() => document.querySelector('#ctx [data-cx="open"]').click());
  await phone.waitForTimeout(250);
  check('the scene fills the screen', (await at(() => document.getElementById('drawer').getBoundingClientRect().width)) >= 388);
  check('the scene panel scrolls', (await at(() => getComputedStyle(document.getElementById('drawer')).overflowY)) === 'auto');
  check('text is not shrunk', (await at(() => parseFloat(getComputedStyle(document.querySelector('#drawer p')).fontSize))) >= 14);
  await at(() => closeDrawer());

  await at(() => document.querySelector('[data-seq]').click());
  await phone.waitForTimeout(200);
  check('✎ opens the sequence menu', !(await at(() => document.getElementById('ctx').hidden)) &&
    (await at(() => [...document.querySelectorAll('#ctx button')].map(b => b.dataset.cx).join(','))).includes('after'));
  check('that menu fits too', await at(() => { const r = document.getElementById('ctx').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; }));
  await at(() => hideCtx());

  await at(() => document.getElementById('btn-read').click());
  await phone.waitForTimeout(350);
  check('read-through fits the phone', await at(() => document.getElementById('read').scrollWidth <= innerWidth + 1));
  check('read-through is complete', (await at(() => document.querySelectorAll('#read .rsc').length)) > 100);
  await at(() => closeRead());

  await at(() => document.querySelector('#viewseg [data-view="desktop"]').click());
  await phone.waitForTimeout(300);
  check('can force the desktop layout', (await at(() => document.body.dataset.view)) === 'desktop');
  check('the choice is stored', (await at(() => localStorage.getItem('sceneboard.view'))) === 'desktop');
  await phone.reload();
  await phone.waitForTimeout(800);
  check('the choice survives a reload', (await at(() => document.body.dataset.view)) === 'desktop', await at(() => document.body.dataset.view));
  check('no page errors on the phone', phone.errors.length === 0, phone.errors);
  await phone.close();

  // ---------- on a desktop ----------
  const desk = await openPage(browser, { seed });
  const d = desk.at;
  check('wide screen gets the desktop layout', (await d(() => document.body.dataset.view)) === 'desktop');
  check('both panes side by side', (await d(() => getComputedStyle(document.getElementById('pane-board')).display)) !== 'none');
  check('sequences run across', await d(() => { const c = document.querySelectorAll('.col'); return c[1].getBoundingClientRect().left > c[0].getBoundingClientRect().left + 100; }));
  check('no ⋯ on the cards', (await d(() => getComputedStyle(document.querySelector('.card .more')).display)) === 'none');
  check('no fold buttons', (await d(() => getComputedStyle(document.querySelector('.fold')).display)) === 'none');
  check('no bin/board tabs', (await d(() => getComputedStyle(document.querySelector('.tabs')).display)) === 'none');
  check('✎ opens the sequence panel', await d(() => { document.querySelector('[data-seq]').click(); return !document.getElementById('drawer').hidden; }));
  await d(() => closeDrawer());

  await d(() => document.querySelector('#viewseg [data-view="mobile"]').click());
  await desk.waitForTimeout(300);
  check('can preview the mobile layout', (await d(() => document.body.dataset.view)) === 'mobile' &&
    (await d(() => getComputedStyle(document.querySelector('.card .more')).display)) !== 'none');
  check('the board is unchanged by switching', (await d(() => document.getElementById('s-placed').textContent)).endsWith('/115'));
  await d(() => document.querySelector('#viewseg [data-view="desktop"]').click());
  await desk.waitForTimeout(300);
  check('and back again', (await d(() => document.body.dataset.view)) === 'desktop');
  check('no page errors on the desktop', desk.errors.length === 0, desk.errors);
  await desk.close();
};
