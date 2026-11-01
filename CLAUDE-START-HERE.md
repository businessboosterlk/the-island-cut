# THE ISLAND CUT — FINAL ANIMATION HANDOVER

## Latest implementation update — 1 November, publication pass

The owner resumed implementation here and then explicitly requested immediate publication to conserve weekly usage. This update supersedes the older work-in-progress status below.

Implemented: front-facing rendered box opening; a 36-frame gem-to-ring bridge using the approved model; dedicated local sticky customisation scene containing the complete explosion and reassembly; alternating lateral ring travel; a 36-frame matching return-to-box sequence with real geometry occlusion; final copy revealed only after seating; reduced-motion/still fallback; existing enquiry builder retained. New controller: src/scripts/journey.js. New scene component: src/components/Journey.astro. Styles: src/styles/journey.css. Render sources: scripts/render-bookends.py and scripts/render-bridges.py.

Verified locally: Astro production build, JavaScript syntax, opening button, visible gemstone, desktop exploded composition fully within one viewport, and opening the enquiry builder. Full phone and final-sequence visual QA was NOT completed before the owner's instruction to publish immediately. Do not describe this as fully QA-certified. Remaining polish can include box material richness, text choreography during departure, frame interpolation/performance, phone spacing, and direct-anchor/scroll continuity. Preserve current work and inspect the latest Git revisions before changing anything.

The original notes below preserve the creative direction and historical issues; they are not an accurate statement that none of these features have been implemented.

Written 1 November 2026, following the owner's 19:18 screenshots and corrections.

## 1. Read this first

Continue the existing work. Do not redesign the website or replace the approved ring with a different model. This is a motion-design and continuity task, not a request for another generic jewellery template.

This document is the authoritative latest direction. It supersedes conflicting choreography in earlier handovers, particularly instructions that centre everything, explode the ring between sections, or reveal the final headline before the ring is seated.

The owner has paused ChatGPT implementation to conserve usage and wants you, Claude, to finish. The local demo is a work in progress, not a finished or deployed result.

### Exact working directory

`/Users/thulaibhassen/.codex/.chatgpt-projects/g-p-685024c3ceac8191850e42383d44643e/island-cut-current`

Local built preview: `http://127.0.0.1:8157/the-island-cut/`

Live site: `https://businessboosterlk.github.io/the-island-cut/`

Repository: `https://github.com/businessboosterlk/the-island-cut`

Fetched main revision: `86f78e3a056646171593c77bb3e5c680bed10f76`.
GitHub Pages serves the **gh-pages branch, root directory**, via legacy Pages deployment. Main contains Astro source, not the deployment output. Remote gh-pages was observed at `25e685f2b78952e092610e2665094e2a8f53b7a3`.

**No changes from this ChatGPT pass have been committed, pushed or deployed.** All new source and assets are in the working directory above. Fetch and inspect remote changes before merging or publishing. Do not force-push over someone else's work.

Other potentially useful directories:
- `/Users/thulaibhassen/bb-websites/the-island-cut`: another local checkout; do not assume it contains this pass. Preserve its dirty changes.
- `/Users/thulaibhassen/Downloads/THE-ISLAND-CUT/site`: an older built export, NOT the authoritative new source.
- `/Users/thulaibhassen/.codex/.chatgpt-projects/g-p-685024c3ceac8191850e42383d44643e/island-cut-opening`: older standalone prototypes and previous handover. Do not replace the current Astro site with these.

## 2. The owner's latest vision, in order

### A. A genuinely premium opening

The opening is the hero. Improve the box, lighting, materials and background substantially beyond the current plain demonstration. Keep the established warm porcelain / charcoal / understated champagne visual language and Cormorant typography. Aim for an expensive jewellery campaign, not neon effects, a plastic-looking box or a game interface.

The box is FRONT-FACING, symmetrical, straight, with a modest elevated camera angle that reveals the lining. No diagonal three-quarter box. It can have realistic soft contact shadow, restrained studio illumination and subtle background depth. Do not introduce busy decoration or gratuitous glow.

