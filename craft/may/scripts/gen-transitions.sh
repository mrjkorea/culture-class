#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

cap_gate="Temple gate"
cap_fog="Clear fog"
cap_lamp="Intention lamp"
cap_speech="Kind speech"
cap_offering="Offering"
cap_sweep="Sweep path"
cap_walk="Keep walking"
cap_breathe="Mindful breath"
cap_bell="Soft bell"
cap_lotus="Lotus"

for id in t01_gate t02_fog t03_lamp t04_speech t05_offering t06_sweep t07_walk t08_breathe t09_bell t10_lotus; do
  case $id in
    t01_gate) cap=$cap_gate ;;
    t02_fog) cap=$cap_fog ;;
    t03_lamp) cap=$cap_lamp ;;
    t04_speech) cap=$cap_speech ;;
    t05_offering) cap=$cap_offering ;;
    t06_sweep) cap=$cap_sweep ;;
    t07_walk) cap=$cap_walk ;;
    t08_breathe) cap=$cap_breathe ;;
    t09_bell) cap=$cap_bell ;;
    t10_lotus) cap=$cap_lotus ;;
  esac
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0x3d2c1a:s=1280x720:d=1" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontsize=48:fontcolor=0xe9c46a:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.001,1.12)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "May transitions in $OUT"
