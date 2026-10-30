#!/usr/bin/env node
/* SCREENSHOTS AND THE SHARE CARD. Phone and desk, full page and hero, into evidence/. The 1200 by 630 share card
   goes to public/assets/og.png and into dist/ so the current build carries it too.
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
  await page.waitForFunction(() => window.IslandCut && window.IslandCut.stills >= 6, null, { timeout: 10000 }).catch(() => {});
  /* every reveal fires on scroll, so the page is walked before a full picture is taken */
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(80); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1600);
  return { ctx, page };
}

for (const [name, w, h, touch] of [['phone', 390, 844, true], ['desk', 1440, 900, false]]) {
  const { ctx, page } = await open(w, h, touch);
  await page.screenshot({ path: `evidence/${name}-hero.png` });
  await page.screenshot({ path: `evidence/${name}-full.png`, fullPage: true });
  for (const id of ['stones', 'set', 'buy', 'province']) { await page.evaluate(i => document.getElementById(i).scrollIntoView(), id); await page.waitForTimeout(900); await page.screenshot({ path: `evidence/${name}-${id}.png` }); }
  console.log(`wrote evidence/${name}-*.png`);
  await ctx.close();
}
{
  const { ctx, page } = await open(1200, 630, false, 1);
  await page.evaluate(() => { document.querySelector('.nav').style.visibility = 'hidden'; document.querySelector('.scroll-cue')?.remove(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'public/assets/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  if (existsSync('dist/assets')) copyFileSync('public/assets/og.png', 'dist/assets/og.png');
  console.log('wrote public/assets/og.png (and dist/assets/og.png)');
  await ctx.close();
}
await browser.close(); server.close();