Box opens, revealing a loose blue sapphire. Show this clearly before the gem leaves. The sapphire floats out, gently turns, and travels to the RIGHT side. The setting and band then form around that same gemstone, smoothly. The ring must not simply fade into existence while the loose gem disappears elsewhere.

Only the box compositions are centred. After departure, restore lateral editorial layouts.

### B. Formation and customisation

First establish the assembled ring on the right with copy on the left. Introduce colour/customisation possibilities with the approved ring motion and materials. Then move into a deliberate customisation composition: ring on LEFT, explanatory text on RIGHT.

IMPORTANT: the WHOLE explosion and reassembly must happen INSIDE ONE COMPOSED VIEWPORT/SCENE. In the current demo the ring starts coming apart across the dividing line between two sections. The owner explicitly rejects this. Do not let the gemstone occupy one 'slide' and the band occupy another.

Stage the action:
1. Whole ring arrives and settles fully inside the customisation frame.
2. Stone lifts from the setting.
3. Setting separates from the band.
4. Hold the entire exploded view with every component visible and room for the copy.
5. Explain gemstone, setting, metal/band and optional name/date engraving.
6. Demonstrate compatible variations where assets support them.
7. Reassemble completely IN THAT SAME FRAME before moving to the next chapter.

Do not distort a single gemstone to fake different cuts. Render compatible alternatives if showing genuine shape changes. Do not recolour the entire ring image to change only the stone. Treat choices as illustrative, not verified stock, prices or manufacturing promises.

### C. Restore the premium side-to-side movement

After reassembly:
- Ring RIGHT, words LEFT.
- Ring moves LEFT, words enter RIGHT.
- Ring moves RIGHT again, words enter LEFT.

The ring's rotation, lateral travel and typography must be coordinated on the SAME timeline. Preserve the earlier approved hero's visual quality. The text should feel choreographed, not a static paragraph with an unrelated floating object beside it.

Use gentle text translation and controlled reveal. Outgoing text clears the crossing path before the ring enters that region. New text occupies the side the ring vacated. No simultaneous ring/text collision. No random bounce, overshoot or letter confetti.

The website must visibly progress down the page. Do not trap the entire journey in one endless fixed hero. Short local sticky scenes for formation, explosion and seating are appropriate; they resolve the owner's requirement that these actions remain within one frame. Native scroll continues between those scenes, carrying the object down into the next section.

### D. The final box must receive the SAME ring

The finished ring moves towards the centre, turns into the correct orientation, scales through a plausible approach and descends straight into the matching open box. It must visibly enter the cushion and settle. Correct occlusion by the front lip and cushion is essential.

There must NOT be one large ring fading out while a second small ring is already visible in the box. There must NOT be a camera-angle jump disguised with opacity. The current prototype does not yet solve this transition.

ONLY AFTER THE RING IS SEATED: the headline rises/reveals from behind the box with a refined depth effect. Suggested text:

> Imagine opening yours.
> Your idea starts with a conversation.
> Customise yours

Use a masked reveal and deliberate layering: background, text-behind layer, rendered box/ring foreground, then an unobstructed CTA layer. Keep the final words readable above/around the box once revealed. Never leave the text obscured behind the lid. Do not show the CTA/headline while the ring is still crossing them.

Hold the open, seated product long enough to appreciate it. Closing the box is optional, not a reason to immediately hide the finished ring.

## 3. What ChatGPT actually built

### Source changes

