#!/usr/bin/env node
/* THE ISLAND CUT GATE. Every rule the page must keep, as a check that can fail.
   A. the source and the built files, read without a browser
   B. the page in a real browser, phone and desk: errors, the records, the tray's limit, the sheets, taps, fields,
      centring, the nav, the keyboard, reduced motion, the ink centre of the close mark, the words
   Every FAIL line says what was seen. Exit 1 on any FAIL.
     node scripts/check-site.mjs            phone and desk
     node scripts/check-site.mjs --quick    phone only
   Method: ~/.claude/skills/bb-click-path, bb-app-foundations, look/BRIEF-10-FEATURES.md (phase 1). */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
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
  ok('no picture is drawn or generated: every img on the page is one of those files', [...page.matchAll(/<img[^>]+src="([^"]*)"/g)].map(m => m[1]).every(s => /assets\/photos\/.+\.webp$/.test(s) || s === ''), sample([...page.matchAll(/<img[^>]+src="([^"]*)"/g)].map(m => m[1].split('/').pop()), 4));
  ok('the stock photographs are labelled as not the house\'s stones where they are shown', /licensed stock/i.test(text) && (text.match(/not the house/gi) || []).length >= 1 && /take this place/.test(text), `${(text.match(/stock/gi) || []).length} mentions of stock in the text`);
  ok('no media type on a record is anything but a captured photograph or honestly null', stones.every(s => Object.values(s.media).every(v => v === 'photo' || v === null)) && stones.every(s => VIEWS.every(v => v.key in s.media)), `${VIEWS.length} views on ${stones.length} records`);
  const hrefs = [...page.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const wrong = hrefs.filter(h => !h.startsWith(`https://wa.me/${SITE.whatsapp}?text=`) || !/from%20the%20website/.test(h));
  ok('every WhatsApp door opens the house line with a message that says where it came from', hrefs.length >= 4 && !wrong.length, wrong.length ? sample(wrong) : `${hrefs.length} doors to wa.me/${SITE.whatsapp}`);
  ok('the working name is held in one place', (html.index.match(/The Island Cut/g) || []).length >= 3 && readFileSync('src/config.js', 'utf8').includes("name: 'The Island Cut'"), 'src/config.js SITE.name');
  ok('a shortlist is never a reservation and a viewing never holds a stone, said on the page', /not a reservation/.test(text) && /does not reserve a stone/.test(text), 'both lines in the rendered text');
  ok('no autoplay, no chatbot, no countdown, no "only N left"', !/autoplay|chatbot|only \d+ left|countdown|hurry/i.test(page), 'none of the four in the page');
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
    [...document.querySelectorAll('.hero h1, .hero .lead, .hero .eyebrow, .hero .state-note, .house p')].filter(vis).forEach(e => { const d = mid(e); if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
    [...document.querySelectorAll('.hero .doors .door, .hero .state')].filter(vis).forEach(e => { const r = e.getBoundingClientRect(), d = Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
  }
  /* body copy is 16px or more on a phone: the lead, the prose, the steps, the facts on a record */
  out.smallBody = phone ? [...document.querySelectorAll('.lead, .prose p, .steps p, .stone .facts, .beside dd, .house p')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(e => name(e) + ' ' + getComputedStyle(e).fontSize) : [];
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
  /* THE HERO'S SECOND STATE is an honest empty frame, never a drawing */
  const hero = await page.evaluate(() => { document.querySelector('.hero .state [data-state="piece"]').click(); const o = { img: !document.getElementById('hero-img').hidden, empty: !document.getElementById('hero-piece').hidden, imgs: document.querySelectorAll('#hero-frame img:not([hidden])').length, pressed: document.querySelector('.hero .state [data-state="piece"]').getAttribute('aria-pressed') }; document.querySelector('.hero .state [data-state="stone"]').click(); return o; });
  ok(`${tag}: "The finished piece" shows an honest empty frame and no picture`, !hero.img && hero.empty && hero.imgs === 0 && hero.pressed === 'true', JSON.stringify(hero));
  /* REDUCED MOTION: with the preference set, nothing transitions */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const rm = await page.evaluate(() => ['.door', '.tray', '.tab', 'dialog'].map(s => s + ' ' + getComputedStyle(document.querySelector(s)).transitionDuration + ' ' + getComputedStyle(document.querySelector(s)).animationName));
  ok(`${tag}: with reduced motion on, no transition and no animation`, rm.every(x => / 0s none$/.test(x)), rm.join(', '));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
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
