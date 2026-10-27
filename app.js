// Polly Phonics — a parent-led phonics app for ages 3–4.
// Plain browser JavaScript, no build step. Works offline from index.html.
"use strict";

const C = window.CURRICULUM;
const LETTERS = C.letters;
// Letters are keyed by `id`: the letter itself, unless two letters look the same (oo in "moon" and "book").
LETTERS.forEach((l) => { l.id = l.id || l.g; });
const STORE_KEY = "polly-phonics-v1";

// ---------- small helpers ----------

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c != null) node.append(c);
  return node;
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const letterOf = (id) => LETTERS.find((l) => l.id === id);
// The name a grown-up sees: "oo" alone would not say which oo, so it becomes "oo (book)".
const labelOf = (l) => (LETTERS.some((o) => o !== l && o.g === l.g) ? `${l.g} (${l.keyword})` : l.g);
// Split a word into its letters, longest first, so "duck" is d-u-ck and "night" is n-igh-t.
// A word can list its own `units` when the spelling is not enough ("book" uses the short oo).
const GRAPHEMES = [...new Set(LETTERS.map((l) => l.g))].sort((a, b) => b.length - a.length);
function lettersOf(w) {
  if (w.units) return w.units.map(letterOf);
  const out = [];
  for (let i = 0; i < w.word.length;) {
    const g = GRAPHEMES.find((x) => w.word.startsWith(x, i)) || w.word[i];
    out.push(letterOf(g));
    i += g.length;
  }
  return out;
}
// Two first sounds too alike for a young child to tell apart: two vowels, or a listed pair (f and th).
function tooClose(a, b) {
  if (C.phonemes[a] && C.phonemes[a].vowel && C.phonemes[b] && C.phonemes[b].vowel) return true;
  return C.similar.some((group) => group.includes(a) && group.includes(b));
}
// replaceChildren() would print a null child as the text "null", so drop empties first.
function setKids(node, ...kids) { node.replaceChildren(...kids.filter((k) => k != null)); }

// ---------- saved progress ----------

function defaultState() {
  return { version: 1, introduced: 1, stats: {}, words: {}, stickers: 0, sessions: [], warmupTurn: 0, settings: { rounds: 6, voice: "girl", raiseMyPitch: false } };
}
function normalizeState(value) {
  if (!value || value.version !== 1 || typeof value !== "object" || Array.isArray(value)) return defaultState();
  const clean = defaultState();
  const attempts = (groups, limit) => {
    if (!groups || typeof groups !== "object" || Array.isArray(groups)) return {};
    return Object.fromEntries(Object.entries(groups).flatMap(([key, list]) => {
      if (!Array.isArray(list)) return [];
      return [[key, list.filter((a) => a && typeof a === "object" && typeof a.d === "string" && typeof a.ok === "boolean").slice(-limit)]];
    }));
  };
  clean.introduced = Math.min(LETTERS.length, Math.max(1, Number.isInteger(value.introduced) ? value.introduced : 1));
  clean.stats = attempts(value.stats, 40);
  clean.words = attempts(value.words, 20);
  clean.stickers = Number.isInteger(value.stickers) && value.stickers >= 0 ? value.stickers : 0;
  clean.sessions = Array.isArray(value.sessions) ? value.sessions.filter((d) => typeof d === "string").slice(-200) : [];
  clean.warmupTurn = Number.isInteger(value.warmupTurn) && value.warmupTurn >= 0 ? value.warmupTurn : 0;
  if ([4, 6, 8].includes(value.settings && value.settings.rounds)) clean.settings.rounds = value.settings.rounds;
  if (["girl", "adult"].includes(value.settings && value.settings.voice)) clean.settings.voice = value.settings.voice;
  clean.settings.raiseMyPitch = !!(value.settings && value.settings.raiseMyPitch);
  return clean;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
  return defaultState();
}
let state = loadState();
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* export still works */ }
}

function recordAttempt(g, ok, kind) {
  const list = (state.stats[g] = state.stats[g] || []);
  list.push({ d: today(), ok, k: kind });
  if (list.length > 40) list.splice(0, list.length - 40);
  saveState();
}
function recordWord(word, ok) {
  const list = (state.words[word] = state.words[word] || []);
  list.push({ d: today(), ok });
  if (list.length > 20) list.splice(0, list.length - 20);
  saveState();
}

// "Ready" is a suggestion for the parent, never a lock: 4 of the last 5 correct, on 2+ different days.
function letterStatus(g) {
  const recent = (state.stats[g] || []).slice(-5);
  const correct = recent.filter((a) => a.ok).length;
  const days = new Set(recent.map((a) => a.d)).size;
  return { tries: recent.length, correct, days, ready: recent.length >= 5 && correct >= 4 && days >= 2 };
}
const introducedLetters = () => LETTERS.slice(0, state.introduced);
const focusLetter = () => LETTERS[state.introduced - 1];
function readableWords() {
  const known = new Set(introducedLetters());
  return C.readWords.filter((w) => lettersOf(w).every((l) => known.has(l)));
}

// ---------- sound effects (generated, no files needed) ----------

let actx = null;
function audioCtx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  }
  if (actx && actx.state === "suspended") actx.resume();
  return actx;
}
function tone(freq, start, dur, type = "sine", gain = 0.2, endFreq = null) {
  const ctx = audioCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}
const chime = () => [660, 880, 1320].forEach((f, i) => tone(f, i * 0.09, 0.3, "triangle", 0.18));
const boop = () => { tone(260, 0, 0.18, "sine", 0.15); tone(200, 0.14, 0.22, "sine", 0.12); };
const drum = () => tone(160, 0, 0.25, "sine", 0.6, 60);

// ---------- speech (whole words only; never isolated letter sounds) ----------

