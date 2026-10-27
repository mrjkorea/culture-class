#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Grandma June — set JUNE_VOICE_ID to your Fish Grandma June reference_id (see APPROVED_VOICES).
VOICE_ID="${JUNE_VOICE_ID:-ca3007f96ae7499ab87d27ea3599956a}"
OUT="$ROOT/assets/audio/june"
LINES="$OUT/LINES.md"

if [ -z "${FISH_API_KEY:-}" ]; then
  echo "Set FISH_API_KEY to bake June audio." >&2
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

# Minimal bake from LINES table — extend as needed
bake intro.mp3 "Welcome. Let's remember together — ten quiet steps from seed to silence."
bake finale.mp3 "Lest we forget. Check the board for your time."
bake miss.mp3 "Let's try again, gently."

echo "Done — June clips in $OUT (add stage lines to this script or bake from LINES.md)"
