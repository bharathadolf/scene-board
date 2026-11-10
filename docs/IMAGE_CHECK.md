# How a picture is checked against its prompt

The loop on the board is: a shot is approved → it gets a Midjourney prompt →
you generate a picture and bring it back → **the check** → the picture is kept,
or the prompt is rewritten. This is what the check actually does.

## What is sent

Pressing **Check** on a shot sends Claude one request carrying four things:

1. **The film's standing rules** — the same premise block every prompt in the
   tool is built on, including the rule that Krishna is unseen until the temple.
2. **The scene around the shot** — its title, what happens in it, the place,
   and the line that matters most: *how much of Krishna is present in this
   scene* (`Not present`, `Spoken of`, `Shadow or sound`, `Hands`, `Effect`,
   or, after the reveal, his face).
3. **The shot itself** — its number, its type (`WIDE`, `POV`, `INSERT`…) and
   its text, plus **the prompt that made the pictures**.
4. **Every picture on that shot**, in order, as real image data — not a
   description of them, not a filename. The check looks at the pictures.

## What Claude is asked

For each picture, judge five things:

- what is in frame,
- the framing and shot size,
- the place,
- the time of day and the light,
- and **whether anyone shown should be shown** — if the scene keeps Krishna off
  screen, his face must not be in the picture.

Then: which single picture is the best one for this shot, **or none** if not one
of them will do. And if none will do, write a better prompt.

The reply is a JSON object:

```json
{
  "best": 2,
  "note": "Image 2 fits the brief better: a tired, bearded guard in a cloth headwrap…",
  "images": [
    {"n": 1, "ok": false, "note": "The crested bronze helmet and segmented armour make him a Roman legionary, not an ancient Indian guard."},
    {"n": 2, "ok": true,  "note": "Close three-quarter shot of a weary guard, warm torchlight, night, eyes following someone off."}
  ],
  "prompt": ""
}
```

`best` is 1-based, `0` means none of them will do, and `prompt` is filled only
in that case.

## What the board does with the answer

- **`best` points at a picture** → that picture is marked as the shot's
  picture (a green border), the others are dimmed, each keeps its one-line
  verdict, and the prompt is left alone. The toast says *Image 2 is the one
  that fits*.
- **`best` is 0** → the verdict reads *None of these is the shot*, and the
  rewritten prompt **replaces** the shot's prompt, so the next thing you copy
  into Midjourney is already the corrected one. The toast says so.
- **The prompt has been approved** (the lock on the prompt itself) → a check
  never rewrites it, however bad the pictures are. The verdict still appears.
- **Adding or removing a picture** clears the verdict, because it no longer
  describes what is on the shot.

Everything the check decided is stored on the shot as `chk`:

```json
{"best": 1, "note": "…", "at": "2026-11-09T18:12:03.511Z",
 "per": [{"i": 0, "ok": false, "note": "…"}, {"i": 1, "ok": true, "note": "…"}]}
```

## Why it matters downstream

The After Effects export never reads your uploads; it reads `chk`. For each
shot it takes the picture the check kept — `chk.best` first, then the first
picture marked `ok`, then a lone unchecked picture — and if the check turned
all of them down, the shot comes through as a labelled red card so the hole is
visible in the timeline rather than silently skipped. The reason travels into
the layer marker and the burn-in, so in After Effects you can see **why** that
frame is on screen.

That is the whole point of the check: it is the record of a judgement, and
everything after it obeys that record instead of guessing from filenames.

## Two notes on prompts

**No version flag.** Prompts no longer carry `--v`. Midjourney uses its newest
model when no version is named, and naming an old one — `--v 7` — costs more
render time for a worse picture. Claude is now told never to write one, and any
flag that slips through, or that is already stored on an old prompt, is
stripped when the prompt is shown, copied or saved. Prompts end at
`--ar 21:9 --style raw`.

**What a prompt is.** One line of comma-separated visual clauses in a fixed
order: what is in frame and what it is doing, where it is, the time of day and
the light, the shot size and lens, the mood, then the look, then the
parameters. No camera moves, no cuts, no sound, no words in the image, under
sixty words — and never more of Krishna than the scene shows.