// Keep synthetic speech close to a natural speaking voice. Large pitch shifts make
// even good system voices sound robotic, so the child-friendly option is only
// slightly brighter and uses the best locally installed female voice available.
const VOICE_STYLES = {
  girl: { names: /Samantha|Flo|Shelley|Sandy|Ava|Allison|Susan|Zoe|Karen/, pitch: 1.08, rate: 1.08 },
  adult: { names: /Samantha|Ava|Allison|Susan|Zoe/, pitch: 1, rate: 1 }
};
const voiceStyle = () => VOICE_STYLES[state.settings.voice] || VOICE_STYLES.girl;
let voice = null;
let currentSpeechFinish = null;
function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  const vs = speechSynthesis.getVoices();
  const us = vs.filter((v) => v.lang === "en-US" || v.lang === "en_US");
  const style = voiceStyle();
  // Prefer downloaded Premium/Enhanced voices. Novelty voices are deliberately
  // penalized; a familiar high-quality voice matters more than artificial pitch.
  const score = (v) => (v.localService ? 20 : 0)
    + (/Premium/i.test(v.name) ? 12 : /Enhanced/i.test(v.name) ? 8 : 0)
    + (style.names.test(v.name) ? 6 : 0)
    - (/Grandma|Grandpa|Bubbles|Organ|Trinoids|Whisper/i.test(v.name) ? 50 : 0);
  const candidates = us.length ? us : vs.filter((v) => /^en(?:-|_)/i.test(v.lang));
  voice = candidates.slice().sort((a, b) => score(b) - score(a))[0] || null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}
function say(text, rate = 0.85) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    stopAudio();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    if (voice) u.voice = voice;
    u.rate = rate * voiceStyle().rate;
    u.pitch = voiceStyle().pitch;
    let finished = false;
    // Some browsers never fire onend, so a timer resolves as a fallback.
    const timer = setTimeout(() => finish(), 1500 + (text.length * 110) / rate);
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (currentSpeechFinish === finish) currentSpeechFinish = null;
      resolve();
    }
    currentSpeechFinish = finish;
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
  });
}

// ---------- letter sounds: parent recordings, then audio files, then a fallback ----------

const recordings = {}; // phoneme -> object URL of an in-app recording (IndexedDB)
const fileSounds = {}; // phoneme -> URL of a file in audio/sounds/, or null
let currentAudio = null;

function stopAudio() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (currentSpeechFinish) currentSpeechFinish();
  if (currentAudio) {
    const playback = currentAudio;
    currentAudio = null;
    playback.audio.pause();
    playback.finish();
  }
}
function soundUrl(ph) { return recordings[ph] || fileSounds[ph] || null; }
const hasSound = (ph) => !!soundUrl(ph);

function probeFile(url) {
  return new Promise((resolve) => {
    const a = new Audio();
    const done = (ok) => { clearTimeout(t); a.oncanplaythrough = a.onloadedmetadata = a.onerror = null; resolve(ok); };
    const t = setTimeout(() => done(false), 2500);
    a.oncanplaythrough = a.onloadedmetadata = () => done(true);
    a.onerror = () => done(false);
    a.preload = "auto";
    a.src = url;
  });
}
async function findSoundFiles() {
  await Promise.all(Object.keys(C.phonemes).map(async (ph) => {
    const urls = ["m4a", "mp3", "wav", "webm", "ogg"].map((ext) => `audio/sounds/${ph}.${ext}`);
    const found = await Promise.all(urls.map(probeFile));
    fileSounds[ph] = urls[found.indexOf(true)] || null;
  }));
}

function playUrl(url) {
  return new Promise((resolve) => {
    stopAudio();
    const a = new Audio(url);
    // Recordings play in the grown-up's natural voice unless they choose to raise the pitch.
    if (state.settings.raiseMyPitch) {
      a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = false;
      a.playbackRate = 1.2;
    }
    let finished = false;
    const playback = { audio: a, finish: done };
    currentAudio = playback;
    function done() {
      if (finished) return;
      finished = true;
      clearTimeout(t);
      if (currentAudio === playback) currentAudio = null;
      resolve();
    }
    const t = setTimeout(done, 6000);
    a.onended = done;
    a.onerror = done;
    a.play().catch(done);
  });
}
// Without a recording, say the keyword ("sun") instead. A computer voice saying
// an isolated sound adds "uh" (s → "suh"), which makes blending harder later.
async function playPhoneme(ph) {
  const url = soundUrl(ph);
  if (url) return playUrl(url);
  return sayWord(C.phonemes[ph].keyword);
}

// Words and phrases: the grown-up's recording if there is one, otherwise the computer voice.
const PHRASES = {
  starts: "Which one starts with",
  rhymes: "Which one rhymes with",
  robot: "Robot says",
  welldone: "Well done!"
};
const wordKey = (word) => `w:${word}`;
const phraseKey = (k) => `p:${k}`;
function sayWord(word, rate) {
  const url = recordings[wordKey(word)];
  return url ? playUrl(url) : say(word, rate);
}
function sayPhrase(k) {
  const url = recordings[phraseKey(k)];
  return url ? playUrl(url) : say(PHRASES[k]);
}
// "Which one rhymes with cat?" is one natural sentence from the computer voice,
// or two parts when either part has a recording.
async function sayPhraseThen(k, word, check) {
  if (!recordings[phraseKey(k)] && !recordings[wordKey(word)]) return say(`${PHRASES[k]} ${word}?`);
  await sayPhrase(k);
  check();
  await sayWord(word);
}
// Every word the app can say, in recording order: letter keywords first, reading words last.
function recordableWords() {
  const found = new Map();
  const add = (word, emoji, group) => {
    if (!found.has(word)) found.set(word, { word, emoji: emoji || null, group });
    else if (!found.get(word).emoji && emoji) found.get(word).emoji = emoji;
  };
  LETTERS.forEach((l) => add(l.keyword, l.emoji, "pictures"));
  C.pictures.forEach((p) => add(p.word, p.emoji, "pictures"));
  C.rhymes.flat().forEach((p) => add(p.word, p.emoji, "pictures"));
  C.claps.forEach((p) => add(p.word, p.emoji, "pictures"));
  C.robotWords.forEach((p) => add(p.word, p.emoji, "pictures"));
  C.readWords.forEach((p) => add(p.word, p.emoji, "reading"));
  return [...found.values()];
}

// IndexedDB keeps recordings on this device.
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("polly-phonics", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("recordings");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbDo(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("recordings", mode);
    const result = fn(tx.objectStore("recordings"));
    tx.oncomplete = () => resolve(result && result.result);
    tx.onerror = () => reject(tx.error);
  });
}
async function loadRecordings() {
  try {
    const db = await openDb();
    await new Promise((resolve) => {
      const store = db.transaction("recordings", "readonly").objectStore("recordings");
      const req = store.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return resolve();
        recordings[cur.key] = URL.createObjectURL(cur.value);
        cur.continue();
      };
      req.onerror = () => resolve();
    });
  } catch (e) { /* IndexedDB unavailable: files and fallback still work */ }
}
// Keys: a phoneme ("s"), a word ("w:sun") or a phrase ("p:welldone").
async function saveRecording(key, blob) {
  try { await dbDo("readwrite", (s) => s.put(blob, key)); } catch (e) { /* kept for this visit only */ }
  if (recordings[key]) URL.revokeObjectURL(recordings[key]);
  recordings[key] = URL.createObjectURL(blob);
}
async function deleteRecording(key) {
  try { await dbDo("readwrite", (s) => s.delete(key)); } catch (e) { /* nothing stored */ }
  if (recordings[key]) URL.revokeObjectURL(recordings[key]);
  delete recordings[key];
}

