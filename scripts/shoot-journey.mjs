/* Stills of the six stop journey at the desk and on the phone, one per stop, into a folder.
   node scripts/shoot-journey.mjs http://localhost:4616/the-island-cut/ ~/Downloads/THE-ISLAND-CUT/JOURNEY
   Runs alone: never beside another Playwright gate. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
const url = process.argv[2], out = process.argv[3];
if (!url || !out) { console.error('usage: node scripts/shoot-journey.mjs <url> <folder>'); process.exit(2); }
mkdirSync(out, { recursive: true });
const VIEWS = [{ name: 'desk', w: 1440, h: 900 }, { name: 'phone', w: 402, h: 874, mobile: true }];
const STOPS = [{ n: 1, p: 0 }, { n: 2, p: 0.25 }, { n: 3, p: 0.49 }, { n: 4, p: 0.66 }, { n: 5, p: 0.78 }, { n: 6, p: 1 }];
const browser = await chromium.launch({ channel: 'chromium' });
const rows = [];
for (const v of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 2, isMobile: !!v.mobile, hasTouch: !!v.mobile });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { const ic = window.IslandCut.hero, t0 = Date.now(); while ((ic.loaded < ic.frames || (!ic.apart.failed && ic.apart.loaded < ic.apart.frames)) && Date.now() - t0 < 40000) await new Promise(r => setTimeout(r, 100)); });
  const travel = await page.evaluate(() => document.getElementById('hero-track').offsetHeight - document.getElementById('hero-stage').offsetHeight);
  for (const s of STOPS) {
    const y = s.p >= 1 ? travel + 60 : Math.round(travel * s.p);
    const r = await page.evaluate(async y => { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 800)); const ic = window.IslandCut.hero; return { stop: ic.stop, frame: ic.frame, apart: ic.apart.frame, drop: Math.round(ic.drop * 100) / 100, labels: document.querySelectorAll('#apart-labels li[data-on="true"]').length }; }, y);
    const file = join(out, `${v.name}-stop${s.n}.png`);
    await page.screenshot({ path: file });
    rows.push({ view: v.name, stop: s.n, y, ...r, file });
  }
  await ctx.close();
}
await browser.close();
for (const r of rows) console.log(`${r.view} stop ${r.stop}: y ${r.y}, hero frame ${r.frame}, apart frame ${r.apart}, drop ${r.drop}, labels ${r.labels}  ${r.file}`);
