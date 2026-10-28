#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

for id in t01_egypt t02_meso t03_indus t04_china t05_greece t06_rome t07_maya t08_mali t09_inca t10_modern; do
  case $id in
    t01_egypt) cap="Egypt" ;;
    t02_meso) cap="Mesopotamia" ;;
    t03_indus) cap="Indus Valley" ;;
    t04_china) cap="China" ;;
    t05_greece) cap="Greece" ;;
    t06_rome) cap="Rome" ;;
    t07_maya) cap="Maya" ;;
    t08_mali) cap="Mali" ;;
    t09_inca) cap="Inca" ;;
    t10_modern) cap="Modern world" ;;
  esac
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x5c4033:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=48:fontcolor=0xf5e6c8:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.001,1.12)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "August History transitions in $OUT"
