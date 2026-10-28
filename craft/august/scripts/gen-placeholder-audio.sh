#!/usr/bin/env bash
# Placeholder MP3s (short tone) until Fish bake — run from craft/august/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/audio/sage"
mkdir -p "$OUT"

bake() {
  local name="$1"
  local path="$OUT/$name"
  if [[ -f "$path" && "$path" -nt "$0" ]]; then
    return 0
  fi
  ffmpeg -y -f lavfi -i "sine=frequency=440:duration=0.35" -q:a 9 "$path" 2>/dev/null
  echo "placeholder $name"
}

while IFS= read -r line; do
  [[ "$line" == "| "*.mp3* ]] || continue
  file=$(echo "$line" | awk -F'|' '{print $2}' | xargs)
  [[ "$file" == *.mp3 ]] || continue
  bake "$file"
done < "$OUT/LINES.md"

echo "Placeholder Sage MP3s in $OUT"
