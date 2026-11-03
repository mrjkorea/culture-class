#!/usr/bin/env bash
# Replace Culture Class cache-bust token across the repo.
set -euo pipefail
OLD="${1:-20261102-unlock-all}"
NEW="${2:-20261104-nov-quiz-grandma}"
rg -l "$OLD" /workspace --glob '!scripts/bump-cache-version.sh' | while read -r f; do
  sed -i "s/${OLD}/${NEW}/g" "$f"
done
echo "Bumped ${OLD} -> ${NEW}"
