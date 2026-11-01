#!/bin/zsh
# Turns the thirty-two PNG renders of the ring coming apart (scripts/render-journey.py) into the WebP sets the journey's stops
# five and six load, at the hero's own widths, and PROVES THE SEAM first: frame 0 must trim to the same box as the hero's last
# render (ring-059.png), within 2 px each way, or the two films are not the same ring at the same scale and the page would
# jump at the swap. The crop is the union of the ink over all frames, padded; ALIGN.txt records where the hero's own crop
# (hero-ring/CROP.txt) sits inside it, which is what the page uses to lay the two canvases over each other.
#   IN=renders/journey HERO=renders/ring-v4 scripts/journey-frames.sh
# Prints the crop, the alignment and the weight of each set; writes CROP.txt and ALIGN.txt into $OUT.
set -e; setopt null_glob
cd "$(dirname "$0")/.."
IN=${IN:-renders/journey}; HERO=${HERO:-renders/ring-v4}; OUT=${OUT:-public/assets/motion/journey}; HERO_OUT=${HERO_OUT:-public/assets/motion/hero-ring}
N=${N:-32}; PAD=${PAD:-24}
read HS HX HY <<< "$(sed -E 's/.*crop ([0-9]+)x[0-9]+\+([0-9]+)\+([0-9]+).*/\1 \2 \3/' "$HERO_OUT/CROP.txt")"
[ -n "$HS" ] || { echo "no hero crop in $HERO_OUT/CROP.txt"; exit 1; }
# 1. The seam: the hero's last frame and the journey's first trim to the same size; their offset is the shift between the films.
read hw hh hx hy <<< "$(magick "$HERO/ring-059.png" -trim -format "%w %h %X %Y" info: | tr -d '+')"
read jw jh jx jy <<< "$(magick "$IN/apart-000.png" -trim -format "%w %h %X %Y" info: | tr -d '+')"
dw=$((hw-jw)); dh=$((hh-jh)); dw=${dw#-}; dh=${dh#-}
if [ $dw -gt 2 ] || [ $dh -gt 2 ]; then echo "SEAM FAIL: hero ring-059 trims ${hw}x${hh} at ${hx},${hy}; journey apart-000 trims ${jw}x${jh} at ${jx},${jy}"; exit 1; fi
DX=$((jx-hx)); DY=$((jy-hy))
echo "seam: hero ring-059 ${hw}x${hh} at ${hx},${hy}; journey apart-000 ${jw}x${jh} at ${jx},${jy}; the journey film is the hero film moved ${DX},${DY}"
# 2. The union of the ink over all frames, padded, one box, kept inside the film.
L=999999; T=999999; R=0; B=0; W=0; H=0
for i in $(seq 0 $((N-1))); do
  f=$(printf "%s/apart-%03d.png" "$IN" $i); [ -s "$f" ] || { echo "missing $f"; exit 1; }
  read w h x y <<< "$(magick "$f" -trim -format "%w %h %X %Y" info: | tr -d '+')"
  read W H <<< "$(magick "$f" -format "%w %h" info:)"
  [ $x -lt $L ] && L=$x; [ $y -lt $T ] && T=$y; [ $((x+w)) -gt $R ] && R=$((x+w)); [ $((y+h)) -gt $B ] && B=$((y+h))
done
# the crop must also hold the hero's own crop box (moved by the shift), so the whole of the hero's square is inside the journey's film
hL=$((HX+DX)); hT=$((HY+DY)); hR=$((hL+HS)); hB=$((hT+HS))
X=$((L-PAD)); Y=$((T-PAD)); X2=$((R+PAD)); Y2=$((B+PAD))
[ $hL -lt $X ] && X=$hL; [ $hT -lt $Y ] && Y=$hT; [ $hR -gt $X2 ] && X2=$hR; [ $hB -gt $Y2 ] && Y2=$hB
[ $X -lt 0 ] && X=0; [ $Y -lt 0 ] && Y=0; [ $X2 -gt $W ] && X2=$W; [ $Y2 -gt $H ] && Y2=$H
CW=$((X2-X)); CH=$((Y2-Y))
mkdir -p "$OUT"; rm -f "$OUT"/apart-*.webp "$OUT"/poster-*.webp
echo "film ${W}x${H}px; ink union ${L},${T} to ${R},${B}; crop ${CW}x${CH}+${X}+${Y}" | tee "$OUT/CROP.txt"
echo "hero crop ${HS}x${HS} sits at $((hL-X)),$((hT-Y)) in the journey crop" | tee "$OUT/ALIGN.txt"
# 3. The sets at the hero's widths (DESK and PHONE read from hero-ring's file names), the hero's quality settings.
DESK=$(ls "$HERO_OUT" | sed -nE 's/^poster-([0-9]+)\.webp$/\1/p' | sort -n | tail -1); PHONE=$(ls "$HERO_OUT" | sed -nE 's/^poster-([0-9]+)\.webp$/\1/p' | sort -n | head -1)
# the sets keep the hero's pixels per ring unit: a journey file is DESK (or PHONE) * crop width / hero crop wide, named by the hero width it pairs with
AD=$((DESK*CW/HS)); AP=$((PHONE*CW/HS)); echo "sets ${AD} px wide beside the ${DESK} hero set, ${AP} beside the ${PHONE}"
for i in $(seq 0 $((N-1))); do
  f=$(printf "%s/apart-%03d.png" "$IN" $i)
  magick "$f" -crop "${CW}x${CH}+${X}+${Y}" +repage -resize "${AD}x" -quality 78 -define webp:alpha-quality=85 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/apart-%d-%03d.webp" "$OUT" $DESK $i)"
  magick "$f" -crop "${CW}x${CH}+${X}+${Y}" +repage -resize "${AP}x" -quality 70 -define webp:alpha-quality=80 -define webp:alpha-filtering=best -define webp:method=6 "$(printf "%s/apart-%d-%03d.webp" "$OUT" $PHONE $i)"
done
cp "$OUT/apart-$DESK-$(printf %03d $((N-1))).webp" "$OUT/poster-apart-$DESK.webp"; cp "$OUT/apart-$PHONE-$(printf %03d $((N-1))).webp" "$OUT/poster-apart-$PHONE.webp"
echo "$N frames; $PHONE set $(du -ck $OUT/apart-$PHONE-*.webp | tail -1 | cut -f1) KB; $DESK set $(du -ck $OUT/apart-$DESK-*.webp | tail -1 | cut -f1) KB; phone on the wire $(( $(stat -f%z $OUT/apart-$PHONE-*.webp | paste -sd+ -) )) bytes"
