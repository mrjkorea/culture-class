#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

for id in t01_forest t02_chop t03_carry t04_stand t05_lights t06_ornaments t07_presents t08_wrap t09_stockings t10_treats t11_santa; do
  case $id in
    t01_forest) cap="Forest" ;;
    t02_chop) cap="Chop" ;;
    t03_carry) cap="Carry" ;;
    t04_stand) cap="Tree stand" ;;
    t05_lights) cap="Lights" ;;
    t06_ornaments) cap="Ornaments" ;;
    t07_presents) cap="Presents" ;;
    t08_wrap) cap="Wrap gift" ;;
    t09_stockings) cap="Stockings" ;;
    t10_treats) cap="Cookies & milk" ;;
    t11_santa) cap="Santa" ;;
  esac
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x1b3d2f:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=48:fontcolor=0xe8f5e9:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.001,1.12)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "December transitions in $OUT"
