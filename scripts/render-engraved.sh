#!/bin/zsh
set -e
cd "${0:A:h}/.."
export GPU=1 SAMPLES=32 RES=1600
export OUT="$PWD/renders/engraved-hero"
/opt/homebrew/bin/blender -b --python scripts/render-ring.py
export OUT="$PWD/renders/engraved-journey"
/opt/homebrew/bin/blender -b --python scripts/render-journey.py
# Bookends and bridges reuse the exact same corrected master band.
/opt/homebrew/bin/blender -b --python scripts/render-bridges.py
/opt/homebrew/bin/blender -b --python scripts/render-bookends.py -- return
# Preserve the approved crop registration rather than re-trimming the artwork.
for i in {0..59}; do
 f=$(printf '%03d' $i)
 for width in 560 1200; do
  /opt/homebrew/bin/magick "renders/engraved-hero/ring-$f.png" -crop 1247x1247+177+178 +repage -resize ${width}x${width} -quality 82 "public/assets/motion/hero-ring/ring-$width-$f.webp"
 done
done
for i in {0..31}; do
 f=$(printf '%03d' $i)
 for width in 560 1200; do
  /opt/homebrew/bin/magick "renders/engraved-journey/apart-$f.png" -crop 1247x1401+177+453 +repage -resize ${width}x -quality 82 "public/assets/motion/journey/apart-$width-$f.webp"
 done
done
for width in 560 1200; do
 cp "public/assets/motion/hero-ring/ring-$width-000.webp" "public/assets/motion/hero-ring/poster-$width.webp"
 cp "public/assets/motion/journey/apart-$width-031.webp" "public/assets/motion/journey/poster-apart-$width.webp"
done
for kind in depart arrive; do
 for i in {0..35}; do
  f=$(printf '%03d' $i)
  /opt/homebrew/bin/magick "renders/bridges/$kind-$f.png" -quality 82 "public/assets/motion/bridges/$kind-$f.webp"
 done
done
for i in {0..23}; do
 f=$(printf '%03d' $i)
 /opt/homebrew/bin/magick "renders/bookends/return-$f.png" -quality 82 "public/assets/motion/bookends/return-$f.webp"
done
echo 'ENGRAVED ASSETS COMPLETE'
