# Where every picture and clip on this demo comes from

Every file under `public/assets/` is a real photograph or real footage under a free licence. Nothing is generated,
drawn or rendered. Every one is labelled Sample on the page because none of it is the house's own stone, ring or box.
No AI image or video of a stone or a ring, ever.

## Record photographs (`photos/`)

Licensed stock photographs of loose stones standing in for the house's own records. Each is credited on its record
in `src/data/stones.json` (`photo.credit`) and labelled "Sample data" on the card and in the passport.

## Hero frame sequence (`motion/hero/480/`, `motion/hero/800/`, `motion/hero/poster.webp`)

| What | Detail |
| --- | --- |
| Source | Pixabay video 266081, "Solitaire, Ring, Gold" by GreenCardShow, https://pixabay.com/videos/solitaire-ring-gold-diamond-266081/ |
| Licence | Pixabay Content License (free for commercial use, no attribution required, attribution given anyway) |
| Shows | A rose gold solitaire ring turning on a stand against a red backdrop |
| Made | 60 frames taken every eighth frame of the first 480, cropped to the ring, the red backdrop keyed to the site's paper, the putty stand under the band erased, bottom cropped. 480px set for phones, 800px set for desks, both WebP |
| On the page | The hero: the ring turns as the page scrolls. Labelled Sample. The house's own ring would be filmed the same way, on a white sweep, no key needed |

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
