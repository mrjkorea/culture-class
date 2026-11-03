#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Grandma June — November Culture Class craft narrator (same voice as May / November word pack).
VOICE_ID="${GRANDMA_VOICE_ID:-${JUNE_VOICE_ID:-0a90765966ac4556a6ecfd86ef8057d3}}"
OUT="$ROOT/assets/audio/grandma"

if [ -z "${FISH_API_KEY:-}" ]; then
  echo "Set FISH_API_KEY to bake Grandma June audio." >&2
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

bake intro.mp3 "Welcome to our Thanksgiving kitchen! Eleven warm steps from turkey to thankful hearts."
bake finale.mp3 "Happy Thanksgiving! Check the board for your time."
bake miss.mp3 "Not quite — let's try again together."

echo "Done — extend with stage lines from assets/audio/grandma/LINES.md"
