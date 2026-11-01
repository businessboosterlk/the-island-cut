#!/usr/bin/env node
/* SCREENSHOTS AND THE SHARE CARD. Phone and desk: the fold, the whole page, each section, the tray open, the
   passport and the request, into evidence/. The 1200 by 630 share card goes to public/assets/og.png and into dist/.
     node scripts/shots.mjs */
import { chromium } from 'playwright';
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { serve, BASE as BP } from './serve.mjs';

const server = await serve(4614);
const BASE = `http://localhost:4614${BP}/`;
const browser = await chromium.launch({ channel: 'chromium' });
mkdirSync('evidence', { recursive: true }); mkdirSync('public/assets', { recursive: true });

async function open(w, h, touch, scale = 2) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, isMobile: touch, hasTouch: touch });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.IslandCut && window.IslandCut.ready, null, { timeout: 10000 });
  await page.evaluate(() => localStorage.removeItem('island-cut-tray'));
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
  return { ctx, page };
}

for (const [name, w, h, touch] of [['phone', 390, 844, true], ['desk', 1440, 900, false]]) {
  const { ctx, page } = await open(w, h, touch);
  await page.screenshot({ path: `evidence/${name}-hero.png` });
  await page.evaluate(() => { const tr = document.getElementById('hero-track'), st = document.getElementById('hero-stage'); window.scrollTo(0, Math.round((tr.offsetHeight - st.offsetHeight) * 0.5)); }); await page.waitForTimeout(500);
  await page.screenshot({ path: `evidence/${name}-hero-half.png` }); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
  await page.screenshot({ path: `evidence/${name}-full.png`, fullPage: true });
  for (const id of ['stones', 'viewing', 'bespoke', 'contact']) { await page.evaluate(i => document.getElementById(i).scrollIntoView(), id); await page.waitForTimeout(400); await page.screenshot({ path: `evidence/${name}-${id}.png` }); }
  await page.evaluate(() => { for (const r of ['IC-101', 'IC-104', 'IC-106']) document.querySelector(`[data-compare="${r}"]`).click(); document.getElementById('tray-open').click(); }); await page.waitForTimeout(500);
  await page.screenshot({ path: `evidence/${name}-tray.png` });
  await page.evaluate(() => { document.getElementById('tray-open').click(); document.querySelector('[data-passport="IC-101"]').click(); }); await page.waitForTimeout(500);
  await page.screenshot({ path: `evidence/${name}-passport.png` });
  await page.evaluate(() => { document.getElementById('passport').close(); document.getElementById('nav-book').click(); }); await page.waitForTimeout(500);
  await page.screenshot({ path: `evidence/${name}-request.png` });
  await page.evaluate(() => { document.getElementById('request').close(); document.getElementById('tray-clear').click(); });
  console.log(`wrote evidence/${name}-*.png`);
  await ctx.close();
}
{
  const { ctx, page } = await open(1200, 630, false, 1);
  await page.evaluate(() => { document.querySelector('.nav').style.visibility = 'hidden'; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'public/assets/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  if (existsSync('dist/assets')) copyFileSync('public/assets/og.png', 'dist/assets/og.png');
  console.log('wrote public/assets/og.png (and dist/assets/og.png)');
  await ctx.close();
}
await browser.close(); server.close();