// Trim silence from both ends so blended sounds follow each other closely.
async function trimToWav(blob, thresholdRatio = 0.08) {
  const ctx = audioCtx();
  if (!ctx) return blob;
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    if (peak < 0.01) return blob;
    const threshold = peak * thresholdRatio;
    let start = 0, end = data.length - 1;
    while (start < end && Math.abs(data[start]) < threshold) start++;
    while (end > start && Math.abs(data[end]) < threshold) end--;
    const pad = Math.floor(buf.sampleRate * 0.03);
    start = Math.max(0, start - pad);
    end = Math.min(data.length - 1, end + pad);
    return encodeWav(data.subarray(start, end + 1), buf.sampleRate, peak);
  } catch (e) {
    return blob;
  }
}
function encodeWav(samples, rate, peak) {
  const gain = Math.min(4, 0.9 / peak); // gentle normalise so quiet recordings are audible
  const out = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); out.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE");
  str(12, "fmt "); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  str(36, "data"); out.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * gain));
    out.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([out], { type: "audio/wav" });
}

// ---------- session engine ----------

class Cancelled extends Error {}
let runId = 0;
let replay = null; // what the 🔊 button repeats in the current step
const guard = (id) => { if (id !== runId) throw new Cancelled(); };

// Spoken prompts run one at a time. Starting a new one (🔊) or tapping an answer
// stops the current one, so the app never talks over itself.
let activePrompt = null;
function startPrompt(id, fn) {
  stopPrompt();
  const ctl = { stopped: false };
  activePrompt = ctl;
  const check = () => { guard(id); if (ctl.stopped) throw new Cancelled(); };
  return fn(check).catch((e) => { if (!(e instanceof Cancelled)) console.error(e); });
}
function stopPrompt() {
  if (activePrompt) activePrompt.stopped = true;
  activePrompt = null;
  stopAudio();
}
const stage = () => $("stage");

function burst(symbol = "⭐") {
  const b = el("div", { class: "star-burst", text: symbol });
  document.body.append(b);
  setTimeout(() => b.remove(), 800);
}
function nextButton(onNext) {
  return el("button", { class: "next", "aria-label": "Next", text: "➜", onclick: () => { stopPrompt(); onNext(); } });
}
// Say each picture name while it lights up, so the child knows what each picture is called.
async function nameChoices(buttons, words, check) {
  try {
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.add("lit");
      await sayWord(words[i]);
      check();
      buttons[i].classList.remove("lit");
      await sleep(150);
      check();
    }
  } finally {
    buttons.forEach((b) => b.classList.remove("lit"));
  }
}

// A choice round: resolves with true if the right button was tapped on the first try.
// After two misses the right answer gently pulses.
function choiceRound(buttons, rightIndex, onWrong, id) {
  return new Promise((resolve) => {
    let misses = 0;
    let answered = false;
    buttons.forEach((b, i) => b.addEventListener("click", async () => {
      if (answered || id !== runId) return;
      stopPrompt();
      if (i === rightIndex) {
        answered = true;
        b.classList.add("right");
        buttons.forEach((o, j) => { if (j !== i) o.classList.add("faded"); });
        chime();
        burst();
        resolve(misses === 0);
      } else {
        misses++;
        boop();
        b.classList.remove("wrong");
        void b.offsetWidth;
        b.classList.add("wrong");
        if (misses >= 2) buttons[rightIndex].classList.add("hint");
        if (onWrong) onWrong(i);
      }
    }));
  });
}

