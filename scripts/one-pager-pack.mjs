// Packs the built one pager into a folder that opens with a double click.
// Run AFTER `npm run build`:  node scripts/one-pager-pack.mjs [out folder]
// 1. Takes the shared site stylesheet out of dist/one-pager.html. The build links that one bundle on every page
//    (cssCodeSplit is off); the one pager carries its own inline styles and must not inherit the home page's.
// 2. Copies the page, its two fonts and the hero picture to the out folder.
// 3. Links the out folder's products folder to ~/Downloads/HOUSE-OF-PRIYANTHA-HERO/products, where the product
//    pictures are saved, so a new picture shows on the next refresh.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const out = path.resolve(process.argv[2] || path.join(os.homedir(), 'Downloads/HOUSE-OF-PRIYANTHA-ONE-PAGER'));
const drop = path.join(os.homedir(), 'Downloads/HOUSE-OF-PRIYANTHA-HERO/products');
const page = path.join(dist, 'one-pager.html');

let html = fs.readFileSync(page, 'utf8');
const before = html.length;
html = html.replace(/<link rel="stylesheet"[^>]*>/g, '');
fs.writeFileSync(page, html);
if (/rel="stylesheet"/.test(html)) { console.error('FAIL: a stylesheet link is still in the page'); process.exit(1); }
if (/(src|href)="\/(?!\/)/.test(html)) { console.error('FAIL: the page holds a path that starts at the site root, it will not open from a folder'); process.exit(1); }

fs.mkdirSync(path.join(out, 'assets/fonts'), { recursive: true });
fs.mkdirSync(path.join(out, 'assets/one-pager'), { recursive: true });
fs.mkdirSync(drop, { recursive: true });
fs.writeFileSync(path.join(out, 'House of Priyantha one pager.html'), html);
for (const f of ['assets/fonts/cormorant.woff2', 'assets/fonts/instrument.woff2', 'assets/one-pager/hero-start.webp']) fs.copyFileSync(path.join(dist, f), path.join(out, f));
const link = path.join(out, 'assets/one-pager/products');
try { fs.rmSync(link, { recursive: true, force: true }); } catch {}
fs.symlinkSync(drop, link);
const pics = fs.readdirSync(drop).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
console.log(`packed to ${out}: page ${html.length} bytes (${before - html.length} bytes of shared stylesheet link removed), product pictures found: ${pics.length}${pics.length ? ' (' + pics.join(', ') + ')' : ''}`);