- `src/components/Journey.astro`: nine document-flow chapters, opening/closing canvas scenes, alternate left/right text, customisation list and existing builder CTA hooks.
- `src/scripts/journey.js`: shared absolute-positioned ring visual using document-space anchors; existing hero and apart frame playback; 24-frame opening and return sets; still mode.
- `src/styles/journey.css`: desktop lateral composition, mobile stacked composition, box layout.
- `src/pages/index.astro`: imports Journey instead of old six-stop pinned hero; removed duplicate old stock-video closing box section.
- `src/scripts/site.js`: imports and calls `initJourney()`; removed old pinned-hero and stock-box controllers. Existing viewing room, shortlist, passport, builder and enquiry flows remain.
- `scripts/render-bookends.py`: creates straight-on opening/return box sequences using the existing approved ring geometry, not a newly invented ring.
- `public/assets/motion/bookends/`: 48 new WebP assets, about 500 KB total.
- `renders/bookends/`: source PNGs, ignored by Git.

### Reusable approved assets

- `public/assets/motion/hero-ring/ring-1200-000.webp` through `059`: desktop hero turn, blue through warm orange/pink. Phone counterparts use `560`.
- `public/assets/motion/journey/apart-1200-000.webp` through `031`: explosion in orange end-state. Phone counterparts use `560`.
- `scripts/render-ring.py`: approved Blender master geometry, materials, rotation, stone colour and engraving.
- `scripts/render-journey.py`: same ring's separated components, matching the hero's frame 59 pose.
- `public/assets/motion/journey/CROP.txt` and `ALIGN.txt`: crop registration information. Hero square size 1247; apart image 1247 × 1401 with hero square offset y=154. Preserve this alignment when swapping the existing canvases.

New bookends:
- `opening-000.webp` through `023`: frames 0–15 open the lid, later frames lift the loose gemstone.
- `return-000.webp` through `023`: finished blue ring descends into a front-facing open box.
- Both use the same box and approved ring geometry. Rendered in Blender Cycles, 720 square, 16 samples, transparent, AgX. These are preview-quality assets, not final luxury finish.
- Current bookend camera `(0,-7,4.7)`, target `(0,0,1.35)`, orthographic scale 5.8. Ring root scale .42. These are starting values, not locked art direction.

The bookend renderer reads the scene-building portion of `render-ring.py` before its render loop. Refactor to an explicit shared scene factory before extending this substantially; do not duplicate divergent versions of the ring model.

## 4. Known problems: fix these, do not inherit them

1. **Explosion at section boundary.** `journey.js` currently interpolates absolute anchors across chapters while simultaneously changing apart frames around s=3.18–4 and reversing around s=4.18–4.88. This causes exactly the composition failure shown in the owner's screenshot. Replace this scheduling with a local hold/explode/hold/reassemble phase inside a dedicated customisation scene.
2. **Fake opening handoff.** The loose stone in the opening render and the assembled hero ring are separate sequences. Hero opacity ramps from s=.65 to .95. There is no genuine gem-to-right formation bridge. Render that bridge; do not call this fade a seamless transformation.
3. **Fake final handoff.** The current shared ring fades at s=7.45–7.63 and an independently positioned return sequence plays at s=7.52–8. It is not registered for position/scale/rotation and can show two rings. Replace with matching poses and a deterministic handoff, ideally one continuous rendered sequence for approach and contact.
4. **Transparent poster underneath canvas.** Bookend posters currently remain underneath their transparent animated canvases. The final poster already contains a seated ring; if left visible, it creates a second ring under the descending one. Hide/remove the poster ONLY after a successfully decoded frame is painted. Restore the poster on failure. A transparent canvas does not erase an image underneath it.
5. **Final text is premature.** Finale copy is currently present above the box before seating. Gate its reveal on confirmed seating progress. Keep a readable static fallback for reduced motion or asset failure.
6. **Click/scroll ownership.** Current Open tween uses clickProgress but scroll resets it to zero immediately. That can snap the lid backwards after clicking. Use a state machine that transfers from the current pose, or a single scroll-driven opening with the button advancing to its open checkpoint. Do not run two competing progress owners.
7. **Frame loading/memory.** All bookend frames load eagerly even in still/data-saver mode. Change to posters first, relevant nearby sequence preload, bounded concurrency and decoded-frame cache. Desktop 1200px RGBA frames can consume much more RAM than their WebP download sizes suggest. Release offscreen buffers when appropriate.
8. **Mobile incomplete.** The CSS has mobile rules but phone QA was NOT completed. Some large text, frame sizes, min-heights and captions may collide. Do not claim tested responsiveness yet.
9. **Old tests assume old architecture.** `scripts/check-site.mjs`, `live.mjs`, `click-path.mjs` and journey screenshot scripts refer to old IDs/6-stop timing/old box videos. Update their expectations, but keep unrelated functional checks. Do not merely delete failing assertions.
10. **Underlying site claims/placeholders.** Existing stock/sample records, house-copy placeholders and noindex remain. Do not turn a concept site into a fully verified commercial site by removing disclosures. Animation approval is not approval of business claims.

