#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

for id in t01_river t02_bag t03_plastic t04_paper t05_cans t06_dig t07_plant t08_water t09_lights t10_bike t11_highfive; do
  case $id in
    t01_river) cap="River cleanup" ;;
    t02_bag) cap="Trash bag" ;;
    t03_plastic) cap="Plastic" ;;
    t04_paper) cap="Paper" ;;
    t05_cans) cap="Cans" ;;
    t06_dig) cap="Dig" ;;
    t07_plant) cap="Plant" ;;
    t08_water) cap="Water" ;;
    t09_lights) cap="Lights off" ;;
    t10_bike) cap="Bike path" ;;
    t11_highfive) cap="High-five" ;;
  esac
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x2d6a4f:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=48:fontcolor=0xd8f3dc:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.001,1.12)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "September transitions in $OUT"
