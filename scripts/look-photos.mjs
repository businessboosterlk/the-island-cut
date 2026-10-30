/* LOOK ROUND, step 2: candidate photographs of REAL sapphires from Unsplash and Pexels (both licences allow
   commercial use without credit; the source and photographer are recorded anyway). Writes a contact sheet. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 2400 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
const page = await ctx.newPage();
const found = [];
for (const [src, url] of [
  ['unsplash', 'https://unsplash.com/s/photos/blue-sapphire'],
  ['unsplash', 'https://unsplash.com/s/photos/sapphire-gemstone'],
  ['pexels', 'https://www.pexels.com/search/sapphire%20gemstone/'],
  ['pexels', 'https://www.pexels.com/search/blue%20sapphire/'],
]) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 1500); await page.waitForTimeout(1200); }
    const items = await page.evaluate(s => [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, alt: i.alt || '' , w: i.naturalWidth })).filter(i => s === 'unsplash' ? /images\.unsplash\.com\/photo-/.test(i.src) : /images\.pexels\.com\/photos\/\d+/.test(i.src)), src);
    for (const it of items) {
      const id = src === 'unsplash' ? (it.src.match(/photo-[0-9a-f-]+/) || [])[0] : (it.src.match(/photos\/(\d+)/) || [])[1];
      if (!id || found.some(f => f.id === id)) continue;
      const full = src === 'unsplash' ? `https://images.unsplash.com/${id}?w=2400&q=85&fit=max` : it.src.replace(/\?.*$/, '') + '?auto=compress&w=2400';
      const thumb = src === 'unsplash' ? `https://images.unsplash.com/${id}?w=600&q=70&fit=max` : it.src.replace(/\?.*$/, '') + '?auto=compress&w=600';
      found.push({ src, id, alt: it.alt.slice(0, 90), full, thumb, page: url });
    }
    console.log(src, url, items.length);
  } catch (e) { console.log('FAILED', url, String(e).slice(0, 100)); }
}
const top = found.slice(0, 36);
writeFileSync('look/photos/candidates.json', JSON.stringify(top, null, 2));
const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#fff;font:13px/1.3 -apple-system,sans-serif}.g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#eee}figcaption{padding:4px 2px;color:#333}</style><div class=g>${top.map((t, i) => `<figure><img src="${t.thumb}"><figcaption><b>${i + 1}</b> ${t.src} ${t.alt || ''}</figcaption></figure>`).join('')}</div>`;
writeFileSync('look/photos/sheet.html', html);
await page.goto('file://' + process.cwd() + '/look/photos/sheet.html'); await page.waitForTimeout(6000);
await page.screenshot({ path: 'look/photos/sheet.png', fullPage: true });
console.log('candidates', top.length);
await browser.close();
