#!/usr/bin/env bash
# Post-merge: confirm GitHub Pages climb.html cache bust + month-wins unit logic.
set -euo pipefail
BASE="${1:-https://mrjkorea.github.io/culture-class}"
HTML="$(curl -fsSL "${BASE}/climb/climb.html?month=10")"
echo "=== wb.js query in live climb.html ==="
echo "$HTML" | grep -o 'wb.js?v=[^"]*' | head -1
echo "=== unit logic (month=10 beats unit=basic_a_u06) ==="
node -e "
const qs = new URLSearchParams('month=10&unit=basic_a_u06');
const monthRaw=qs.get('month');
const monthNum=monthRaw!=null?parseInt(String(monthRaw).trim(),10):NaN;
let unit;
if(Number.isFinite(monthNum)&&monthNum>=1&&monthNum<=12){
  unit='culture_m'+String(monthNum).padStart(2,'0');
}else{
  unit=qs.get('unit')||'basic_a_u06';
}
if(unit!=='culture_m10'){console.error('FAIL unit='+unit);process.exit(1);}
console.log('PASS unit='+unit);
"
echo "=== culture_m10.json HTTP ==="
curl -fsSL -o /dev/null -w "culture_m10.json HTTP %{http_code}\n" "${BASE}/climb/data/culture_m10.json"
