#!/bin/zsh
# Turns the sixty PNG renders of the customise ring (scripts/render-customise.py) into the WebP sets the Customise section
# loads, plus two posters at each size: `whole` (frame 0, the ring in the hero's pose) and `apart` (the settled frame).
# 1 Nov 2026: the renders are 1600 px on a transparent film and every frame is CROPPED to the one box that holds the ink of
# all sixty (measured, not guessed, the same rule as scripts/hero-frames.sh), so no pixel of a set is spent on empty film.
# The crop is NOT squared: the separation is tall, and the page sizes the film by the crop's ratio (APART.w and APART.h in
# src/pages/index.astro, which must equal the crop printed here). Run from the site folder once the renders are in.
#   IN=renders/customise DESK=760 PHONE=480 SETTLE=39 scripts/customise-frames.sh
set -e
# zsh or bash: an empty folder must not stop the clear out (zsh says "no matches found" on an empty glob)
(setopt NULL_GLOB 2>/dev/null || shopt -s nullglob 2>/dev/null) || true
cd "$(dirname "$0")/.."
IN=${IN:-renders/customise}; OUT=${OUT:-public/assets/motion/customise}; DESK=${DESK:-760}; PHONE=${PHONE:-480}; SETTLE=${SETTLE:-39}; PAD=${PAD:-0}
mkdir -p "$OUT"; find "$OUT" -name "apart-*.webp" -delete; find "$OUT" -name "poster-*.webp" -delete
# 1. The union of the ink across all sixty frames.
L=999999; T=999999; R=0; B=0; W=0; HH=0
for i in $(seq 0 59); do
  f=$(printf "%s/apart-%03d.png" "$IN" $i); [ -s "$f" ] || { echo "missing $f"; exit 1; }
  read w h x y <<< "$(magick "$f" -trim -format "%w %h %X %Y" info: | tr -d '+')"
  read W HH <<< "$(magick "$f" -format "%w %h" info:)"
  [ $x -lt $L ] && L=$x; [ $y -lt $T ] && T=$y; [ $((x+w)) -gt $R ] && R=$((x+w)); [ $((y+h)) -gt $B ] && B=$((y+h))
done
X=$((L-PAD)); Y=$((T-PAD)); CW=$((R-L+2*PAD)); CH=$((B-T+2*PAD))
[ $X -lt 0 ] && X=0; [ $Y -lt 0 ] && Y=0; [ $((X+CW)) -gt $W ] && CW=$((W-X)); [ $((Y+CH)) -gt $HH ] && CH=$((HH-Y))
echo "film ${W}x${HH}px; ink union ${L},${T} to ${R},${B}; crop ${CW}x${CH}+${X}+${Y}" | tee "$OUT/CROP.txt"
# 2. The sets. Alpha quality 80 or more with filtering keeps the soft edge of the metal clean against the paper.
n=0
for i in $(seq 0 59); do
  f=$(printf "%s/apart-%03d.png" "$IN" $i)
  magick "$f" -crop "${CW}x${CH}+${X}+${Y}" +repage -resize "${DESK}x" -quality 78 -define webp:alpha-quality=85 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/apart-%d-%03d.webp" "$OUT" $DESK $i)"
  magick "$f" -crop "${CW}x${CH}+${X}+${Y}" +repage -resize "${PHONE}x" -quality 70 -define webp:alpha-quality=80 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/apart-%d-%03d.webp" "$OUT" $PHONE $i)"
  n=$((n+1))
done
for s in $DESK $PHONE; do cp "$OUT/apart-$s-000.webp" "$OUT/poster-whole-$s.webp"; cp "$(printf "%s/apart-%d-%03d.webp" "$OUT" $s $SETTLE)" "$OUT/poster-apart-$s.webp"; done
echo "$n frames; $PHONE set $(du -ck $OUT/apart-$PHONE-*.webp | tail -1 | cut -f1) KB; $DESK set $(du -ck $OUT/apart-$DESK-*.webp | tail -1 | cut -f1) KB; posters $(ls $OUT/poster-*.webp | wc -l | tr -d ' ')"
