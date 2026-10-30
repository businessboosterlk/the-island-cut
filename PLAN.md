# THE ISLAND CUT, the phased build

Working name for a gem and jewellery house in Sri Lanka. One page, Astro static, GitHub Pages demo. Written 30 October
2026 after Thulaib rejected the first build on look and chose the porcelain mock ("the mix, as mocked": the photograph
is the fold, the house speaks once, the stones are records on a table, warm porcelain, real photographs only).

The brief is `look/BRIEF-10-FEATURES.md`, ten features. This file says which are built now, which wait, what each
one needs that nobody has yet, and where a feature meets a BB law and the law wins.

## Phase 1, built in this pass

| Feature | What is on the page | Standing |
|---|---|---|
| 1 Stone to jewel hero | Photograph of a cut stone as the fold. Two state control, The stone and The finished piece. No finished piece has been photographed, so the second state is an honest empty frame that says so. Doors: Explore gemstones, Create your piece. | Implemented, demo data |
| 2 Real light viewing room | Daylight, Indoor light, Macro, Rotation tabs over the chosen stone. Only Daylight has media; the other three say "Not captured yet for this stone" and offer Request another view, prefilled with the stone reference and the view. Weight, size and treatment sit beside the picture. | Implemented, demo media |
| 4 Three stone comparison tray | Compare on every record. A tray at the foot holds up to three; a fourth is refused with a line that says why. Rows: colour, cut, weight, size, treatment, lab report, provenance. Show differences only. Saved on this device only, never a reservation. | Implemented |
| 6 Gemstone passport | A drawer per stone: reference, photograph, measurements, treatment, lab report, provenance. Each fact carries its status, Lab report, Seller disclosure or Not documented. No cutter, district or report number is invented. | Implemented, demo data |
| 7 View with a specialist, request based | View these with a specialist beside the tray and in the passport. A sheet carries the stone references, a day and a time in the visitor's own clock with the Colombo clock beside it. Request a time opens WhatsApp with the whole request. The page says a confirmation follows and that a viewing reserves nothing. | Implemented, front end only |

## Phase 2, waits for the house

| Feature | Why it waits |
|---|---|
| 3 Lifelike jewellery gallery | Needs the house's finished pieces photographed on one ground. None exist yet. |
| 5 Bespoke configurator | Was built in the first version (drawn stone, drawn settings) and rejected on look. Returns only when real setting photographs exist, one per metal and piece. |
| 9 Provenance and craft story | Needs the house's own words and the people who agree to be named. Nothing here may be invented. |
| 8 Shortlist, basic | A saved shortlist on this device exists through the tray. Sharing waits for phase 3. |

## Phase 3, needs a backend the client has not confirmed

| Feature | Why it waits |
|---|---|
| 8 Shareable shortlist | A link that opens the same three stones on another phone needs a server or a very long address. Front end demo first. |
| 10 Concierge and payments | Any booking that holds a slot, any payment, any client account needs a backend and a signed agreement. BB rule: demos stay pure front end until the client confirms Supabase. |

## Where a feature meets a BB law

- **No prices.** The brief's price fields stay empty. The house's own rule from the first call. Every door says "Nothing is priced on this page".
- **No invented facts.** The first data file carried district names and lab names per stone as if known. Both now carry a status, Seller disclosure or Not documented, and sample records say so on their face. No founding year, no cutter, no buyer count.
- **Real photographs only.** The three stones on the page are licensed Unsplash photographs and every frame says so. They stand in until the house's stones are shot on one ground (bb_pending 922). No AI imagery, no colour alteration.
- **Front end only.** Every action ends in a prefilled WhatsApp message to BB's demo line. Success is shown only after the door has opened. No form posts anywhere.
- **The design system's token block is not used.** The chosen look has no shadows, no gradient, no glow and a champagne accent on porcelain. Stated departure, Thulaib's choice on 30 October.

## What the house must supply before this goes to a client

1. Photographs of its own stones, every stone on the same ground in daylight, plus a short rotation clip each (bb_pending 919, 922).
2. The inventory fields per stone: weight, dimensions, treatment, lab and report number, where it was bought.
3. The lab reports as files and permission to show them.
4. The house's own words for the one paragraph the house speaks, and for Our craft.
5. The WhatsApp line (917) and the buying terms and return line (920, 921).
6. Whether jewellery is made in house or outsourced (918). Create your piece reads differently either way.

## Dependency map

```
photographs on one ground ──> hero, table, viewing room, passport, gallery (3), configurator (5)
inventory fields ──────────> passport, comparison rows
lab reports + permission ──> passport "Lab report" status
house's words ─────────────> the house speaks, our craft (9)
WhatsApp line ─────────────> every door
backend (not confirmed) ───> sharing (8), concierge and payments (10)
```

## Handover state

- Implemented: hero with state control, viewing room, comparison tray, passport drawer, request a time sheet, nav, footer, every WhatsApp door.
- Demo only: the three stones, their fields, their media, the empty finished piece, the Colombo time line.
- Needs content or a backend: everything in phases 2 and 3 and the six items above.
- Shared tokens: `src/styles/site.css` top block (paper, ink, line, champagne, the two faces, the four motion durations).
- Verified by `npm run verify`: build, the site gate, the click path. Live by `npm run live`.

Never publish this to the client's own domain, replace live inventory or take a payment without Thulaib's explicit go.
