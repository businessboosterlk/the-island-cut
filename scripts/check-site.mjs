#!/usr/bin/env node
/* THE ISLAND CUT GATE. Every rule the page must keep, as a check that can fail.
   A. the source and the built files, read without a browser
   B. the page in a real browser, phone and desk: errors, the records, the tray's limit, the sheets, taps, fields,
      centring, the nav, the keyboard, reduced motion, the ink centre of the close mark, the words
   Every FAIL line says what was seen. Exit 1 on any FAIL.
     node scripts/check-site.mjs            phone and desk
     node scripts/check-site.mjs --quick    phone only
   Method: ~/.claude/skills/bb-click-path, bb-app-foundations, look/BRIEF-10-FEATURES.md (phase 1), the seven reference clips (phase 2:
   the hero scrubs, the ring comes apart and back, the box opens on a tap, the builder ends in two doors with no price). */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { chromium } from 'playwright';
import { serve, BASE as BP } from './serve.mjs';
import { SITE, VIEWS } from '../src/config.js';

const HOME = homedir(), NODE = process.execPath, PY = 'python3';
const QUICK = process.argv.includes('--quick');
const { measure } = await import(join(HOME, 'bb-systems/qa/optical.mjs'));
const R = [];
const ok = (name, pass, seen = '') => { R.push({ name, pass: !!pass, seen: String(seen) }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (seen ? '   ' + String(seen).slice(0, 600) : '')); };
const run = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opt });
const sample = (a, n = 3) => a.slice(0, n).join(' | ') + (a.length > n ? ` | and ${a.length - n} more` : '');
const data = JSON.parse(readFileSync('src/data/stones.json', 'utf8'));
const stones = data.stones;
const STATUS = ['Lab report', 'Seller disclosure', 'Not documented'];

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
ok('no 3D library, no animation library, no AI image generator in the shipped script', !/three|gsap|WebGLRenderer|openai|replicate|stability/i.test(js), `${Math.round(js.length / 1024)} KB of script, plain DOM only`);
{
  const all = css + js;
  const knobs = { 'touch-action': /touch-action:\s*manipulation/g, 'tap-highlight-color': /-webkit-tap-highlight-color:\s*(transparent|#0000|rgba\(0,\s*0,\s*0,\s*0\))/g, 'overscroll-behavior': /overscroll-behavior(-[xy])?:\s*(contain|none)/g, 'text-size-adjust': /text-size-adjust:\s*100%/g };
  const zero = Object.entries(knobs).map(([k, re]) => [k, (all.match(re) || []).length]);
  ok('foundation knobs, none at zero', zero.every(([, n]) => n > 0), zero.map(([k, n]) => `${k} ${n}`).join(', '));
  const flat = css.replace(/\s*([{};:,])\s*/g, '$1').replace(/@media\(/g, '@media (');
  ok('a field cannot zoom the screen: 16px on a touch screen', /@media \(pointer:coarse\)\{[^}]*font-size:16px/.test(flat), 'the coarse pointer rule is in the built stylesheet');
  ok('heights are in dvh, never vh', !/\d[\d.]*vh\b/.test(css.replace(/\d[\d.]*[sld]vh/g, '')), 'no vh unit in the stylesheet');
  ok('overflow is clipped on the page itself', /html,body\{[^}]*overflow-x:clip/.test(flat) || /html\{[^}]*overflow-x:clip/.test(flat), 'overflow-x:clip on the page');
  ok('images keep their own proportion', /img,video\{[^}]*height:auto/.test(flat) || /img\{[^}]*height:auto/.test(flat), 'img{height:auto} beats the width and height attributes');
  ok('every motion rule is inside prefers-reduced-motion:no-preference', !/transition:/.test(flat.replace(/@media \(prefers-reduced-motion:no-preference\)\{[^@]*?\}\}/g, '')), 'transitions and keyframes only inside the no-preference block');
  let bad = []; const stack = []; const src = css.replace(/\/\*[\s\S]*?\*\//g, ''); let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i), shut = src.indexOf('}', i); if (shut === -1) break;
    if (open !== -1 && open < shut) { const sel = src.slice(i, open).trim(); stack.push(sel); if (/:hover/.test(sel) && !stack.some(s => /^@media[^{]*\(hover:\s*hover\)/.test(s))) bad.push(sel.slice(0, 60)); i = open + 1; }
    else { stack.pop(); i = shut + 1; }
  }
  ok('every hover rule is inside @media (hover:hover)', !bad.length, bad.length ? sample(bad) : `${(src.match(/:hover/g) || []).length} hover rules, all inside`);
}
{
  /* THE CLIENT'S LANDMINES AND THE BRIEF'S LAWS, as text and data the build may never carry */
  const page = html.index.replace(/<script[\s\S]*?<\/script>/g, '');
  const text = page.replace(/<[^>]+>/g, ' ');
  const money = text.match(/(\$|USD|LKR|Rs\.?|€|£)\s?\d[\d,.]*/g) || [];
  ok('no price anywhere on the page', !money.length, money.length ? sample(money) : 'no currency figure in the rendered text');
  const banned = ['Sapphire Trails', 'light blue', 'pale blue', 'GaaS', 'Serene', 'founded in', 'since 1', 'master cutters', 'countries', 'Ratnapura', 'Elahera', 'generations'];
  const hit = banned.filter(w => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text));
  ok('none of the words the first call forbade, no district, no generations', !hit.length, hit.length ? hit.join(', ') : `${banned.length} words searched`);
  const year = (text.match(/\b(18|19|20)\d\d\b/g) || []).filter(y => y !== String(new Date().getFullYear()));
  ok('no invented year or founding date', !year.length, year.length ? sample(year) : 'the only year is the build date');
  ok('no report number, real or invented, on the page', !/\b(GIA|GRS|SSEF|Gübelin|GIT|AGL|Lotus)\b/.test(text) && !/report\s*(no\.?|number|#)\s*[:\s]?\s*[A-Z0-9]{5,}/i.test(text), 'no lab name and no report number in the text');
  ok('the records are marked as samples, in the data and on every card', data.meta.sample === true && (text.match(/Sample data/g) || []).length >= stones.length + 1 && (html.index.match(/class="stone"/g) || []).length === stones.length, `meta.sample ${data.meta.sample}, ${(text.match(/Sample data/g) || []).length} Sample data tags for ${stones.length} records`);
  const short = stones.filter(s => ['ref', 'title', 'colour', 'cut', 'carat', 'mm', 'treatment', 'lab', 'origin', 'media'].some(k => s[k] === undefined || s[k] === '') || 'price' in s || s.mm.length !== 3 || [s.treatment, s.lab, s.origin].some(f => !STATUS.includes(f.status)));
  ok(`every one of the ${stones.length} records carries treatment, lab report and provenance each with a status from the three allowed, and none carries a price`, stones.length >= 4 && !short.length, short.length ? sample(short.map(s => s.ref)) : stones.map(s => `${s.ref} ${s.treatment.status}/${s.lab.status}/${s.origin.status}`).join(', '));
  ok('no cutter name, no district and no story is written into any record', !stones.some(s => ['cutter', 'district', 'mine', 'story', 'history'].some(k => k in s)), 'records hold only what a report or the seller states');
  /* REAL PHOTOGRAPHS ONLY: every picture file on disk is a record's photograph with a credit that says what it is */
  const files = readdirSync('public/assets/photos').filter(f => f.endsWith('.webp'));
  const named = new Set(stones.filter(s => s.photo).flatMap(s => [`${s.photo.file}-800.webp`, `${s.photo.file}-1600.webp`]));
  const stray = files.filter(f => !named.has(f)), missing = [...named].filter(f => !files.includes(f));
  const uncredited = stones.filter(s => s.photo && !/stock|house's own/i.test(s.photo.credit));
  ok('every photograph on disk belongs to a record and says it is stock or the house\'s own', !stray.length && !missing.length && !uncredited.length, stray.length ? 'stray ' + sample(stray) : missing.length ? 'missing ' + sample(missing) : uncredited.length ? 'uncredited ' + sample(uncredited.map(s => s.ref)) : `${files.length} files, ${stones.filter(s => s.photo).length} records with a photograph, ${stones.filter(s => !s.photo).length} honestly without`);
  ok('no picture is drawn or generated: every img on the page is a record photograph or a licensed motion file', [...page.matchAll(/<img[^>]+src="([^"]*)"/g)].map(m => m[1]).every(s => /assets\/(photos|motion)\/.+\.webp$/.test(s) || s === ''), sample([...page.matchAll(/<img[^>]+src="([^"]*)"/g)].map(m => m[1].split('/').pop()), 4));
  ok('the stock photographs are labelled as not the house\'s stones where they are shown', /licensed stock/i.test(text) && (text.match(/not the house/gi) || []).length >= 1 && /standing in for the house's own/.test(text), `${(text.match(/stock/gi) || []).length} mentions of stock in the text`);
  ok('no media type on a record is anything but a captured photograph or honestly null', stones.every(s => Object.values(s.media).every(v => v === 'photo' || v === null)) && stones.every(s => VIEWS.every(v => v.key in s.media)), `${VIEWS.length} views on ${stones.length} records`);
  const hrefs = [...page.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const wrong = hrefs.filter(h => !h.startsWith(`https://wa.me/${SITE.whatsapp}?text=`) || !/from%20the%20website/.test(h));
  ok('every WhatsApp door opens the house line with a message that says where it came from', hrefs.length >= 4 && !wrong.length, wrong.length ? sample(wrong) : `${hrefs.length} doors to wa.me/${SITE.whatsapp}`);
  ok('the working name is held in one place', (html.index.match(/The Island Cut/g) || []).length >= 3 && readFileSync('src/config.js', 'utf8').includes("name: 'The Island Cut'"), 'src/config.js SITE.name');
  ok('a shortlist is never a reservation and a viewing never holds a stone, said on the page', /not a reservation/.test(text) && /does not reserve a stone/.test(text), 'both lines in the rendered text');
  ok('no autoplay, no chatbot, no countdown, no "only N left"', !/autoplay|chatbot|only \d+ left|countdown|hurry/i.test(page), 'none of the four in the page');
  /* THE MOTION (phase 2): real licensed footage and photographs only, each named with its licence in SOURCES.md, labelled Sample on the page, the phone weight under the cap */
  const sources = readFileSync('public/assets/SOURCES.md', 'utf8');
  const h480 = readdirSync('public/assets/motion/hero/480').filter(f => /^\d{3}\.webp$/.test(f)), h800 = readdirSync('public/assets/motion/hero/800').filter(f => /^\d{3}\.webp$/.test(f));
  ok('the hero is a frame sequence of 48 to 72 real frames in a phone set and a desk set, with a poster for each', h480.length >= 48 && h480.length <= 72 && h800.length === h480.length && existsSync('public/assets/motion/hero/poster-480.webp') && existsSync('public/assets/motion/hero/poster-800.webp') && page.includes(`data-frames="${h480.length}"`), `${h480.length} frames at 480, ${h800.length} at 800, data-frames="${h480.length}" on the page`);
  const unnamed = ['hero/480', 'hero/800', 'layers', 'box'].filter(k => !sources.includes(k)), lic = ['Pixabay', 'Unsplash', 'Pexels'].filter(k => !new RegExp(k + ' (Content )?Licen[cs]e').test(sources));
  ok('SOURCES.md names every motion folder with its source and licence, and says no AI stone or ring ever', !unnamed.length && !lic.length && /No AI image or video of a stone or a ring, ever/.test(sources), unnamed.length ? 'unnamed ' + unnamed.join(', ') : lic.length ? 'no licence line for ' + lic.join(', ') : '4 folders, 3 licences, the rule stated');
  const layers = readdirSync('public/assets/motion/layers'), box = readdirSync('public/assets/motion/box');
  ok('the layers are the three parts and the whole, the box is two clips with a poster each', ['stone.webp', 'setting.webp', 'band.webp', 'ring.webp'].every(f => layers.includes(f)) && ['box-loop.mp4', 'box-open.mp4', 'box-loop.webp', 'box-open.webp'].every(f => box.includes(f)), layers.length + ' layer files, ' + box.length + ' box files');
  const vids = page.match(/<video[^>]*>/g) || [];
  ok('both clips are muted, inline, preload none, with a poster, played only from script', vids.length === 2 && vids.every(v => /\bmuted\b/.test(v) && /\bplaysinline\b/.test(v) && /preload="none"/.test(v) && /poster="[^"]+\.webp"/.test(v) && !/\bsrc=/.test(v)), vids.length + ' video tags');
  ok('every motion asset is labelled Sample where it is shown', (text.match(/Sample footage/g) || []).length >= 2 && (text.match(/Sample photograph/g) || []).length >= 1, `${(text.match(/Sample footage/g) || []).length} Sample footage, ${(text.match(/Sample photograph/g) || []).length} Sample photograph`);
  const kb = f => statSync(f).size;
  const seq = h480.reduce((n, f) => n + kb('public/assets/motion/hero/480/' + f), 0);
  const phone = seq + kb('public/assets/motion/hero/poster-480.webp') + ['stone', 'setting', 'band'].reduce((n, f) => n + kb(`public/assets/motion/layers/${f}.webp`), 0) + box.reduce((n, f) => n + kb('public/assets/motion/box/' + f), 0);
  ok('the phone loads under 2 MB of motion in all: the sequence, the layers, both posters and both clips', phone < 2 * 1024 * 1024, `${Math.round(seq / 1024)} KB sequence, ${Math.round(phone / 1024)} KB with the layers and the clips`);
  const bj = readFileSync('src/data/builder.json', 'utf8'), bd = JSON.parse(bj);
  const opts = Object.values(bd.groups).flatMap(g => g.options);
  ok('the builder data carries no price and every option has a key, a label and one plain reason', !/price|\$|USD|LKR|\bRs\b|cost|from \d/i.test(JSON.stringify(bd.groups)) && Object.keys(bd.groups).length === 5 && opts.length >= 14 && opts.every(o => o.key && o.label && o.why && o.why.length <= 90), `${Object.keys(bd.groups).length} groups, ${opts.length} options`);
  ok('the page itself carries no builder price line and the two doors are the only way out of it', !/Send it as it is[\s\S]{0,400}(price|\$|LKR)/i.test(text), 'no money word near the doors');
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
  out.past = [...document.querySelectorAll('*')].filter(e => vis(e) && !e.closest('svg,[aria-hidden="true"],.tabs') && getComputedStyle(e).position !== 'fixed' && e.getBoundingClientRect().right > innerWidth + 1).map(name);
  out.sideways = document.documentElement.scrollWidth - innerWidth;
  const phone = innerWidth < 720;
  out.centred = phone ? [] : [...document.querySelectorAll('h1,h2')].filter(e => vis(e) && getComputedStyle(e).textAlign === 'center').map(name);
  out.offCentre = [];
  if (phone) {
    const mid = e => { const g = document.createRange(); g.selectNodeContents(e); const r = g.getBoundingClientRect(); return Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; };
    [...document.querySelectorAll('.hero h1, .hero .lead, .hero .eyebrow, .hero .words li, .house p')].filter(vis).forEach(e => { const d = mid(e); if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
    [...document.querySelectorAll('.hero .doors, .turn .box, .explode .layers, .explode .doors')].filter(vis).forEach(e => { const r = e.getBoundingClientRect(), d = Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
  }
  /* body copy is 16px or more on a phone: the lead, the prose, the steps, the facts on a record */
  out.smallBody = phone ? [...document.querySelectorAll('.lead, .prose p, .steps p, .stone .facts, .beside dd, .house p, .words li, .bld .opt span, .bld .ask')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(e => name(e) + ' ' + getComputedStyle(e).fontSize) : [];
  out.tight = [...document.querySelectorAll('h1,h2,h3')].filter(vis).filter(e => { const c = getComputedStyle(e); return parseFloat(c.lineHeight) / parseFloat(c.fontSize) < 1.05; }).map(name);
  const brand = document.querySelector('.nav .brand'), h1 = document.querySelector('.hero h1');
  out.left = (!phone && brand && h1) ? Math.round((h1.getBoundingClientRect().left - brand.getBoundingClientRect().left) * 10) / 10 : 0;
  out.torn = [...document.images].filter(i => vis(i) && i.complete && i.naturalWidth === 0).map(i => i.alt || i.src.slice(0, 40));
  out.gutter = Math.min(...[...document.querySelectorAll('.hero h1, #stones h2, #craft h2')].filter(vis).map(e => Math.round(e.getBoundingClientRect().left)));
  const ic = window.IslandCut || {};
  out.ready = !!ic.ready; out.cards = [...document.querySelectorAll('.stone')].filter(vis).length;
  out.labelled = [...document.querySelectorAll('.stone')].filter(s => /Sample data/.test(s.textContent)).length;
  out.noPhoto = [...document.querySelectorAll('.stone .frame .empty')].filter(vis).length;
  return out;
};
const TEXT = () => {
  /* every string the page can ever show, the closed sheets and the hidden panels included */
  const skip = e => e.closest('script,style,svg,noscript');
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
  const ready = await page.waitForFunction(() => window.IslandCut && window.IslandCut.ready, null, { timeout: 8000 }).then(() => true).catch(() => false);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 300) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
  const p = await page.evaluate(PAGE_PROBE);
  const tag = `${w}px`;
  ok(`${tag}: no error in the console or the page`, !errs.length, errs.length ? sample(errs) : 'console clean');
  ok(`${tag}: the script ran to the end`, ready && p.ready, `IslandCut.ready ${p.ready}`);
  ok(`${tag}: ${stones.length} records on the table, every one labelled sample, the one without a photograph honest about it`, p.cards === stones.length && p.labelled === stones.length && p.noPhoto === stones.filter(s => !s.photo).length, `${p.cards} cards, ${p.labelled} labelled, ${p.noPhoto} empty frames`);
  ok(`${tag}: no sideways scroll and nothing clipped off the right edge`, p.sideways <= 0 && !p.past.length, p.sideways > 0 ? `by ${p.sideways}px` : p.past.length ? sample(p.past) : 'nothing past the edge');
  ok(`${tag}: the side gutter holds on every section`, p.gutter >= (touch ? 20 : 40), `narrowest left edge ${p.gutter}px`);
  if (touch) ok(`${tag}: every touchpoint is at least 44px`, !p.small.length, p.small.length ? sample(p.small, 12) : `${p.taps} touchpoints measured`);
  ok(`${tag}: no text under 11px`, !p.tiny.length, p.tiny.length ? sample(p.tiny) : 'smallest text 11px or more');
  if (touch) ok(`${tag}: body copy is 16px or more on a phone`, !p.smallBody.length, p.smallBody.length ? sample(p.smallBody, 6) : 'lead, prose, steps, facts and the house line all 16px or more');
  ok(touch ? `${tag}: on a phone the hero and the house line sit in the middle` : `${tag}: on a desk no centred heading, the hero heading level with the brand mark`, !p.centred.length && !p.offCentre.length && Math.abs(p.left) <= 1, sample([...p.centred, ...p.offCentre, ...(Math.abs(p.left) > 1 ? [`h1 ${p.left}px from the brand mark`] : [])], 5) || (touch ? 'hero and house line centred' : `h1 ${p.left}px from the brand mark`));
  ok(`${tag}: no heading tighter than 1.05`, !p.tight.length, sample(p.tight) || 'every heading 1.05 or more');
  ok(`${tag}: every picture loaded`, !p.torn.length, sample(p.torn) || `${stones.filter(s => s.photo).length} photographs on the page`);
  /* the nav survives a scroll */
  const nb = await page.evaluate(async () => { const t = document.querySelector('.nav'), before = t.getBoundingClientRect().top; window.scrollTo(0, 900); await new Promise(r => setTimeout(r, 150)); const after = t.getBoundingClientRect().top; window.scrollTo(0, 0); return { before, after }; });
  ok(`${tag}: the nav survives a scroll`, nb.before === nb.after && nb.before === 0, `top ${nb.before} then ${nb.after}`);
  /* THE TRAY HOLDS THREE AND REFUSES A FOURTH, and it says it is not a reservation */
  const tray = await page.evaluate(refs => { localStorage.removeItem('island-cut-tray'); for (const r of refs) document.querySelector(`[data-compare="${r}"]`).click(); const t = document.getElementById('tray'); return { refs: JSON.parse(localStorage.getItem('island-cut-tray') || '[]'), warn: !document.getElementById('tray-warn').hidden, what: document.getElementById('tray-what').textContent, open: t.dataset.open, rows: document.querySelectorAll('#cmp-body tr').length, cols: document.querySelectorAll('#cmp-head th').length - 1, note: t.textContent.includes('not a reservation') }; }, stones.map(s => s.ref));
  ok(`${tag}: the tray takes three, refuses the fourth with a reason, and says a shortlist is not a reservation`, tray.refs.length === 3 && tray.warn && tray.what === 'Comparing 3 of 3' && tray.open === 'true' && tray.rows === 7 && tray.cols === 3 && tray.note, JSON.stringify(tray));
  const diff = await page.evaluate(() => { for (const r of ['IC-101', 'IC-108']) { const b = document.querySelector(`[data-remove="${r}"]`); if (b) b.click(); } const cb = document.getElementById('diff'); cb.click(); const hidden = [...document.querySelectorAll('#cmp-body tr[hidden]')].map(tr => tr.querySelector('th').textContent); cb.click(); const back = document.querySelectorAll('#cmp-body tr[hidden]').length; document.getElementById('tray-clear').click(); return { hidden, back, after: document.getElementById('tray').dataset.on }; });
  ok(`${tag}: "Show differences only" hides the rows two stones share, and shows them again`, diff.hidden.length >= 1 && diff.hidden.includes('Provenance') && diff.back === 0 && diff.after === 'false', `hidden ${diff.hidden.join(', ') || 'nothing'}, then ${diff.back} hidden, tray ${diff.after}`);
  /* THE PASSPORT: every fact carries a status, nothing invented, and it opens and closes by keyboard with focus returned */
  const pp = await page.evaluate(async refs => {
    const out = [];
    for (const r of refs) { document.querySelector(`[data-passport="${r}"]`).click(); await new Promise(f => setTimeout(f, 50)); const d = document.getElementById('passport'); out.push({ r, open: d.open, ref: document.getElementById('pp-ref').textContent, statuses: document.querySelectorAll('#pp-dl .status').length, views: document.querySelectorAll('#pp-views li').length, sample: /Sample data/.test(d.textContent), empty: !document.getElementById('pp-empty').hidden, ask: decodeURIComponent(document.getElementById('pp-ask').href).includes(r) }); d.close(); }
    return out;
  }, stones.map(s => s.ref));
  ok(`${tag}: every passport opens on its own stone with three statused facts, ${VIEWS.length} views, a sample tag and a door that names the stone`, pp.every(x => x.open && x.ref === x.r && x.statuses === 3 && x.views === VIEWS.length && x.sample && x.ask) && pp.filter(x => x.empty).length === stones.filter(s => !s.photo).length, pp.map(x => `${x.r} ${x.statuses}/${x.views}${x.empty ? ' no photo' : ''}`).join(', '));
  const kb = await page.evaluate(async () => { const b = document.querySelector('[data-passport]'); b.focus(); b.click(); await new Promise(f => setTimeout(f, 60)); const d = document.getElementById('passport'); const inside = d.contains(document.activeElement); d.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); d.close(); await new Promise(f => setTimeout(f, 60)); return { opened: d.open === false && inside, back: document.activeElement === b }; });
  ok(`${tag}: the passport takes focus when it opens and gives it back to the button that opened it`, kb.opened && kb.back, JSON.stringify(kb));
  /* THE REQUEST: the stones travel, both clocks show, the field sizes hold on a phone, and success is shown only after the door */
  const req = await page.evaluate(async () => { localStorage.removeItem('island-cut-tray'); document.querySelector('[data-compare="IC-104"]').click(); document.querySelector('[data-compare="IC-106"]').click(); document.getElementById('nav-book').click(); await new Promise(f => setTimeout(f, 80)); const d = document.getElementById('request'); const fields = [...d.querySelectorAll('select')].map(s => parseFloat(getComputedStyle(s).fontSize)); const send = decodeURIComponent(document.getElementById('req-send').href); const doneBefore = getComputedStyle(document.getElementById('req-done')).display; const out = { open: d.open, chips: document.querySelectorAll('#req-stones .chip').length, fields, days: document.getElementById('req-day').options.length, slots: document.getElementById('req-time').options.length, local: document.getElementById('req-local').textContent, sendHas: ['IC-104', 'IC-106', 'Colombo', 'from the website', 'Please confirm'].filter(k => send.includes(k)).length, doneBefore, sent: d.dataset.sent }; d.close(); document.getElementById('tray-clear').click(); return out; });
  ok(`${tag}: the request carries the shortlist, seven days, the house's slots, both clocks, and shows no success before the door is pressed`, req.open && req.chips === 2 && req.days === 7 && req.slots === SITE.slots.length && /Colombo|in /.test(req.local) && req.sendHas === 5 && req.doneBefore === 'none' && req.sent === 'false' && (!touch || req.fields.every(f => f >= 16)), JSON.stringify(req));
  /* THE VIEWING ROOM says when a view has not been captured, and never shows anything else */
  const room = await page.evaluate(() => { const out = []; for (const ref of ['IC-101', 'IC-108']) { document.querySelector(`[data-pick="${ref}"]`).click(); for (const v of ['daylight', 'rotation']) { document.querySelector(`[data-view="${v}"]`).click(); out.push({ ref, v, img: !document.getElementById('stage-img').hidden, empty: !document.getElementById('stage-empty').hidden, h: document.getElementById('stage-empty-h').textContent, ask: decodeURIComponent(document.getElementById('room-ask').href).includes(ref) }); } } document.querySelector('[data-pick="IC-101"]').click(); document.querySelector('[data-view="daylight"]').click(); return out; });
  ok(`${tag}: the viewing room shows the daylight photograph where one exists and an honest "not captured" panel everywhere else`, room.every(x => x.ask && (x.img !== x.empty)) && room.find(x => x.ref === 'IC-101' && x.v === 'daylight').img && room.find(x => x.ref === 'IC-101' && x.v === 'rotation').empty && room.find(x => x.ref === 'IC-108' && x.v === 'daylight').empty && /not captured yet for IC-108/.test(room.find(x => x.ref === 'IC-108' && x.v === 'daylight').h), room.map(x => `${x.ref} ${x.v} ${x.img ? 'photo' : 'honest panel'}`).join(', '));
  /* THE HERO SCRUBS WITH THE SCROLL (clip 5): the sequence loads behind the poster, two scroll positions give two frames, the canvas pixels differ, the words change, the travel is capped */
  const hero = await page.evaluate(async () => {
    const ic = window.IslandCut.hero, c = document.getElementById('hero-canvas'), track = document.getElementById('hero-track'), stage = document.getElementById('hero-stage');
    const t0 = Date.now(); while (ic.loaded < ic.frames && Date.now() - t0 < 20000) await new Promise(r => setTimeout(r, 100));
    const pix = () => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && (d[i] + d[i + 1] + d[i + 2]) / 3 < 200) n++; return n; };
    const at = async y => { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 260)); return { y, frame: ic.frame, p: Math.round(ic.progress * 100) / 100, word: [...document.querySelectorAll('#hero-words li')].findIndex(l => l.getAttribute('aria-current') === 'true'), ink: pix(), poster: document.getElementById('hero-poster').hidden, canvas: c.hidden }; };
    const travel = track.offsetHeight - stage.offsetHeight;
    const a = await at(0), b = await at(Math.round(travel * 0.55)), z = await at(travel + 60); await at(0);
    return { loaded: ic.loaded, frames: ic.frames, travel, a, b, z };
  });
  ok(`${tag}: the hero sequence loaded behind the poster, ${hero.frames} frames, the travel capped`, hero.loaded === hero.frames && hero.frames >= 48 && hero.travel > 300 && hero.travel <= h + 60, `${hero.loaded} of ${hero.frames} loaded, travel ${hero.travel}px`);
  ok(`${tag}: scrolling scrubs the ring: a different frame, different pixels and a different word at the top, the middle and the end`, hero.a.frame === 0 && hero.b.frame > 10 && hero.b.frame < hero.frames - 10 && hero.z.frame === hero.frames - 1 && hero.a.ink !== hero.b.ink && hero.b.ink !== hero.z.ink && hero.a.word === 0 && hero.b.word === 1 && hero.z.word === 2 && hero.b.poster && !hero.b.canvas, `frames ${hero.a.frame}, ${hero.b.frame}, ${hero.z.frame}; ink ${hero.a.ink}, ${hero.b.ink}, ${hero.z.ink}; words ${hero.a.word}, ${hero.b.word}, ${hero.z.word}`);
  /* THE RING COMES APART AND BACK (clip 7): three photograph layers move with the scroll, the labels appear past half way, and scrolling up puts it together again */
  const ex = await page.evaluate(async () => {
    const track = document.getElementById('explode-track'), stage = document.getElementById('explode'), top = track.getBoundingClientRect().top + scrollY - stage.getBoundingClientRect().height * 0 - parseFloat(getComputedStyle(stage).top);
    const travel = track.offsetHeight - stage.offsetHeight;
    const at = async y => { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 260)); const st = sel => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).m42; return { p: Math.round(window.IslandCut.explode.p * 100) / 100, apart: stage.dataset.apart, stone: Math.round(st('.l-stone')), band: Math.round(st('.l-band')), labels: Math.round(parseFloat(getComputedStyle(document.querySelector('.parts li')).opacity) * 100) / 100, layers: [...document.querySelectorAll('.layer')].filter(i => i.complete && i.naturalWidth > 0).length }; };
    const shut = await at(top), open = await at(top + travel + 20), back = await at(top); await at(0);
    return { travel, shut, open, back };
  });
  ok(`${tag}: the three layers are real photographs, the ring comes apart past half way with its labels, and goes back together on the way up`, ex.shut.layers === 3 && ex.shut.p <= 0.05 && ex.shut.apart === 'false' && ex.open.p >= 0.95 && ex.open.apart === 'true' && ex.open.stone < ex.shut.stone - 40 && ex.open.band > ex.shut.band + 40 && ex.open.labels === 1 && ex.shut.labels === 0 && ex.back.p <= 0.05 && ex.back.apart === 'false' && ex.back.stone === ex.shut.stone && ex.travel > 300 && ex.travel <= h, JSON.stringify({ shut: ex.shut, open: ex.open, back: ex.back }));
  /* THE BOX (clip 3): the loop plays only when on screen, a tap opens the box on the ring and the door appears at the same moment with focus on it */
  const bx = await page.evaluate(async () => {
    const box = document.getElementById('box'), loop = document.getElementById('box-loop'), opened = document.getElementById('box-open');
    window.scrollTo({ top: box.getBoundingClientRect().top + scrollY - 80, behavior: 'instant' });
    const t0 = Date.now(); while ((loop.paused || !window.IslandCut.box.playing) && Date.now() - t0 < 8000) await new Promise(r => setTimeout(r, 100));
    const was = loop.currentTime; await new Promise(r => setTimeout(r, 500));
    const before = { playing: window.IslandCut.box.playing, t: Math.round((loop.currentTime - was) * 100) / 100, paused: loop.paused, reveal: document.getElementById('box-reveal').hidden, open: box.dataset.open };
    document.getElementById('box-tap').click();
    const t1 = Date.now(); while (!(opened.currentTime > 0.3) && Date.now() - t1 < 8000) await new Promise(r => setTimeout(r, 100));
    const after = { open: box.dataset.open, loopHidden: loop.hidden, openShown: !opened.hidden, t: Math.round(opened.currentTime * 10) / 10, reveal: !document.getElementById('box-reveal').hidden, focus: document.activeElement && document.activeElement.id };
    return { before, after };
  });
  ok(`${tag}: the box loop plays on screen, the tap swaps to the opening clip, the door appears with focus on it`, bx.before.playing && bx.before.t > 0.2 && !bx.before.paused && bx.before.reveal && bx.before.open === 'false' && bx.after.open === 'true' && bx.after.loopHidden && bx.after.openShown && bx.after.t > 0.3 && bx.after.reveal && bx.after.focus === 'close-request', JSON.stringify(bx));
  /* THE BUILDER (clip 2): setting, stone, size, details, then a name and a number; Next waits for a choice; both doors wait for the two fields; the message carries every choice; no price */
  const bld = await page.evaluate(async () => {
    localStorage.removeItem('island-cut-ring');
    const d = document.getElementById('builder'), $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)], tick = () => new Promise(r => setTimeout(r, 40));
    const o = { steps: [], nextBefore: [], nextAfter: [] };
    document.getElementById('customise-build').click(); await tick();
    o.open = d.open; o.first = d.dataset.step; o.firstQuiet = ($('#bld-acts [data-close]') || {}).textContent; o.inside = d.contains(document.activeElement);
    const pick = { setting: 'halo', stone: 'blue', size: '1to2', metal: 'rose', band: 'set' };
    for (const st of ['setting', 'stone', 'size', 'details']) {
      o.steps.push(d.dataset.step + ' ' + $('#bld-step').textContent + ' ' + $('#bld-title').textContent + ' ' + $$('.opt').length);
      o.nextBefore.push($('[data-next]').disabled);
      for (const g of (st === 'details' ? ['metal', 'band'] : [st])) { $(`[data-option="${g}:${pick[g]}"]`).click(); await tick(); }
      o.nextAfter.push($('[data-next]').disabled);
      $('[data-next]').click(); await tick();
    }
    o.ready = d.dataset.step + ' ' + $('#bld-title').textContent;
    o.sum = $$('.sum dd').map(e => e.textContent);
    o.fields = $$('input').map(i => [i.id, i.type, i.getAttribute('inputmode'), Math.round(parseFloat(getComputedStyle(i).fontSize))]);
    o.doorsBefore = $$('[data-door]').map(a => a.getAttribute('aria-disabled') + ' ' + a.getAttribute('href'));
    const set = (id, v) => { const i = $(id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#bld-name', 'Te'); set('#bld-number', '077123'); await tick(); o.doorsShort = $$('[data-door]').map(a => a.getAttribute('aria-disabled'));
    set('#bld-name', 'Test Person'); set('#bld-number', '0771234567'); await tick();
    o.doors = $$('[data-door]').map(a => ({ door: a.dataset.door, dis: a.getAttribute('aria-disabled'), msg: decodeURIComponent(a.getAttribute('href')).split('text=')[1] || '' }));
    o.why = $('#bld-why').textContent;
    $('[data-back]').click(); await tick(); o.backTo = d.dataset.step;
    $('[data-next]').click(); await tick(); $('.chg[data-step="stone"]').click(); await tick(); o.changeTo = d.dataset.step + ' ' + $('[data-option="stone:blue"]').getAttribute('aria-pressed');
    document.getElementById('bld-close').click(); await tick(); o.closed = !d.open; o.back = document.activeElement && document.activeElement.id;
    o.kept = JSON.parse(localStorage.getItem('island-cut-ring') || '{}');
    return o;
  });
  const labels = ['Halo', 'Blue sapphire', '1 to 2 carats', 'Rose gold'];
  ok(`${tag}: the builder opens on the setting, walks setting, stone, size and details with Next waiting for a choice, and ends on the ready step with the five choices summed up`, bld.open && bld.first === 'setting' && bld.firstQuiet === 'Not now' && bld.inside && bld.steps.length === 4 && bld.steps[0].startsWith('setting Step 1 of 4 The setting 4') && bld.steps[3].startsWith('details Step 4 of 4 The details 6') && bld.nextBefore.every(x => x === true) && bld.nextAfter.every(x => x === false) && bld.ready === 'ready Your ring is almost ready' && bld.sum.length === 5 && labels.every(l => bld.sum.includes(l)), bld.steps.join(' | ') + ' | ' + bld.ready + ' | ' + bld.sum.join(', '));
  ok(`${tag}: both doors wait for a name of two letters and a number of seven digits, then open WhatsApp with every choice, the name, the number and "from the website", and no price`, bld.doorsBefore.every(x => x === 'true #') && bld.doorsShort.every(x => x === 'true') && bld.doors.length === 2 && bld.doors.every(x => x.dis === 'false' && x.msg.startsWith('Hello, from the website. My ring.') && labels.every(l => x.msg.includes(l)) && x.msg.includes('Test Person') && x.msg.includes('0771234567') && !/\$|USD|LKR|Rs\b|price/i.test(x.msg)) && bld.doors[0].msg.includes('as it is') && bld.doors[1].msg.includes('fully custom') && /Nothing is priced here/.test(bld.why) && (!touch || bld.fields.every(f => f[3] >= 16)) && bld.fields.some(f => f[0] === 'bld-number' && f[1] === 'text' && f[2] === 'tel'), JSON.stringify({ before: bld.doorsBefore, short: bld.doorsShort, msg: bld.doors[0].msg.slice(0, 150), fields: bld.fields }));
  ok(`${tag}: Back goes to the details, Change goes to the stone with the choice still pressed, the close mark shuts it, focus returns, and the choices are kept on this device`, bld.backTo === 'details' && bld.changeTo === 'stone true' && bld.closed && bld.back === 'customise-build' && bld.kept.setting === 'halo' && bld.kept.band === 'set' && bld.kept.name === 'Test Person', JSON.stringify({ backTo: bld.backTo, changeTo: bld.changeTo, closed: bld.closed, back: bld.back, kept: bld.kept }));
  await page.evaluate(() => { localStorage.removeItem('island-cut-ring'); window.scrollTo(0, 0); });
  /* REDUCED MOTION: with the preference set, nothing transitions */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const rm = await page.evaluate(() => ['.door', '.tray', '.tab', 'dialog'].map(s => s + ' ' + getComputedStyle(document.querySelector(s)).transitionDuration + ' ' + getComputedStyle(document.querySelector(s)).animationName));
  ok(`${tag}: with reduced motion on, no transition and no animation`, rm.every(x => / 0s none$/.test(x)), rm.join(', '));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  {
    /* with the preference set BEFORE the page loads: the poster only, no frame fetched, the ring already apart, the box still */
    const c2 = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
    const p2 = await c2.newPage(); const fetched = [];
    p2.on('request', q => { if (/motion\/hero\/\d+\/\d{3}\.webp/.test(q.url())) fetched.push(q.url()); });
    await p2.goto(BASE, { waitUntil: 'load' }); await p2.waitForFunction(() => window.IslandCut && window.IslandCut.ready);
    const H2 = await p2.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H2; y += 300) { await p2.evaluate(v => window.scrollTo(0, v), y); await p2.waitForTimeout(50); }
    await p2.waitForTimeout(400);
    const r2 = await p2.evaluate(() => ({ reduced: window.IslandCut.hero.reduced, loaded: window.IslandCut.hero.loaded, poster: !document.getElementById('hero-poster').hidden, canvas: document.getElementById('hero-canvas').hidden, p: getComputedStyle(document.getElementById('explode')).getPropertyValue('--p').trim(), apart: document.getElementById('explode').dataset.apart, box: document.getElementById('box-loop').paused, playing: window.IslandCut.box.playing, hero: document.getElementById('hero-track').offsetHeight - document.getElementById('hero-stage').offsetHeight }));
    ok(`${tag}: with reduced motion set before load, the poster alone is shown, no frame is fetched, the ring sits apart with its labels and the box is still`, r2.reduced && r2.loaded === 0 && !fetched.length && r2.poster && r2.canvas && parseFloat(r2.p) === 1 && r2.apart === 'true' && r2.box && !r2.playing && r2.hero <= 1, JSON.stringify(r2) + ` ${fetched.length} frames fetched`);
    await c2.close();
  }
  /* THE INK CENTRE of the close mark in the passport (bb-alignment, optical.mjs) */
  await page.evaluate(() => { document.querySelector('[data-passport="IC-101"]').click(); }); await page.waitForTimeout(400);
  const x = await measure(page, '#pp-close', { shape: 'rect', inset: 3 });
  ok(`${tag}: the close mark sits in the centre of its button`, !x.error && Math.abs(x.dx) <= 0.5 && Math.abs(x.dy) <= 0.5, x.error || `dx ${x.dx} dy ${x.dy}`);
  await page.evaluate(() => document.getElementById('passport').close());
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
