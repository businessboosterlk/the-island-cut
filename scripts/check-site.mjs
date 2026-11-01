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
  /* THE MOTION (phase 2, hero rebuilt 1 Nov 2026 pm): the hero is ONE ring in sixty GENERATED frames (Blender, scripts/render-ring.py) that turns with the scroll, said so on the page and in SOURCES.md; everything else is real licensed footage and photographs, each named with its licence in SOURCES.md, labelled Sample on the page; the phone weight under the cap */
  const sources = readFileSync('public/assets/SOURCES.md', 'utf8');
  /* v4 (1 Nov 2026 pm): the two set widths are read from the page's SET const, so index.astro, hero-frames.sh and this check move together */
  const SETM = readFileSync('src/pages/index.astro', 'utf8').match(/const SET = \{ desk: (\d+), phone: (\d+) \}/), SETW = { desk: +SETM[1], phone: +SETM[2] };
  const FR = 60, FW = [SETW.phone, SETW.desk], fname = (w, i) => i == null ? `poster-${w}.webp` : `ring-${w}-${String(i).padStart(3, '0')}.webp`;
  const lost = FW.flatMap(w => [null, ...Array.from({ length: FR }, (_, i) => i)].filter(i => !existsSync('public/assets/motion/hero-ring/' + fname(w, i))).map(i => fname(w, i)));
  ok('the hero is one ring in sixty frames at two widths with a poster each, six stops on the page as stages, a canvas, the stills hero gone', !lost.length && page.includes('data-stages="6"') && page.includes('data-frames="60"') && (page.match(/class="still"/g) || []).length === 1 && page.includes('id="turntable"') && !existsSync('public/assets/motion/hero-ai') && !existsSync('public/assets/motion/hero'), lost.length ? 'missing ' + lost.slice(0, 5).join(', ') + (lost.length > 5 ? ` and ${lost.length - 5} more` : '') : `60 frames at ${SETW.phone} and ${SETW.desk}, a poster each, data-stages="6", data-frames="60"`);
  const unnamed = ['hero-ring', 'journey', 'box'].filter(k => !sources.includes(k)), lic = ['Unsplash', 'Pexels'].filter(k => !new RegExp(k + ' (Content )?Licen[cs]e').test(sources));
  ok('SOURCES.md names every motion folder with its source and licence, says the hero frames are generated and that the house\'s own photographs replace them', !unnamed.length && !lic.length && /hero-ring[\s\S]*generated/i.test(sources) && /own photographs replace/.test(sources), unnamed.length ? 'unnamed ' + unnamed.join(', ') : lic.length ? 'no licence line for ' + lic.join(', ') : '3 folders, 2 licences, the hero disclosed as generated');
  /* THE JOURNEY (Thulaib's six stops, 1 Nov 2026 pm): the hero's ring comes apart in thirty-two more GENERATED frames at the hero's two widths, cut by scripts/journey-frames.sh to one crop with a poster of the last frame at each width; the page lays the apart canvas over the opening's by the numbers the cutter printed (CROP.txt and ALIGN.txt), so the swap at stop 5 lands on the same pixels */
  const TURN = (page.match(/<figure class="turn"[^>]*>/) || [''])[0], td = k => (TURN.match(new RegExp(`data-${k}="([^"]*)"`)) || [])[1];
  const AF = +td('apart-frames'), AB = +td('apart-break'), AP = { desk: +td('desk'), phone: +td('phone') }, AS = +td('apart-s');
  const apart = existsSync('public/assets/motion/journey') ? readdirSync('public/assets/motion/journey') : [], box = readdirSync('public/assets/motion/box');
  const apName = (w, i) => `apart-${w}-${String(i).padStart(3, '0')}.webp`;
  ok('the journey is thirty-two frames at each of the hero\'s two widths with an apart poster at each and a break half way, the box two clips with a poster each', AF === 32 && AB === 16 && AP.desk > 0 && AP.phone > 0 && [AP.desk, AP.phone].every(w => Array.from({ length: AF }, (_, i) => apName(w, i)).every(f => apart.includes(f)) && apart.includes(`poster-apart-${w}.webp`)) && ['box-loop.mp4', 'box-open.mp4', 'box-loop.webp', 'box-open.webp'].every(f => box.includes(f)), `${apart.length} journey files (${AF} frames, break ${AB}, named ${AP.desk} and ${AP.phone}), ${box.length} box files`);
  { const crop = existsSync('public/assets/motion/journey/CROP.txt') ? readFileSync('public/assets/motion/journey/CROP.txt', 'utf8').match(/crop (\d+)x(\d+)/) : null, align = existsSync('public/assets/motion/journey/ALIGN.txt') ? readFileSync('public/assets/motion/journey/ALIGN.txt', 'utf8').match(/sits at (\d+),(\d+)/) : null;
    const css = k => +(page.match(new RegExp(`id="apart-canvas"[^>]*--${k}:([\\d.]+)`)) || [])[1], near = (x, y) => Math.abs(x - y) < 0.00051;
    ok('the page lays the apart canvas over the opening by the crop the cutter printed: its width and height, and where the hero crop sits inside it', !!crop && !!align && +td('apart-w') === +crop[1] && +td('apart-h') === +crop[2] && near(css('aw'), +crop[1] / AS) && near(css('ah'), +crop[2] / AS) && near(css('ax'), +align[1] / AS) && near(css('ay'), +align[2] / AS), crop && align ? `crop ${crop[1]}x${crop[2]}, hero at ${align[1]},${align[2]}; page w ${td('apart-w')} h ${td('apart-h')} ax ${css('ax')} ay ${css('ay')} aw ${css('aw')} ah ${css('ah')}` : 'no CROP.txt or ALIGN.txt in motion/journey'); }
  const vids = page.match(/<video[^>]*>/g) || [];
  ok('both clips are muted, inline, preload none, with a poster, played only from script', vids.length === 2 && vids.every(v => /\bmuted\b/.test(v) && /\bplaysinline\b/.test(v) && /preload="none"/.test(v) && /poster="[^"]+\.webp"/.test(v) && !/\bsrc=/.test(v)), vids.length + ' video tags');
  ok('every motion asset is labelled where it is shown: the ring as a generated sample, the box as Sample footage', (text.match(/Generated sample/g) || []).length >= 1 && (text.match(/Sample footage/g) || []).length >= 1, `${(text.match(/Generated sample/g) || []).length} Generated sample, ${(text.match(/Sample footage/g) || []).length} Sample footage`);
  const kb = f => existsSync(f) ? statSync(f).size : 0;
  const seq = kb(`public/assets/motion/hero-ring/poster-${SETW.phone}.webp`) + Array.from({ length: FR }, (_, i) => kb('public/assets/motion/hero-ring/' + fname(SETW.phone, i))).reduce((a, b) => a + b, 0);
  const apSeq = kb(`public/assets/motion/journey/poster-apart-${AP.phone}.webp`) + Array.from({ length: AF }, (_, i) => kb('public/assets/motion/journey/' + apName(AP.phone, i))).reduce((a, b) => a + b, 0);
  const phone = seq + apSeq + box.reduce((n, f) => n + kb('public/assets/motion/box/' + f), 0);
  ok('the phone loads under 2 MB of motion in all: the sixty hero frames and the poster, the thirty-two journey frames and their poster, both box posters and both clips', phone < 2 * 1024 * 1024 && apSeq > 0, `${Math.round(seq / 1024)} KB of hero frames, ${Math.round(apSeq / 1024)} KB of journey frames, ${Math.round(phone / 1024)} KB in all`);
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
  out.past = [...document.querySelectorAll('*')].filter(e => vis(e) && !e.closest('svg,[aria-hidden="true"],.tabs,.turn') && getComputedStyle(e).position !== 'fixed' && e.getBoundingClientRect().right > innerWidth + 1).map(name); /* the hero ring is carried across the desk by the scroll and may cross the edge (ChatGPT's opening, 1 Nov 2026); the hero check proves no sideways scroll */
  out.sideways = document.documentElement.scrollWidth - innerWidth;
  const phone = innerWidth < 720;
  out.centred = phone ? [] : [...document.querySelectorAll('h1,h2')].filter(e => vis(e) && getComputedStyle(e).textAlign === 'center').map(name);
  out.offCentre = [];
  if (phone) {
    const mid = e => { const g = document.createRange(); g.selectNodeContents(e); const r = g.getBoundingClientRect(); return Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; };
    [...document.querySelectorAll('.hero h1, .hero .h, .hero .intro, .hero .edition, .hero .sample, .house p')].filter(vis).forEach(e => { const d = mid(e); if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
  }
  /* body copy is 16px or more on a phone: the lead, the prose, the steps, the facts on a record */
  out.smallBody = phone ? [...document.querySelectorAll('.lead, .prose p, .steps p, .stone .facts, .beside dd, .house p, .hero .intro, .bld .opt span, .bld .ask')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(e => name(e) + ' ' + getComputedStyle(e).fontSize) : [];
  /* the opening's display headline is ChatGPT's, set at .86 on the desk and .88 on the phone (Thulaib, 1 Nov 2026 pm: "follow what he did"); every other heading keeps the 1.05 floor */
  out.tight = [...document.querySelectorAll('h1,h2,h3')].filter(vis).filter(e => !e.closest('.hero .chapters')) /* ChatGPT's own line heights in the opening, taken whole (1 Nov 2026) */.filter(e => { const c = getComputedStyle(e); return parseFloat(c.lineHeight) / parseFloat(c.fontSize) < 1.05; }).map(name);
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
  /* THE OPENING TURNS WITH THE SCROLL, THEN THE RING DROPS AND COMES APART (ChatGPT's layout of 1 Nov 2026 taken whole as stops 1 to 3; Thulaib's stops 4 to 6 that evening: "we scroll 3 times and the ring moves to the side. When we scroll the 4th time, the ring drops down. Scroll the 5th time, then the ring breaks once, and then scroll the 6th time, the whole ring breaks apart, but it has gone down"): the sixty frames and the thirty-two load; stop 1 frame 0, chapter 01, the ring at rest; the middle of stop 2 about frame 30, chapter 02, the ring carried across the desk (wave near 1) or swayed on the phone; the end of stop 3 frame 58 or 59, chapter 03; stop 4 frame 59 held, chapter 04, the drop at 1, the ring lower and smaller; stop 5 an apart frame below the break, chapter 05, the apart canvas over the opening's; the end apart frame 31, chapter 06, the three labels up one after another beside the picture; back at the top frame 0, chapter 01, whole, no label; the ring never covers the foot row on the phone; the travel capped; nothing played on load */
  const hero = await page.evaluate(async (touch) => {
    const ic = window.IslandCut.hero, track = document.getElementById('hero-track'), stage = document.getElementById('hero-stage'), turn = document.getElementById('turn'), foot = document.querySelector('.hero .foot');
    const poster = document.getElementById('hero-poster'), canvas = document.getElementById('turntable'), apart = document.getElementById('apart-canvas'), number = document.getElementById('chapter-number');
    const t0 = Date.now(); while ((ic.loaded < ic.frames || (!ic.apart.failed && ic.apart.loaded < ic.apart.frames)) && Date.now() - t0 < 40000) await new Promise(r => setTimeout(r, 100));
    const at = async (y, ms = 420) => { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, ms)); const tb = turn.getBoundingClientRect(), cb = canvas.getBoundingClientRect(), ab = apart.getBoundingClientRect(), fb = foot.getBoundingClientRect(), lab = [...document.querySelectorAll('#apart-labels li')].map(l => l.getBoundingClientRect()); return { y, stage: ic.stage, stop: ic.stop, p: Math.round(ic.progress * 100) / 100, w: Math.round(ic.wave * 100) / 100, drop: Math.round(ic.drop * 100) / 100, number: number.textContent, ringMid: Math.round((tb.left + tb.right) / 2), ringTop: Math.round(cb.top), ringH: Math.round(cb.height), ringBottom: Math.round(tb.bottom), apartBottom: Math.round(ab.bottom), footTop: Math.round(fb.top), chapter: [...document.querySelectorAll('#hero-words li')].findIndex(l => l.getAttribute('aria-current') === 'true'), shown: [...document.querySelectorAll('#hero-words li')].filter(l => getComputedStyle(l).display !== 'none').length, frame: ic.frame, apart: ic.apart.frame, settled: stage.dataset.settled, labels: [...document.querySelectorAll('#apart-labels li')].filter(l => l.dataset.on === 'true' && parseFloat(getComputedStyle(l).opacity) > 0.99).length, up: document.querySelectorAll('#apart-labels li[data-on="true"]').length, labelsRight: lab.every(r => r.left >= ab.right - 1), labelsInside: lab.every(r => r.top >= ab.top - 1 && r.bottom <= ab.bottom + 1), labelsOnScreen: lab.every(r => r.right <= innerWidth + 1 && r.left >= -1), posterOn: poster.getAttribute('aria-current') === 'true', canvasOn: canvas.classList.contains('ready') && getComputedStyle(canvas).opacity === '1', apartOn: apart.classList.contains('ready') && getComputedStyle(apart).opacity === '1', bar: getComputedStyle(document.getElementById('hero-progress')).transform }; };
    const travel = track.offsetHeight - stage.offsetHeight;
    const a = await at(0), b = await at(Math.round(travel * 0.25)), z = await at(Math.round(travel * 0.49)), d = await at(Math.round(travel * 0.66)), e = await at(Math.round(travel * 0.78)), soon = await at(travel + 60, 120), f = await at(travel + 60, 700), back = await at(0);
    const btn = document.getElementById('hero-still'); btn.click(); await new Promise(r => setTimeout(r, 300));
    const on = { still: ic.still, poster: poster.getAttribute('aria-current') === 'true', frame: ic.frame, apart: ic.apart.frame, labels: document.querySelectorAll('#apart-labels li[data-on="true"]').length, label: btn.textContent, h: Math.round(btn.getBoundingClientRect().height), hero: document.getElementById('hero').dataset.still, track: track.offsetHeight - stage.offsetHeight };
    btn.click(); await new Promise(r => setTimeout(r, 300));
    const off = { still: ic.still, poster: poster.getAttribute('aria-current') === 'true', frame: ic.frame, label: btn.textContent, hero: document.getElementById('hero').dataset.still };
    return { loaded: ic.loaded, frames: ic.frames, failed: ic.failed, apartLoaded: ic.apart.loaded, apartFrames: ic.apart.frames, apartFailed: ic.apart.failed, stages: ic.stages, travel, a, b, z, d, e, soon, f, back, on, off, sideways: document.documentElement.scrollWidth > innerWidth + 1 };
  }, touch);
  ok(`${tag}: the sixty opening frames and the thirty-two apart frames loaded; six chapters, one shown at a time; the page never scrolls sideways; the travel capped`, hero.loaded === hero.frames && hero.frames === 60 && !hero.failed && hero.apartLoaded === hero.apartFrames && hero.apartFrames === 32 && !hero.apartFailed && hero.stages === 6 && [hero.a, hero.b, hero.z, hero.d, hero.e, hero.f].every(x => x.shown === 1) && !hero.sideways && hero.travel > 300 && hero.travel <= 2500, `${hero.loaded} of ${hero.frames} frames and ${hero.apartLoaded} of ${hero.apartFrames} apart frames loaded; ${hero.a.shown} chapter shown; sideways ${hero.sideways}; travel ${hero.travel}px`);
  ok(`${tag}: stops 1 to 3 are the opening as it was: frame 0, chapter 01 and the ring at rest at the top; the middle of stop 2 about frame 30, chapter 02 and the ring ${touch ? 'swayed' : 'carried across the desk'}; frame 58 or 59, chapter 03 and no drop at the end of stop 3; the canvas shown, the poster and the apart canvas hidden`, hero.a.frame === 0 && hero.a.chapter === 0 && hero.a.number === '01' && hero.a.w === 0 && hero.a.apart === -1 && hero.b.frame >= 28 && hero.b.frame <= 32 && hero.b.chapter === 1 && hero.b.number === '02' && hero.b.w > 0.95 && (touch ? hero.b.ringMid !== hero.a.ringMid : hero.b.ringMid < hero.a.ringMid - 200) && hero.z.frame >= 57 && hero.z.chapter === 2 && hero.z.number === '03' && hero.z.drop === 0 && [hero.a, hero.b, hero.z].every(x => x.canvasOn && !x.posterOn && !x.apartOn), `frames ${hero.a.frame}, ${hero.b.frame}, ${hero.z.frame}; chapters ${hero.a.number}, ${hero.b.number}, ${hero.z.number}; ring middle ${hero.a.ringMid}px, ${hero.b.ringMid}px; wave ${hero.a.w}, ${hero.b.w}; drop ${hero.z.drop}; canvas ${hero.a.canvasOn}, ${hero.b.canvasOn}, ${hero.z.canvasOn}`);
  ok(`${tag}: stop 4 drops the ring: frame 59 held, chapter 04, the drop at 1, the ring lower on the screen and smaller than at the end of stop 3; stop 5 breaks it once: an apart frame below the break, chapter 05, the apart canvas shown in place of the opening's, no label; stop 6 breaks it apart: the last apart frame, chapter 06, settled, the three labels up one after another off the right of the picture inside its height and on the screen; back at the top frame 0, chapter 01, whole, no label, the ring where it started`, hero.d.frame === 59 && hero.d.chapter === 3 && hero.d.number === '04' && hero.d.drop >= 0.99 && hero.d.apart === -1 && hero.d.ringTop > hero.z.ringTop + 20 && hero.d.ringH < hero.z.ringH - 20 && hero.e.apart >= 8 && hero.e.apart <= 15 && hero.e.chapter === 4 && hero.e.number === '05' && hero.e.apartOn && !hero.e.canvasOn && hero.e.labels === 0 && hero.f.apart === 31 && hero.f.chapter === 5 && hero.f.number === '06' && hero.f.settled === 'true' && hero.f.labels === 3 && hero.soon.up >= 1 && hero.soon.up < 3 && hero.f.labelsRight && hero.f.labelsInside && hero.f.labelsOnScreen && hero.back.frame === 0 && hero.back.chapter === 0 && hero.back.apart === -1 && hero.back.settled === 'false' && hero.back.labels === 0 && hero.back.ringMid === hero.a.ringMid, JSON.stringify({ z: { top: hero.z.ringTop, h: hero.z.ringH }, d: { frame: hero.d.frame, n: hero.d.number, drop: hero.d.drop, top: hero.d.ringTop, h: hero.d.ringH }, e: { apart: hero.e.apart, n: hero.e.number, on: hero.e.apartOn, under: !hero.e.canvasOn }, soon: hero.soon.up, f: { apart: hero.f.apart, n: hero.f.number, settled: hero.f.settled, labels: hero.f.labels, right: hero.f.labelsRight, inside: hero.f.labelsInside, onScreen: hero.f.labelsOnScreen }, back: { frame: hero.back.frame, n: hero.back.number, labels: hero.back.labels, mid: hero.back.ringMid } }));
  if (touch) ok(`${tag}: on the phone the ring sits above the foot row at every stop, never over "Meet the house" or the still control`, [hero.a, hero.b, hero.z].every(x => x.ringBottom <= x.footTop + 1) && hero.f.apartBottom <= hero.f.footTop + 1, [hero.a, hero.b, hero.z].map(x => `ring bottom ${x.ringBottom}px, foot top ${x.footTop}px`).join('; ') + `; apart bottom ${hero.f.apartBottom}px, foot top ${hero.f.footTop}px at the end`);
  ok(`${tag}: "Use a still" brings the poster back, stops the turn, puts the ring back together with no label and collapses the track to one screen; pressing it again brings the turn back; the control is a 44px target`, hero.on.still && hero.on.poster && hero.on.frame === -1 && hero.on.apart === -1 && hero.on.labels === 0 && /scroll/.test(hero.on.label) && hero.on.h >= 44 && hero.on.hero === 'true' && hero.on.track <= 1 && !hero.off.still && !hero.off.poster && hero.off.frame === 0 && /still/.test(hero.off.label) && hero.off.hero === 'false', `${JSON.stringify(hero.on)} then ${JSON.stringify(hero.off)}`);
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
  ok(`${tag}: the box loop plays on screen, the tap swaps to the opening clip, the door appears with focus on it`, bx.before.playing && bx.before.t > 0.2 && !bx.before.paused && bx.before.reveal && bx.before.open === 'false' && bx.after.open === 'true' && bx.after.loopHidden && bx.after.openShown && bx.after.t >= 0.25 && bx.after.reveal /* the opening clip has played at least a quarter second; 0.3 exactly was read once on 1 Nov 2026 */ && bx.after.focus === 'close-request', JSON.stringify(bx));
  /* THE BUILDER (clip 2): setting, stone, size, details, then a name and a number; Next waits for a choice; both doors wait for the two fields; the message carries every choice; no price */
  const bld = await page.evaluate(async () => {
    localStorage.removeItem('island-cut-ring');
    const d = document.getElementById('builder'), $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)], tick = () => new Promise(r => setTimeout(r, 40));
    const o = { steps: [], nextBefore: [], nextAfter: [] };
    document.getElementById('bespoke-build').click(); await tick();
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
  ok(`${tag}: Back goes to the details, Change goes to the stone with the choice still pressed, the close mark shuts it, focus returns, and the choices are kept on this device`, bld.backTo === 'details' && bld.changeTo === 'stone true' && bld.closed && bld.back === 'bespoke-build' && bld.kept.setting === 'halo' && bld.kept.band === 'set' && bld.kept.name === 'Test Person', JSON.stringify({ backTo: bld.backTo, changeTo: bld.changeTo, closed: bld.closed, back: bld.back, kept: bld.kept }));
  await page.evaluate(() => { localStorage.removeItem('island-cut-ring'); window.scrollTo(0, 0); });
  /* REDUCED MOTION: with the preference set, nothing transitions */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const rm = await page.evaluate(() => ['.door', '.tray', '.tab', 'dialog'].map(s => s + ' ' + getComputedStyle(document.querySelector(s)).transitionDuration + ' ' + getComputedStyle(document.querySelector(s)).animationName));
  ok(`${tag}: with reduced motion on, no transition and no animation`, rm.every(x => / 0s none$/.test(x)), rm.join(', '));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  {
    /* with the preference set BEFORE the page loads: the poster only, no frame fetched, the ring whole, the box still */
    const c2 = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
    const p2 = await c2.newPage(); const fetched = [];
    p2.on('request', q => { if (/motion\/(hero-ring|journey)\//.test(q.url())) fetched.push(q.url()); });
    await p2.goto(BASE, { waitUntil: 'load' }); await p2.waitForFunction(() => window.IslandCut && window.IslandCut.ready);
    const H2 = await p2.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H2; y += 300) { await p2.evaluate(v => window.scrollTo(0, v), y); await p2.waitForTimeout(50); }
    await p2.waitForTimeout(400);
    const r2 = await p2.evaluate(() => ({ reduced: window.IslandCut.hero.reduced, loaded: window.IslandCut.hero.loaded, posterOn: document.getElementById('hero-poster').getAttribute('aria-current') === 'true', frame: window.IslandCut.hero.frame, stage: window.IslandCut.hero.stage, canvasOn: document.getElementById('turntable').classList.contains('ready'), label: document.getElementById('hero-still').textContent, counter: getComputedStyle(document.querySelector('.hero .chapter')).visibility, settled: document.getElementById('hero-stage').dataset.settled, labels: [...document.querySelectorAll('#apart-labels li')].filter(l => l.dataset.on === 'true' && parseFloat(getComputedStyle(l).opacity) > 0.99).length, apartOn: document.getElementById('apart-canvas').classList.contains('ready'), apartLoaded: window.IslandCut.hero.apart.loaded, drop: getComputedStyle(document.getElementById('hero-stage')).getPropertyValue('--drop').trim(), box: document.getElementById('box-loop').paused, playing: window.IslandCut.box.playing, hero: document.getElementById('hero-track').offsetHeight - document.getElementById('hero-stage').offsetHeight }));
    ok(`${tag}: with reduced motion set before load, the poster sits still with the first chapter and no counter, only the poster is fetched, no frame, the track is one screen, the control says reduced motion is on, the ring stays whole with no label, no drop and no journey frame fetched, and the box is still`, r2.reduced && r2.loaded === 0 && fetched.every(u => /poster-/.test(u)) && fetched.filter(u => /hero-ring/.test(u)).length <= 1 && !fetched.some(u => /journey/.test(u)) && r2.posterOn && !r2.canvasOn && r2.frame === -1 && r2.stage === 0 && /Reduced motion/.test(r2.label) && r2.counter === 'hidden' && r2.settled === 'false' && r2.labels === 0 && !r2.apartOn && r2.apartLoaded === 0 && parseFloat(r2.drop) === 0 && r2.box && !r2.playing && r2.hero <= 1, JSON.stringify(r2) + ` ${fetched.length} motion files fetched: ${fetched.map(u => u.split('/').pop()).join(', ')}`);
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
