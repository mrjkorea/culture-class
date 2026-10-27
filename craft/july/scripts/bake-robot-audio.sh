#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Robot — set ROBOT_VOICE_ID to your Fish Robot reference_id (see APPROVED_VOICES).
VOICE_ID="${ROBOT_VOICE_ID:-}"
OUT="$ROOT/assets/audio/robot"

if [ -z "$VOICE_ID" ]; then
  echo "Set ROBOT_VOICE_ID (Fish Robot reference_id) and FISH_API_KEY." >&2
  exit 1
fi
if [ -z "${FISH_API_KEY:-}" ]; then
  echo "Set FISH_API_KEY to bake Robot audio." >&2
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

bake intro.mp3 "Hey! Canada Day quest — eleven steps from maple sap to fireworks. Let's go, eh!"
bake finale.mp3 "O Canada! Check the board for your time."
bake miss.mp3 "Nice try — give it another go, eh?"

echo "Done — extend this script with stage lines from LINES.md"
