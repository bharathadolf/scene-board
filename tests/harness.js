/* Shared test harness.
   Serves dist/ over http (so the browser gives the page a real origin and
   "/_blob/<id>" resolves), opens it in headless Chromium, and stubs the
   claude.ai runtime: an in-memory database, an asset store, and a `sample`
   that returns whatever JSON the test puts in window.__reply.
   The rest of the network is blocked, so Sortable never loads — which is why
   drag and drop is the one thing these tests cannot cover. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

let server = null, PAGE = '';
function serve() {
  if (server) return Promise.resolve(PAGE);
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      const name = req.url.split('?')[0];
      const file = path.join(ROOT, 'dist', name === '/' ? 'scene_board.html' : name);
      fs.readFile(file, (err, body) => {
        if (err) { res.writeHead(404).end('no'); return; }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(body);
      });
    }).listen(0, '127.0.0.1', () => {
      PAGE = 'http://127.0.0.1:' + server.address().port + '/scene_board.html';
      resolve(PAGE);
    });
  });
}
function closeServer() { if (server) { server.close(); server = null; } }

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
  window.__uploads = [];
  let assetN = 0;
  window.claude = {
    use: async n => {
      if (n === 'db') return { collection: coll, doc: () => ({ onSnapshot: f => { setTimeout(() => f({ exists: false, data: () => ({}) }), 0); return () => {}; }, set: async () => {} }) };
      if (n === 'sample') {
        const s = async () => ({ text: '' });
        s.json = async (q, o) => {
          window.__calls.push(q);
          window.__lastImages = (o && o.images && o.images.length) || 0;
          return JSON.parse(window.__reply);
        };
        return s;
      }
      if (n === 'assets' && !window.__noAssets) return {
        upload: async (blob, opt) => {
          const id = ('asset' + (++assetN)).padEnd(32, '0');
          window.__uploads.push({ id, type: (opt && opt.type) || blob.type, size: blob.size });
          return { id, url: '/_blob/' + id, sizeBytes: blob.size, contentType: (opt && opt.type) || blob.type };
        },
        list: async () => ({ assets: [], usage: {} }),
        delete: async id => { window.__uploads = window.__uploads.filter(u => u.id !== id); return { deleted: true }; },
      };
      if (n === 'downloads' && !window.__noDownloads) return {
        save: async ({ filename, data }) => {
          if (window.__declineSave) throw { code: 'declined', message: 'declined' };
          const buf = data instanceof Blob ? await data.arrayBuffer()
            : (typeof data === 'string' ? new TextEncoder().encode(data).buffer : data);
          const u8 = new Uint8Array(buf);
          let b64 = '';
          for (let i = 0; i < u8.length; i += 0x8000)
            b64 += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
          window.__saved = { filename, bytes: u8.length, b64: btoa(b64) };
          return { status: 'saved' };
        },
      };
      return null;
    },
  };
}

async function openPage(browser, opts = {}) {
  const page = await browser.newPage(Object.assign({ viewport: { width: 1400, height: 950 } }, opts.context || {}));
  const errors = [];
  page.on('pageerror', e => errors.push('page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_BLOCKED|404/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(stubs, { seed: opts.seed || boards(['b1']) });
  const url = await serve();
  const origin = url.replace('/scene_board.html', '');
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('/_blob/')) return r.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    if (u.startsWith(origin)) return r.continue();
    return r.abort();
  });
  await page.goto(url);
  await page.waitForTimeout(900);
  page.errors = errors;
  page.at = (fn, arg) => page.evaluate(fn, arg);
  page.reply = v => page.evaluate(x => { window.__reply = JSON.stringify(x); }, v);
  page.png = name => ({ name: name || 'img.png', mimeType: 'image/png', buffer: PNG });
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

module.exports = { chromium, ROOT, PNG, boards, openPage, collector, closeServer };
