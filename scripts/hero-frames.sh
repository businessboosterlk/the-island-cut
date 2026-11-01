#!/bin/zsh
# Turns the sixty PNG renders of the hero ring into the WebP sets the hero loads, plus a poster of frame 0 at each size.
# v4, 1 Nov 2026 pm: the renders are 1600 px and every frame is CROPPED to the one square that holds the ink of all sixty
# (measured, not guessed), so no pixel of the set is spent on empty film; the sets are then cut at DESK and PHONE widths.
# Why: the live 800 set held a ring of 481 x 569 px that the desk showed at 1760 device px, 2.2 times upscaled, which is
# why Thulaib asked why the quality was so low. Run from the site folder after scripts/render-ring.py.
#   IN=renders/ring-v4 DESK=1200 PHONE=640 scripts/hero-frames.sh
# Prints the crop box and the weight of each set; writes the crop to $OUT/CROP.txt so the page can be checked against it.
set -e
cd "$(dirname "$0")/.."
IN=${IN:-renders/ring-v4}; OUT=${OUT:-public/assets/motion/hero-ring}; DESK=${DESK:-1200}; PHONE=${PHONE:-640}; PAD=${PAD:-24}
mkdir -p "$OUT"; rm -f "$OUT"/ring-*.webp "$OUT"/poster-*.webp
# 1. The union of the ink: trim every frame, take the smallest left and top and the largest right and bottom.
L=999999; T=999999; R=0; B=0; W=0
for i in $(seq 0 59); do
  f=$(printf "%s/ring-%03d.png" "$IN" $i); [ -s "$f" ] || { echo "missing $f"; exit 1; }
  read w h x y <<< "$(magick "$f" -trim -format "%w %h %X %Y" info: | tr -d '+')"
  W=$(magick "$f" -format "%w" info:)
  [ $x -lt $L ] && L=$x; [ $y -lt $T ] && T=$y; [ $((x+w)) -gt $R ] && R=$((x+w)); [ $((y+h)) -gt $B ] && B=$((y+h))
done
# 2. One square around that union, padded, kept inside the film.
cw=$((R-L+2*PAD)); ch=$((B-T+2*PAD)); S=$(( cw > ch ? cw : ch ))
cx=$(( (L+R)/2 )); cy=$(( (T+B)/2 )); X=$(( cx - S/2 )); Y=$(( cy - S/2 ))
[ $X -lt 0 ] && X=0; [ $Y -lt 0 ] && Y=0; [ $((X+S)) -gt $W ] && X=$((W-S)); [ $((Y+S)) -gt $W ] && Y=$((W-S))
echo "film ${W}px; ink union ${L},${T} to ${R},${B}; crop ${S}x${S}+${X}+${Y}" | tee "$OUT/CROP.txt"
# 3. The sets. Alpha quality 80 or more with filtering keeps the ring's soft edge clean (alpha 70 banded).
n=0
for i in $(seq 0 59); do
  f=$(printf "%s/ring-%03d.png" "$IN" $i)
  magick "$f" -crop "${S}x${S}+${X}+${Y}" +repage -resize "${DESK}x${DESK}" -quality 78 -define webp:alpha-quality=85 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/ring-%d-%03d.webp" "$OUT" $DESK $i)"
  magick "$f" -crop "${S}x${S}+${X}+${Y}" +repage -resize "${PHONE}x${PHONE}" -quality 70 -define webp:alpha-quality=80 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/ring-%d-%03d.webp" "$OUT" $PHONE $i)"
  n=$((n+1))
done
cp "$OUT/ring-$DESK-000.webp" "$OUT/poster-$DESK.webp"; cp "$OUT/ring-$PHONE-000.webp" "$OUT/poster-$PHONE.webp"
echo "$n frames; $PHONE set $(du -ck $OUT/ring-$PHONE-*.webp | tail -1 | cut -f1) KB; $DESK set $(du -ck $OUT/ring-$DESK-*.webp | tail -1 | cut -f1) KB"
