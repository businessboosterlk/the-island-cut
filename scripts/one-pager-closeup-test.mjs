// Proves the close-up band on a THROWAWAY copy of the packed page, with a stand-in picture cut from the hero still.
// The stand-in never reaches the delivered folder. Run: node scripts/one-pager-closeup-test.mjs <scratch folder>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { chromium } from 'playwright';

const src = path.join(os.homedir(), 'Downloads/HOUSE-OF-PRIYANTHA-ONE-PAGER');
const out = path.resolve(process.argv[2]);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets/one-pager/products'), { recursive: true });
fs.copyFileSync(path.join(src, 'House of Priyantha one pager.html'), path.join(out, 'page.html'));
fs.cpSync(path.join(src, 'assets/fonts'), path.join(out, 'assets/fonts'), { recursive: true });
fs.copyFileSync(path.join(src, 'assets/one-pager/hero-start.webp'), path.join(out, 'assets/one-pager/hero-start.webp'));
await sharp(path.join(src, 'assets/one-pager/hero-start.webp')).extract({ left: 494, top: 451, width: 320, height: 224 }).resize(640, 448).jpeg({ quality: 85 }).toFile(path.join(out, 'assets/one-pager/products/closeup.jpg'));
const browser = await chromium.launch({ channel: 'chromium' });
let fails = 0;
for (const v of [{ name: 'desk-1440', width: 1440, height: 900 }, { name: 'phone-390', width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  await page.goto(pathToFileURL(path.join(out, 'page.html')).href);
  await page.waitForFunction(() => document.querySelector('[data-closeup]').dataset.state);
  const band = page.locator('[data-closeup]');
  await band.evaluate(e => e.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `${v.name}-closeup.png`) });
  const saw = await band.evaluate(e => { const i = e.querySelector('img').getBoundingClientRect(); return { hidden: e.hidden, shown: Math.round(i.width), natural: e.querySelector('img').naturalWidth, over: document.documentElement.scrollWidth - innerWidth, text: e.innerText.replace(/\n+/g, ' | ') }; });
  const ok = !saw.hidden && saw.shown <= saw.natural && saw.over <= 0 && /Generated sample/.test(saw.text);
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${v.name} close-up band shows, never wider than the picture, labelled: ${JSON.stringify(saw)}`);
  if (v.name === 'desk-1440') fs.writeFileSync(path.join(out, 'closeup.txt'), await band.evaluate(e => e.innerText));
  await page.close();
}
await browser.close();
const hs = spawnSync('python3', [path.join(os.homedir(), 'bb-consultancy/house_style.py'), path.join(out, 'closeup.txt')], { encoding: 'utf8' });
const bad = (hs.stdout || '').split('\n').filter(l => l.includes('[FAIL]'));
if (bad.length) fails++;
console.log(`${bad.length ? 'FAIL' : 'PASS'}  house style on the band's words: ${bad.join(' | ') || 'every line OK'}`);
process.exit(fails ? 1 : 0);
