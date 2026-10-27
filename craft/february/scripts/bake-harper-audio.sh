#!/usr/bin/env bash
# Bake Miss Harper Fish MP3s into assets/audio/harper/ (requires FISH_API_KEY).
set -euo pipefail
VOICE_ID="736de7d32d7949469ba4664bce9f3f32"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/audio/harper"
LINES="$OUT/LINES.md"

if [[ -z "${FISH_API_KEY:-}" ]]; then
  echo "Set FISH_API_KEY to bake Harper audio." >&2
  exit 1
fi

bake() {
  local file="$1"
  local text="$2"
  echo "→ $file"
  curl -sfS -X POST "https://api.fish.audio/v1/tts" \
    -H "Authorization: Bearer $FISH_API_KEY" \
    -H "Content-Type: application/json" \
    -H "model: s2.1-pro-free" \
    -d "$(python3 -c "import json; print(json.dumps({'text':'''$text''','reference_id':'$VOICE_ID','format':'mp3'}))")" \
    --output "$OUT/$file"
}

# Parse LINES.md table (| file | text |)
while IFS= read -r line; do
  [[ "$line" == "| "*.mp3* ]] || continue
  file=$(echo "$line" | awk -F'|' '{print $2}' | xargs)
  text=$(echo "$line" | awk -F'|' '{print $3}' | xargs)
  [[ "$file" == *.mp3 ]] && bake "$file" "$text"
done < "$LINES"

echo "Done. Harper clips in $OUT"
