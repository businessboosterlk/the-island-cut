#!/usr/bin/env node
/* THE ISLAND CUT GATE. Every rule the page must keep, as a check that can fail.
   A. the source and the built files, read without a browser
   B. the page in a real browser, phone and desk: errors, the stone, the shelf's stills, taps, fields, centring,
      the nav, the floating button never covering a control, the ink centre of every centred glyph, the words
   Every FAIL line says what was seen. Exit 1 on any FAIL.
     node scripts/check-site.mjs            phone and desk
     node scripts/check-site.mjs --quick    phone only
   Follows ~/bb-websites/sastho/scripts/check-site.mjs. Method: ~/.claude/skills/bb-click-path, bb-app-foundations. */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { chromium } from 'playwright';
import { serve, BASE as BP } from './serve.mjs';
import { SITE } from '../src/config.js';

const HOME = homedir(), NODE = process.execPath, PY = 'python3';
const QUICK = process.argv.includes('--quick');
const { measure } = await import(join(HOME, 'bb-systems/qa/optical.mjs'));
const R = [];
const ok = (name, pass, seen = '') => { R.push({ name, pass: !!pass, seen: String(seen) }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (seen ? '   ' + String(seen).slice(0, 600) : '')); };
const run = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opt });
const sample = (a, n = 3) => a.slice(0, n).join(' | ') + (a.length > n ? ` | and ${a.length - n} more` : '');
const stones = JSON.parse(readFileSync('src/data/stones.json', 'utf8'));

/* ───────────── A. WHAT CAN BE READ WITHOUT A BROWSER ───────────── */
console.log('\nA. The source and the built files');
ok('the site is built', existsSync('dist/index.html') && existsSync('dist/404.html'), 'dist/index.html and dist/404.html');
let r = run(NODE, ['scripts/build-icons.mjs', '--check']); ok('icons and the favicon come from the licensed sets, untouched', r.status === 0, (r.stdout + r.stderr).trim());
r = run(NODE, [join(HOME, 'bb-systems/qa/hand-svg.mjs'), 'src', '--allow', 'scripts/icon.js=1']); ok('no icon typed by hand (one named exception: the function that places a symbol)', r.status === 0, (r.stdout + r.stderr).trim().split('\n').slice(-1)[0]);
r = run(PY, [join(HOME, 'bb-systems/stack-standard/check_stack.py'), '.']); ok('stack standard', r.status === 0, (r.stdout + r.stderr).trim().split('\n').slice(0, 2).join(' '));

const css = readdirSync('dist/assets/app').filter(f => f.endsWith('.css')).map(f => readFileSync('dist/assets/app/' + f, 'utf8')).join('\n');
const js = readdirSync('dist/assets/app').filter(f => f.endsWith('.js')).map(f => readFileSync('dist/assets/app/' + f, 'utf8')).join('\n');
const html = { index: readFileSync('dist/index.html', 'utf8'), notfound: readFileSync('dist/404.html', 'utf8') };
const tmp = join(tmpdir(), 'island-cut-gate'); mkdirSync(tmp, { recursive: true });

