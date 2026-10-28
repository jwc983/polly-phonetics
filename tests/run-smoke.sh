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
  const expectedState = { introduced: 50, stickers: 0, sessions: 0, rounds: 6, voice: "girl", stats: 0 };
  const failures = [];
  const check = (ok, what) => { if (!ok) failures.push(what); };
  check(report.results.every((r) => r.end === "home"), "a session did not end at home");
  check(report.results.every((r) => r.recorded || !r.read), "reading came up without recorded sounds");
  check(report.results.some((r) => r.recorded && r.read), "reading never came up with recorded sounds");
  check(report.seenRobot, "robot talk never came up");
  check(report.errors.length === 0, "errors: " + report.errors.join("; "));
  check(report.rules.length === 0, "lesson rules: " + report.rules.join("; "));
  check(report.zip.crc && report.zip.roundTrip, "zip round trip");
  check(JSON.stringify(report.zip.keys) === JSON.stringify(["s", "w:yo-yo", "p:welldone", null, "oo2"]), "zip paths: " + JSON.stringify(report.zip.keys));
  check(report.zip.exported.join() === "words/sun.wav:244", "export: " + report.zip.exported.join());
  check(report.trimmedSeconds > 0.38 && report.trimmedSeconds < 0.52, "trim kept " + report.trimmedSeconds + " s, expected about 0.45");
  check(report.wordRecording.computerSaid.join() === "moon,cat,kite", "fallback speech: " + report.wordRecording.computerSaid.join());
  check(report.panelOk, "grown-up menu");
  check(JSON.stringify(report.normalizedState) === JSON.stringify(expectedState), "normalizeState");
  if (failures.length) { console.error("Smoke assertions failed:\n- " + failures.join("\n- ")); process.exit(1); }
  console.error("Smoke OK");
' "$REPORT"
