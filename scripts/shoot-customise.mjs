/* Shoots the Customise section ("Every part. Your choice.") at desk and phone width at the top of its track, half way and
   settled, once the sixty frames have loaded and the labels have risen, so the stills show what a visitor sees and not a
   poster or a label mid-rise. Written 1 Nov 2026 pm for the hand-over stills in ~/Downloads/THE-ISLAND-CUT/CUSTOMISE.
   node scripts/shoot-customise.mjs <url> <outdir> */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [url, out] = process.argv.slice(2);
if (!url || !out) { console.error('usage: shoot-customise.mjs <url> <outdir>'); process.exit(2); }
mkdirSync(out, { recursive: true });
const views = { desk: { width: 1440, height: 900 }, phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } };
const browser = await chromium.launch({ channel: 'chromium' });
const report = [];
for (const [name, vp] of Object.entries(views)) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.IslandCut && window.IslandCut.ready);
  const geo = await page.evaluate(() => { const t = document.getElementById('apart-track'), s = document.getElementById('apart'); return { top: t.getBoundingClientRect().top + scrollY, travel: t.offsetHeight - s.offsetHeight }; });
  await page.evaluate(([y]) => scrollTo({ top: y, behavior: 'instant' }), [geo.top]);
  await page.waitForFunction(() => { const C = window.IslandCut.customise; return C.loaded === C.frames || C.failed; }, null, { timeout: 60000 });
  const shots = {};
  for (const [label, p, wait] of [['top', 0, 400], ['half', 0.5, 400], ['settled', 1, 1200]]) {
    await page.evaluate(([y]) => scrollTo({ top: y, behavior: 'instant' }), [geo.top + geo.travel * p]);
    await page.waitForTimeout(wait);
    shots[label] = await page.evaluate(() => { const C = window.IslandCut.customise; return { frame: C.frame, labels: C.labels, settled: document.getElementById('apart').dataset.settled }; });
    await page.screenshot({ path: join(out, `${name}-${label}.png`) });
  }
  report.push({ name, geo, shots });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report));
