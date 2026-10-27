#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/transitions"
VID="$OUT/video"
mkdir -p "$VID"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

for id in t01_tap t02_boil t03_bottle t04_spot t05_cut t06_fish t07_gear t08_hockey t09_cheer t10_flag t11_fireworks; do
  case $id in
    t01_tap) cap="Maple sap" ;;
    t02_boil) cap="Boil" ;;
    t03_bottle) cap="Syrup" ;;
    t04_spot) cap="Lake spot" ;;
    t05_cut) cap="Ice hole" ;;
    t06_fish) cap="Fishing" ;;
    t07_gear) cap="Skates" ;;
    t08_hockey) cap="Hockey" ;;
    t09_cheer) cap="Cheer" ;;
    t10_flag) cap="Flag" ;;
    t11_fireworks) cap="Fireworks" ;;
  esac
  jpg="$OUT/${id}.jpg"
  mp4="$VID/${id}.mp4"
  ffmpeg -y -f lavfi -i "color=c=0xffffff:s=1280x720:d=1" \
    -vf "drawbox=x=0:y=0:w=iw:h=ih:color=0xc41e3a:t=fill:enable='gte(t,0)',drawbox=x=iw/3:y=0:w=iw/3:h=ih:color=0xffffff:t=fill,drawtext=fontfile=${FONT}:text='${cap}':fontsize=48:fontcolor=0xc41e3a:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 "$jpg" 2>/dev/null
  ffmpeg -y -loop 1 -i "$jpg" -vf "zoompan=z='min(zoom+0.001,1.12)':d=90:s=1280x720:fps=30" -t 3 -pix_fmt yuv420p "$mp4" 2>/dev/null
done

echo "July transitions in $OUT"
