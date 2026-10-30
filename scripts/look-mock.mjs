import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chromium' });
const url = 'file://' + process.cwd() + '/look/mock/index.html';
for (const [name, w, h] of [['phone', 390, 844], ['desk', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
  await page.screenshot({ path: `look/mock/mock-${name}-fold.png` });
  await page.screenshot({ path: `look/mock/mock-${name}-full.png`, fullPage: true });
  await ctx.close();
}
await browser.close(); console.log('mock rendered');
