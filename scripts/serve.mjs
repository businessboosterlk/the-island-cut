#!/usr/bin/env node
/* A SMALL SERVER THAT BEHAVES LIKE GITHUB PAGES: dist/ under /the-island-cut/, a missing page answers 404.
     node scripts/serve.mjs [port]     default 4611 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
export const BASE = '/the-island-cut';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
export function serve(port = 4611) {
  const server = createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/' || u.pathname === BASE) { res.writeHead(302, { Location: BASE + '/' }); return res.end(); }
    if (!u.pathname.startsWith(BASE + '/')) { res.writeHead(404); return res.end('not found'); }
    let rel = normalize(decodeURIComponent(u.pathname.slice(BASE.length))).replace(/^(\.\.[/\\])+/, '');
    if (rel.endsWith('/')) rel += 'index.html';
    let file = join(ROOT, rel), code = 200;
    try { const s = await stat(file); if (s.isDirectory()) file = join(file, 'index.html'); await stat(file); } catch { file = join(ROOT, '404.html'); code = 404; }
    try { const body = await readFile(file); res.writeHead(code, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' }); res.end(body); }
    catch { res.writeHead(500); res.end('error'); }
  });
  return new Promise(ok => server.listen(port, '127.0.0.1', () => ok(server)));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { const port = +(process.argv[2] || 4611); await serve(port); console.log(`serving dist at http://localhost:${port}${BASE}/`); }