function buildPlan() {
  const steps = [];
  steps.push({ type: "warmup", kind: chooseWarmup() });
  steps.push({ type: "meet", letter: focusLetter() });
  let last = null;
  for (let i = 0; i < state.settings.rounds; i++) {
    const target = pickTarget(last);
    last = target;
    // Letters with no "starts with" pictures (ck, ng, ai…) only get "hear the sound, tap the letter" rounds.
    steps.push({ type: i % 2 === 0 || target.noPictures ? "findLetter" : "findSound", letter: target });
  }
  const words = readableWords();
  if (words.length) {
    const tries = (w) => (state.words[w.word] || []).length;
    const newest = focusLetter();
    const rank = (w) => tries(w) - (lettersOf(w).includes(newest) ? 2 : 0);
    const ranked = shuffle(words).sort((a, b) => rank(a) - rank(b));
    ranked.slice(0, 2).forEach((w) => steps.push({ type: "read", word: w }));
  }
  steps.push({ type: "done" });
  return steps;
}
// Half the rounds practise the newest letter; the rest review earlier letters, weaker ones more often.
function pickTarget(last) {
  const known = introducedLetters();
  if (known.length === 1) return known[0];
  const focus = focusLetter();
  if (last !== focus && Math.random() < 0.5) return focus;
  const pool = known.filter((l) => l !== last);
  const weights = pool.map((l) => {
    const s = letterStatus(l.id);
    return 1.3 - (s.tries ? s.correct / s.tries : 0.5);
  });
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
function robotReady() {
  return C.robotWords.filter((w) => w.sounds.every(hasSound));
}
function chooseWarmup() {
  const kinds = ["rhyme", "clap"];
  if (robotReady().length >= 2) kinds.push("robot");
  const kind = kinds[state.warmupTurn % kinds.length];
  state.warmupTurn++;
  saveState();
  return kind;
}

function renderDots(steps, index) {
  const dots = $("dots");
  dots.replaceChildren(...steps.filter((s) => s.type !== "done").map((s, i) =>
    el("span", { class: i < index ? "done" : i === index ? "now" : "" })));
}

async function runSession() {
  const id = ++runId;
  const steps = buildPlan();
  showScreen("session");
  for (let i = 0; i < steps.length; i++) {
    if (id !== runId) return;
    renderDots(steps, i);
    replay = null;
    try {
      await STEPS[steps[i].type](steps[i], id);
    } catch (e) {
      if (e instanceof Cancelled) return;
      console.error(e);
    }
  }
}

const STEPS = {
  // Meet today's letter: see it, hear its sound, link it to a keyword picture.
  async meet({ letter }, id) {
    const ph = letter.phoneme;
    const letterBtn = el("button", { class: "hero-letter", text: letter.g, "aria-label": `Letter ${letter.g}`, onclick: () => { stopPrompt(); playPhoneme(ph); } });
    const picBtn = el("button", { class: "hero-pic", text: letter.emoji, "aria-label": letter.keyword, onclick: () => { stopPrompt(); sayWord(letter.keyword); } });
    // Letters with the same sound (c, k and ck; f and ff) are shown together once they are taught.
    const twins = introducedLetters().filter((l) => l.phoneme === ph && l !== letter);
    const twinRow = twins.length
      ? el("div", { class: "row" }, [...twins, letter].map((l) => el("button", { class: "choice letter", text: l.g, onclick: () => { stopPrompt(); playPhoneme(ph); } })))
      : null;
    const slot = el("div");
    setKids(stage(), el("div", { class: "with-letter" }, [letterBtn, picBtn]), twinRow, slot);
    const sequence = async (check) => {
      letterBtn.classList.add("lit");
      try {
        await playPhoneme(ph); check(); await sleep(450); check();
        await playPhoneme(ph); check(); await sleep(350); check();
        await sayWord(letter.keyword); check(); await sleep(300); check();
        await playPhoneme(ph); check();
      } finally {
        letterBtn.classList.remove("lit");
      }
    };
    replay = () => startPrompt(id, sequence);
    await replay();
    guard(id);
    await new Promise((resolve) => slot.replaceChildren(nextButton(resolve)));
    guard(id);
  },

  // Hear a sound, tap its letter.
  async findLetter({ letter }, id) {
    const known = introducedLetters();
    const count = known.length <= 2 ? 2 : 3;
    // A wrong answer must sound different and look different (the two oo letters look the same).
    const differs = (l) => l.phoneme !== letter.phoneme && l.g !== letter.g;
    let distractors = shuffle(known.filter(differs));
    if (distractors.length < count - 1) distractors = distractors.concat(LETTERS.slice(state.introduced).filter(differs));
    distractors = distractors.filter((l, i, all) => all.findIndex((o) => o.g === l.g) === i);
    const options = shuffle([letter, ...distractors.slice(0, count - 1)]);
    const buttons = options.map((l) => el("button", { class: "choice letter", text: l.g, "aria-label": `Letter ${l.g}` }));
    const speaker = el("button", { class: "speaker", text: "🔊", "aria-label": "Hear the sound" });
    setKids(stage(), speaker, el("div", { class: "row" }, buttons));
    const prompt = async (check) => {
      speaker.classList.add("playing");
      try { await playPhoneme(letter.phoneme); check(); } finally { speaker.classList.remove("playing"); }
    };
    replay = () => startPrompt(id, prompt);
    speaker.addEventListener("click", replay);
    const answer = choiceRound(buttons, options.indexOf(letter), replay, id);
    await sleep(300); guard(id);
    replay();
    const firstTry = await answer;
    guard(id);
    recordAttempt(letter.id, firstTry, "letter");
    await sleep(900);
    guard(id);
  },

  // See a letter and hear its sound, tap the picture that starts with that sound.
  async findSound({ letter }, id) {
    const known = introducedLetters();
    const count = known.length <= 2 ? 2 : 3;
    const ph = letter.phoneme;
    let targets = C.pictures.filter((p) => p.first === ph);
    // With no recording the fallback says the keyword, which would give the answer away.
    if (!hasSound(ph) && targets.length > 1) targets = targets.filter((p) => p.word !== C.phonemes[ph].keyword);
    const target = pick(targets);
    const pool = C.pictures.filter((p) => p.first !== ph && !tooClose(ph, p.first));
    const options = shuffle([target, ...shuffle(pool).slice(0, count - 1)]);
    const buttons = options.map((p) => el("button", { class: "choice pic", text: p.emoji, "aria-label": p.word }));
    const speaker = el("button", { class: "speaker", text: "🔊", "aria-label": "Hear the sound" });
    setKids(stage(), 
      el("div", { class: "with-letter" }, [speaker, el("span", { class: "tag", text: letter.g })]),
      el("div", { class: "row" }, buttons));
    const sound = async (check) => {
      speaker.classList.add("playing");
      try { await playPhoneme(ph); check(); } finally { speaker.classList.remove("playing"); }
    };
    const prompt = async (check) => {
      await nameChoices(buttons, options.map((p) => p.word), check);
      await sayPhrase("starts"); check();
      await sound(check);
    };
    replay = () => startPrompt(id, prompt);
    speaker.addEventListener("click", () => startPrompt(id, sound));
    const answer = choiceRound(buttons, options.indexOf(target), (i) => startPrompt(id, async (check) => {
      await sayWord(options[i].word); check();
      await sleep(250); check();
      await sound(check);
    }), id);
    await sleep(300); guard(id);
    replay();
    const firstTry = await answer;
    guard(id);
    recordAttempt(letter.id, firstTry, "sound");
    await sayWord(target.word);
    guard(id);
    await sleep(400);
    guard(id);
  },

  // Read a word: tap each letter for its sound, blend, then the grown-up marks it.
  // The picture appears only after the attempt, so the child reads rather than guesses.
  async read({ word }, id) {
    const letters = lettersOf(word);
    const tiles = letters.map((l) => el("button", { class: l.g.length > 1 ? "tile wide" : "tile", text: l.g, "aria-label": `Letter ${l.g}` }));
    tiles.forEach((t, i) => t.addEventListener("click", () => startPrompt(id, async (check) => {
      t.classList.add("lit");
      try { await playPhoneme(letters[i].phoneme); check(); } finally { t.classList.remove("lit"); }
    })));
    const blend = async (check) => {
      for (let i = 0; i < tiles.length; i++) {
        tiles[i].classList.add("lit");
        try { await playPhoneme(letters[i].phoneme); check(); } finally { tiles[i].classList.remove("lit"); }
        await sleep(220);
        check();
      }
    };
    replay = () => startPrompt(id, blend);
    const blendBtn = el("button", { class: "blend-btn", text: "🔊 ➜", "aria-label": "Say each sound in a row", onclick: replay });
    const reveal = el("div", { class: "reveal" });
    const slot = el("div");
    let judged = null;
    const judge = new Promise((resolve) => { judged = resolve; });
    const judgeRow = el("div", { class: "judge" }, [
      el("button", { text: "✓", "aria-label": "Read it alone", onclick: () => judged(true) }),
      el("button", { text: "🤝", "aria-label": "Needed help", onclick: () => judged(false) })
    ]);
    const hint = el("div", { class: "parent-hint", text: "Grown-up: ✓ read it alone · 🤝 needed help — 家长：自己读出来点 ✓，需要帮助点 🤝" });
    // Rough width of the row in letter-heights, so long words shrink to fit a phone (see .tiles).
    const width = letters.reduce((sum, l) => sum + (l.g.length > 1 ? 0.6 * l.g.length + 0.4 : 1.25), 0) + 0.125 * (letters.length - 1);
    setKids(stage(), el("div", { class: "tiles", style: `--w: ${width.toFixed(2)}` }, tiles), blendBtn, reveal, judgeRow, hint, slot);
    const ok = await judge;
    guard(id);
    stopPrompt();
    judgeRow.remove();
    hint.remove();
    recordWord(word.word, ok);
    reveal.textContent = word.emoji || "⭐";
    chime();
    replay = () => startPrompt(id, async (check) => { await sayWord(word.word, 0.75); check(); });
    await replay();
    guard(id);
    await new Promise((resolve) => slot.replaceChildren(nextButton(resolve)));
    guard(id);
  },

  async warmup({ kind }, id) {
    await WARMUPS[kind](id);
  },

  async done(_, id) {
    state.stickers++;
    state.sessions.push(today());
    if (state.sessions.length > 200) state.sessions.splice(0, state.sessions.length - 200);
    saveState();
    setKids(stage(), 
      el("div", { class: "polly", text: "🦜" }),
      el("div", { class: "done-stars", text: "⭐ ⭐ ⭐" }),
      el("button", { class: "next", text: "🏠", "aria-label": "Home", onclick: goHome }));
    $("dots").replaceChildren();
    chime();
    burst("🌟");
    replay = () => startPrompt(id, async () => { await sayPhrase("welldone"); });
    await replay();
  }
};

// ---------- warm-up listening games (about one minute) ----------

const WARMUPS = {
  // Which picture rhymes with this one?
  async rhyme(id) {
    for (const pair of shuffle(C.rhymes).slice(0, 3)) {
      const [target, answer] = shuffle(pair);
      const other = pick(pick(C.rhymes.filter((p) => p !== pair)));
      const options = shuffle([answer, other]);
      const hero = el("button", { class: "hero-pic", text: target.emoji, "aria-label": target.word });
      const buttons = options.map((p) => el("button", { class: "choice pic", text: p.emoji, "aria-label": p.word }));
      setKids(stage(), hero, el("div", { class: "row" }, buttons));
      const prompt = async (check) => {
        await sayWord(target.word); check();
        await sleep(200); check();
        await nameChoices(buttons, options.map((p) => p.word), check);
        await sayPhraseThen("rhymes", target.word, check); check();
      };
      replay = () => startPrompt(id, prompt);
      hero.addEventListener("click", () => startPrompt(id, async () => { await sayWord(target.word); }));
      const result = choiceRound(buttons, options.indexOf(answer),
        (i) => startPrompt(id, async (check) => { await sayWord(options[i].word); check(); }), id);
      replay();
      await result;
      guard(id);
      await sayWord(target.word);
      guard(id);
      await sleep(150);
      guard(id);
      await sayWord(answer.word);
      guard(id);
      await sleep(500);
      guard(id);
    }
  },

  // Clap the beats in a word. Led by the grown-up; not scored.
  async clap(id) {
    for (const w of shuffle(C.claps).slice(0, 3)) {
      const beats = el("div", { class: "beats" });
      const show = async (check) => {
        beats.replaceChildren();
        await sayWord(w.word, 0.7); check();
        await sleep(300); check();
        for (let i = 0; i < w.beats; i++) {
          drum();
          beats.append(el("span"));
          await sleep(480);
          check();
        }
      };
      replay = () => startPrompt(id, show);
      const slot = el("div");
      setKids(stage(), 
        el("button", { class: "hero-pic", text: w.emoji, "aria-label": w.word, onclick: replay }),
        beats,
        el("button", { class: "drum", text: "🥁", "aria-label": "Drum", onclick: drum }),
        slot);
      await replay();
      guard(id);
      await new Promise((resolve) => slot.replaceChildren(nextButton(resolve)));
      guard(id);
    }
  },

  // Robot talk: hear c-a-t, find the cat. Uses the recorded sounds only.
  async robot(id) {
    const ready = robotReady();
    for (const w of shuffle(ready).slice(0, 3)) {
      const other = pick(ready.filter((r) => r !== w));
      const options = shuffle([w, other]);
      const buttons = options.map((p) => el("button", { class: "choice pic", text: p.emoji, "aria-label": p.word }));
      const robotBtn = el("button", { class: "hero-pic", text: "🤖", "aria-label": "Robot" });
      setKids(stage(), robotBtn, el("div", { class: "row" }, buttons));
      const robotSays = async (check) => {
        robotBtn.classList.add("lit");
        try {
          for (const ph of w.sounds) {
            await playPhoneme(ph); check();
            await sleep(300); check();
          }
        } finally {
          robotBtn.classList.remove("lit");
        }
      };
      const prompt = async (check) => {
        await nameChoices(buttons, options.map((p) => p.word), check);
        await sayPhrase("robot"); check();
        await robotSays(check);
      };
      replay = () => startPrompt(id, prompt);
      robotBtn.addEventListener("click", () => startPrompt(id, robotSays));
      const result = choiceRound(buttons, options.indexOf(w), () => startPrompt(id, robotSays), id);
      replay();
      await result;
      guard(id);
      await sayWord(w.word);
      guard(id);
      await sleep(500);
      guard(id);
    }
  }
};

// ---------- screens ----------

const STICKER_SET = ["⭐", "🌟", "🍎", "🐱", "🦜", "🐙", "🌙", "🦆", "🪁", "🐷", "🐯", "☀️"];
function showScreen(name) {
  $("home").hidden = name !== "home";
  $("session").hidden = name !== "session";
  $("gearBtn").hidden = name !== "home";
  $("audioNote").hidden = true;
}
function goHome() {
  runId++;
  stopPrompt();
  showScreen("home");
  const n = state.stickers;
  const shown = Array.from({ length: Math.min(n, 30) }, (_, i) => STICKER_SET[i % STICKER_SET.length]).join(" ");
  $("stickers").textContent = n > 30 ? `${shown} +${n - 30}` : shown;
  const missing = [...new Set(introducedLetters().map((l) => l.phoneme))].filter((ph) => !hasSound(ph));
  const note = $("audioNote");
  note.textContent = "Grown-up: record the letter sounds in ⚙️ · 家长：请在 ⚙️ 里录制字母发音";
  note.hidden = missing.length === 0;
}

$("startBtn").addEventListener("click", () => {
  audioCtx(); // browsers only allow sound after a tap
  pickVoice();
  runSession();
});
$("quitBtn").addEventListener("click", goHome);
$("replayBtn").addEventListener("click", () => {
  if (replay) replay();
});

// Hold the gear for about a second to open the grown-up menu (a light child lock).
(function setupGear() {
  const gear = $("gearBtn");
  let timer = null;
  const cancel = () => { clearTimeout(timer); timer = null; gear.classList.remove("holding"); };
  gear.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    gear.classList.add("holding");
    timer = setTimeout(() => { cancel(); openParent(); }, 1200);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => gear.addEventListener(ev, cancel));
  gear.addEventListener("contextmenu", (e) => e.preventDefault());
  gear.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") openParent(); });
})();

