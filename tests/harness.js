/* Shared test harness.
   Opens dist/scene_board.html in headless Chromium with the claude.ai runtime
   stubbed: an in-memory database that behaves like the `db` capability, and a
   `sample` stub that returns whatever JSON the test puts in window.__reply.
   The network is blocked, so the page runs with no fonts and no Sortable —
   which is why drag and drop is the one thing these tests cannot cover. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'dist', 'scene_board.html');

function boards(ids) {
  const out = {};
  ids.forEach(id => { out[id] = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'boards', id + '.json'), 'utf8')); });
  return out;
}

/* Runs inside the page before anything else. */
function stubs({ seed }) {
  window.Sortable = function () { return { destroy() {} }; };
  window.Sortable.create = () => ({ destroy() {} });
  const store = { boards: JSON.parse(JSON.stringify(seed)), scenes: {} };
  const subs = { boards: [], scenes: [] };
  const fire = c => subs[c].forEach(f => f({ docs: Object.keys(store[c]).map(id => ({ id, data: () => store[c][id] })) }));
  const coll = n => ({
    doc: id => ({
      set: async d => { store[n][id] = JSON.parse(JSON.stringify(d)); setTimeout(() => fire(n), 0); },
      delete: async () => { delete store[n][id]; window.__deleted = (window.__deleted || []); window.__deleted.push(n + '/' + id); setTimeout(() => fire(n), 0); },
    }),
    onSnapshot: f => { subs[n].push(f); setTimeout(() => fire(n), 0); return () => {}; },
  });
  window.__store = store;
  window.__calls = [];
  window.claude = {
    use: async n => {
      if (n === 'db') return { collection: coll, doc: () => ({ onSnapshot: f => { setTimeout(() => f({ exists: false, data: () => ({}) }), 0); return () => {}; }, set: async () => {} }) };
      if (n === 'sample') { const s = async () => ({ text: '' }); s.json = async q => { window.__calls.push(q); return JSON.parse(window.__reply); }; return s; }
      return null;
    },
  };
}

async function openPage(browser, opts = {}) {
  const page = await browser.newPage(Object.assign({ viewport: { width: 1400, height: 900 } }, opts.context || {}));
  const errors = [];
  page.on('pageerror', e => errors.push('page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_BLOCKED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(stubs, { seed: opts.seed || boards(['b1']) });
  await page.route('**/*', r => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  await page.goto(PAGE);
  await page.waitForTimeout(900);
  page.errors = errors;
  page.at = (fn, arg) => page.evaluate(fn, arg);
  return page;
}

function collector(name) {
  const passed = [], failed = [];
  const check = (what, condition, detail) => {
    if (condition) passed.push(what);
    else failed.push(what + (detail === undefined ? '' : '  <<< ' + JSON.stringify(detail)));
  };
  check.report = () => ({ name, passed: passed.length, failed });
  return check;
}

module.exports = { chromium, ROOT, PAGE, boards, openPage, collector };
