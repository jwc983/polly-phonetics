#!/bin/zsh
# Runs tests/smoke.html in headless Chrome and prints the JSON report.
set -euo pipefail
DIR="${0:A:h}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
REPORT=$("$CHROME" --headless=new --disable-gpu --allow-file-access-from-files --autoplay-policy=no-user-gesture-required \
  --virtual-time-budget=600000 --dump-dom "file://$DIR/smoke.html" 2>/dev/null | grep -o 'REPORT .*}' | sed 's/^REPORT //')
print -r -- "$REPORT"
node -e '
  const report = JSON.parse(process.argv[1]);
  const badSession = report.results.find((r) => r.end !== "home");
  const expectedState = { introduced: 50, stickers: 0, sessions: 0, rounds: 6, voice: "girl", stats: 0 };
  if (badSession || report.errors.length || !report.panelOk || JSON.stringify(report.normalizedState) !== JSON.stringify(expectedState)) {
    console.error("Smoke assertions failed", JSON.stringify({ badSession, errors: report.errors, panelOk: report.panelOk, normalizedState: report.normalizedState }));
    process.exit(1);
  }
' "$REPORT"