// ---------- grown-up menu (English + Chinese) ----------

let recorder = null;
let recordingKey = null;
let recordTimer = null;
let micStream = null; // kept open while the menu is open, so the browser asks only once
let resetArmed = false;
let panelMessage = "";
let showLaterSounds = false;
let showAllLetters = false;

function openParent() {
  stopAudio();
  $("parent").hidden = false;
  renderParent();
  $("panel").querySelector("button")?.focus();
}
function closeParent() {
  if (recorder) stopRecording();
  if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
  $("parent").hidden = true;
  resetArmed = false;
  panelMessage = "";
  showAllLetters = false;
  goHome();
}
$("parent").addEventListener("click", (e) => { if (e.target === $("parent")) closeParent(); });
$("parent").addEventListener("keydown", (e) => { if (e.key === "Escape") closeParent(); });

function bi(en, zh) {
  return [en, el("span", { class: "zh", text: ` · ${zh}` })];
}

function renderParent() {
  const panel = $("panel");
  const focus = focusLetter();
  const fs = letterStatus(focus.id);
  const next = LETTERS[state.introduced];

  const chips = LETTERS.map((l, i) => {
    const s = letterStatus(l.id);
    const taught = i < state.introduced;
    let label = "not yet · 未学";
    if (taught) label = s.tries === 0 ? "new · 新" : s.ready ? "ready ✓ · 已掌握" : `${s.correct}/${s.tries} · 练习中`;
    const cls = ["lchip", taught ? "" : "locked", l === focus ? "current" : "", taught && s.ready ? "ready" : ""].join(" ");
    return el("button", {
      class: cls, title: "Make this the current letter · 设为当前字母",
      onclick: () => { state.introduced = i + 1; saveState(); panelMessage = ""; renderParent(); }
    }, [el("b", { text: l.g }), labelOf(l) === l.g ? null : `${l.keyword} · `, label]);
  });
  // Keep the phone menu useful: show the current learning neighborhood first,
  // while retaining an explicit way to jump to any later letter.
  const nearbyCount = Math.min(LETTERS.length, Math.max(12, state.introduced + 4));
  const nearbyChips = chips.slice(0, nearbyCount);
  const laterChips = chips.slice(nearbyCount);

  const focusName = labelOf(focus);
  let suggestion;
  if (fs.ready && next) {
    suggestion = bi(`“${focusName}” looks secure (${fs.correct} of the last ${fs.tries} right, on ${fs.days} days). When your child seems keen, you could teach the next letter, “${labelOf(next)}”.`,
      `“${focusName}” 已经比较熟练。孩子有兴趣时，可以开始教下一个字母 “${labelOf(next)}”。`);
  } else if (fs.ready) {
    suggestion = bi(`All ${LETTERS.length} letters are taught. Keep reading words and stories together for fun.`,
      `${LETTERS.length} 个字母都学完了。继续一起开心地读单词和故事吧。`);
  } else if (fs.tries < 5) {
    suggestion = bi(`Keep practising “${focusName}” in short sessions on different days. Earlier letters keep coming back for review.`,
      `在不同的日子里短时间练习 “${focusName}”。之前学过的字母会自动复习。`);
  } else {
    suggestion = bi(`“${focusName}” is still settling (${fs.correct} of the last ${fs.tries} right). Keep going, or move on if your child is bored — nothing is locked.`,
      `“${focusName}” 还在巩固中（最近 ${fs.tries} 次对了 ${fs.correct} 次）。可以继续练习；如果孩子觉得无聊，也可以前进，没有任何锁定。`);
  }

  const words = readableWords().map((w) => w.word);

  // Sounds for the letters taught so far and the next one come first; the rest are tucked away.
  const soon = new Set(LETTERS.slice(0, state.introduced + 1).map((l) => l.phoneme));
  const recRow = ([ph, info]) => {
    const graphemes = LETTERS.filter((l) => l.phoneme === ph).map((l) => l.g);
    const status = recordings[ph] ? ["Recorded ✓ · 已录制", "ok"]
      : fileSounds[ph] ? ["From file ✓ · 使用音频文件", "ok"]
      : ["Missing · 未录制", "missing"];
    const isRec = recordingKey === ph;
    return el("div", { class: "rec" }, [
      el("div", { class: graphemes.length > 1 ? "ph multi" : "ph", text: graphemes.join(" ") }),
      el("div", { class: "tips" }, [
        el("div", { class: `status ${status[1]}`, text: status[0] }),
        el("div", { text: `As in “${info.keyword}”. ${info.tip}` }),
        el("div", { class: "zh", text: info.tipZh })
      ]),
      el("div", { class: "btns" }, [
        el("button", { class: `pbtn ${isRec ? "recording" : ""}`, text: isRec ? "■ Stop · 停止" : "● Record · 录音", disabled: recorder && !isRec ? "" : null, onclick: () => toggleRecording(ph) }),
        el("button", { class: "pbtn", text: "▶", "aria-label": "Play", disabled: hasSound(ph) ? null : "", onclick: () => playPhoneme(ph) }),
        recordings[ph] ? el("button", { class: "pbtn danger", text: "✕", "aria-label": "Delete recording", onclick: async () => { await deleteRecording(ph); renderParent(); } }) : null
      ])
    ]);
  };
  const recRows = Object.entries(C.phonemes).filter(([ph]) => soon.has(ph)).map(recRow);
  const laterSounds = Object.entries(C.phonemes).filter(([ph]) => !soon.has(ph));

  const allWords = recordableWords();
  const phraseItems = Object.entries(PHRASES).map(([k, text]) => ({ key: phraseKey(k), label: text, emoji: "💬", maxMs: 4000 }));
  const wordItems = allWords.map((w) => ({ key: wordKey(w.word), label: w.word, emoji: w.emoji || "⭐", maxMs: 2500, group: w.group }));
  const allItems = [...phraseItems, ...wordItems];
  const doneCount = allItems.filter((it) => recordings[it.key]).length;
  const nextItem = allItems.find((it) => !recordings[it.key]);
  const wordChip = (it) => {
    const has = !!recordings[it.key];
    const isRec = recordingKey === it.key;
    return el("div", { class: `wchip ${has ? "ok" : ""} ${isRec ? "recording" : ""}` }, [
      el("button", { class: "wrec", title: `${it.label} — ${has ? "record again · 重新录制" : "record · 录音"}`, disabled: recorder && !isRec ? "" : null,
        onclick: () => toggleRecording(it.key, it.maxMs) }, [isRec ? "■ " : `${it.emoji} `, it.label]),
      has ? el("button", { class: "wmini", text: "▶", "aria-label": `Play ${it.label}`, onclick: () => { stopAudio(); playUrl(recordings[it.key]); } }) : null,
      has ? el("button", { class: "wmini danger", text: "✕", "aria-label": `Delete ${it.label}`, onclick: async () => { await deleteRecording(it.key); renderParent(); } }) : null
    ]);
  };
  const recordingNext = nextItem && recordingKey === nextItem.key;
  const wordSection = [
    el("h3", {}, bi(`Record words and phrases (${doneCount} of ${allItems.length})`, `录制单词和句子（已录 ${doneCount} / ${allItems.length}）`)),
    el("p", {}, bi("Optional: everything the app says can be in your voice. Say each word clearly and naturally, like reading to your child. Anything not recorded uses the computer voice, so you can record a few at a time.",
      "可选：应用说的所有内容都可以用你的声音。像给孩子读书一样，清楚自然地说出每个词。没有录的词会用电脑语音，所以可以每次录一部分。")),
    el("div", { class: "actions" }, nextItem
      ? [el("button", { class: `pbtn primary ${recordingNext ? "recording" : ""}`, disabled: recorder && !recordingNext ? "" : null,
          onclick: () => toggleRecording(nextItem.key, nextItem.maxMs) },
          recordingNext ? `■ Recording “${nextItem.label}”… tap to stop · 录音中，点击停止` : `● Record next: ${nextItem.emoji} “${nextItem.label}” · 录下一个`),
        el("span", { class: "word-list", text: "Tap, say the word, and it stops by itself · 点一下，说出这个词，会自动停止" })]
      : [el("span", { class: "status ok", text: "All recorded ✓ · 全部录完" })]),
    el("p", { class: "word-list", text: "Phrases · 句子" }),
    el("div", { class: "word-grid" }, phraseItems.map(wordChip)),
    el("p", { class: "word-list", text: "Picture words · 图片单词" }),
    el("div", { class: "word-grid" }, wordItems.filter((it) => it.group === "pictures").map(wordChip)),
    el("p", { class: "word-list", text: "Reading words · 阅读单词" }),
    el("div", { class: "word-grid" }, wordItems.filter((it) => it.group === "reading").map(wordChip))
  ];

  const roundsSelect = el("select", { class: "pbtn", onchange: (e) => { state.settings.rounds = Number(e.target.value); saveState(); } },
    [4, 6, 8].map((n) => { const o = el("option", { value: n, text: `${n}` }); if (n === state.settings.rounds) o.selected = true; return o; }));

  const voiceSelect = el("select", { class: "pbtn", onchange: (e) => { state.settings.voice = e.target.value; saveState(); pickVoice(); renderParent(); } },
    [["girl", "Natural female · 自然女声"], ["adult", "Grown-up · 成人"]].map(([v, label]) => {
      const o = el("option", { value: v, text: label });
      if (v === state.settings.voice) o.selected = true;
      return o;
    }));
  const youngBox = el("input", { type: "checkbox", onchange: (e) => { state.settings.raiseMyPitch = e.target.checked; saveState(); } });
  youngBox.checked = !!state.settings.raiseMyPitch;

  const importInput = el("input", { type: "file", accept: "application/json,.json", hidden: "", onchange: importProgress });

  setKids(panel, 
    el("button", { class: "pbtn close", text: "✕ Close · 关闭", onclick: closeParent }),
    el("h2", {}, bi("Grown-up menu", "家长菜单")),
    panelMessage ? el("div", { class: "suggest", text: panelMessage }) : null,

    el("h3", {}, bi("Progress", "学习进度")),
    el("div", { class: "letter-grid" }, showAllLetters ? chips : nearbyChips),
    laterChips.length ? el("div", { class: "actions" }, [
      el("button", { class: "pbtn", text: showAllLetters ? "Show fewer letters · 收起之后的字母" : `Show all ${LETTERS.length} letters · 显示全部 ${LETTERS.length} 个字母`,
        onclick: () => { showAllLetters = !showAllLetters; renderParent(); } })
    ]) : null,
    el("div", { class: "suggest" }, suggestion),
    el("div", { class: "actions" }, [
      el("button", { class: "pbtn primary", disabled: next ? null : "", text: next ? `Teach next letter: ${labelOf(next)} · 教下一个字母` : "All letters taught · 全部学完",
        onclick: () => { if (next) { state.introduced++; saveState(); renderParent(); } } }),
      el("button", { class: "pbtn", disabled: state.introduced > 1 ? null : "", text: "Go back one · 退回一个",
        onclick: () => { if (state.introduced > 1) { state.introduced--; saveState(); renderParent(); } } })
    ]),
    el("p", { class: "word-list" }, words.length
      ? `Words to read now (${words.length}) · 现在可以读的单词: ${words.join(", ")}`
      : "Reading words start after s, a, t · 学会 s、a、t 之后开始读单词"),
    el("p", { class: "word-list", text: `Sessions finished · 已完成课程: ${state.sessions.length} · Today · 今天: ${state.sessions.filter((d) => d === today()).length}` }),

    el("h3", {}, bi("Record the letter sounds", "录制字母发音")),
    el("p", {}, bi("Record each sound in your own voice, short and pure. Computer voices add “uh” (s → “suh”), which makes blending “s-a-t” into “sat” much harder. Recording stops by itself after 2.5 seconds; silence at the ends is trimmed.",
      "请用自己的声音录下每个发音，要短而纯。电脑语音会加上 “uh”（s 会变成 “suh”），这会让孩子很难把 s-a-t 拼成 sat。录音 2.5 秒后自动停止，前后的静音会被自动剪掉。")),
    el("p", { class: "word-list", text: "Or put files named after each sound (s.m4a, a.m4a, … ch.m4a; the oo in “book” is oo2.m4a) in the audio/sounds folder · 也可以把以发音命名的音频文件（s.m4a、ch.m4a 等）放进 audio/sounds 文件夹" }),
    el("div", { class: "rec-list" }, recRows),
    laterSounds.length ? el("div", { class: "actions" }, [
      el("button", { class: "pbtn", text: showLaterSounds ? "Hide later sounds · 收起之后的发音" : `Show ${laterSounds.length} later sounds · 显示之后的 ${laterSounds.length} 个发音`,
        onclick: () => { showLaterSounds = !showLaterSounds; renderParent(); } }),
      el("span", { class: "word-list", text: "Each sound appears above when its letter is next · 快学到时会自动出现在上面" })
    ]) : null,
    showLaterSounds && laterSounds.length ? el("div", { class: "rec-list later" }, laterSounds.map(recRow)) : null,
    ...wordSection,

    el("h3", {}, bi("Voice", "声音")),
    el("div", { class: "actions" }, [
      el("span", {}, bi("App voice", "应用的声音")),
      voiceSelect,
      el("button", { class: "pbtn", text: "▶ Try it · 试听", onclick: () => { stopAudio(); say("Hi! I'm Polly. Let's play with sounds!"); } })
    ]),
    el("label", { class: "actions" }, [
      youngBox,
      el("span", {}, bi("Raise the pitch of my recordings (off = my natural voice)", "提高我录音的音调（不勾选 = 我的原声）"))
    ]),
    el("p", { class: "word-list" }, bi(`The app voice is only used for words you have not recorded. Using: ${voice ? voice.name : "browser default"}.`,
      "应用的声音只用于你还没录的词。")),

    el("h3", {}, bi("Session", "课程设置")),
    el("div", { class: "actions" }, [el("span", {}, bi("Letter rounds per session", "每次练习轮数")), roundsSelect]),
    el("p", {}, bi("Each session: a 1-minute listening game, the current letter, letter rounds, then up to 2 words. Stop as soon as your child loses interest — the 🏠 button ends a session any time.",
      "每次课程：1 分钟听力游戏、当前字母、字母练习，最多 2 个单词。孩子一没兴趣就停下来，随时点 🏠 结束。")),

    el("h3", {}, bi("Save progress", "保存进度")),
    el("p", {}, bi("Progress is kept in this browser. Export a copy now and then (recordings are not included).",
      "进度保存在这个浏览器里。请不时导出一份备份（录音不包含在内）。")),
    el("div", { class: "actions" }, [
      el("button", { class: "pbtn", text: "⬇ Export · 导出", onclick: exportProgress }),
      el("button", { class: "pbtn", text: "⬆ Import · 导入", onclick: () => importInput.click() }),
      importInput,
      el("button", { class: "pbtn danger", text: resetArmed ? "Tap again to erase all progress · 再点一次清除所有进度" : "Reset progress · 重置进度",
        onclick: () => {
          if (!resetArmed) { resetArmed = true; renderParent(); return; }
          state = defaultState(); saveState(); resetArmed = false; panelMessage = "Progress reset · 进度已重置"; renderParent();
        } })
    ]),

    el("h3", {}, bi("Tips", "小贴士")),
    el("ul", {}, [
      el("li", {}, bi("Say letter sounds, not letter names: “sss”, not “ess”.", "说字母的发音，不是字母名：说 “sss”，不说 “ess”。")),
      el("li", {}, bi("Short and happy beats long: 3–5 minutes, most days.", "短而开心比长时间好：大多数日子练 3–5 分钟。")),
      el("li", {}, bi("Reading words is a bonus at this age, not a goal. No pressure, no deadlines.", "这个年龄能读单词是额外收获，不是目标。不要有压力，也没有期限。")),
      el("li", {}, bi("Keep reading stories aloud in both English and Chinese.", "继续用中文和英文给孩子读故事。"))
    ])
  );
}

