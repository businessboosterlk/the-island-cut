import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.goto('file://' + process.cwd() + '/look/LOOK-BOARD.html', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
await page.screenshot({ path: 'look/LOOK-BOARD.png', fullPage: true });
const t = await page.evaluate(() => document.body.innerText);
await browser.close(); console.log('board rendered', t.length, 'chars');
