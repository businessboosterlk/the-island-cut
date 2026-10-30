#!/usr/bin/env node
/* THE CLICK PATH. Every touchpoint on the page is COUNTED by a recorder in the page, PRESSED in a real browser and
   its effect READ. A press that changes nothing a person can see is a FAIL. Then Back once and Back twice after
   following links on the page, a drag on each stone, and every door to WhatsApp read for its message.
     node scripts/click-path.mjs            phone and desk
     node scripts/click-path.mjs --quick    phone only
   Method: ~/.claude/skills/bb-click-path. Follows ~/bb-websites/sastho/scripts/click-path.mjs. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { serve, BASE as BP } from './serve.mjs';
import { SITE } from '../src/config.js';

const QUICK = process.argv.includes('--quick');
const R = [];
const ok = (name, pass, seen = '') => { R.push({ name, pass: !!pass }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (seen ? '   ' + String(seen).slice(0, 700) : '')); };
const stones = JSON.parse(readFileSync('src/data/stones.json', 'utf8')).stones;
const WA = 'wa.me/' + SITE.whatsapp;
const server = await serve(4613);
const BASE = `http://localhost:4613${BP}/`;
const browser = await chromium.launch({ channel: 'chromium' });

/* runs in the page before anything else: names every touchpoint, hears every real press */
const INSTALL = () => {
  const TOUCH = 'a[href],button,select,input:not([type=hidden])';
  const region = e => { for (const [sel, n] of [['.nav', 'nav'], ['.fab', 'float'], ['.hero', 'hero'], ['#stones', 'stones'], ['#set', 'set'], ['#buy', 'buy'], ['#province', 'province'], ['.close', 'close'], ['.footer', 'footer']]) if (e.closest(sel)) return n; return 'page'; };
  const dest = a => { const u = new URL(a.href, location.href); if (/wa\.me$/.test(u.host)) return 'to WhatsApp'; if (u.host !== location.host) return 'to ' + u.host; if (u.hash) return 'to ' + u.hash; return 'to ' + (u.pathname.split('/').pop() || 'index.html'); };
  const name = e => {
    const d = e.dataset;
    if ('colourChip' in d) return 'colour ' + d.colourChip;
    if ('stoneChip' in d) return 'stone ' + d.stoneChip;
    if ('piece' in d) return 'piece ' + d.piece;
    if ('metal' in d) return 'metal ' + d.metal;
    if ('set' in d) return 'set ' + d.set;
    if (e.id) return '#' + e.id;
    if (e.tagName === 'A') return dest(e) + (e.closest('.stone') ? ' for ' + e.closest('.stone').dataset.ref : '');
    return 'UNNAMED ' + e.outerHTML.replace(/\s+/g, ' ').slice(0, 70);
  };
  window.__kind = e => region(e) + ': ' + name(e);
  window.__vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); if (!(r.width > 1 && r.height > 1) || c.visibility === 'hidden' || c.display === 'none' || c.pointerEvents === 'none') return false; if (e.disabled) return false; for (let n = e.parentElement; n; n = n.parentElement) { const k = getComputedStyle(n); if (k.display === 'none' || k.visibility === 'hidden') return false; } return true; };
  window.__kinds = () => [...new Set([...document.querySelectorAll(TOUCH)].filter(window.__vis).map(window.__kind))];
  window.__pressed = JSON.parse(sessionStorage.getItem('__pressed') || '[]');
  const hear = e => { const t = e.target instanceof Element ? e.target.closest(TOUCH) : null; if (!t) return; const k = window.__kind(t); if (!window.__pressed.includes(k)) { window.__pressed.push(k); sessionStorage.setItem('__pressed', JSON.stringify(window.__pressed)); } };
  document.addEventListener('click', hear, true); document.addEventListener('change', hear, true);
  window.__snap = () => JSON.stringify({
    hash: location.hash, y: Math.round(scrollY / 40),
    count: (document.querySelector('#count') || {}).textContent, empty: getComputedStyle(document.querySelector('#empty')).display,
    order: [...document.querySelectorAll('.stone')].filter(window.__vis).map(s => s.dataset.ref).join(','),
    pressed: [...document.querySelectorAll('[aria-pressed="true"]')].map(window.__kind).join(','),
    summary: (document.querySelector('#summary') || {}).textContent, send: (document.querySelector('#send') || {}).href,
    size: getComputedStyle(document.querySelector('#size-field')).display, sizeVal: document.querySelector('#size').value,
    checks: [...document.querySelectorAll('input[type=checkbox]')].map(c => c.checked).join(','), cap: (document.querySelector('#set-cap') || {}).textContent
  });
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
/* the page scrolls smoothly, so nothing is read or pressed until the scroll has stopped */
const settleOn = page => page.evaluate(() => new Promise(res => { let last = scrollY, still = 0, n = 0; const t = setInterval(() => { if (scrollY === last) still++; else still = 0; last = scrollY; if (still >= 3 || ++n > 40) { clearInterval(t); res(scrollY); } }, 60); }));
async function run(w, h, touch) {
  const tag = touch ? `phone ${w}px` : `desk ${w}px`;
  console.log(`\n${tag}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch });
  await ctx.addInitScript(INSTALL);
  const outside = [];
  await ctx.route(u => !/^localhost/.test(new URL(u).host), route => {
    const q = route.request();
    if (q.resourceType() === 'document') { outside.push(q.url()); return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>outside</title>' }); }
    return route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64') });
  });
  const page = await ctx.newPage(); const errs = [];
  page.on('popup', async p => { try { await p.waitForLoadState('domcontentloaded', { timeout: 3000 }); } catch { /* empty tab */ } try { await p.close(); } catch { /* shut */ } });
  page.on('pageerror', e => errs.push(e.message));
  const seen = new Set();
  const note = async () => { (await page.evaluate(() => window.__kinds())).forEach(k => seen.add(k)); };
  const settle = () => settleOn(page);
  const go = async (path = '') => { await page.goto(BASE + path, { waitUntil: 'load' }); await page.waitForFunction(() => window.IslandCut && window.IslandCut.gl); await settle(); await sleep(300); await note(); };
  const point = async (sel, nth = 0) => {
    const e = page.locator(sel).nth(nth); await e.waitFor({ state: 'attached', timeout: 4000 });
    const reach = () => e.evaluate(n => { const r = n.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (!(r.width > 0) || x < 0 || x > innerWidth || y < 0 || y > innerHeight) return null; const t = document.elementFromPoint(x, y); return t && (t === n || n.contains(t) || t.contains(n)) ? [x, y] : null; });
    let at = await reach();
    if (!at) { await e.evaluate(n => n.scrollIntoView({ block: 'center', inline: 'center' })); await settle(); at = await reach(); }
    if (!at) throw new Error('nothing to press, or it is covered: ' + sel);
    return at;
  };
  const tap = async (sel, nth = 0) => { const [x, y] = await point(sel, nth); touch ? await page.touchscreen.tap(x, y) : await page.mouse.click(x, y); await settle(); await sleep(250); await note(); };
  const snap = () => page.evaluate(() => window.__snap());
  const changed = async (label, sel, nth = 0, field) => { const a = await snap(); await tap(sel, nth); const b = await snap(); const same = field ? JSON.parse(a)[field] === JSON.parse(b)[field] : a === b; ok(`${tag}: ${label} changes something a person can see`, !same, same ? 'nothing changed' : (field ? JSON.parse(b)[field] : '').toString().slice(0, 80)); return b; };
  const outsideWA = async (label, sel, nth = 0, must = '') => { const n = outside.length; await tap(sel, nth); const u = outside[outside.length - 1] || ''; const dec = decodeURIComponent(u); ok(`${tag}: ${label} opens WhatsApp with its message`, outside.length === n + 1 && u.includes(WA) && dec.includes('from the website') && (!must || dec.includes(must)), outside.length === n + 1 ? dec.slice(0, 160) : 'no door opened'); };

  await go();
  /* THE NAV */
  if (!touch) {
    for (const [i, hash] of ['#stones', '#set', '#buy', '#province'].entries()) { const b = await changed(`nav link ${hash}`, '.nav .links a', i, 'hash'); ok(`${tag}: nav link ${hash} lands on its section`, JSON.parse(b).hash === hash, JSON.parse(b).hash); }
    await outsideWA('nav WhatsApp', '.nav .nav-wa');
  } else {
    await outsideWA('nav WhatsApp pill', '.nav .nav-wa');
  }
  await page.evaluate(() => window.scrollTo(0, 1500)); await settle();
  const top = await changed('nav brand mark goes to the top', '.nav .brand', 0, 'y'); ok(`${tag}: the top is the top`, JSON.parse(top).y === 0, 'scrollY ' + JSON.parse(top).y * 40);
  /* THE HERO */
  await outsideWA('hero "See a stone turn"', '.hero-ctas .btn-wa');
  await changed('hero "The stones"', '.hero-ctas .btn-ghost', 0, 'y');
  {
    /* a drag turns the stone: the pose only tilts under a finger */
    const before = await page.evaluate(() => window.IslandCut.hero.pose.x);
    const c = page.locator('#hero-canvas'); await c.evaluate(n => n.scrollIntoView({ block: 'center' })); await settle();
    const b = await c.boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 40, y + 60, { steps: 8 }); await page.mouse.up(); await sleep(200);
    const after = await page.evaluate(() => window.IslandCut.hero.pose.x);
    ok(`${tag}: a drag on the hero stone tilts it`, Math.abs(after - before) > 0.05, `tilt ${before.toFixed(2)} to ${after.toFixed(2)}`);
  }
  /* THE SHELF */
  const colours = [...new Set(stones.map(s => s.colour))];
  for (const c of colours) { const b = await changed(`colour chip ${c}`, `[data-colour-chip="${c}"]`, 0, 'order'); const want = stones.filter(s => s.colour === c).length; ok(`${tag}: colour chip ${c} keeps ${want}`, new RegExp(`^${want} stone`).test(JSON.parse(b).count) || (want === 6 && /All 6/.test(JSON.parse(b).count)), JSON.parse(b).count); }
  await changed('colour chip all', '[data-colour-chip="all"]', 0, 'count');
  const un = await changed('unheated only', '#unheated', 0, 'count'); ok(`${tag}: unheated only keeps ${stones.filter(s => s.treatment === 'Unheated').length}`, new RegExp(`^${stones.filter(s => s.treatment === 'Unheated').length} stone`).test(JSON.parse(un).count), JSON.parse(un).count);
  await tap('#unheated');
  { const a = JSON.parse(await snap()); await page.selectOption('#sort', 'asc'); await sleep(300); await note(); const b = JSON.parse(await snap()); ok(`${tag}: sort lightest first turns the shelf round`, a.order !== b.order && b.order.split(',')[0] === stones.slice().sort((p, q) => p.carat - q.carat)[0].ref, b.order); await page.selectOption('#sort', 'desc'); await sleep(200); }
  {
    /* the empty state: a colour that is only heated, with unheated on */
    const heatedOnly = colours.find(c => stones.filter(s => s.colour === c).every(s => s.treatment !== 'Unheated'));
    await tap(`[data-colour-chip="${heatedOnly}"]`); const e = await changed('unheated on a heated colour shows the empty state', '#unheated', 0, 'empty');
    ok(`${tag}: the empty state is on screen`, JSON.parse(e).empty !== 'none' && JSON.parse(e).count.startsWith('0'), JSON.parse(e).count);
    await outsideWA('empty state "Ask what else there is"', '#empty .btn-wa');
    const r = await changed('"Show all stones"', '#reset', 0, 'count'); ok(`${tag}: reset brings all six back`, /All 6/.test(JSON.parse(r).count), JSON.parse(r).count);
  }
  await tap(`[data-stone-chip="${stones[stones.length - 1].ref}"]`);
  for (const s of stones) {
    await outsideWA(`"Ask for the price" on ${s.ref}`, `.stone[data-ref="${s.ref}"] .btn-primary`, 0, s.ref);
    const b = await changed(`"Set this stone" on ${s.ref}`, `.stone[data-ref="${s.ref}"] [data-set]`, 0, 'summary');
    ok(`${tag}: ${s.ref} is now the stone in the configurator`, JSON.parse(b).summary.includes(s.name) && JSON.parse(b).pressed.includes('stone ' + s.ref), JSON.parse(b).summary.slice(0, 60));
    await page.evaluate(() => document.querySelector('#stones').scrollIntoView()); await settle();
  }
  /* THE CONFIGURATOR */
  for (const s of stones) await changed(`stone chip ${s.ref}`, `[data-stone-chip="${s.ref}"]`, 0, 'summary');
  const pend = await changed('piece pendant', '[data-piece="pendant"]', 0, 'summary'); ok(`${tag}: the ring size field hides for a pendant`, JSON.parse(pend).size === 'none', 'size field ' + JSON.parse(pend).size);
  await changed('piece earrings', '[data-piece="earrings"]', 0, 'summary');
  const ring = await changed('piece ring', '[data-piece="ring"]', 0, 'summary'); ok(`${tag}: the ring size field returns for a ring`, JSON.parse(ring).size !== 'none', 'size field ' + JSON.parse(ring).size);
  for (const m of ['yellow', 'white', 'rose', 'platinum']) await changed(`metal ${m}`, `[data-metal="${m}"]`, 0, 'summary');
  { const a = JSON.parse(await snap()); await page.selectOption('#size', '5'); await sleep(250); await note(); const b = JSON.parse(await snap()); ok(`${tag}: ring size 5 reaches the summary and the drawing`, a.summary !== b.summary && /size 5/.test(b.summary) && a.cap !== undefined, b.summary.slice(0, 80)); }
  const ins = await changed('inscription extra', '#inscribe', 0, 'summary'); ok(`${tag}: the extra is in the WhatsApp message`, /inscri/i.test(decodeURIComponent(JSON.parse(ins).send)), decodeURIComponent(JSON.parse(ins).send).slice(0, 120));
  await changed('melee extra', '#melee', 0, 'summary');
  await outsideWA('"Send for a CAD drawing"', '#send', 0, 'size 5');
  /* THE CLOSE, THE FOOTER, THE FLOAT */
  await outsideWA('close "Open WhatsApp"', '.close .btn-wa');
  for (const [i, hash] of ['#stones', '#set', '#buy', '#province'].entries()) { const b = await changed(`footer link ${hash}`, '.footer a[href^="#"]', i + 1); ok(`${tag}: footer link ${hash} lands on its section`, JSON.parse(b).hash === hash, JSON.parse(b).hash); }
  await outsideWA('footer WhatsApp', '.footer a[href*="wa.me"]');
  const ft = await changed('footer brand mark goes to the top', '.footer .brand', 0, 'y'); ok(`${tag}: the footer brand mark reaches the top even with #top already in the address`, JSON.parse(ft).y === 0, 'scrollY ' + JSON.parse(ft).y * 40);
  if (touch) { await page.evaluate(() => window.scrollTo(0, document.querySelector('#buy').getBoundingClientRect().top + scrollY + 200)); await settle(); await sleep(300); await note(); await outsideWA('the floating button over the buy steps', '.fab'); }
  {
    /* a drag on the piece */
    const before = await page.evaluate(() => window.IslandCut.set.pose.x);
    const c = page.locator('#set-canvas'); await c.evaluate(n => n.scrollIntoView({ block: 'center' })); await settle();
    const b = await c.boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 30, y + 70, { steps: 8 }); await page.mouse.up(); await sleep(200);
    const after = await page.evaluate(() => window.IslandCut.set.pose.x);
    ok(`${tag}: a drag on the piece tilts it`, Math.abs(after - before) > 0.05, `tilt ${before.toFixed(2)} to ${after.toFixed(2)}`);
  }
  /* BACK ONCE AND BACK TWICE: two links followed, then the browser's own Back */
  await go();
  await tap('.hero-ctas .btn-ghost'); await tap('.footer a[href="#set"]');
  const h2 = await page.evaluate(() => location.hash);
  await page.goBack({ waitUntil: 'commit' }).catch(() => null); await sleep(500);
  const h1 = await page.evaluate(() => location.hash);
  await page.goBack({ waitUntil: 'commit' }).catch(() => null); await sleep(500);
  const h0 = await page.evaluate(() => ({ hash: location.hash, gl: !!(window.IslandCut && window.IslandCut.gl), cards: document.querySelectorAll('.stone').length }));
  ok(`${tag}: Back once returns from ${h2} to the section before it`, h1 === '#stones', `${h2} then ${h1}`);
  ok(`${tag}: Back twice returns to the top with the page intact`, h0.hash === '' && h0.gl && h0.cards === 6, JSON.stringify(h0));

  /* THE COUNT: every touchpoint the page ever showed must have been pressed */
  const pressed = await page.evaluate(() => window.__pressed);
  const missed = [...seen].filter(k => !pressed.includes(k));
  ok(`${tag}: every touchpoint the page showed was pressed`, !missed.length, `${seen.size} counted, ${pressed.length} pressed` + (missed.length ? ', MISSED ' + missed.join(' | ') : ''));
  ok(`${tag}: no error thrown during the run`, !errs.length, errs.length ? errs.slice(0, 2).join(' | ') : 'clean');
  ok(`${tag}: every door that left the page went to the house line`, outside.length > 0 && outside.every(u => u.includes(WA)), `${outside.length} doors, ${outside.filter(u => !u.includes(WA)).length} elsewhere`);
  await ctx.close();
}

await run(390, 844, true);
if (!QUICK) await run(1440, 900, false);
await browser.close(); server.close();
const bad = R.filter(x => !x.pass);
console.log(`\n${R.length - bad.length} of ${R.length} checks passed.` + (bad.length ? '\nFAILED:\n  ' + bad.map(x => x.name).join('\n  ') : ''));
process.exit(bad.length ? 1 : 0);
