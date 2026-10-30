#!/usr/bin/env node
/* LIVE PROOF. Opens the deployed address in a real browser at phone and desk, checks the page ran, the records are
   on the table, every request answered, no console errors, the robots tag still says noindex, and writes
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
  const photos = await page.evaluate(() => [...document.images].filter(i => !i.hidden && i.closest('.stone, .hero')).every(i => i.complete && i.naturalWidth > 0));
  check(photos, `${name}: every photograph on the page loaded`);
  check(await page.getAttribute('meta[name="robots"]', 'content') === 'noindex,nofollow', `${name}: robots says noindex,nofollow`);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  check(bad.length === 0, `${name}: every request answered (${bad.length} failed${bad.length ? ': ' + bad.join(', ') : ''})`);
  check(errors.length === 0, `${name}: no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await page.screenshot({ path: `evidence/live-${name}-hero.png` });
  await page.screenshot({ path: `evidence/live-${name}-full.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(`\nLIVE ${URL_}\n${pass} of ${pass + fail} passed`);
process.exit(fail ? 1 : 0);
