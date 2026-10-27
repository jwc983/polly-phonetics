// Takes screenshots of each app screen via the Chrome DevTools Protocol.
// Usage: node tests/screenshots.mjs <output-dir>   (needs Google Chrome and Node 22+)
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const out = resolve(process.argv[2] || ".");
const page = "file://" + resolve(new URL(".", import.meta.url).pathname, "../index.html");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9333;
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "polly-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 50 && !targets; i++) {
  await sleep(200);
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {}
}
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const js = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true })).result?.value;

async function shot(name, width, height, setup) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await send("Page.navigate", { url: page });
  await sleep(800);
  await js(`localStorage.setItem("polly-phonics-v1", JSON.stringify({ version: 1, introduced: 7, stickers: 5,
    stats: { s: [1,1,1,0,1].map((ok, i) => ({ d: "2026-09-2" + (i % 2), ok: !!ok })), a: [{ d: "2026-09-24", ok: true }] } }))`);
  await send("Page.reload");
  await sleep(1500);
  await js(`speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 5); speechSynthesis.cancel = () => {};`);
  if (setup) { await js(setup); await sleep(1500); }
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(out, `shot-${name}.png`), Buffer.from(data, "base64"));
}

const run = (step) => `showScreen("session"); runId++; ${step}; true`;
await shot("home", 900, 760);
await shot("meet", 900, 760, run(`STEPS.meet({ letter: LETTERS[1] }, runId)`));
await shot("letter", 900, 760, run(`STEPS.findLetter({ letter: LETTERS[2] }, runId)`));
await shot("sound", 900, 760, run(`STEPS.findSound({ letter: LETTERS[0] }, runId)`));
await shot("read", 900, 760, run(`STEPS.read({ word: C.readWords.find((w) => w.word === "sat") }, runId)`));
await shot("read-ck", 900, 760, run(`STEPS.read({ word: C.readWords.find((w) => w.word === "duck") }, runId)`));
await shot("meet-ck", 900, 760, run(`state.introduced = 13; STEPS.meet({ letter: LETTERS[12] }, runId)`));
await shot("read-long", 900, 760, run(`STEPS.read({ word: C.readWords.find((w) => w.word === "number") }, runId)`));
await shot("meet-igh", 900, 760, run(`STEPS.meet({ letter: letterOf("igh") }, runId)`));
await shot("letter-oo", 900, 760, run(`state.introduced = LETTERS.length; STEPS.findLetter({ letter: letterOf("oo2") }, runId)`));
await shot("parent", 900, 1400, `openParent(); true`);
await shot("parent-all", 900, 1400, `state.introduced = LETTERS.length; openParent(); true`);
await shot("parent-words", 900, 1100, `recordings["w:sun"] = recordings["p:starts"] = "x"; openParent(); document.getElementById("parent").scrollTop = document.querySelector(".word-grid").offsetTop - 260; true`);
await shot("phone-sound", 390, 800, run(`STEPS.findSound({ letter: LETTERS[3] }, runId)`));
await shot("phone-read", 390, 800, run(`STEPS.read({ word: C.readWords.find((w) => w.word === "map") }, runId)`));
await shot("phone-read-ck", 390, 800, run(`STEPS.read({ word: C.readWords.find((w) => w.word === "kick") }, runId)`));
await shot("phone-read-long", 390, 800, run(`STEPS.read({ word: C.readWords.find((w) => w.word === "sister") }, runId)`));
await shot("phone-meet-igh", 390, 800, run(`STEPS.meet({ letter: letterOf("igh") }, runId)`));
await shot("phone-parent", 390, 1600, `openParent(); true`);
ws.close();
chrome.kill();
console.log("screenshots written to", out);