{
  const ft = [];
  const scripts = readdirSync('src/scripts').filter(f => f.endsWith('.js')).map(f => 'src/scripts/' + f);
  for (const f of ['dist/index.html', 'dist/404.html', ...scripts]) { const o = run(NODE, [join(HOME, 'bb-systems/qa/first-try.mjs'), f]); if (o.status !== 0) ft.push(f.split('/').pop() + ': ' + ((o.stdout + o.stderr).split('\n').find(l => /FAIL F/.test(l)) || '').trim()); }
  ok('first try checker on both pages and every script', !ft.length, ft.length ? sample(ft, 2) : `2 pages and ${scripts.length} scripts pass`);
}
ok('the concept cannot be found by Google while it is a concept', Object.values(html).every(h => /<meta name="robots" content="noindex,nofollow">/.test(h)), 'noindex on both pages');
ok('the share card and the favicon the head names exist in the build', existsSync('dist/assets/og.png') && existsSync('dist/favicon.svg'), 'dist/assets/og.png, dist/favicon.svg (shots.mjs makes the card)');
{
  const all = css + js;
  const knobs = { 'touch-action': /touch-action:\s*manipulation/g, 'tap-highlight-color': /-webkit-tap-highlight-color:\s*(transparent|#0000|rgba\(0,\s*0,\s*0,\s*0\))/g, 'overscroll-behavior': /overscroll-behavior(-[xy])?:\s*(contain|none)/g, 'text-size-adjust': /text-size-adjust:\s*100%/g };
  const zero = Object.entries(knobs).map(([k, re]) => [k, (all.match(re) || []).length]);
  ok('foundation knobs, none at zero', zero.every(([, n]) => n > 0), zero.map(([k, n]) => `${k} ${n}`).join(', '));
  const flat = css.replace(/\s*([{};:,])\s*/g, '$1').replace(/@media\(/g, '@media (');
  ok('a field cannot zoom the screen: 16px on a touch screen', /@media \(pointer:coarse\)\{[^}]*font-size:16px/.test(flat), 'the coarse pointer rule is in the built stylesheet');
  ok('heights are in dvh, never vh', !/[\d.]+vh\b/.test(css.replace(/[\d.]+[sld]vh/g, '')), 'no vh unit in the stylesheet');
  ok('overflow is clipped on the page itself', /html,body\{[^}]*overflow-x:clip/.test(flat) || /html\{[^}]*overflow-x:clip/.test(flat), 'overflow-x:clip on the page');
  let bad = []; const stack = []; const src = css.replace(/\/\*[\s\S]*?\*\//g, ''); let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i), shut = src.indexOf('}', i); if (shut === -1) break;
    if (open !== -1 && open < shut) { const sel = src.slice(i, open).trim(); stack.push(sel); if (/:hover/.test(sel) && !stack.some(s => /^@media[^{]*\(hover:\s*hover\)/.test(s))) bad.push(sel.slice(0, 60)); i = open + 1; }
    else { stack.pop(); i = shut + 1; }
  }
  ok('every hover rule is inside @media (hover:hover)', !bad.length, bad.length ? sample(bad) : `${(src.match(/:hover/g) || []).length} hover rules, all inside`);
}
{
  /* THE CLIENT'S LANDMINES, as text the build may never carry */
  const page = html.index.replace(/<script[\s\S]*?<\/script>/g, '');
  const text = page.replace(/<[^>]+>/g, ' ');
  const money = text.match(/(\$|USD|LKR|Rs\.?|€|£)\s?\d[\d,.]*/g) || [];
  ok('no price anywhere on the page', !money.length, money.length ? sample(money) : 'no currency figure in the rendered text');
  const banned = ['Sapphire Trails', 'light blue', 'pale blue', 'GaaS', 'Serene', 'founded in', 'since 1', 'master cutters', 'countries'];
  const hit = banned.filter(w => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text));
  ok('none of the words the first call forbade', !hit.length, hit.length ? hit.join(', ') : `${banned.length} words searched`);
  const year = (text.match(/\b(18|19|20)\d\d\b/g) || []).filter(y => y !== String(new Date().getFullYear()));
  ok('no invented year or founding date', !year.length, year.length ? sample(year) : 'the only year is the build date');
  ok('the stones are marked as samples where the shelf is', /Six sample stones/.test(text) && stones.meta.sample === true, 'sample note on the shelf, meta.sample true');
  const keys = ['ref', 'name', 'colour', 'hex', 'cut', 'carat', 'mm', 'origin', 'treatment', 'lab'];
  const short = stones.stones.filter(s => keys.some(k => s[k] === undefined || s[k] === '') || 'price' in s);
  ok(`every one of the ${stones.stones.length} stones names its district, its treatment and its lab, and none carries a price`, stones.stones.length === 6 && !short.length, short.length ? sample(short.map(s => s.ref)) : stones.stones.map(s => `${s.ref} ${s.origin} ${s.treatment} ${s.lab}`).join(', '));
  const hrefs = [...page.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const wrong = hrefs.filter(h => !h.startsWith(`https://wa.me/${SITE.whatsapp}?text=`) || !/from%20the%20website/.test(h));
  ok('every WhatsApp door opens the house line with a message that says where it came from', hrefs.length >= 10 && !wrong.length, wrong.length ? sample(wrong) : `${hrefs.length} doors to wa.me/${SITE.whatsapp}`);
  ok('the working name is held in one place', (html.index.match(/The Island Cut/g) || []).length >= 3 && readFileSync('src/config.js', 'utf8').includes("name: 'The Island Cut'"), 'src/config.js SITE.name');
}

/* ───────────── B. THE PAGE IN A REAL BROWSER ───────────── */
const server = await serve(4612);
const BASE = `http://localhost:4612${BP}/`;
const browser = await chromium.launch({ channel: 'chromium' });
const SIZES = QUICK ? [[390, 844, true]] : [[390, 844, true], [1440, 900, false]];
const styleText = [];

const PAGE_PROBE = () => {
  const vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); if (!(r.width > 1 && r.height > 1) || c.visibility === 'hidden' || c.display === 'none' || +c.opacity < .05) return false; if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true })) return false; if (e.disabled) return false; for (let n = e.parentElement; n; n = n.parentElement) { const k = getComputedStyle(n); if (k.visibility === 'hidden' || k.display === 'none' || +k.opacity < .05) return false; } return true; };
  const name = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(' ').filter(Boolean).slice(0, 2).join('.')) + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24) + '"';
  const out = {};
  const taps = [...document.querySelectorAll('a[href],button,select,input:not([type=hidden])')].filter(vis);
  out.taps = taps.length;
  out.small = taps.map(e => e.type === 'checkbox' && e.closest('label') ? e.closest('label') : e).filter(e => { const r = e.getBoundingClientRect(); const inline = e.tagName === 'A' && getComputedStyle(e).display === 'inline'; return !inline && (r.height < 43.5 || r.width < 43.5); }).map(e => name(e) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  out.fields = [...document.querySelectorAll('input,select')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(name);
  out.tiny = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() && vis(e) && !e.closest('svg') && parseFloat(getComputedStyle(e).fontSize) < 11).map(name);
  /* the district words are kinetic and meant to run past the edge; the page itself must never scroll sideways */
  out.past = [...document.querySelectorAll('*')].filter(e => vis(e) && !e.closest('svg,[aria-hidden="true"],.kin') && getComputedStyle(e).position !== 'fixed' && e.getBoundingClientRect().right > innerWidth + 1).map(name);
  out.sideways = document.documentElement.scrollWidth - innerWidth;
  const phone = innerWidth < 720;
  out.centred = phone ? [] : [...document.querySelectorAll('h1,h2')].filter(e => vis(e) && getComputedStyle(e).textAlign === 'center').map(name);
  out.offCentre = [];
  if (phone) {
    const mid = e => { const g = document.createRange(); g.selectNodeContents(e); const r = g.getBoundingClientRect(); return Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; };
    [...document.querySelectorAll('.hero h1, .hero .lead, .hero .eyebrow, .close h2')].filter(vis).forEach(e => { const d = mid(e); if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
    [...document.querySelectorAll('.hero-ctas .btn')].filter(vis).forEach(e => { const r = e.getBoundingClientRect(), d = Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
  }
  out.tight = [...document.querySelectorAll('h1,h2,h3')].filter(vis).filter(e => { const c = getComputedStyle(e); return parseFloat(c.lineHeight) / parseFloat(c.fontSize) < 1.05; }).map(name);
  const brand = document.querySelector('.nav .brand'), h1 = document.querySelector('.hero h1');
  out.left = (!phone && brand && h1) ? Math.round((h1.getBoundingClientRect().left - brand.getBoundingClientRect().left) * 10) / 10 : 0;
  out.torn = [...document.images].filter(i => vis(i) && i.complete && i.naturalWidth === 0).map(i => i.alt || i.src.slice(0, 40));
  const ic = window.IslandCut || {};
  out.gem = { gl: !!ic.gl, drawn: ic.drawn || 0, stills: ic.stills || 0, errors: ic.errors || ['no IslandCut object'] };
  out.cards = [...document.querySelectorAll('.stone')].filter(vis).length;
  out.count = (document.querySelector('#count') || {}).textContent || '';
  return out;
};
/* the floating button, read at every scroll stop: it may never sit on another control */
const FAB_PROBE = () => {
  const fab = document.querySelector('.fab'); if (!fab) return [];
  const f = fab.getBoundingClientRect(), c = getComputedStyle(fab);
  if (+c.opacity < .5 || c.pointerEvents === 'none') return [];
  const hit = [];
  for (const e of document.querySelectorAll('a[href],button,select,input')) {
    if (e === fab) continue; const r = e.getBoundingClientRect(); if (!(r.width > 1 && r.height > 1)) continue;
    if (r.left < f.right && r.right > f.left && r.top < f.bottom && r.bottom > f.top) hit.push(scrollY + ': ' + (e.id ? '#' + e.id : (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)));
  }
  return hit;
};
const TEXT = () => {
  const skip = e => e.closest('script,style,svg,[hidden],noscript');
  const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t && n.parentElement && !skip(n.parentElement)) out.push(t); }
  document.querySelectorAll('[aria-label],[placeholder],[alt],[title]').forEach(e => { if (skip(e)) return; ['aria-label', 'placeholder', 'alt', 'title'].forEach(a => { const v = e.getAttribute(a); if (v && v.trim()) out.push(v.trim()); }); });
  out.push(document.title); const d = document.querySelector('meta[name=description]'); if (d) out.push(d.content);
  return out;
};

console.log('\nB. The page in a real browser');
for (const [w, h, touch] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  /* the stone must draw and the six stills must land within eight seconds of load */
  const gemOk = await page.waitForFunction(() => window.IslandCut && window.IslandCut.gl && window.IslandCut.stills >= 6 && window.IslandCut.drawn > 10, null, { timeout: 8000 }).then(() => true).catch(() => false);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const fabHits = [];
  for (let y = 0; y < H; y += 300) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(90); if (touch) fabHits.push(...(await page.evaluate(FAB_PROBE))); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
  const p = await page.evaluate(PAGE_PROBE);
  const tag = `${w}px`;
  ok(`${tag}: no error in the console or the page`, !errs.length, errs.length ? sample(errs) : 'console clean');
  ok(`${tag}: the stone draws, the six stills land and nothing threw`, gemOk && !p.gem.errors.length, `gl ${p.gem.gl}, ${p.gem.drawn} frames, ${p.gem.stills} stills, errors [${p.gem.errors.join('; ')}]`);
  ok(`${tag}: six cards on the shelf and the count says so`, p.cards === 6 && /All 6 stones/.test(p.count), `${p.cards} cards, "${p.count}"`);
  ok(`${tag}: no sideways scroll and nothing clipped off the right edge`, p.sideways <= 0 && !p.past.length, p.sideways > 0 ? `by ${p.sideways}px` : p.past.length ? sample(p.past) : 'nothing past the edge');
  if (touch) ok(`${tag}: every touchpoint is at least 44px`, !p.small.length, p.small.length ? sample(p.small, 12) : `${p.taps} touchpoints measured`);
  if (touch) ok(`${tag}: no field under 16px`, !p.fields.length, p.fields.length ? sample(p.fields) : 'select and checkboxes at 16px or more');
  ok(`${tag}: no text under 11px`, !p.tiny.length, p.tiny.length ? sample(p.tiny) : 'smallest text 11px or more');
  ok(touch ? `${tag}: on a phone the hero and the close sit in the middle` : `${tag}: on a desk no centred heading, the hero heading level with the brand mark`, !p.centred.length && !p.offCentre.length && Math.abs(p.left) <= 1, sample([...p.centred, ...p.offCentre, ...(Math.abs(p.left) > 1 ? [`h1 ${p.left}px from the brand mark`] : [])], 5) || (touch ? 'hero and close centred' : `h1 ${p.left}px from the brand mark`));
  ok(`${tag}: no heading tighter than 1.05`, !p.tight.length, sample(p.tight) || 'every heading 1.05 or more');
  ok(`${tag}: every picture loaded`, !p.torn.length, sample(p.torn) || `${p.gem.stills} stills on the shelf`);
  if (touch) ok(`${tag}: the floating WhatsApp button never sits on another control`, !fabHits.length, fabHits.length ? sample([...new Set(fabHits)], 4) : `read at ${Math.ceil(H / 300)} scroll stops`);
  /* the nav survives a scroll */
  const nb = await page.evaluate(async () => { const t = document.querySelector('.nav'), before = t.getBoundingClientRect().top; window.scrollTo(0, 900); await new Promise(r => setTimeout(r, 150)); const after = t.getBoundingClientRect().top; const tone = t.dataset.tone; window.scrollTo(0, 0); return { before, after, tone }; });
  ok(`${tag}: the nav survives a scroll and reads the section under it`, nb.before === nb.after && nb.before === 0 && !!nb.tone, `top ${nb.before} then ${nb.after}, tone ${nb.tone}`);
  /* the ink centre of every centred glyph (bb-alignment, optical.mjs): the floating button and the phone's icon-only WhatsApp pill */
  if (touch) {
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#buy').getBoundingClientRect().top + scrollY + 200)); await page.waitForTimeout(500);
    const fab = await measure(page, '.fab', { shape: 'circle', inset: 4 });
    ok(`${tag}: the WhatsApp mark sits in the centre of the floating button`, !fab.error && Math.abs(fab.dx) <= 0.5 && Math.abs(fab.dy) <= 0.5, fab.error || `dx ${fab.dx} dy ${fab.dy}`);
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    const pill = await measure(page, '.nav-wa', { shape: 'rect', inset: 3 });
    ok(`${tag}: the WhatsApp mark sits in the centre of the nav pill`, !pill.error && Math.abs(pill.dx) <= 0.5 && Math.abs(pill.dy) <= 0.5, pill.error || `dx ${pill.dx} dy ${pill.dy}`);
  }
  if (w === 390) styleText.push(...(await page.evaluate(TEXT)));
  await page.close(); await ctx.close();
}

/* ───────────── C. THE WORDS, AS RENDERED ───────────── */
console.log('\nC. The words, read off the rendered page');
{
  const f = join(tmp, 'words.txt'); writeFileSync(f, [...new Set(styleText)].join('\n'));
  const hs = run(PY, [join(HOME, 'bb-consultancy/house_style.py'), f]);
  const lines = (hs.stdout + hs.stderr).trim().split('\n');
  ok('house style on the rendered words: no dashes, no comma before and, UK English, no AI filler', hs.status === 0, lines.filter(l => /FAIL/.test(l)).join(' ') || `${styleText.length} strings read, ${lines.length} rules`);
}

await browser.close(); server.close();
try { rmSync(tmp, { recursive: true }); } catch { /* left for the next run */ }
const bad = R.filter(x => !x.pass);
console.log(`\n${R.length - bad.length} of ${R.length} checks passed.` + (bad.length ? '\nFAILED:\n  ' + bad.map(x => x.name).join('\n  ') : ''));
process.exit(bad.length ? 1 : 0);
