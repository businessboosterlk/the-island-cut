# RECIPE: House of Priyantha one pager

Kind: website page, a sample for a client meeting, front end only
Live: none. Not deployed. It opens from this folder with a double click.
Ignore: stills/, node_modules/, dist/
Last verified: 2026-11-12

## 1. What it is

One page for House of Priyantha, built 12 Nov 2026 for an 8pm client meeting. Top to bottom: a still hero, a dark
close-up band (hidden until its picture exists), the ring journey in three steps on three screens of scroll, a
list of six points on how a sapphire is judged, a section where one product picture at a time swaps in place and
a short close with the "Book a private viewing" door. Desk and phone have their own layouts. The hero is still:
the colour change on scroll waits on bb_pending row 1843.

## 2. Where the source lives

- Clone `~/bb-websites/hop-hero/site`, branch `hero-one-stone-two-moments`. Never the shared tree
  `~/bb-websites/the-island-cut`.
- `src/pages/one-pager.astro`: the whole page, styles and scripts inline. Three lists sit at the top: `PRODUCTS`
  (a file name without its ending and a caption), `STEPS` (the ring's three texts) and `KNOW` (the six points).
- `scripts/one-pager-pack.mjs`: packs the built page into this folder and writes the ring frames with a blue stone.
- `scripts/one-pager-check.mjs`: opens the packed page in a real browser, shoots the stills and presses everything.
- `scripts/one-pager-closeup-test.mjs`: proves the close-up band on a throwaway copy with a stand-in picture.
- `public/assets/one-pager/hero-start.webp`: the hero still, made from
  `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/hero-start.png` with `cwebp -q 82`.
- Ring frames: the site's own, `public/assets/motion/hero-ring/ring-{560,1200}-000..059.webp` and
  `public/assets/motion/journey/apart-{560,1200}-000..031.webp`, 184 files. Read only.
- Product pictures: `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/products/`, named as on
  `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/PRODUCT-PROMPTS.md` (p1-oval-sapphire, p2-cushion-sapphire, p3-ring,
  p4-earrings, p5-pendant; png, jpg, jpeg or webp). The close-up picture goes in the same folder as `closeup`
  with one of those endings.
- The six points: facts checked against the client's own guide `~/bb-consultancy/priyantha-gems/client-src/Made-Simple.txt`.
  The article Thulaib sent (svkjoyeros.com, a Spanish jeweller's page on sapphire quality) was read for facts
  only. No sentence, picture or table of theirs is on the page.

## 3. Rebuild from nothing

```bash
cd ~/bb-websites/hop-hero/site
git status --short --branch   # must say hero-one-stone-two-moments
npm install
npm run build
node scripts/one-pager-pack.mjs
```

## 4. Gates

```bash
cd ~/bb-websites/hop-hero/site
node scripts/one-pager-check.mjs   # must end ALL PASSED
node scripts/one-pager-closeup-test.mjs /tmp/closeup-test   # three PASS lines
```

Seen on 12 Nov 2026: 41 PASS, ALL PASSED, at desk 1440 x 900 and phone 390 x 844. It covers no sideways scroll,
no text under 11 px, fonts, next, previous, every marker, wrap round, keyboard, drag, finger swipe, the picture
box never moving, the ring track being three screens, one ring text at a time with the stage pinned, the ring
starting and ending on its first frame, reduced motion, the six rows of the list, house style on the rendered
words and the list of unconfirmed words. The close-up test: 3 PASS (band shows on desk and phone, never wider
than its picture, labelled, house style on its words).

NOT run, because this is a folder page for one meeting and not a shipped site: `speed.mjs` on a live address,
`device-views.mjs`, the iOS Simulator, `check_stack.py`. Run them before the page goes on any address.

## 5. Deliver or deploy

```bash
open ~/Downloads/HOUSE-OF-PRIYANTHA-ONE-PAGER/"House of Priyantha one pager.html"
```

No deploy. Putting it on the demo address needs Thulaib's yes first. The folder must travel whole: the page reads
`assets/` beside it.

## 6. Finishing touches

- The shared site stylesheet link is taken out of the built page | why: the build links the home page's bundle into every page and its cream theme and class rules would leak in | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-pack.mjs
- Every path in the page is relative | why: the page must open from a folder with a double click | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-pack.mjs
- The products folder here is a link to `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/products/` | why: a new picture shows on the next refresh with no rebuild | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-pack.mjs
- A missing picture shows a marked empty slot and is left out once at least one picture exists | why: nothing is ever drawn or invented in a product's place | held by: ~/bb-websites/hop-hero/site/src/pages/one-pager.astro
- Pictures are stacked in one fixed square and swapped by opacity | why: the page must not jump when the picture changes | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-check.mjs
- Every picture carries "Generated sample" and the close says so again | why: the client must not take a generated picture for the house's own stock | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-check.mjs
- No certificate, treatment, origin, price, weight or year words, with one allowed sentence, "Natural does not mean untreated." | why: the client has not confirmed them and that one sentence is the client guide's own rule | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-check.mjs
- Playwright launches the full Chromium build | why: the headless shell is not installed on the BB machine | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-check.mjs
- The ring frames are written with the stone's pink and warm colours moved to blue (hue 0 to 24 and 262 to 360 go to 222; the gold at 27 to 45 is left alone) | why: the site's ring turns pink then brown and this page is blue only until row 1843 is answered | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-pack.mjs
- The ring runs a short scroll clock of its own on a track three screens tall | why: the site's journey script is tied to nine chapters and the cream theme and Thulaib asked for three scrolls, four at most | held by: ~/bb-websites/hop-hero/site/src/pages/one-pager.astro
- The ring ends on the frame it starts on | why: the last thing seen before the knowledge list is the first blue stone | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-check.mjs
- The close-up band stays hidden until `closeup` exists and never shows the picture wider than its own pixels | why: a small picture stretched across a desk screen goes soft | held by: ~/bb-websites/hop-hero/site/scripts/one-pager-closeup-test.mjs

## 7. Cast a copy

Copy `src/pages/one-pager.astro` to a new page name, change `HOUSE`, the `PRODUCTS`, `STEPS` and `KNOW` lists, the
hero picture and the words, then point the scripts at the new page name and folder. The hero picture box numbers
are measured off this photograph: a new photograph needs its own numbers. The hue numbers in the pack script are
measured off these ring frames: other frames need their own.

## 8. Not on disk

- The product pictures and the close-up picture, until Thulaib saves them into the products folder.
- The house's own photographs. Every picture here is a generated sample.
- The WhatsApp doors open BB's own demo line from `src/config.js`, not the client's number.
- Open decisions: bb_pending 1843 (other stone colours), 1844 (headline wording), 1845 (recast the whole site),
  1846 and 1847.
