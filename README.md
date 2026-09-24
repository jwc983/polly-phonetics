# Polly Phonics 🦜

A small, offline phonics app for a child aged 3–4, used together with a grown-up.
It teaches letter **sounds** (not letter names) in a fixed order, with short daily sessions.

## Start

Open `index.html` in Chrome or Safari. No internet, server or install is needed.

- **Child:** tap the big ▶ button. Everything on the child's screens is pictures, sounds and big buttons.
- **Grown-up:** press and hold ⚙️ (top right) for about a second to open the grown-up menu (English + 中文).
- **Stop at any time:** 🏠 ends a session. 🔊 repeats the current sound or question.

## Before the first session: record the sounds (about 5 minutes)

Computer voices cannot say a letter sound on its own: they turn *s* into “suh” and *p* into “puh”.
Children then find it hard to blend s‑a‑t into “sat”. So the app uses **your** voice.

In the grown-up menu, under **Record the letter sounds**, press ● Record for each sound.
Recording stops by itself after 2.5 seconds, and the silence at each end is trimmed.

| Letter | Sound | Tip |
|---|---|---|
| s | as in **s**un | Long hiss: sssss |
| a | as in **a**pple | Short “a”, not “ay” |
| t | as in **t**iger | Whispered tap, not “tuh” |
| p | as in **p**ig | Whispered pop, not “puh” |
| i | as in **i**nsect | Short “i”, not “eye” |
| n | as in **n**ose | Long hum: nnnn |
| m | as in **m**oon | Long hum: mmmm |
| d | as in **d**uck | As short as you can |
| g | as in **g**oat | As short as you can |
| o | as in **o**ctopus | Short “o” (American “ah”) |
| c / k | as in **c**at, **k**ite | Whispered click, not “kuh” — one recording for both |

Recordings stay in this browser on this computer. Alternatively, put audio files named
`s.m4a`, `a.m4a`, … `k.m4a` (also `.mp3` or `.wav`) in `audio/sounds/`.
Until a sound is recorded, the app says its picture word instead (“sun”), and the
home screen shows a reminder.

## Record everything in your own voice (optional)

Besides the letter sounds, you can record **every word and phrase** the app says:
105 words (picture names, rhymes, clapping words, reading words) and 4 phrases
(“Which one starts with”, “Which one rhymes with”, “Robot says”, “Well done!”).
In the grown-up menu, under **Record words and phrases**, press **● Record next** again and again.
Each press records one item, stops by itself, and plays it back. This takes about 15 minutes in total.
You can also tap any word to record it (or record it again), ▶ to hear it, ✕ to delete it.

Anything not recorded uses the computer voice, so you can record a few words at a time.

## Voice

Your recordings always play in **your natural voice**. For anything you have not recorded,
the app uses a computer voice: a **little-girl voice** by default (a clear female voice with raised
pitch, since this Mac has no real child voice), or a grown-up voice. Change it under **Voice · 声音**
in the grown-up menu and press **▶ Try it** to hear it. There is also an optional
“raise the pitch of my recordings” box, which is off by default.

## How a session works (3–5 minutes)

1. **Listening warm-up (about 1 minute)**, taking turns: rhyme (“which one rhymes with *cat*?”),
   clapping the beats in a word, and — once sounds are recorded — robot talk (hear *c‑a‑t*, find the cat).
2. **Meet the current letter:** see it, hear its sound, and link it to a picture (*s* → ☀️ sun).
3. **Letter rounds** (4, 6 or 8; set in the grown-up menu), taking turns:
   - hear a sound → tap its letter;
   - see and hear a letter → tap the picture that starts with that sound.

   Half the rounds practise the current letter. The rest review earlier letters, with weaker ones coming up more often.
4. **Reading (up to 2 words),** once enough letters are taught: tap each letter for its sound,
   press 🔊 ➜ to hear them in a row, and let your child try to say the word.
   The grown-up taps ✓ (read it alone) or 🤝 (needed help). **The picture appears only after that**,
   so the child reads the letters rather than guessing from the picture.
5. A star sticker for the home screen.

## Order of letters

UK *Letters and Sounds*, Phase 2: **s a t p → i n m d → g o c k**. Letters are lowercase only.
After s, a, t the child can already read *at*, *sat*; after all 12 there are 41 words to read.

## Moving on is your choice

Nothing is locked. The grown-up menu shows each letter's progress and suggests moving on when the
current letter looks secure: **4 of the last 5 right, on at least 2 different days**. You decide:
use **Teach next letter**, **Go back one**, or tap any letter to make it the current one.

Reading words is a bonus at this age, not a goal. Stop as soon as your child loses interest.

## Saving progress

Progress is saved in the browser automatically. Use **Export** in the grown-up menu now and then
to keep a backup file, and **Import** to restore it (for example, on another computer).
Recordings are not included in the export.

## Files

```
index.html            page layout and styles
app.js                app logic: sessions, games, audio, recording, grown-up menu
data/curriculum.js    letters, sounds, pictures, rhymes, clapping words and reading words
audio/sounds/         optional sound files (s.m4a …)
fonts/                Andika font (SIL Open Font License), with the simple “a” and “g” children learn
tests/                automated checks (see below)
```

To change the content (more words, other pictures), edit `data/curriculum.js`.

## Tests

```sh
./tests/run-smoke.sh                  # plays 3 whole sessions in headless Chrome; prints a JSON report
node tests/screenshots.mjs /tmp/shots # saves a screenshot of each screen (needs Node 22+)
```

A good smoke result shows every session ending at `"home"` and `"errors": []`.
