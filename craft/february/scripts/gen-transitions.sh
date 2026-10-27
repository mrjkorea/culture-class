#!/usr/bin/env bash
# Generate Valentine transition stills + short movies (1280x720).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"

declare -A CAP=(
  [t01_color]="Pick your paper"
  [t02_fold]="Fold time"
  [t03_stamp]="Stamp hearts"
  [t04_stickers]="Stickers"
  [t05_write]="Write your wish"
  [t06_seal]="Seal the envelope"
  [t07_address]="Class mailbox"
  [t08_drop]="Drop in mailbox"
  [t09_open]="Open your card"
  [t10_candy]="Candy hearts"
)

for id in t01_color t02_fold t03_stamp t04_stickers t05_write t06_seal t07_address t08_drop t09_open t10_candy; do
  cap="${CAP[$id]}"
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x5c1a33:s=1280x720:d=1" \
    -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${cap}':fontsize=52:fontcolor=0xffd6e7:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.0012,1.15)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "Wrote 10 JPG + MP4 under $OUT"
