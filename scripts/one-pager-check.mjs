// Looks at the packed one pager in a real browser and presses the switching.
// Run:  node scripts/one-pager-check.mjs [folder that holds the packed page]
// Writes stills/desk-1440.png, stills/phone-390.png, stills/*-fold.png, stills/text.txt and prints one line per check.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const out = path.resolve(process.argv[2] || path.join(os.homedir(), 'Downloads/HOUSE-OF-PRIYANTHA-ONE-PAGER'));
const url = pathToFileURL(path.join(out, 'House of Priyantha one pager.html')).href;
const stills = path.join(out, 'stills');
fs.mkdirSync(stills, { recursive: true });
let fails = 0;
const say = (ok, what, saw) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}: ${saw}`); };

// The full Chromium build is the one installed on the BB machine (the headless shell is not).
const browser = await chromium.launch({ channel: 'chromium' });
const state = page => page.evaluate(() => {
  const r = document.querySelector('[data-switch]');
  const on = [...r.querySelectorAll('[data-slide]')].findIndex(s => s.classList.contains('on'));
  const cap = r.querySelector('[data-cap].on');
  const vis = [...r.querySelectorAll('[data-slide]')].filter(s => getComputedStyle(s).opacity !== '0').length;
  const b = r.querySelector('[data-stage]').getBoundingClientRect();
  const c = r.querySelector('.caps').getBoundingClientRect();
  return { at: +r.dataset.at, count: +r.dataset.count, slide: on, cap: cap ? cap.textContent : '', visible: vis,
    dot: [...r.querySelectorAll('[data-dots] button')].findIndex(d => d.getAttribute('aria-current') === 'true') + 1,
    box: [b.x, b.y + scrollY, b.width, b.height, c.y + scrollY, c.height].map(n => Math.round(n * 10) / 10).join(','),
    ask: decodeURIComponent(document.querySelector('[data-ask]').href.split('text=')[1]) };
});
const settle = page => page.waitForTimeout(650);

for (const v of [{ name: 'desk-1440', width: 1440, height: 900, scale: 1 }, { name: 'phone-390', width: 390, height: 844, scale: 2, touch: true }]) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale, hasTouch: !!v.touch, isMobile: !!v.touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('[data-switch]').dataset.count && [...document.querySelectorAll('[data-slide]')].every(s => s.dataset.state));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(stills, `${v.name}-fold.png`) });
  await page.screenshot({ path: path.join(stills, `${v.name}.png`), fullPage: true });
  if (v.name === 'desk-1440') fs.writeFileSync(path.join(stills, 'text.txt'), await page.evaluate(() => document.body.innerText));

  const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  say(wide <= 0, `${v.name} no sideways scroll`, `${wide} px over`);
  const small = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getClientRects().length && parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.textContent.trim().slice(0, 30)));
  say(small.length === 0, `${v.name} no text under 11 px`, small.length ? small.join(' | ') : 'none');
  const fonts = await page.evaluate(() => [document.fonts.check("16px 'Cormorant Garamond'"), document.fonts.check("16px 'Instrument Sans'")].join(','));
  say(fonts === 'true,true', `${v.name} both fonts loaded`, fonts);

  await page.locator('[data-switch]').scrollIntoViewIfNeeded();
  const s0 = await state(page);
  const n = s0.count;
  say(s0.at === 1 && s0.visible === 1, `${v.name} starts on piece 1 with one picture showing`, JSON.stringify(s0));
  const seen = [s0.cap];
  let boxes = new Set([s0.box]);
  for (let i = 0; i < n; i++) { await page.locator('[data-next]').click(); await settle(page); const s = await state(page); seen.push(s.cap); boxes.add(s.box); }
  const sN = await state(page);
  say(sN.at === 1 && new Set(seen.slice(0, n)).size === n, `${v.name} next pressed ${n} times shows ${n} captions and wraps to piece 1`, seen.join(' > '));
  await page.locator('[data-prev]').click(); await settle(page);
  const sP = await state(page); boxes.add(sP.box);
  say(sP.at === n, `${v.name} previous from piece 1 wraps to piece ${n}`, `at ${sP.at}, "${sP.cap}"`);
  const dots = [];
  for (let i = 0; i < n; i++) { await page.locator('[data-dots] button').nth(i).click(); await settle(page); const s = await state(page); boxes.add(s.box); dots.push(`${s.at}/${s.dot}/${s.visible}`); }
  say(dots.every((d, i) => d === `${i + 1}/${i + 1}/1`), `${v.name} each dot shows its own piece (piece/dot/pictures showing)`, dots.join(' '));
  const sD = await state(page);
  say(sD.ask.endsWith(`${sD.cap}.`), `${v.name} the ask door carries the caption on show`, sD.ask);

  await page.locator('[data-stage]').focus();
  const keys = [];
  for (const k of ['Home', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'End', 'ArrowRight', 'ArrowLeft']) { await page.keyboard.press(k); await settle(page); const s = await state(page); boxes.add(s.box); keys.push(`${k}:${s.at}`); }
  const want = ['Home:1', 'ArrowRight:2', 'ArrowRight:3', 'ArrowLeft:2', `End:${n}`, 'ArrowRight:1', `ArrowLeft:${n}`].join(' ');
  say(n < 3 || keys.join(' ') === want, `${v.name} keyboard`, keys.join(' '));

  await page.keyboard.press('Home'); await settle(page);
  const box = await page.locator('[data-stage]').boundingBox();
  const drag = async (from, to) => { await page.mouse.move(box.x + box.width * from, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width * to, box.y + box.height / 2, { steps: 6 }); await page.mouse.up(); await settle(page); };
  await drag(.75, .25); const sw1 = await state(page);
  await drag(.25, .75); const sw2 = await state(page);
  say(sw1.at === 2 && sw2.at === 1, `${v.name} drag left then right on the picture`, `left gives piece ${sw1.at}, right gives piece ${sw2.at}`);
  if (v.touch) {
    const cdp = await ctx.newCDPSession(page);
    const y = box.y + box.height / 2;
    const touch = async (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', box.x + box.width * .8); for (const f of [.7, .6, .5, .4, .3]) await touch('touchMove', box.x + box.width * f); await touch('touchEnd');
    await settle(page);
    const st = await state(page);
    say(st.at === 2, `${v.name} finger swipe left on the picture`, `piece ${st.at}`);
    await page.keyboard.press('Home'); await settle(page);
  }
  say(boxes.size === 1, `${v.name} the picture box and caption never moved through every press`, `${boxes.size} position(s) seen: ${[...boxes].join(' ; ')}`);
  // THE RING: the track is three screens, one text shows at a time, the stage stays pinned and it ends back on the first frame.
  const track = await page.evaluate(() => { const e = document.querySelector('[data-ring]'); return { screens: Math.round(e.offsetHeight / innerHeight * 100) / 100, still: e.dataset.still }; });
  say(track.still === 'false' && Math.abs(track.screens - 3) < .05, `${v.name} the ring track is three screens of scroll`, JSON.stringify(track));
  const ringAt = async p => {
    await page.evaluate(p => { const e = document.querySelector('[data-ring]'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY + (e.offsetHeight - innerHeight) * p, behavior: 'instant' }); }, p);
    await page.waitForFunction(() => (document.querySelector('[data-ring]').dataset.loaded || '').split(' ').length === 2);
    await page.waitForTimeout(600);
    return page.evaluate(() => { const e = document.querySelector('[data-ring]'); return { step: e.dataset.step, frame: e.dataset.frame, apart: e.dataset.apart,
      on: [...e.querySelectorAll('[data-step]')].filter(s => getComputedStyle(s).opacity === '1').map(s => s.querySelector('h2').textContent), pin: Math.round(e.querySelector('.pin').getBoundingClientRect().top) }; });
  };
  const rs = [];
  for (const [i, p] of [.12, .5, .88].entries()) { rs.push(await ringAt(p)); await page.screenshot({ path: path.join(stills, `${v.name}-ring-${i + 1}.png`) }); }
  say(rs.map(x => x.step).join('') === '123' && rs.every(x => x.on.length === 1 && x.pin === 0) && rs[1].apart !== '' && rs[0].apart === '' && rs[2].apart === '', `${v.name} ring: three steps, one text at a time, stage pinned, parts apart in step 2 only`, JSON.stringify(rs));
  const ends = [await ringAt(0), await ringAt(1)];
  say(ends[0].frame === '0' && ends[1].frame === '0', `${v.name} ring starts and ends on the first frame, the blue stone`, `start frame ${ends[0].frame}, end frame ${ends[1].frame}`);
  const rows = await page.locator('.know dl div').count();
  say(rows === 6, `${v.name} the knowledge list has six rows`, String(rows));
  for (const [sel, name] of [['.know', 'know'], ['.pieces', 'pieces']]) { await page.locator(sel).evaluate(e => e.scrollIntoView({ behavior: 'instant', block: 'start' })); await page.waitForTimeout(250); await page.screenshot({ path: path.join(stills, `${v.name}-${name}.png`) }); }
  say(errors.length === 0, `${v.name} no script errors`, errors.join(' | ') || 'none');
  await ctx.close();

  // (reduced motion below also turns the ring into a still with its three texts stacked)
  const calm = await browser.newContext({ viewport: { width: v.width, height: v.height }, reducedMotion: 'reduce' });
  const p2 = await calm.newPage();
  await p2.goto(url);
  await p2.waitForFunction(() => document.querySelector('[data-switch]').dataset.count);
  const dur = await p2.evaluate(() => getComputedStyle(document.querySelector('[data-slide]')).transitionDuration + ' / ' + getComputedStyle(document.querySelector('[data-cap]')).transitionDuration + ' / ' + getComputedStyle(document.documentElement).scrollBehavior);
  say(dur === '0s / 0s / auto', `${v.name} reduced motion means an instant swap`, dur);
  const stillRing = await p2.evaluate(() => { const e = document.querySelector('[data-ring]'); return e.dataset.still + ' / ' + Math.round(e.offsetHeight / innerHeight * 10) / 10 + ' screens / ' + [...e.querySelectorAll('[data-step]')].filter(s => getComputedStyle(s).opacity === '1').length + ' texts showing'; });
  say(stillRing.startsWith('true') && stillRing.endsWith('3 texts showing'), `${v.name} reduced motion makes the ring a still with all three texts`, stillRing);
  await calm.close();
}
await browser.close();

// The words a person reads (innerText, never the source) go through BB's house style check and a banned word list.
const text = fs.readFileSync(path.join(stills, 'text.txt'), 'utf8');
const hs = spawnSync('python3', [path.join(os.homedir(), 'bb-consultancy/house_style.py'), path.join(stills, 'text.txt')], { encoding: 'utf8' });
const hsFails = (hs.stdout || '').split('\n').filter(l => l.includes('[FAIL]'));
say(hs.status === 0 && hsFails.length === 0 && /\[OK/.test(hs.stdout || ''), 'house style on the rendered words', hsFails.join(' | ') || 'every line OK');
const banned = text.replace(/Natural does not mean untreated\./g, '').match(/sapphire trails|untreated|unheated|certif|\breport|\bcarat|\bct\b|LKR|\bRs\.|\$|\bEst\b|since \d|light blue|pale blue|Sri Lankan origin/gi) || [];
say(banned.length === 0, 'no word the client has not confirmed (certificate, treatment, origin, price, weight, year)', banned.join(', ') || 'none found');
const tagged = (text.match(/Generated sample/g) || []).length;
say(tagged >= 2 && /generated samples/.test(text), 'the pictures are marked as generated samples', `${tagged} labels and the closing note`);
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
process.exit(fails ? 1 : 0);
