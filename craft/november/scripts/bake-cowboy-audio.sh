#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VOICE_ID="${COWBOY_VOICE_ID:-a97131ef0e2f4bc3b55305c9d3ab57c5}"
OUT="$ROOT/assets/audio/cowboy"

if [ -z "${FISH_API_KEY:-}" ]; then
  echo "Set FISH_API_KEY to bake Cowboy audio." >&2
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

bake intro.mp3 "Howdy! Thanksgiving feast time — eleven steps from turkey hunt to grateful hearts. Let's cook!"
bake finale.mp3 "Happy Thanksgiving, partner! Check the board for your time."
bake miss.mp3 "Not that bush — try again!"

echo "Done — extend with stage lines from assets/audio/cowboy/LINES.md"
