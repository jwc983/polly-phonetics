#!/bin/zsh
# Runs tests/smoke.html in headless Chrome and prints the JSON report.
set -euo pipefail
DIR="${0:A:h}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --allow-file-access-from-files --autoplay-policy=no-user-gesture-required \
  --virtual-time-budget=600000 --dump-dom "file://$DIR/smoke.html" 2>/dev/null | grep -o 'REPORT .*}' | sed 's/^REPORT //'
