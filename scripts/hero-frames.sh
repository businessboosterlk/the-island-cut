#!/bin/zsh
# Turns the sixty PNG renders in renders/ring-v3/ into the two WebP sets the hero loads (800 for the desk, 480 for the
# phone) plus a poster of frame 0 at each size. Written 1 Nov 2026. Run from the site folder after scripts/render-ring.py.
set -e
cd "$(dirname "$0")/.."
IN=renders/ring-v3; OUT=public/assets/motion/hero-ring   # no shadow plate since 1 Nov 2026 pm (the ring floats on the paper, as ChatGPT's did)
n=0
for i in $(seq 0 59); do
  f=$(printf "%s/ring-%03d.png" "$IN" $i); [ -s "$f" ] || { echo "missing $f"; exit 1; }
  # Alpha quality 80 with filtering keeps the ring's soft edge clean (alpha 70 banded the old shadow); without a shadow a 480 frame
  # is about 11 KB, so the sixty sit well under the phone's 2 MB cap with the layers and the clips (measured 1 Nov 2026 pm).
  magick "$f" -resize 800x800 -quality 78 -define webp:alpha-quality=85 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/ring-800-%03d.webp" "$OUT" $i)"
  magick "$f" -resize 480x480 -quality 70 -define webp:alpha-quality=80 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/ring-480-%03d.webp" "$OUT" $i)"
  n=$((n+1))
done
cp "$OUT/ring-800-000.webp" "$OUT/poster-800.webp"; cp "$OUT/ring-480-000.webp" "$OUT/poster-480.webp"
echo "$n frames; 480 set $(du -ck $OUT/ring-480-*.webp | tail -1 | cut -f1) KB; 800 set $(du -ck $OUT/ring-800-*.webp | tail -1 | cut -f1) KB"
