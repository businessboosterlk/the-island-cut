// EVERY ICON ON THIS SITE COMES FROM A LICENSED ICON SET. NOBODY DRAWS ONE BY HAND.
//   line icons   Lucide (ISC), via lucide-static      brand marks  Simple Icons (CC0), via simple-icons
// Writes src/data/icons.json and public/assets/icons.svg. `--check` fails if either differs from the packages.
// Follows ~/bb-websites/bswl/scripts/build-icons.mjs and ~/bb-websites/sastho/scripts/build-icons.mjs.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const LINE = { arrow: 'arrow-right', down: 'chevron-down', check: 'check', close: 'x', shield: 'shield-check', video: 'video', report: 'file-text', truck: 'truck', bank: 'landmark', chat: 'message-circle', sun: 'sun', ruler: 'ruler', hand: 'hand', gem: 'gem', move: 'move-3d', up: 'arrow-up' };
const BRAND = { whatsapp: 'whatsapp', instagram: 'instagram' };
const inner = svg => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
const ver = p => JSON.parse(readFileSync(`node_modules/${p}/package.json`, 'utf8')).version;
const out = { _source: { line: 'lucide-static ' + ver('lucide-static') + ' (ISC)', brand: 'simple-icons ' + ver('simple-icons') + ' (CC0-1.0)' }, line: {}, brand: {} };
for (const [k, f] of Object.entries(LINE)) out.line[k] = inner(readFileSync(`node_modules/lucide-static/icons/${f}.svg`, 'utf8'));
for (const [k, f] of Object.entries(BRAND)) out.brand[k] = inner(readFileSync(`node_modules/simple-icons/icons/${f}.svg`, 'utf8')).replace(/<title>.*?<\/title>/, '');
const json = JSON.stringify(out, null, 1) + '\n';
const sprite = '<!-- Built by scripts/build-icons.mjs from ' + out._source.line + ' and ' + out._source.brand + '. Do not edit by hand. -->\n<svg xmlns="http://www.w3.org/2000/svg">\n'
  + Object.entries(out.line).map(([k, v]) => `<symbol id="${k}" viewBox="0 0 24 24">${v}</symbol>`).join('\n') + '\n'
  + Object.entries(out.brand).map(([k, v]) => `<symbol id="b-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('\n') + '\n</svg>\n';
// The favicon is the same licensed gem symbol on the brand square. Nobody draws it either.
const favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1b3fa8"/><g transform="translate(12 12) scale(1.6667)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + out.line.gem + '</g></svg>\n';
const J = 'src/data/icons.json', S = 'public/assets/icons.svg', F = 'public/favicon.svg';
if (process.argv.includes('--check')) {
  const bad = [[J, json], [S, sprite], [F, favicon]].filter(([f, want]) => !existsSync(f) || readFileSync(f, 'utf8') !== want).map(([f]) => f);
  if (bad.length) { console.error('FAIL  ' + bad.join(' and ') + ' do not match the icon packages. Run: npm run icons'); process.exit(1); }
  console.log('PASS  icons match the packages: ' + Object.keys(out.line).length + ' line, ' + Object.keys(out.brand).length + ' brand');
} else {
  mkdirSync('src/data', { recursive: true }); mkdirSync('public/assets', { recursive: true });
  writeFileSync(J, json); writeFileSync(S, sprite); writeFileSync(F, favicon);
  console.log('wrote ' + J + ', ' + S + ' and ' + F + ': ' + Object.keys(out.line).length + ' line, ' + Object.keys(out.brand).length + ' brand');
}
