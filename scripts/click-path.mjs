#!/usr/bin/env node
/* THE CLICK PATH. Every touchpoint on the page is COUNTED by a recorder in the page, PRESSED in a real browser and
   its effect READ. A press that changes nothing a person can see is a FAIL. Then Back once and Back twice after
   following links on the page, and every door to WhatsApp read for its message.
     node scripts/click-path.mjs            phone and desk
     node scripts/click-path.mjs --quick    phone only
   Method: ~/.claude/skills/bb-click-path. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { serve, BASE as BP } from './serve.mjs';
import { SITE, LINKS, VIEWS } from '../src/config.js';

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
  const region = e => { for (const [sel, n] of [['.nav', 'nav'], ['.hero', 'hero'], ['#stones', 'stones'], ['#viewing', 'room'], ['#jewellery', 'jewellery'], ['#bespoke', 'bespoke'], ['#craft', 'craft'], ['#contact', 'contact'], ['.tray', 'tray'], ['#passport', 'passport'], ['#request', 'request'], ['.footer', 'footer']]) if (e.closest(sel)) return n; return 'page'; };
  const dest = a => { const u = new URL(a.href, location.href); if (/wa\.me$/.test(u.host)) return 'to WhatsApp'; if (u.host !== location.host) return 'to ' + u.host; if (u.hash) return 'to ' + u.hash; return 'to ' + (u.pathname.split('/').pop() || 'index.html'); };
  const name = e => {
    const d = e.dataset;
    for (const k of ['state', 'passport', 'room', 'compare', 'pick', 'view', 'remove']) if (k in d) return k + ' ' + d[k];
    if ('close' in d) return 'close';
    if (e.id) return '#' + e.id;
    if (e.tagName === 'A') return dest(e);
    return 'UNNAMED ' + e.outerHTML.replace(/\s+/g, ' ').slice(0, 70);
  };
  window.__kind = e => region(e) + ': ' + name(e);
  window.__vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); if (!(r.width > 1 && r.height > 1) || c.visibility === 'hidden' || c.display === 'none' || c.pointerEvents === 'none') return false; if (e.disabled) return false; for (let n = e.parentElement; n; n = n.parentElement) { const k = getComputedStyle(n); if (k.display === 'none' || k.visibility === 'hidden') return false; } return true; };
  window.__kinds = () => [...new Set([...document.querySelectorAll(TOUCH)].filter(window.__vis).map(window.__kind))];
  window.__pressed = JSON.parse(sessionStorage.getItem('__pressed') || '[]');
  const hear = e => { const t = e.target instanceof Element ? e.target.closest(TOUCH) : null; if (!t) return; const k = window.__kind(t); if (!window.__pressed.includes(k)) { window.__pressed.push(k); sessionStorage.setItem('__pressed', JSON.stringify(window.__pressed)); } };
  document.addEventListener('click', hear, true); document.addEventListener('change', hear, true);
  window.__snap = () => { const g = id => document.getElementById(id) || {}; return JSON.stringify({
    hash: location.hash, y: Math.round(scrollY / 40),
    hero: g('hero-frame').dataset ? g('hero-frame').dataset.state : '',
    room: g('room-ref').textContent + ' ' + ([...document.querySelectorAll('.tab[aria-selected="true"]')].map(t => t.dataset.view).join('')) + ' ' + (g('stage-empty').hidden ? 'photo' : 'panel'),
    tray: g('tray').dataset.on + ' ' + g('tray').dataset.open + ' ' + g('tray-refs').textContent + ' warn:' + !g('tray-warn').hidden, what: g('tray-what').textContent,
    hiddenRows: document.querySelectorAll('#cmp-body tr[hidden]').length, diff: g('diff').checked,
    passport: (g('passport').open ? 'open ' : 'shut ') + g('pp-ref').textContent,
    request: (g('request').open ? 'open ' : 'shut ') + g('req-stones').textContent + ' ' + g('req-day').value + ' ' + g('req-time').value, sent: g('request').dataset ? g('request').dataset.sent : '',
    send: (g('req-send').href || '')
  }); };
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
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
  const go = async (path = '') => { await page.goto(BASE + path, { waitUntil: 'load' }); await page.waitForFunction(() => window.IslandCut && window.IslandCut.ready); await page.evaluate(() => localStorage.removeItem('island-cut-tray')); await settle(); await sleep(200); await note(); };
  const point = async (sel, nth = 0) => {
    const e = page.locator(sel).nth(nth); await e.waitFor({ state: 'attached', timeout: 4000 });
    const reach = () => e.evaluate(n => { const r = n.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (!(r.width > 0) || x < 0 || x > innerWidth || y < 0 || y > innerHeight) return null; const t = document.elementFromPoint(x, y); return t && (t === n || n.contains(t) || t.contains(n)) ? [x, y] : null; });
    let at = await reach();
    if (!at) { await e.evaluate(n => n.scrollIntoView({ block: 'center', inline: 'center' })); await settle(); at = await reach(); }
    if (!at) throw new Error('nothing to press, or it is covered: ' + sel);
    return at;
  };
  const tap = async (sel, nth = 0) => { const [x, y] = await point(sel, nth); touch ? await page.touchscreen.tap(x, y) : await page.mouse.click(x, y); await settle(); await sleep(220); await note(); };
  const snap = () => page.evaluate(() => window.__snap());
  const J = s => JSON.parse(s);
  const changed = async (label, sel, nth = 0, field) => { const a = await snap(); await tap(sel, nth); const b = await snap(); const same = field ? J(a)[field] === J(b)[field] : a === b; ok(`${tag}: ${label} changes something a person can see`, !same, same ? 'nothing changed' : (field ? J(b)[field] : '').toString().slice(0, 90)); return J(b); };
  const outsideWA = async (label, sel, nth = 0, must = []) => { const n = outside.length; await tap(sel, nth); const u = outside[outside.length - 1] || ''; const dec = decodeURIComponent(u); const lack = must.filter(m => !dec.includes(m)); ok(`${tag}: ${label} opens WhatsApp with its message`, outside.length === n + 1 && u.includes(WA) && dec.includes('from the website') && !lack.length, outside.length === n + 1 ? (lack.length ? 'MISSING ' + lack.join(', ') + ' in ' : '') + dec.slice(0, 160) : 'no door opened'); };
  const unhash = () => page.evaluate(() => history.replaceState(null, '', location.pathname));

  await go();
  /* THE NAV */
  if (!touch) for (const [i, l] of LINKS.entries()) { await unhash(); const b = await changed(`nav link ${l.label}`, '.nav .links a', i, 'hash'); ok(`${tag}: nav link ${l.label} lands on ${l.href}`, b.hash === l.href, b.hash); }
  { const b = await changed('nav "Book a viewing"', '#nav-book', 0, 'request'); ok(`${tag}: the request opens with no stone chosen and says so`, /^open .*No stone chosen yet/.test(b.request), b.request.slice(0, 60)); }
  await changed('request "Not now"', '#request [data-close]', 0, 'request');
  await page.evaluate(() => window.scrollTo(0, 1500)); await settle();
  { const b = await changed('nav brand mark goes to the top', '.nav .brand', 0, 'y'); ok(`${tag}: the top is the top`, b.y === 0, 'scrollY ' + b.y * 40); }
  /* THE HERO */
  { const b = await changed('hero "The finished piece"', '.hero .state [data-state="piece"]', 0, 'hero'); ok(`${tag}: the second state is the honest empty frame`, b.hero === 'piece' && await page.evaluate(() => !document.getElementById('hero-piece').hidden && document.getElementById('hero-img').hidden), b.hero); }
  await changed('hero "The stone"', '.hero .state [data-state="stone"]', 0, 'hero');
  await unhash(); { const b = await changed('hero "Explore gemstones"', '.hero .doors a[href="#stones"]', 0, 'hash'); ok(`${tag}: it lands on the stones`, b.hash === '#stones', b.hash); }
  await unhash(); { const b = await changed('hero "Create your piece"', '.hero .doors a[href="#bespoke"]', 0, 'hash'); ok(`${tag}: it lands on bespoke`, b.hash === '#bespoke', b.hash); }
  /* THE RECORDS: every button on every card, the passport's whole action bar */
  for (const s of stones) {
    const card = `.stone[data-ref="${s.ref}"]`;
    { const b = await changed(`${s.ref} "Compare"`, `${card} [data-compare]`, 0, 'tray'); ok(`${tag}: ${s.ref} is in the tray`, b.tray.includes(s.ref) && b.tray.startsWith('true'), b.what + ' ' + b.tray); }
    { const b = await changed(`${s.ref} "Passport"`, `${card} [data-passport]`, 0, 'passport'); ok(`${tag}: the passport is ${s.ref}'s`, b.passport === 'open ' + s.ref, b.passport); }
    { const b = await changed(`${s.ref} passport "Compare" takes it out again`, '#pp-compare', 0, 'tray'); ok(`${tag}: ${s.ref} left the tray`, !b.tray.includes(s.ref), b.tray); }
    await outsideWA(`${s.ref} passport "Ask about it"`, '#pp-ask', 0, [s.ref, s.title]);
    { const b = await changed(`${s.ref} passport "View with a specialist"`, '#pp-spec', 0, 'request'); ok(`${tag}: the request carries ${s.ref} and the passport is under it`, b.request.startsWith('open') && b.request.includes(s.ref) && b.passport.startsWith('shut'), b.request.slice(0, 50) + ' / ' + b.passport); }
    await changed(`request close mark after ${s.ref}`, '#req-close', 0, 'request');
    { const b = await changed(`${s.ref} "Viewing room"`, `${card} [data-room]`); ok(`${tag}: the room shows ${s.ref} in daylight`, b.room.startsWith(s.ref + ' daylight'), b.room); }
  }
  { const b = await changed('passport "Close" (quiet)', '[data-passport="IC-101"]', 0, 'passport'); ok(`${tag}: open again`, b.passport.startsWith('open'), b.passport); }
  await changed('passport quiet "Close"', '#passport [data-close]', 0, 'passport');
  await tap('[data-passport="IC-104"]'); await changed('passport close mark', '#pp-close', 0, 'passport');
  /* THE TRAY: three in, the fourth refused, the sheet, the differences, every remove, open, close and clear */
  for (const s of stones.slice(0, 3)) await tap(`.stone[data-ref="${s.ref}"] [data-compare]`);
  { const b = J(await snap()); ok(`${tag}: three stones sit in the tray`, b.what === 'Comparing 3 of 3' && !b.tray.includes('warn:true'), b.what + ' ' + b.tray); }
  { const b = await changed(`a fourth "Compare" (${stones[3].ref}) is refused with a reason`, `.stone[data-ref="${stones[3].ref}"] [data-compare]`, 0, 'tray'); ok(`${tag}: still three, the warning shows, the tray opened to show it`, b.what === 'Comparing 3 of 3' && b.tray.includes('warn:true') && b.tray.includes('true true') && !b.tray.includes(stones[3].ref), b.what + ' ' + b.tray); }
  { const b = await changed('tray "View these with a specialist"', '#tray-spec', 0, 'request'); const have = stones.slice(0, 3).map(s => s.ref).filter(r => b.request.includes(r) && decodeURIComponent(b.send).includes(r)); ok(`${tag}: the request carries all three stones into the message`, have.length === 3 && decodeURIComponent(b.send).includes('Please confirm'), decodeURIComponent(b.send).slice(0, 170)); }
  { const a = J(await snap()); await page.selectOption('#req-day', { index: 3 }); await page.selectOption('#req-time', { index: 2 }); await sleep(200); await note(); const b = J(await snap()); ok(`${tag}: day and time reach the message and both clocks`, a.send !== b.send && b.request.includes(await page.$eval('#req-day', e => e.value)) && decodeURIComponent(b.send).includes(await page.$eval('#req-time', e => e.value)), decodeURIComponent(b.send).slice(-120)); }
  { const b = await changed('request "Request a time" to WhatsApp shows the done line only after the door', '#req-send', 0, 'sent'); const dec = decodeURIComponent(outside[outside.length - 1] || ''); ok(`${tag}: the door carried the stones, the Colombo time and "from the website"`, b.sent === 'true' && dec.includes(WA) && dec.includes('Colombo') && dec.includes('from the website') && stones.slice(0, 3).every(s => dec.includes(s.ref)), dec.slice(0, 200)); }
  await changed('request "Not now" after sending', '#request [data-close]', 0, 'request');
  { const b = await changed(`remove ${stones[0].ref} from the tray`, `[data-remove="${stones[0].ref}"]`, 0, 'tray'); ok(`${tag}: two left`, b.what === 'Comparing 2 of 3', b.what); }
  { const b = await changed('"Show differences only"', '#diff', 0, 'hiddenRows'); ok(`${tag}: the rows the two share are hidden`, b.hiddenRows >= 1 && b.diff === true, `${b.hiddenRows} rows hidden`); }
  await changed('"Show differences only" off', '#diff', 0, 'hiddenRows');
  { const isOpen = () => page.$eval('#tray', t => t.dataset.open === 'true');
    if (await isOpen()) await changed('tray "Close" so the table is reachable again', '#tray-open', 0, 'tray');
    await tap(`.stone[data-ref="${stones[3].ref}"] [data-compare]`);
    if (!(await isOpen())) await changed('tray "Open" to remove stones', '#tray-open', 0, 'tray'); }
  for (const s of [stones[3], stones[2]]) await changed(`remove ${s.ref} from the tray`, `[data-remove="${s.ref}"]`, 0, 'tray');
  { const b = await changed(`remove ${stones[1].ref}, the last one`, `[data-remove="${stones[1].ref}"]`, 0, 'tray'); ok(`${tag}: the empty tray leaves the screen`, b.tray.startsWith('false'), b.tray); }
  await tap(`.stone[data-ref="${stones[0].ref}"] [data-compare]`);
  { const b = await changed('tray "Open"', '#tray-open', 0, 'tray'); ok(`${tag}: the tray is open`, b.tray.includes('true true'), b.tray); }
  await changed('tray "Close"', '#tray-open', 0, 'tray');
  { const b = await changed('tray "Clear"', '#tray-clear', 0, 'tray'); ok(`${tag}: cleared and gone`, b.tray.startsWith('false') && b.what === 'Comparing 0 of 3', b.what); }
  /* THE VIEWING ROOM: every stone, every light, the ask, the passport, the compare */
  for (const s of [...stones.slice(0, 3), stones[3]]) { const b = await changed(`room pick ${s.ref}`, `[data-pick="${s.ref}"]`, 0, 'room'); ok(`${tag}: the room is ${s.ref}'s`, b.room.startsWith(s.ref), b.room); }
  for (const v of [...VIEWS.slice(1), VIEWS[0]]) { const b = await changed(`room tab ${v.label}`, `[data-view="${v.key}"]`, 0, 'room'); ok(`${tag}: ${v.label} on ${stones[3].ref} is the honest panel`, b.room.includes(v.key) && b.room.endsWith('panel'), b.room); }
  await outsideWA(`room "Request another view" for ${stones[3].ref}`, '#room-ask', 0, [stones[3].ref]);
  await tap('[data-pick="IC-101"]');
  await outsideWA('room "Request another view" for IC-101 asks for the views not captured', '#room-ask', 0, ['IC-101', 'indoor light']);
  { const b = await changed('room "Passport"', '#room-passport', 0, 'passport'); ok(`${tag}: it is IC-101's`, b.passport === 'open IC-101', b.passport); await tap('#pp-close'); }
  await changed('room "Compare"', '#room-compare', 0, 'tray'); await tap('#room-compare');
  /* JEWELLERY, BESPOKE, CRAFT, CONTACT */
  await unhash(); { const b = await changed('jewellery "Create your piece"', '#jewellery a[href="#bespoke"]', 0, 'hash'); ok(`${tag}: it lands on bespoke`, b.hash === '#bespoke', b.hash); }
  await outsideWA('bespoke "Create your piece"', '#bespoke-wa', 0, ['create a piece']);
  { const b = await changed('contact "Request a time"', '#spec-time', 0, 'request'); ok(`${tag}: the request opens`, b.request.startsWith('open'), b.request.slice(0, 40)); await tap('#req-close'); }
  await outsideWA('contact "WhatsApp a specialist"', '#spec-wa', 0, ['specialist']);
  /* THE FOOTER */
  for (const [i, l] of LINKS.entries()) { await unhash(); const b = await changed(`footer link ${l.label}`, '.footer .flinks a', i, 'hash'); ok(`${tag}: footer link ${l.label} lands on ${l.href}`, b.hash === l.href, b.hash); }
  await outsideWA('footer WhatsApp', '#foot-wa');
  { const b = await changed('footer brand mark goes to the top', '.footer .brand', 0, 'y'); ok(`${tag}: the footer brand mark reaches the top even with a hash in the address`, b.y === 0, 'scrollY ' + b.y * 40); }
  /* BACK ONCE AND BACK TWICE: two links followed, then the browser's own Back */
  await go();
  await tap('.hero .doors a[href="#stones"]'); await tap('.footer .flinks a[href="#bespoke"]');
  const h2 = await page.evaluate(() => location.hash);
  await page.goBack({ waitUntil: 'commit' }).catch(() => null); await sleep(500);
  const h1 = await page.evaluate(() => location.hash);
  await page.goBack({ waitUntil: 'commit' }).catch(() => null); await sleep(500);
  const h0 = await page.evaluate(() => ({ hash: location.hash, ready: !!(window.IslandCut && window.IslandCut.ready), cards: document.querySelectorAll('.stone').length }));
  ok(`${tag}: Back once returns from ${h2} to the section before it`, h1 === '#stones', `${h2} then ${h1}`);
  ok(`${tag}: Back twice returns to the top with the page intact`, h0.hash === '' && h0.ready && h0.cards === stones.length, JSON.stringify(h0));
  /* THE TRAY SURVIVES A RELOAD on this device, and only this device */
  await page.evaluate(() => { document.querySelector('[data-compare="IC-106"]').click(); });
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => window.IslandCut && window.IslandCut.ready);
  const kept = await page.evaluate(() => ({ what: document.getElementById('tray-what').textContent, on: document.getElementById('tray').dataset.on }));
  ok(`${tag}: the tray is still there after a reload`, kept.what === 'Comparing 1 of 3' && kept.on === 'true', JSON.stringify(kept));

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
