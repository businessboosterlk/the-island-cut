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
    while (ic.loaded < ic.frames && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 100));
    /* 1 Nov pm (ChatGPT's layout, taken whole): the scroll picks the frame and the chapter, nothing plays on load. At the top
       frame 0 and the first chapter; half way about frame 30, the second chapter, the ring carried across (wave near 1);
       back at the top frame 0 and the first chapter again. */
    /* half way means p = 0.5 in the page's own progress(): the scene is sticky under the nav, so the travel starts when the
       track's top reaches the scene's sticky top, not the page's top (the live gate read 0.57 as half way on 1 Nov pm). */
    const track = document.getElementById('hero-track'); const sticky = parseFloat(getComputedStyle(track.firstElementChild).top) || 0;
    const top = track.getBoundingClientRect().top + scrollY - sticky;
    const travel = track.offsetHeight - track.firstElementChild.offsetHeight;
    await new Promise(r => setTimeout(r, 400)); const start = ic.stage, startFrame = ic.frame;
    scrollTo({ top: top + travel * 0.5, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
    const mid = ic.stage, midFrame = ic.frame, wave = Math.round(ic.wave * 100) / 100, number = document.getElementById('chapter-number').textContent;
    scrollTo({ top: 0, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
    return { loaded: ic.loaded, frames: ic.frames, stages: ic.stages, reduced: ic.reduced, start, startFrame, mid, midFrame, wave, number, back: ic.stage, backFrame: ic.frame };
  });
  check(hero.loaded === hero.frames && hero.frames === 60 && hero.stages === 3, `${name}: hero frames loaded ${hero.loaded} of ${hero.frames}, ${hero.stages} chapters`);
  check(hero.start === 0 && hero.mid === 1 && hero.number === '02' && hero.back === 0 && (hero.reduced || (hero.startFrame === 0 && hero.midFrame >= 28 && hero.midFrame <= 32 && hero.wave > 0.95 && hero.backFrame === 0)), `${name}: the scroll turns the ring and changes the chapter (chapter ${hero.start}, frame ${hero.startFrame} at the top; chapter ${hero.mid} "${hero.number}", frame ${hero.midFrame}, wave ${hero.wave} half way; chapter ${hero.back}, frame ${hero.backFrame} back at the top)`);
  const ex = await page.evaluate(async () => {
    const C = window.IslandCut.customise, track = document.getElementById('apart-track'), stage = document.getElementById('apart'); const top = track.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(stage).top);
    scrollTo({ top: top + track.offsetHeight - stage.offsetHeight + 20, behavior: 'instant' }); const t0 = Date.now();
    while (C.loaded < C.frames && !C.failed && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 200));
    await new Promise(r => setTimeout(r, 700));
    const labels = () => document.querySelectorAll('#apart-labels li[data-on="true"]').length;
    const settled = { frame: C.frame, settled: stage.dataset.settled, labels: labels() };
    scrollTo({ top, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
    return { loaded: C.loaded, frames: C.frames, reduced: C.reduced, settled, back: { frame: C.frame, settled: stage.dataset.settled, labels: labels() } };
  });
  check(ex.loaded === ex.frames && ex.frames === 60, `${name}: customise frames loaded ${ex.loaded} of ${ex.frames}`);
  check(ex.settled.settled === 'true' && ex.settled.labels === 3 && ex.back.settled === 'false' && ex.back.labels === 0 && (ex.reduced || (ex.settled.frame === 59 && ex.back.frame === 0)), `${name}: the ring comes apart on scroll (frame ${ex.settled.frame}, ${ex.settled.labels} labels) and goes back (frame ${ex.back.frame}, ${ex.back.labels} labels)`);
  const box = await page.evaluate(async () => {
    document.getElementById('box').scrollIntoView({ block: 'center', behavior: 'instant' }); const t0 = Date.now();
    const loop = document.getElementById('box-loop');
    while ((loop.paused || loop.readyState < 2) && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 100));
    const a = loop.currentTime; await new Promise(r => setTimeout(r, 600)); return { playing: !loop.paused, moved: loop.currentTime - a, ready: loop.readyState };
  });
  check(box.playing && box.moved > 0.2, `${name}: the ring box loop plays on the live address (moved ${box.moved.toFixed(2)}s)`);
  const bld = await page.evaluate(() => { document.getElementById('bespoke-build').click(); const d = document.getElementById('builder'); const open = d.open; d.close(); return open; });
  check(bld, `${name}: the builder sheet opens from Build your ring`);
  const req = await page.evaluate(() => { document.getElementById('customise-begin').click(); const d = document.getElementById('request'); const open = d.open; d.close(); return open; });
  check(req, `${name}: the request sheet opens from Begin your ring`);
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