## 5. Recommended technical implementation

### Timeline architecture

Use discrete phases with explicit boundaries and hold intervals, rather than one global linear chapter interpolation:

`closed → lid-open → gem-lift → gem-travel-right → ring-form → customise-arrive → explode → options-hold → reassemble → lateral-A → lateral-B → box-approach → orient → seat → headline-reveal`

Separate:
- document travel between sections;
- local scene progress during one composed action;
- model pose/frame selection;
- object x/y/scale;
- text visibility and depth reveal.

A suggested structure is a short sticky opening/formation scene, normal downward transition, short sticky customisation scene, lateral editorial sections, then a short sticky closing/contact scene. Sticky is LOCAL, never the whole website. Size tracks from the required action duration, not arbitrary kilometres of scrolling.

Use one requestAnimationFrame coordinator triggered by passive scroll input. Measure chapter rectangles on resize/font readiness, not repeatedly perform layout reads between style writes each frame. Freeze a stable scene height during mobile browser toolbar changes where necessary. Preserve native scrolling; do not intercept wheel/touch to simulate scroll.

Reverse scrolling must deterministically reverse poses and text. Rapid jumps, anchor links and resizing mid-action must land in correct states without timers waiting to finish. Scene visibility must not depend on every previous frame having played.

### Seamless rendered handoffs

Make one master Blender scene with named objects: box base, lid hinge, cushion, gemstone, setting, band and engraving. Preserve the existing ring's geometry and materials. For each seam, define the exact world transform, camera transform, orthographic scale/focal length, lighting, colour management and alpha crop.

Render shared boundary frames and compare them visually/with image difference. Store anchor coordinates for the gemstone centre and ring centre in an asset manifest. Align those coordinates in the DOM, not just the canvas rectangles. A rotation/scale mismatch cannot be repaired by a long crossfade.

The approved ring uses camera `(3.5,-6,3.4)` looking at `(0,0,.25)`, ortho 3.9. The new box uses another camera. Therefore render an intentional camera/object-orientation bridge. Do not instantaneously switch between these perspectives. Box itself remains front-facing when presented.

For final contact, render ring and box together, or export registered background/foreground depth layers from the same scene. CSS z-index alone cannot model partial occlusion by the cushion and box lip.

### Visual standards

- Preserve Cormorant Garamond display/italic, Instrument Sans, warm paper and restrained metal colours.
- Improve the opening through composition, believable material roughness, lighting and deliberate negative space, not added UI decorations.
- Keep real gemstone hue/material detail. Do not use a global hue filter.
- Keep the ring and text out of each other's bounding boxes at intermediate scroll positions, not just chapter endpoints.
- Use opacity/transform or a restrained clip/mask for text. Avoid expensive full-screen blur and layout animation.
- No new 3D runtime is required: existing offline-rendered sequences are a valid route. Do not introduce a large library merely to interpolate scroll values.
- Minimum comfortable touch targets, keyboard-accessible Open and Customise actions, visible focus, reduced-motion static equivalents and meaningful accessible headings.
- No autoplay audio. No fabricated testimonials, stock availability, diamond inventory, reports, guarantees or prices.

## 6. Build, test and deploy

