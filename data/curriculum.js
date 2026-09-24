// Polly Phonics curriculum data.
// Loaded with a plain <script> tag (not fetch) so the app works when index.html
// is opened straight from disk with no server.
//
// Sequence: UK "Letters and Sounds", Phase 2, sets 1–3 (s a t p | i n m d | g o c k).
// Graphemes (letters) and phonemes (sounds) are kept separate: c and k share /k/.
// Accent: American English. Vowels are the short sounds (a as in apple, o as in octopus).

window.CURRICULUM = {
  // One entry per sound. `file` is the recording name looked for in audio/sounds/.
  phonemes: {
    s: { keyword: "sun", tip: "Long hiss: sssss. No “uh” at the end.", tipZh: "长长的嘶嘶声 sssss，结尾不要加 “uh”。" },
    a: { keyword: "apple", tip: "Short a, as at the start of “apple”. Not the letter name “ay”.", tipZh: "短音 a，像 apple 的开头，不是字母名 “ei”。" },
    t: { keyword: "tiger", tip: "Quick whispered t, a tiny tap of the tongue. Not “tuh”.", tipZh: "轻轻的气音 t，舌尖一碰就好，不要说成 “tuh”。" },
    p: { keyword: "pig", tip: "Whispered pop of the lips. Not “puh”.", tipZh: "嘴唇轻轻一“噗”，是气音，不要说成 “puh”。" },
    i: { keyword: "insect", tip: "Short i, as at the start of “insect”. Not the letter name “eye”.", tipZh: "短音 i，像 insect 的开头，不是字母名 “ai”。" },
    n: { keyword: "nose", tip: "Long hum through the nose: nnnn.", tipZh: "用鼻子长长地哼 nnnn。" },
    m: { keyword: "moon", tip: "Long hum with closed lips: mmmm.", tipZh: "闭上嘴唇长长地哼 mmmm。" },
    d: { keyword: "duck", tip: "Short d. Keep it as short as you can, not “duh”.", tipZh: "短促的 d，尽量短，不要拖成 “duh”。" },
    g: { keyword: "goat", tip: "Short g from the throat, as short as you can. Not “guh”.", tipZh: "喉咙发出的短促 g，尽量短，不要拖成 “guh”。" },
    o: { keyword: "octopus", tip: "Short o, as at the start of “octopus” (American “ah”).", tipZh: "短音 o，像 octopus 的开头（美式发音接近 “啊”）。" },
    k: { keyword: "cat", tip: "Whispered k, a quiet click at the back of the mouth. Not “kuh”.", tipZh: "舌根轻轻一顶的气音 k，不要说成 “kuh”。" }
  },

  // Teaching order. `group` is the Letters and Sounds set number.
  letters: [
    { g: "s", phoneme: "s", group: 1, keyword: "sun", emoji: "☀️" },
    { g: "a", phoneme: "a", group: 1, keyword: "apple", emoji: "🍎" },
    { g: "t", phoneme: "t", group: 1, keyword: "tiger", emoji: "🐯" },
    { g: "p", phoneme: "p", group: 1, keyword: "pig", emoji: "🐷" },
    { g: "i", phoneme: "i", group: 2, keyword: "insect", emoji: "🐛" },
    { g: "n", phoneme: "n", group: 2, keyword: "nose", emoji: "👃" },
    { g: "m", phoneme: "m", group: 2, keyword: "moon", emoji: "🌙" },
    { g: "d", phoneme: "d", group: 2, keyword: "duck", emoji: "🦆" },
    { g: "g", phoneme: "g", group: 3, keyword: "goat", emoji: "🐐" },
    { g: "o", phoneme: "o", group: 3, keyword: "octopus", emoji: "🐙" },
    { g: "c", phoneme: "k", group: 3, keyword: "cat", emoji: "🐱" },
    { g: "k", phoneme: "k", group: 3, keyword: "kite", emoji: "🪁" }
  ],

  // Pictures for "which one starts with this sound?". `first` is the first phoneme;
  // pictures whose first sound is outside the course use "x" and serve only as distractors.
  // Vowel-initial distractors are left out on purpose (egg vs apple is too close for age 3–4).
  pictures: [
    { word: "sun", emoji: "☀️", first: "s" }, { word: "sock", emoji: "🧦", first: "s" },
    { word: "seal", emoji: "🦭", first: "s" }, { word: "sandwich", emoji: "🥪", first: "s" },
    { word: "apple", emoji: "🍎", first: "a" }, { word: "ant", emoji: "🐜", first: "a" },
    { word: "alligator", emoji: "🐊", first: "a" },
    { word: "tiger", emoji: "🐯", first: "t" }, { word: "tent", emoji: "⛺", first: "t" },
    { word: "tomato", emoji: "🍅", first: "t" }, { word: "turtle", emoji: "🐢", first: "t" },
    { word: "pig", emoji: "🐷", first: "p" }, { word: "pizza", emoji: "🍕", first: "p" },
    { word: "penguin", emoji: "🐧", first: "p" }, { word: "panda", emoji: "🐼", first: "p" },
    { word: "insect", emoji: "🐛", first: "i" },
    { word: "nose", emoji: "👃", first: "n" }, { word: "nut", emoji: "🥜", first: "n" },
    { word: "moon", emoji: "🌙", first: "m" }, { word: "monkey", emoji: "🐒", first: "m" },
    { word: "mouse", emoji: "🐭", first: "m" }, { word: "milk", emoji: "🥛", first: "m" },
    { word: "duck", emoji: "🦆", first: "d" }, { word: "dog", emoji: "🐶", first: "d" },
    { word: "dinosaur", emoji: "🦕", first: "d" }, { word: "door", emoji: "🚪", first: "d" },
    { word: "goat", emoji: "🐐", first: "g" }, { word: "gift", emoji: "🎁", first: "g" },
    { word: "guitar", emoji: "🎸", first: "g" }, { word: "gorilla", emoji: "🦍", first: "g" },
    { word: "octopus", emoji: "🐙", first: "o" }, { word: "otter", emoji: "🦦", first: "o" },
    { word: "cat", emoji: "🐱", first: "k" }, { word: "kite", emoji: "🪁", first: "k" },
    { word: "cake", emoji: "🍰", first: "k" }, { word: "key", emoji: "🔑", first: "k" },
    { word: "cow", emoji: "🐄", first: "k" }, { word: "koala", emoji: "🐨", first: "k" },
    { word: "fish", emoji: "🐟", first: "x" }, { word: "ball", emoji: "⚽", first: "x" },
    { word: "bee", emoji: "🐝", first: "x" }, { word: "house", emoji: "🏠", first: "x" },
    { word: "rabbit", emoji: "🐰", first: "x" }, { word: "hat", emoji: "🎩", first: "x" },
    { word: "lion", emoji: "🦁", first: "x" }, { word: "fox", emoji: "🦊", first: "x" },
    { word: "zebra", emoji: "🦓", first: "x" }, { word: "banana", emoji: "🍌", first: "x" },
    { word: "rocket", emoji: "🚀", first: "x" }, { word: "whale", emoji: "🐳", first: "x" },
    { word: "lemon", emoji: "🍋", first: "x" }, { word: "bus", emoji: "🚌", first: "x" }
  ],

  // Warm-up 1: rhyme. Each pair rhymes; the other option comes from a different pair.
  rhymes: [
    [{ word: "cat", emoji: "🐱" }, { word: "hat", emoji: "🎩" }],
    [{ word: "dog", emoji: "🐶" }, { word: "log", emoji: "🪵" }],
    [{ word: "bee", emoji: "🐝" }, { word: "tree", emoji: "🌳" }],
    [{ word: "car", emoji: "🚗" }, { word: "star", emoji: "⭐" }],
    [{ word: "moon", emoji: "🌙" }, { word: "spoon", emoji: "🥄" }],
    [{ word: "cake", emoji: "🍰" }, { word: "snake", emoji: "🐍" }],
    [{ word: "mouse", emoji: "🐭" }, { word: "house", emoji: "🏠" }],
    [{ word: "goat", emoji: "🐐" }, { word: "boat", emoji: "⛵" }],
    [{ word: "bear", emoji: "🐻" }, { word: "pear", emoji: "🍐" }],
    [{ word: "sock", emoji: "🧦" }, { word: "clock", emoji: "🕐" }],
    [{ word: "fox", emoji: "🦊" }, { word: "box", emoji: "📦" }],
    [{ word: "bell", emoji: "🔔" }, { word: "shell", emoji: "🐚" }]
  ],

  // Warm-up 2: clap the syllables (parent-led, not scored).
  claps: [
    { word: "sun", emoji: "☀️", beats: 1 }, { word: "dog", emoji: "🐶", beats: 1 },
    { word: "fish", emoji: "🐟", beats: 1 }, { word: "apple", emoji: "🍎", beats: 2 },
    { word: "tiger", emoji: "🐯", beats: 2 }, { word: "rabbit", emoji: "🐰", beats: 2 },
    { word: "pizza", emoji: "🍕", beats: 2 }, { word: "monkey", emoji: "🐒", beats: 2 },
    { word: "banana", emoji: "🍌", beats: 3 }, { word: "elephant", emoji: "🐘", beats: 3 },
    { word: "butterfly", emoji: "🦋", beats: 3 }, { word: "dinosaur", emoji: "🦕", beats: 3 },
    { word: "octopus", emoji: "🐙", beats: 3 }, { word: "watermelon", emoji: "🍉", beats: 4 },
    { word: "alligator", emoji: "🐊", beats: 4 }
  ],

  // Warm-up 3: robot talk (oral blending). Needs recordings for every sound in the word.
  // `sounds` lists phonemes, so "cat" is k-a-t.
  robotWords: [
    { word: "cat", emoji: "🐱", sounds: ["k", "a", "t"] },
    { word: "dog", emoji: "🐶", sounds: ["d", "o", "g"] },
    { word: "pig", emoji: "🐷", sounds: ["p", "i", "g"] },
    { word: "map", emoji: "🗺️", sounds: ["m", "a", "p"] },
    { word: "pan", emoji: "🍳", sounds: ["p", "a", "n"] },
    { word: "pin", emoji: "📌", sounds: ["p", "i", "n"] },
    { word: "ant", emoji: "🐜", sounds: ["a", "n", "t"] },
    { word: "cap", emoji: "🧢", sounds: ["k", "a", "p"] },
    { word: "sad", emoji: "😢", sounds: ["s", "a", "d"] },
    { word: "can", emoji: "🥫", sounds: ["k", "a", "n"] },
    { word: "tap", emoji: "🚰", sounds: ["t", "a", "p"] },
    { word: "man", emoji: "👨", sounds: ["m", "a", "n"] }
  ],

  // Words to read. A word appears only when every letter in it has been taught.
  // `emoji` is shown after the child has tried to read it (null = a star instead).
  readWords: [
    { word: "at", emoji: null }, { word: "sat", emoji: "🪑" }, { word: "pat", emoji: "🤚" },
    { word: "tap", emoji: "🚰" }, { word: "sap", emoji: null },
    { word: "it", emoji: null }, { word: "sit", emoji: "🪑" }, { word: "sip", emoji: "🥤" },
    { word: "tip", emoji: null }, { word: "pit", emoji: null },
    { word: "in", emoji: null }, { word: "an", emoji: null }, { word: "ant", emoji: "🐜" },
    { word: "nap", emoji: "😴" }, { word: "pan", emoji: "🍳" }, { word: "pin", emoji: "📌" },
    { word: "tin", emoji: "🥫" }, { word: "man", emoji: "👨" }, { word: "map", emoji: "🗺️" },
    { word: "mat", emoji: null }, { word: "am", emoji: null },
    { word: "dad", emoji: "👨" }, { word: "sad", emoji: "😢" }, { word: "mad", emoji: "😠" },
    { word: "dip", emoji: null }, { word: "and", emoji: null },
    { word: "dig", emoji: "⛏️" }, { word: "pig", emoji: "🐷" }, { word: "tag", emoji: "🏷️" },
    { word: "on", emoji: null }, { word: "dog", emoji: "🐶" }, { word: "pot", emoji: "🍲" },
    { word: "top", emoji: null }, { word: "mop", emoji: "🧹" }, { word: "not", emoji: null },
    { word: "cat", emoji: "🐱" }, { word: "can", emoji: "🥫" }, { word: "cap", emoji: "🧢" },
    { word: "cot", emoji: null }, { word: "kid", emoji: "🧒" }, { word: "kit", emoji: null }
  ]
};
