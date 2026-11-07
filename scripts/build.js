/* Builds dist/scene_board.html: one self-contained page.
   src/shell.html (markup + CSS, ending at <script>) + src/app.js with its
   data placeholders filled in, then </script>.
   Run: npm run build */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8').trim();
const json = (...p) => JSON.parse(read(...p));

const scenes = read('data', 'scenes.json');
const boards = {};
fs.readdirSync(path.join(ROOT, 'data', 'boards')).sort().forEach(f => {
  if (f.endsWith('.json')) boards[path.basename(f, '.json')] = json('data', 'boards', f);
});
const sources = read('data', 'sources.json');
const ui = JSON.stringify({ en: json('src', 'ui.json').en });
const te = JSON.stringify({
  sc: json('data', 'te', 'scenes.json'),
  terms: json('data', 'te', 'terms.json'),
  seq: json('data', 'te', 'sequences.json'),
});

let app = read('src', 'app.js')
  .replace('__DATA__', () => scenes)
  .replace('__TE__', () => te)
  .replace('__UI__', () => ui)
  .replace('__SRC__', () => sources)
  .replace('__BOARDS__', () => JSON.stringify(boards));

const left = app.match(/__[A-Z]+__/g);
if (left) {
  console.error('unfilled placeholders:', left);
  process.exit(1);
}

try {
  new Function(app); // syntax check before anything is written
} catch (e) {
  console.error('SYNTAX ERROR in the built script:', e.message);
  process.exit(1);
}

const html = read('src', 'shell.html') + '\n' + app + '\n</script>\n';
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'scene_board.html'), html);

const kb = (html.length / 1024).toFixed(0);
console.log(`built dist/scene_board.html — ${kb} KB, ${json('data', 'scenes.json').length} scenes, ${Object.keys(boards).length} boards`);
