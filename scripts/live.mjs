#!/usr/bin/env node
/* LIVE PROOF. Opens the deployed address in a real browser at phone and desk, checks the page ran, the records are
   on the table, the hero arrives on the scroll and swaps, the ring comes apart, the box plays, the builder opens, every request answered, no console errors, the robots tag still says noindex, and writes
   evidence/live-*.png.
     node scripts/live.mjs [url]     default https://businessboosterlk.github.io/the-island-cut/ */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
const URL_ = process.argv[2] || 'https://businessboosterlk.github.io/the-island-cut/';
const N = JSON.parse(readFileSync('src/data/stones.json', 'utf8')).stones.length;
const browser = await chromium.launch({ channel: 'chromium' });
mkdirSync('evidence', { recursive: true });
let pass = 0, fail = 0;
const check = (ok, what) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); };
for (const [name, w, h, touch] of [['phone', 390, 844, true], ['desk', 1440, 900, false]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: touch, hasTouch: touch });
  const page = await ctx.newPage();
  const errors = [], bad = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  const res = await page.goto(URL_, { waitUntil: 'load' });
  check(res.status() === 200, `${name}: page answers 200`);
  await page.evaluate(() => document.fonts.ready);
  const ready = await page.waitForFunction(() => window.IslandCut && window.IslandCut.ready, null, { timeout: 15000 }).then(() => true).catch(() => false);
  check(ready, `${name}: the page script ran to the end`);
  const cards = await page.evaluate(() => document.querySelectorAll('.stone').length);
  check(cards === N, `${name}: ${cards} of ${N} records on the table`);
  /* the table's photographs are lazy, so walk the page first or the check judges them unloaded below the fold */
  await page.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
  await page.waitForFunction(() => [...document.images].filter(i => !i.hidden && i.closest('.stone, .hero')).every(i => i.complete), null, { timeout: 15000 }).catch(() => {});
  const photos = await page.evaluate(() => [...document.images].filter(i => !i.hidden && i.closest('.stone, .hero')).every(i => i.complete && i.naturalWidth > 0));
  check(photos, `${name}: every photograph on the page loaded`);
  check(await page.getAttribute('meta[name="robots"]', 'content') === 'noindex,nofollow', `${name}: robots says noindex,nofollow`);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  /* phase 2: the motion ran on the live address, not only on the laptop */
  const hero = await page.evaluate(async () => {
    const ic = window.IslandCut.hero; const t0 = Date.now();
    while (ic.loaded < ic.stages && Date.now() - t0 < 20000) await new Promise(r => setTimeout(r, 100));
    /* 1 Nov pm: the arrival is read from the scroll, nothing plays on load. At the top the ring waits in its
       arrival pose (entered false); a third of the way down it has settled (entered true); half way the second
       still shows; back at the top it waits again. */
    const track = document.getElementById('hero-track'); const top = track.getBoundingClientRect().top + scrollY;
    const travel = track.offsetHeight - track.firstElementChild.offsetHeight;
    await new Promise(r => setTimeout(r, 400)); const atTop = ic.entered;
    scrollTo({ top: top + travel * 0.32, behavior: 'instant' }); await new Promise(r => setTimeout(r, 520));
    const arrived = ic.entered, arrival = ic.arrival;
    scrollTo({ top: top + travel * 0.55, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
    const mid = ic.stage; scrollTo({ top: 0, behavior: 'instant' }); await new Promise(r => setTimeout(r, 520));
    return { loaded: ic.loaded, stages: ic.stages, reduced: ic.reduced, atTop, arrived, arrival, back: ic.entered, mid, start: ic.stage };
  });
  check(hero.loaded === hero.stages && (hero.reduced || (!hero.atTop && hero.arrived && hero.arrival === 1 && !hero.back)), `${name}: hero stills loaded ${hero.loaded} of ${hero.stages}; the ring waits at the top, arrives on the scroll (a=${hero.arrival}) and waits again at the top`);
  check(hero.mid === 1 && hero.start === 0, `${name}: hero swaps with scroll (still ${hero.start} at the top, ${hero.mid} half way)`);
  const ex = await page.evaluate(async () => {
    const track = document.getElementById('explode-track'); const top = track.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + track.offsetHeight - track.firstElementChild.offsetHeight, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
    const apart = document.getElementById('explode').dataset.apart; const p = parseFloat(getComputedStyle(document.getElementById('explode')).getPropertyValue('--p'));
    scrollTo({ top, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
    return { apart, p, back: parseFloat(getComputedStyle(document.getElementById('explode')).getPropertyValue('--p')) };
  });
  check(ex.apart === 'true' && ex.p > 0.7 && ex.back < 0.15, `${name}: the ring comes apart on scroll (p ${ex.p.toFixed(2)}) and goes back (p ${ex.back.toFixed(2)})`);
  const box = await page.evaluate(async () => {
    document.getElementById('box').scrollIntoView({ block: 'center', behavior: 'instant' }); const t0 = Date.now();
    const loop = document.getElementById('box-loop');
    while ((loop.paused || loop.readyState < 2) && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 100));
    const a = loop.currentTime; await new Promise(r => setTimeout(r, 600)); return { playing: !loop.paused, moved: loop.currentTime - a, ready: loop.readyState };
  });
  check(box.playing && box.moved > 0.2, `${name}: the ring box loop plays on the live address (moved ${box.moved.toFixed(2)}s)`);
  const bld = await page.evaluate(() => { document.getElementById('customise-build').click(); const d = document.getElementById('builder'); const open = d.open; d.close(); return open; });
  check(bld, `${name}: the builder sheet opens from Create your piece`);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);
  check(bad.length === 0, `${name}: every request answered (${bad.length} failed${bad.length ? ': ' + bad.join(', ') : ''})`);
  check(errors.length === 0, `${name}: no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await page.screenshot({ path: `evidence/live-${name}-hero.png` });
  await page.screenshot({ path: `evidence/live-${name}-full.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(`\nLIVE ${URL_}\n${pass} of ${pass + fail} passed`);
process.exit(fail ? 1 : 0);
