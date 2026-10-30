// The Island Cut (working name). Astro static site on the BB stack standard (2026-09-09).
// TWO VALUES CHANGE WHEN THE SITE MOVES TO THE HOUSE'S OWN DOMAIN: SITE_URL and BASE_PATH, as environment
// variables in the build. The defaults are the GitHub Pages address under businessboosterlk.
import { defineConfig } from 'astro/config';
const site = process.env.SITE_URL || 'https://businessboosterlk.github.io';
const base = process.env.BASE_PATH || '/the-island-cut';
export default defineConfig({
  site, base, output: 'static', trailingSlash: 'ignore',
  build: { format: 'file', assets: 'assets/app' },
  devToolbar: { enabled: false },
  vite: { build: { cssCodeSplit: false, assetsInlineLimit: 0 } }
});
