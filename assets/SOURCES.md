# Where every picture and clip on this demo comes from

Every file under `public/assets/` is labelled on the page because none of it is the house's own stone, ring or box.
The sixty hero frames are GENERATED pictures, rendered in Blender (Thulaib's call on 31 Oct 2026, after the licensed
footage hero was rejected on look twice, and again on 1 Nov when the ring that turns was chosen) and the page says so
under them. Everything else is a real photograph or real footage under a
free licence; nothing there is generated, drawn or rendered. The house's own photographs replace every file here before
the site carries its name.

## Record photographs (`photos/`)

Licensed stock photographs of loose stones standing in for the house's own records. Each is credited on its record
in `src/data/stones.json` (`photo.credit`) and labelled "Sample data" on the card and in the passport.

## Hero frames (`motion/hero-ring/`)

| What | Detail |
| --- | --- |
| Source | One ring modelled and rendered in Blender 5.2 (Cycles) by `scripts/render-ring.py`, Business Booster's copy of the model that came back from ChatGPT on 1 Nov 2026, with the stone re-made as a true sapphire (full transmission, the colour carried in the body, a clear coat, eight facet rows) and a soft shadow on the paper. No photograph, no reference image, nothing drawn by hand |
| Files | `ring-1200-000` to `ring-1200-059` (the desk) and `ring-560-000` to `ring-560-059` (the phone): sixty angles of the same ring, a turn of 210 degrees that eases to a stop, at 1200 and 560 px square, WebP with transparency; `poster-1200` and `poster-560` are frame 0. The 1600 px PNG renders are in `renders/ring-v4/` (not committed); the crop that made the sets is written in `CROP.txt` beside them |
| Made | v4, 1 Nov 2026 evening: rendered at 1600 by 1600 (Cycles on the Metal GPU, 64 samples) with a transparent film and no shadow plate, then cropped to the union of the ring's ink across all sixty frames (1247 px of the 1600) and resized and compressed by `scripts/hero-frames.sh` (ImageMagick), so a desk shows the ring at close to one source pixel per device pixel where the 800 px set was stretched 2.2 times. Through "Look a little closer" the stone turns from blue through violet and pink to a warm padparadscha; through "Make it personal" the ring tilts flat and the words "Entirely yours" are read engraved inside the band (Cormorant Garamond italic, `scripts/fonts/`). The 560 set, which the phone loads, shares the 2 MB motion cap with the rest of the page |
| On the page | The opening (clip 5, ChatGPT's layout of 1 Nov 2026 taken whole, read from the scroll): the ring sits on the paper at the top; as the visitor scrolls it turns a full circle, the scroll picking the frame, and is carried across the desk and back while three chapters of copy change and a counter runs 01 to 03; scrolling up turns it back. The poster stands in until every frame has decoded; reduced motion, data saver and "Use a still" keep the poster. Labelled "Generated sample". The real site shows the house's own ring photographed on a turntable, the same mechanism, no generation |
| The rule | Generated pictures are a stand in for this demo only, approved for it by Thulaib on 31 Oct 2026 and carried into the turning ring on 1 Nov. They never stand for a real stone on a record, never go on a client's domain, and are replaced by the house's own photographs before launch |

## Exploded ring layers (`motion/layers/`)

| What | Detail |
| --- | --- |
| Source | Unsplash photograph KSDaYilI75Q, "Silver and green gemstone ring" by Sabrianna, https://unsplash.com/photos/silver-and-green-gemstone-ring-KSDaYilI75Q |
| Licence | Unsplash License (free for commercial use, no permission needed, attribution appreciated and given) |
| Shows | A white metal ring with an emerald cut dark blue stone in a halo of small stones on a pavé band |
| Made | One photograph cut into three layers by hand drawn masks on the same origin: `stone.webp` (the centre stone, the prong tips fall into this layer), `setting.webp` (the halo), `band.webp` (the shank). `ring.webp` is the whole ring. All 1000px wide WebP with alpha. No layer is drawn: every pixel is the photograph |
| On the page | The Customise section: scrolling pulls the three layers apart and labels each "yours to choose". Labelled Sample. For the real site the house's own ring would be photographed once, flat on, and cut the same way |

## Ring box clips (`motion/box/`)

| What | Detail |
| --- | --- |
| Loop | Pexels video 8246474, "A ring in a pink velvet box" by Mikhail Nilov, https://www.pexels.com/video/a-ring-in-a-pink-velvet-box-8246474/ |
| Open | Pexels video 8246471, "Video of a engagement ring" by Mikhail Nilov, https://www.pexels.com/video/video-of-a-engagement-ring-8246471/ |
| Licence | Pexels License (free to use, no attribution required, attribution given anyway) |
| Shows | A pink velvet round ring box. The loop: the lid tilted over the box, a slow pan, the ring half hidden, seconds 6 to 11. The open: the lid beside the box, the ring standing, a hand reaches in and withdraws, seconds 0 to 6 |
| Made | Both cut to 960 wide H.264, muted, 25fps, poster frame as WebP. Played only from script, never autoplay, never with sound |
| Honest fallback | The reference film turns a CLOSED box and opens it on tap. No free clip of one box does both, so the demo loops the lid tilted over the box and cuts to the open shot on tap. The real film is one take of the house's own box: closed, turning, then opened |

## Not used

Scouted and rejected: every clip that showed a hand holding the box throughout, a wedding pair, a proposal scene or
a different box between the closed and open shots. Jacek Dylag's loose stone photograph (Unsplash agsdDgRW2Ps) was
scouted for a stone plus empty mount pair and not used: no matching empty mount exists, so one ring photograph was cut
into layers instead.
