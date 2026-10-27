#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

ids="t01_shamrocks t02_jig t03_green t04_pot t05_chase t06_bread t07_bodhran t08_wheaten t09_walk t10_clover t11_parade"
caps="Irish field|Jig time|Wear green|Rainbow gold|Leprechaun|Soda bread|Bodhrán|Wheaten terrier|Park walk|Lucky clover|Parade"

i=0
for id in $ids; do
  i=$((i+1))
  cap=$(echo "$caps" | cut -d'|' -f$i)
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x0d3d1f:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=52:fontcolor=0xc3fae8:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.0012,1.15)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "March transitions ready in $OUT"
