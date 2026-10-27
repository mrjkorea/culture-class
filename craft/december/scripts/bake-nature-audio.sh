#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VOICE_ID="${NATURE_VOICE_ID:-3ad4d432023c47ee9e6c7805b973630a}"
OUT="$ROOT/assets/audio/nature"

if [ -z "${FISH_API_KEY:-}" ]; then
  echo "Set FISH_API_KEY to bake Nature (Docs) audio." >&2
  exit 1
fi

bake() {
  local name="$1"
  local text="$2"
  curl -fsS "https://api.fish.audio/v1/tts" \
    -H "Authorization: Bearer $FISH_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json; print(json.dumps({'text':'''$text''','reference_id':'$VOICE_ID','format':'mp3'}))")" \
    -o "$OUT/$name"
}

bake intro.mp3 "Welcome to our Christmas tree quest — eleven steps from the forest to Santa's visit. Let's begin."
bake finale.mp3 "Merry Christmas! Check the board for your time."
bake miss.mp3 "Not that tree — try another spot in the forest."

echo "Done — extend with stage lines from assets/audio/nature/LINES.md"
