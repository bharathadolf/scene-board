/* Runs every test suite in this folder. Exits non-zero if anything failed.
   Run: npm test   (or: node tests/run.js board) */
const { chromium, collector, closeServer } = require('./harness');

const SUITES = ['language', 'board', 'shots', 'approval', 'mobile', 'ae'];
const only = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const reports = [];
  for (const name of SUITES) {
    if (only.length && !only.includes(name)) continue;
    const check = collector(name);
    const suite = require('./' + name + '.test.js');
    try {
      await suite({ browser, check });
    } catch (e) {
      check('suite crashed', false, e.message);
    }
    const r = check.report();
    reports.push(r);
    console.log(`${r.name.padEnd(9)} ${String(r.passed).padStart(3)} passed  ${r.failed.length} failed`);
    r.failed.forEach(f => console.log('   ✗ ' + f));
  }
  await browser.close();
  closeServer();
  const bad = reports.reduce((n, r) => n + r.failed.length, 0);
  const good = reports.reduce((n, r) => n + r.passed, 0);
  console.log(`\n${good} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
