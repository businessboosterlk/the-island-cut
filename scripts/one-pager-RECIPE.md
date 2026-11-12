# RECIPE: House of Priyantha one pager

Kind: website page, a sample for a client meeting, front end only
Live: none. Not deployed. It opens from this folder with a double click.
Ignore: stills/, node_modules/, dist/
Last verified: 2026-11-12

## 1. What it is

One page for House of Priyantha with three parts: a still hero, a section where one product picture at a time
swaps in place (words on the left, picture on white on the right, arrows, markers and a caption) and a short close
with the "Book a private viewing" door. Desk and phone have their own layouts. Built 12 Nov 2026 for an 8pm
client meeting. The hero is still: the colour change on scroll waits on bb_pending row 1843.

## 2. Where the source lives

- Clone `~/bb-websites/hop-hero/site`, branch `hero-one-stone-two-moments`. Never the shared tree
  `~/bb-websites/the-island-cut`.
- `src/pages/one-pager.astro`: the whole page, styles and script inline. The product pictures are ONE list at
  the top (`PRODUCTS`): a file name without its ending and a caption.
- `scripts/one-pager-pack.mjs`: packs the built page into this folder.
- `scripts/one-pager-check.mjs`: opens the packed page in a real browser, shoots the stills and presses everything.
- `public/assets/one-pager/hero-start.webp`: the hero still, made from
  `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/hero-start.png` with `cwebp -q 82`.
- Product pictures: `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/products/`, named as on
  `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/PRODUCT-PROMPTS.md` (p1-oval-sapphire, p2-cushion-sapphire, p3-ring,
  p4-earrings, p5-pendant; png, jpg, jpeg or webp).

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
```

Seen on 12 Nov 2026: 31 PASS, ALL PASSED, at desk 1440 x 900 and phone 390 x 844. It covers no sideways scroll,
no text under 11 px, fonts, next, previous, every marker, wrap round, keyboard, drag, finger swipe, the picture
box never moving, reduced motion, house style on the rendered words and the list of unconfirmed words.

NOT run, because this is a folder page for one meeting and not a shipped site: `speed.mjs` on a live address,
`device-views.mjs`, the iOS Simulator, `check_stack.py`. Run them before the page goes on any address.

## 5. Deliver or deploy

```bash
open ~/Downloads/HOUSE-OF-PRIYANTHA-ONE-PAGER/"House of Priyantha one pager.html"
```

No deploy. Putting it on the demo address needs Thulaib's yes first. The folder must travel whole: the page reads
`assets/` beside it.

## 6. Finishing touches

- The shared site stylesheet link is taken out of the built page | why: the build links the home page's bundle into every page and its cream theme and class rules would leak in | held by: `scripts/one-pager-pack.mjs`
- Every path in the page is relative | why: the page must open from a folder with a double click | held by: `scripts/one-pager-pack.mjs` (fails on a path that starts at the site root)
- The products folder here is a link to `~/Downloads/HOUSE-OF-PRIYANTHA-HERO/products/` | why: a new picture shows on the next refresh with no rebuild | held by: `scripts/one-pager-pack.mjs`
- A missing picture shows a marked empty slot, or is left out once at least one picture exists | why: nothing is ever drawn or invented in a product's place | held by: the inline script in `src/pages/one-pager.astro`
- Pictures are stacked in one fixed square and swapped by opacity | why: the page must not jump when the picture changes | held by: `scripts/one-pager-check.mjs` (one box position through every press)
- Every picture carries "Generated sample" and the close says so again | why: the client must not take a generated picture for the house's own stock | held by: `scripts/one-pager-check.mjs`
- No certificate, treatment, origin, price, weight or year words | why: the client has not confirmed them | held by: `scripts/one-pager-check.mjs`
- Playwright launches the full Chromium build | why: the headless shell is not installed on the BB machine | held by: `scripts/one-pager-check.mjs`

## 7. Cast a copy

Copy `src/pages/one-pager.astro` to a new page name, change `HOUSE`, the `PRODUCTS` list, the hero picture and the
words, then point the two scripts at the new page name and folder. The hero picture box numbers are measured off
this photograph: a new photograph needs its own numbers.

## 8. Not on disk

- The product pictures, until Thulaib makes them in ChatGPT and saves them into the products folder.
- The house's own photographs. Every picture here is a generated sample.
- The WhatsApp doors open BB's own demo line from `src/config.js`, not the client's number.
- Open decisions: bb_pending 1843 (other stone colours), 1844 (headline wording), 1845 (recast the whole site).
