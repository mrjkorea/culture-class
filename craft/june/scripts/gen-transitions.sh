#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

for id in t01_dig t02_plant t03_water t04_grow t05_pick t06_pin t07_march t08_place t09_card t10_silence; do
  case $id in
    t01_dig) cap="Dig soil" ;;
    t02_plant) cap="Plant seeds" ;;
    t03_water) cap="Water" ;;
    t04_grow) cap="Poppies grow" ;;
    t05_pick) cap="Pick poppy" ;;
    t06_pin) cap="Pin poppy" ;;
    t07_march) cap="Walk" ;;
    t08_place) cap="Memorial" ;;
    t09_card) cap="We remember" ;;
    t10_silence) cap="Silence" ;;
  esac
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x2a1215:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=48:fontcolor=0xf4c2c2:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.001,1.12)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "June transitions in $OUT"
