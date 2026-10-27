#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

for id in t01_hunt t02_pluck t03_stuff t04_oven t05_mash t06_gravy t07_pie t08_plates t09_silver t10_seat t11_thanks; do
  case $id in
    t01_hunt) cap="Turkey hunt" ;;
    t02_pluck) cap="Pluck" ;;
    t03_stuff) cap="Stuff" ;;
    t04_oven) cap="Oven roast" ;;
    t05_mash) cap="Mash potatoes" ;;
    t06_gravy) cap="Gravy" ;;
    t07_pie) cap="Pumpkin pie" ;;
    t08_plates) cap="Plates" ;;
    t09_silver) cap="Forks & glasses" ;;
    t10_seat) cap="Seat family" ;;
    t11_thanks) cap="Thankful" ;;
  esac
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x6b2d0a:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=48:fontcolor=0xffe8d6:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.001,1.12)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "November transitions in $OUT"