// Records one sound, word or phrase. Letter sounds are trimmed tightly so they blend;
// words keep a little more of their soft edges.
async function toggleRecording(key, maxMs = 2500) {
  if (recorder) { stopRecording(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    panelMessage = "This browser cannot record here. Use Chrome or Safari, or add audio files to audio/sounds · 这个浏览器无法录音，请用 Chrome 或 Safari，或把音频文件放进 audio/sounds";
    renderParent();
    return;
  }
  try {
    if (!micStream || !micStream.active) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false } });
    }
  } catch (e) {
    panelMessage = "Microphone not available — please allow microphone access · 无法使用麦克风，请允许访问麦克风";
    renderParent();
    return;
  }
  stopAudio();
  const chunks = [];
  const rec = new MediaRecorder(micStream);
  recorder = rec;
  recordingKey = key;
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = async () => {
    const raw = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
    recorder = null;
    recordingKey = null;
    const trimmed = await trimToWav(raw, key.includes(":") ? 0.04 : 0.08);
    await saveRecording(key, trimmed);
    panelMessage = "";
    renderParent();
    playUrl(recordings[key]);
  };
  rec.start();
  recordTimer = setTimeout(stopRecording, maxMs);
  renderParent();
}
function stopRecording() {
  clearTimeout(recordTimer);
  if (recorder && recorder.state !== "inactive") recorder.stop();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `polly-progress-${today()}.json` });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function importProgress(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const s = JSON.parse(reader.result);
      if (!s || s.version !== 1 || typeof s.introduced !== "number") throw new Error("bad file");
      state = normalizeState(s);
      saveState();
      panelMessage = "Progress imported ✓ · 进度已导入";
    } catch (err) {
      panelMessage = "That file is not a Polly progress file · 这不是 Polly 的进度文件";
    }
    renderParent();
  };
  reader.readAsText(file);
}

// ---------- start ----------

(async function init() {
  goHome();
  await Promise.all([loadRecordings(), findSoundFiles()]);
  goHome();
})();
