#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VOICE_ID="${NIA_VOICE_ID:-ffd05ab81f184e10b6767e52342dd244}"
OUT="$ROOT/assets/audio/nia"

if [ -z "${FISH_API_KEY:-}" ]; then
  echo "Set FISH_API_KEY to bake Nia audio." >&2
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

bake intro.mp3 "Hi! Let's help Earth today — eleven green steps from river cleanup to a planet high-five!"
bake finale.mp3 "Planet saved for today! Check the board for your time."
bake miss.mp3 "Oops — try the right bin!"

echo "Done — extend with stage lines from LINES.md"
