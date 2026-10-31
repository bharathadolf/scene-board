/* Serves dist/ so the built page can be opened over http rather than file://
   (browser storage is restricted on file:// in some browsers).
   Run: npm run serve  →  http://localhost:8080 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(DIR, name === '/' ? 'scene_board.html' : name);
  if (!file.startsWith(DIR)) { res.writeHead(403).end('no'); return; }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  });
}).listen(PORT, () => console.log('scene board on http://localhost:' + PORT));
