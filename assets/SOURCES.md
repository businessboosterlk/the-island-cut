# Where every picture and clip on this demo comes from

Every file under `public/assets/` is labelled on the page because none of it is the house's own stone, ring or box.
The three hero stills are GENERATED pictures (Thulaib's call on 31 Oct 2026, after the licensed footage hero was
rejected on look twice) and the page says so under them. Everything else is a real photograph or real footage under a
free licence; nothing there is generated, drawn or rendered. The house's own photographs replace every file here before
the site carries its name.

## Record photographs (`photos/`)

Licensed stock photographs of loose stones standing in for the house's own records. Each is credited on its record
in `src/data/stones.json` (`photo.credit`) and labelled "Sample data" on the card and in the passport.

## Hero stills (`motion/hero-ai/`)

| What | Detail |
| --- | --- |
| Source | Three pictures generated in Canva (Business Booster's own account) on 31 Oct 2026 from written prompts, no reference image: one ring, an oval deep royal blue sapphire in a four prong yellow gold solitaire on a pale porcelain ground |
| Files | `lying` (the ring at a slight tilt), `upright` (standing, facing the camera), `macro` (the stone very close). Each at 480, 800, 1200 and 1600 px wide, WebP. The 1456 by 1088 originals are in `~/Downloads/THE-ISLAND-CUT/HERO-AI/` |
| Made | Exported from Canva at full size, each faded at its edges into the site's paper (#f4efe7) by a radial blend baked into the file, so the picture melts into the page without a mask in the CSS, then resized. Nothing was drawn or retouched by hand |
| On the page | The hero (clip 5): the first still arrives large and tilted and settles in the centre, then each scroll stage swaps to the next still with its line. Labelled "Generated sample". The real site shows the house's own ring photographed three ways on a white sweep, the same mechanism, no generation |
| The rule | Generated pictures are a stand in for this demo only, approved for it by Thulaib on 31 Oct 2026. They never stand for a real stone on a record, never go on a client's domain, and are replaced by the house's own photographs before launch |

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
