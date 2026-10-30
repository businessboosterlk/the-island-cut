/* LOOK ROUND, step 1: open real gem houses in a real browser and keep a picture of each for the board.
   Reference only. Nothing from these pages is copied into the build. */
import { chromium } from 'playwright';
const SITES = [
  ['gubelin', 'https://www.gubelin.com/'],




];
const browser = await chromium.launch({ channel: 'chromium' });
for (const [name, url] of SITES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    /* decline cookie banners where a decline exists, else leave them */
    for (const t of ['Reject all', 'Decline', 'Refuse', 'Only necessary', 'Reject', 'Accept all', 'Accept']) {
      const b = page.getByRole('button', { name: t, exact: false }).first();
      if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `look/refs/${name}-fold.png` });
    await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(1500);
    await page.screenshot({ path: `look/refs/${name}-fold2.png` });
    const info = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      const h = document.querySelector('h1') || document.querySelector('h2');
      const hs = h ? getComputedStyle(h) : null;
      return { bg: cs.backgroundColor, bodyFont: cs.fontFamily.split(',')[0], h1: h ? h.textContent.trim().slice(0, 80) : null, h1Font: hs ? hs.fontFamily.split(',')[0] : null, h1Size: hs ? hs.fontSize : null, nav: [...document.querySelectorAll('nav a, header a')].map(a => a.textContent.trim()).filter(t => t && t.length < 24).slice(0, 10) };
    });
    console.log(name, JSON.stringify(info));
  } catch (e) { console.log(name, 'FAILED', String(e).slice(0, 120)); }
  await ctx.close();
}
await browser.close();
