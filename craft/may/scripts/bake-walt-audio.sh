#!/usr/bin/env bash
set -euo pipefail
VOICE_ID="${WALT_VOICE_ID:-9a9cf47702da476aa4629e2506d4a857}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/audio/walt"
LINES="$OUT/LINES.md"

if [[ -z "${FISH_API_KEY:-}" ]]; then
  echo "Set FISH_API_KEY to bake Walt audio." >&2
  exit 1
fi

while IFS= read -r line; do
  [[ "$line" == "| "*.mp3* ]] || continue
  file=$(echo "$line" | awk -F'|' '{print $2}' | xargs)
  text=$(echo "$line" | awk -F'|' '{print $3}' | xargs)
  [[ "$file" == *.mp3 ]] || continue
  echo "→ $file"
  curl -sfS -X POST "https://api.fish.audio/v1/tts" \
    -H "Authorization: Bearer $FISH_API_KEY" \
    -H "Content-Type: application/json" \
    -H "model: s2.1-pro-free" \
    -d "$(python3 -c "import json; print(json.dumps({'text':'''$text''','reference_id':'$VOICE_ID','format':'mp3'}))")" \
    --output "$OUT/$file"
done < "$LINES"

echo "Done — Walt clips in $OUT"
