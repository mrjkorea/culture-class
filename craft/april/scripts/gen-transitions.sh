#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

ids="t01_hunt1 t02_hunt2 t03_hunt3 t04_hunt4 t05_hunt5 t06_wash t07_dye t08_face t09_aim t10_roll"
caps="Egg hunt|Hunt L2|Hunt L3|Hunt L4|Final hunt|Wash|Dye|Decorate|Aim|Roll"

i=0
for id in $ids; do
  i=$((i+1))
  cap=$(echo "$caps" | cut -d'|' -f$i)
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x4c1d95:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=52:fontcolor=0xfcc2d7:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.0012,1.15)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "April transitions in $OUT"
