/* Shoots ANY opening at desk and phone width at the top, half way and the end of its first scroll track, checks that
   scrolling back lands on the same frame, that reduced motion gives a still, and that every link answers. Written
   1 Nov 2026 to judge ChatGPT's returned opening with the same eyes as ours.
   node scripts/shoot-opening.mjs <url> <outdir> [trackSelector] [stickySelector] */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [url, out, trackSel = '.opening', stickySel = '.stage'] = process.argv.slice(2);
if (!url || !out) { console.error('usage: shoot-opening.mjs <url> <outdir> [track] [sticky]'); process.exit(2); }
mkdirSync(out, { recursive: true });
const views = { desk: { width: 1440, height: 900 }, phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } };
const browser = await chromium.launch({ channel: 'chromium' });
const findings = [];
for (const [name, vp] of Object.entries(views)) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const geo = await page.evaluate(([t, s]) => {
    const track = document.querySelector(t), sticky = document.querySelector(s);
    const top = track.getBoundingClientRect().top + scrollY;
    return { top, travel: Math.max(1, track.offsetHeight - sticky.offsetHeight) };
  }, [trackSel, stickySel]);
  const state = () => page.evaluate(() => {
    const ring = document.querySelector('.ring, #turn');
    const canvas = document.querySelector('canvas');
    const h = [...document.querySelectorAll('h1, h2')].find(e => e.offsetParent !== null && !e.hidden && getComputedStyle(e).display !== 'none');
    const r = ring ? ring.getBoundingClientRect() : null, hb = h ? h.getBoundingClientRect() : null;
    const overlap = r && hb ? Math.max(0, Math.min(r.right, hb.right) - Math.max(r.left, hb.left)) * Math.max(0, Math.min(r.bottom, hb.bottom) - Math.max(r.top, hb.top)) : 0;
    return { ring: r && { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width) }, head: h ? h.textContent.trim().replace(/\s+/g, ' ') : null, headL: hb && Math.round(hb.left), overlap: Math.round(overlap), canvasReady: canvas ? canvas.classList.contains('ready') : null, scrollW: document.documentElement.scrollWidth, innerW: innerWidth };
  });
  const shots = {};
  for (const [label, p] of [['top', 0], ['half', 0.5], ['end', 1]]) {
    await page.evaluate(([y]) => scrollTo({ top: y, behavior: 'instant' }), [geo.top + geo.travel * p]);
    await page.waitForTimeout(700);
    shots[label] = await state();
    await page.screenshot({ path: join(out, `${name}-${label}.png`) });
  }
  const endFrame = await page.evaluate(() => document.querySelector('canvas')?.toDataURL().length);
  await page.evaluate(([y]) => scrollTo({ top: y, behavior: 'instant' }), [geo.top + geo.travel * 0.5]);
  await page.waitForTimeout(500);
  const halfFrame = await page.evaluate(() => document.querySelector('canvas')?.toDataURL().length);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);
  const back = await state();
  const topFrame = await page.evaluate(() => document.querySelector('canvas')?.toDataURL().length);
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim().replace(/\s+/g, ' ') })));
  const linkChecks = [];
  for (const l of links) {
    if (l.href.startsWith('#')) linkChecks.push({ ...l, ok: l.href === '#' ? false : !!(await page.$(l.href)) });
    else if (l.href.startsWith('https://wa.me/94767412531')) linkChecks.push({ ...l, ok: true });
    else linkChecks.push({ ...l, ok: false });
  }
  findings.push({ name, geo, shots, back, frames: { top: topFrame, half: halfFrame, end: endFrame }, errors, links: linkChecks });
  /* reduced motion: a still */
  const ctx2 = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce', isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  const p2 = await ctx2.newPage(); await p2.goto(url, { waitUntil: 'networkidle' }); await p2.waitForTimeout(800);
  await p2.screenshot({ path: join(out, `${name}-reduced.png`) });
  findings[findings.length - 1].reduced = await p2.evaluate(() => ({ posterVisible: getComputedStyle(document.querySelector('#poster, .still[aria-current="true"] img, img') || document.body).visibility, trackH: document.querySelector('.opening, #hero-track')?.offsetHeight }));
  await ctx2.close(); await ctx.close();
}
await browser.close();
console.log(JSON.stringify(findings, null, 1));
