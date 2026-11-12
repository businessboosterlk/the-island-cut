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
import sharp from 'sharp';

// The site's ring frames turn the stone pink and then a warm brown. This page is blue only (bb_pending 1843 is
// still open), so every frame is written to the out folder with the stone's warm and pink colours moved to the
// blue of the first frame. Measured on the frames: the gold sits at hue 27 to 45, the warm stone at 0 to 24, the
// pink stone at 300 to 360 and the blue stone at 210 to 240. The site's own files are not touched.
const BLUE = 222;
const hue2rgb = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
async function blueFrame(from, to) {
  const { data, info } = await sharp(from).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < .02) continue;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
    const w = h <= 20 || h >= 262 ? 1 : h < 27 ? (27 - h) / 7 : h > 245 ? (h - 245) / 17 : 0;
    if (!w) continue;
    const l = (mx + mn) / 2, sat = d / (1 - Math.abs(2 * l - 1)), q = l < .5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q, t = BLUE / 360;
    const n = [hue2rgb(p, q, t + 1 / 3), hue2rgb(p, q, t), hue2rgb(p, q, t - 1 / 3)];
    data[i] = Math.round((r + (n[0] - r) * w) * 255); data[i + 1] = Math.round((g + (n[1] - g) * w) * 255); data[i + 2] = Math.round((b + (n[2] - b) * w) * 255);
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 86, alphaQuality: 100 }).toFile(to);
}

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
// The ring's frames (the site's own ring journey pictures, stone kept blue), both sizes: 560 for a phone, 1200 for a desk.
let frames = 0;
for (const [dir, re] of [['assets/motion/hero-ring', /^ring-(560|1200)-\d{3}\.webp$/], ['assets/motion/journey', /^apart-(560|1200)-\d{3}\.webp$/]]) {
  fs.mkdirSync(path.join(out, dir), { recursive: true });
  for (const f of fs.readdirSync(path.join(dist, dir)).filter(f => re.test(f))) { await blueFrame(path.join(dist, dir, f), path.join(out, dir, f)); frames++; }
}
if (frames !== 184) { console.error(`FAIL: ${frames} ring frames copied, 184 expected`); process.exit(1); }
const link = path.join(out, 'assets/one-pager/products');
try { fs.rmSync(link, { recursive: true, force: true }); } catch {}
fs.symlinkSync(drop, link);
const pics = fs.readdirSync(drop).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
console.log(`packed to ${out}: page ${html.length} bytes (${before - html.length} bytes of shared stylesheet link removed), ring frames: ${frames}, pictures found in the drop folder: ${pics.length}${pics.length ? ' (' + pics.join(', ') + ')' : ''}`);
