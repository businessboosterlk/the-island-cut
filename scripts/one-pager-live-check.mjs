// usage: node check.mjs <url> <tag> [quick]
import { createRequire } from 'module';
const require = createRequire('/Users/thulaibhassen/bb-systems/batch/node_modules/');
const { chromium } = require('playwright');
const url = process.argv[2], tag = process.argv[3] || 'x', quick = process.argv[4] === 'quick';
const dir = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chromium' });
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
for (const [name, w, h, mobile] of [['desk', 1440, 900, false], ['phone', 390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text() + ' ' + (m.location().url || '').split('/').pop()); });
  page.on('pageerror', e => errs.push(String(e)));
  try { await page.goto(url, { waitUntil: 'load', timeout: 45000 }); } catch (e) { console.log('  (load event slow, carried on)'); }
  await page.waitForTimeout(2500);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h * 0.8) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(90); }
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, iw: innerWidth, ring: (document.querySelector('[data-ring]') || {}).offsetHeight, hidden: [...document.querySelectorAll('[data-needs][hidden]')].length, book: (document.body.innerText.match(/Book a/g) || []).length, arrange: (document.body.innerText.match(/Arrange a/g) || []).length }));
  console.log(`\n== ${name} ${w}x${h}: page height ${m.h}px = ${(m.h / h).toFixed(1)} screens; ring track ${m.ring}px; sideways ${m.sw > m.iw ? 'YES ' + m.sw : 'none'}; hidden picture sections ${m.hidden}; "Book a" ${m.book}, "Arrange a" ${m.arrange}`);
  if (m.sw > m.iw) fail(name + ' sideways scroll');
  if (!quick) {
    // FINDER: press every option one at a time, then every combination
    const groups = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-finder] input')].map(i => i.name))]);
    const counts = {};
    for (const g of groups) counts[g] = await page.locator(`[data-finder] input[name="${g}"]`).count();
    console.log('finder groups', JSON.stringify(counts));
    const read = () => page.evaluate(() => ({ say: document.querySelector('[data-say]').textContent, wa: decodeURIComponent(document.querySelector('[data-send]').href.split('text=')[1]) }));
    const okS = s => /^[A-Z]/.test(s) && /\.$/.test(s) && !/  |\.\.|,\.| ,|undefined|null/.test(s);
    for (const g of groups) for (let i = 0; i < counts[g]; i++) {
      await page.locator(`[data-finder] input[name="${g}"]`).nth(i).click({ force: true });
      const r = await read();
      if (name === 'desk') console.log(`  ${g}[${i}] -> ${r.say}`);
      if (!okS(r.say) || !okS(r.wa)) fail(`${name} sentence ${g}[${i}]: ${r.say} | ${r.wa}`);
    }
    let combos = 0; const idx = groups.map(() => 0);
    const total = groups.reduce((a, g) => a * counts[g], 1);
    for (let n = 0; n < total; n++) {
      let k = n; for (let gi = 0; gi < groups.length; gi++) { idx[gi] = k % counts[groups[gi]]; k = Math.floor(k / counts[groups[gi]]); }
      const r = await page.evaluate(({ groups, idx }) => { const f = document.querySelector('[data-finder]'); groups.forEach((g, gi) => { f.querySelectorAll(`input[name="${g}"]`)[idx[gi]].checked = true; }); f.dispatchEvent(new Event('change', { bubbles: true })); return { say: document.querySelector('[data-say]').textContent, wa: decodeURIComponent(document.querySelector('[data-send]').href.split('text=')[1]) }; }, { groups, idx });
      combos++;
      if (!okS(r.say) || !okS(r.wa)) fail(`${name} combo ${idx}: ${r.say}`);
      if (n === total - 1 && name === 'desk') console.log('  last combo WhatsApp text: ' + r.wa);
    }
    console.log(`  ${combos} combinations read, sentence and WhatsApp text checked`);
    // CAROUSEL
    await page.locator('[data-switch]').scrollIntoViewIfNeeded();
    const seen = [];
    const nDots = await page.locator('[data-dots] button').count();
    for (let i = 0; i < nDots; i++) { await page.locator('[data-next]').click(); await page.waitForTimeout(120); seen.push(await page.evaluate(() => document.querySelector('.cap.on').textContent + ' | ' + (document.querySelector('[data-pass]') ? document.querySelector('[data-pass]').innerText.replace(/\n+/g, ' / ') : 'no passport') + ' | ' + decodeURIComponent(document.querySelector('[data-ask]').href.split('text=')[1]))); }
    await page.locator('[data-prev]').click();
    for (let i = 0; i < nDots; i++) await page.locator('[data-dots] button').nth(i).click();
    console.log(`  carousel: ${nDots} markers, next x${nDots}, previous, every marker pressed`);
    if (name === 'desk') seen.forEach(s => console.log('   ' + s));
    // SHORTLIST
    if (await page.locator('[data-short]').count()) {
      const state = () => page.evaluate(() => ({ btn: document.querySelector('[data-short]').textContent.trim(), cols: document.querySelectorAll('[data-compare] [data-col]').length, shown: !document.querySelector('[data-compare]').hidden, note: (document.querySelector('[data-cnote]') || {}).textContent, wa: decodeURIComponent((document.querySelector('[data-csend]').href.split('text=')[1]) || '') }));
      for (let i = 0; i < 4; i++) {
        await page.locator('[data-dots] button').nth(i).click(); await page.waitForTimeout(80);
        await page.locator('[data-short]').click({ force: true }); await page.waitForTimeout(80);
        const s = await state();
        console.log(`  shortlist after adding piece ${i + 1}: ${s.cols} in compare, shown ${s.shown}, button "${s.btn}", note "${s.note}"`);
        if (name === 'desk') console.log('    WhatsApp: ' + s.wa);
        if (i < 3 && s.cols !== i + 1) fail(name + ' shortlist count ' + s.cols);
        if (i === 3 && s.cols !== 3) fail(name + ' fourth piece was not refused');
      }
      await page.locator('[data-compare]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${dir}${tag}-${name}-compare.png` });
      await page.locator('[data-compare] [data-drop]').first().click(); await page.waitForTimeout(80);
      let s = await state(); console.log(`  removed one from the compare table: ${s.cols} left`);
      if (s.cols !== 2) fail(name + ' remove');
      await page.locator('[data-dots] button').nth(1).click(); await page.locator('[data-short]').click({ force: true });
      await page.locator('[data-dots] button').nth(2).click(); await page.locator('[data-short]').click({ force: true });
      s = await state(); console.log(`  toggled the last two off from the card: ${s.cols} left, compare shown ${s.shown}`);
      if (s.cols !== 0 || s.shown) fail(name + ' empty shortlist still shown');
    }
    // EXPLAINERS
    const nd = await page.locator('.know details').count();
    for (let i = 0; i < nd; i++) { await page.locator('.know summary').nth(i).click(); }
    if (nd) { const open = await page.locator('.know details[open]').count(); console.log(`  explainers: ${nd} pressed, ${open} open, first reads: ` + (await page.locator('.know details p').first().innerText()).slice(0, 60)); if (open !== nd) fail(name + ' explainers'); await page.locator('.know').screenshot({ path: `${dir}${tag}-${name}-know.jpg`, type: 'jpeg', quality: 60 }); for (let i = 0; i < nd; i++) await page.locator('.know summary').nth(i).click(); }
    // DRAG TO COMPARE by keyboard
    if (await page.locator('.cmp .grip').count()) { await page.locator('.cmp .grip').focus(); await page.keyboard.press('End'); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight'); console.log('  two lights: End, Home, ArrowRight ->', await page.locator('.cmp .grip').getAttribute('aria-valuenow')); }
    // every link: anchors land, WhatsApp links are wa.me
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({ t: a.textContent.trim().slice(0, 40), h: a.getAttribute('href'), ok: a.getAttribute('href').startsWith('#') ? !!document.querySelector(a.getAttribute('href')) : /^https:\/\/wa\.me\/\d+\?text=/.test(a.href) || /^(tel|mailto):/.test(a.href) })));
    links.filter(l => !l.ok).forEach(l => fail(name + ' link ' + l.t + ' ' + l.h));
    console.log(`  ${links.length} links: ${links.filter(l => l.h.startsWith('#')).length} in-page targets exist, ${links.filter(l => !l.h.startsWith('#')).length} WhatsApp doors`);
    for (const sel of ['.nav .door', '.hero .doors a:nth-child(1)', '.hero .doors a:nth-child(2)']) { await page.evaluate(() => scrollTo(0, 0)); await page.locator(sel).click(); await page.waitForTimeout(900); const y = await page.evaluate(() => Math.round(scrollY)); console.log(`  pressed ${sel} -> scrolled to ${y}`); if (y < 200) fail(name + ' ' + sel + ' did not move'); }
  }
  if (!quick) for (const [sel, n] of [['.switch', 'card'], ['.close', 'close'], ['.finder', 'finder']]) if (await page.locator(sel).count()) { await page.locator(sel).scrollIntoViewIfNeeded(); await page.locator(sel).screenshot({ path: `${dir}${tag}-${name}-${n}.jpg`, type: 'jpeg', quality: 60 }); }
  const m2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  if (m2.sw > m2.iw) fail(name + ' sideways scroll after pressing');
  console.log(`  console errors: ${errs.length}${errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''}`);
  const real = errs.filter(e => !/woff2|CORS/.test(e) || !url.startsWith('file:')); if (real.length) bad++;
  await page.evaluate(() => scrollTo(0, 0));
  if (!quick) await page.screenshot({ path: `${dir}${tag}-${name}.jpg`, fullPage: true, type: 'jpeg', quality: 60 });
  await ctx.close();
}
await browser.close();
console.log(bad ? `\n${bad} PROBLEM(S)` : '\nALL CLEAN');