Node available here: `/Users/thulaibhassen/.local/node/bin/node` (v22.14.0 observed).
Dependencies are copied locally into this checkout's ignored `node_modules`; they are NOT a symlink anymore. Do not point the Vite cache into another active checkout.

Build command used successfully:

```sh
cd /Users/thulaibhassen/.codex/.chatgpt-projects/g-p-685024c3ceac8191850e42383d44643e/island-cut-current
/Users/thulaibhassen/.local/node/bin/node node_modules/astro/bin/astro.mjs build
```

Local preview:

```sh
/Users/thulaibhassen/.local/node/bin/node scripts/serve.mjs 8157
```

Blender: `/opt/homebrew/bin/blender`. Re-render bookends with `-b --python scripts/render-bookends.py`; optional trailing `-- opening 15` renders just one checkpoint. Render PNGs are in `renders/bookends`. Convert via `/opt/homebrew/bin/cwebp -q 84` to WebP. Final render quality should be increased only after camera and seam checkpoints are approved.

### What was verified

- Astro static build succeeded.
- New 48-frame bookend render and WebP conversion completed.
- Local page loaded; existing enquiry/builder hooks remain in source.
- Desktop screenshots showed the new ring, box and alternating layouts.
- Owner supplied screenshots explicitly identifying boundary explosion, premature text and imperfect handoff. These are unresolved, not accepted final behaviour.

### Not verified / not done

- No comprehensive interaction regression test, phone QA, reduced-motion QA, slow-network QA or frame-rate profiling.
- No seamless gem-to-ring bridge or ring-to-box orientation bridge.
- No completed within-one-frame customisation choreography.
- No animated text-from-behind-box finale.
- No Git commit, push or Pages deployment from this pass.

### Acceptance checkpoints before publication

1. Closed, straight-on hero box looks premium at desktop and phone sizes.
2. Open reveals one sapphire; same sapphire lifts, turns, moves right and becomes a ring without a fade/pop/duplicate.
3. Whole ring arrives fully inside the customisation scene before separating.
4. Entire exploded ring and explanatory text fit in ONE viewport, including at intermediate positions.
5. Reassembly finishes there before lateral travel resumes.
6. Right/left/right ring positions pair with left/right/left text, including collision-free intermediate states.
7. Final approach visibly turns and aligns the same ring, then seats it with correct occlusion and no second ring underneath.
8. Text emerges from behind the box only after seating; CTA becomes usable and remains readable.
9. Upward scroll, fast scroll, anchor jump, refresh midpage, resize, keyboard and still mode behave coherently.
10. Existing stone cards, comparison, passport, viewing room, builder and WhatsApp enquiry destinations still work. Do not send test messages to real recipients.
11. Check 1440×900, 1280×800, 390×844 and 360×800, plus a real iPhone/Android if available. Measure actual performance; do not claim 60fps without evidence.
12. Commit source/assets first, publish generated output through the existing gh-pages workflow, and verify the deployed revision. Preserve unrelated source and remote changes.

## 7. Suggested execution order for Claude

1. Inspect this checkout and current remote; preserve the local working changes.
2. Read current `Journey.astro`, `journey.js`, `journey.css` and render scripts. Treat the existing timeline as a prototype to correct, not a contract to retain.
3. Fix poster-under-canvas ghosting and premature final text first.
4. Redesign the timeline into local composed scenes and proper transition intervals.
5. Approve a small set of key stills: hero closed/open; sapphire in flight to right; formation; fully exploded left; reassembled right; final approach; seated ring/headline.
6. Render the missing matched bridge sequences. Increase samples/resolution only after matching camera and registration.
7. Integrate coordinated text and object motion; test backward and intermediate scroll positions.
8. Validate responsive/fallback behaviour and existing features; then publish and hand back the live link plus commit details.

Owner's summary: premium hero box → opens on gem → gem floats/turns RIGHT → ring forms → customisation → ring splits WITHIN ONE FRAME → reassembles → premium LEFT/RIGHT editorial movement → ring turns/aligned descent into box → THEN words rise from behind it.
