# The Island Cut — finishing pass, 2 November 2026

## Preserve
- The existing scroll-led opening, alternating ring/text composition, in-frame exploded view and final box landing. Do not replace this with a permanently centred product or crossfade two ring silhouettes.
- Desktop is the current review target. This pass does not redesign the mobile journey.
- This remains a clearly labelled concept. Sample records, reference photographs and generated design studies are not claims of stock, certification or completed commissions.

## Engraving
The raised text mesh is removed from each render. `scripts/engrave-band.py` binds the inscription to the band's inner surface through a UV mask, a shallow inward bump and restrained gold colour/roughness variation. There is no independent lettering geometry to protrude or float as the ring rotates. This is a rendered surface effect, not manufacturing CAD or a physical Boolean groove.

`scripts/render-engraved.sh` regenerates the hero, exploded journey, departure/arrival bridges and final return. Preserve the original crop registration and camera endpoints. Do not change the mask orientation without verifying a full-size frontal and angled frame. The opening scene contains a loose gem and does not need a new inscription.

## Lower-page direction
- Warm editorial transition from the animation into the collection.
- Two-column gemstone collection with restrained image zoom on hover.
- Charcoal viewing room with clear selected states and honest missing-view placeholders.
- Large sapphire design study beside personal-commission copy and the existing builder.
- Three considered commissioning steps, expandable practical questions, a spacious contact invitation and oversized typographic footer.
- `src/styles/atelier.css` contains the lower-page treatment; `src/scripts/atelier.js` provides one-time intersection-triggered reveals and subtle question-answer entrances. Reduced-motion users receive static content. Content is visible without JavaScript.
- Existing passports, comparison tray, viewing tabs, builder and appointment dialogs retain their original handlers.

## Validation
Run the Astro production build and icon check. Inspect the collection, viewing room, jewellery, FAQ and contact at desktop size. Open the builder and appointment dialog without sending WhatsApp messages. Check engraving at frontal, oblique and exploded frames. Confirm bridge and return frames use the same inscription. Publish source and built GitHub Pages assets only after the complete render batch finishes.
