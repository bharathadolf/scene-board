# From approved shots to an After Effects sequence

The board's picture loop ends at approval. This is what happens after it.

```
   scene  →  shots written  →  shot approved  →  Midjourney prompt revealed
                                                          │
                              image generated and uploaded ↓
                                                   image checked  ──not the shot──→  prompt rewritten ──┐
                                                          │                                             │
                                                     image kept  ←──────────────────────────────────────┘
                                                          │
                                        all shots approved → the scene can be approved
                                                          │
                                       scripts/ae-sequence.py  ← you are here
                                                          │
                        images/ + <scene>.jsx + manifest.json + <scene>_animatic.mp4
                                                          │
                                  After Effects → Run Script File… → the comp is built
```

Nothing in the loop changes. The export reads what the board already holds and
never writes back to it.

---

## What the exporter does

`scripts/ae-sequence.py`

1. **Takes the shots as the board holds them.** Only approved shots
   (`a: true`) are used — the ones you have locked. `--all-shots` overrides
   that for a rough look.
2. **Picks the image the check chose.** For each shot:
   `chk.best` wins; if the check said none of them fit (`best: -1`) the shot is
   exported without an image and the comp gets a labelled red placeholder, so
   the hole is visible rather than silent; if there was no check and there is
   one image, that image is used. The reason is written into the manifest and
   into the layer's marker, so you can see in After Effects why that frame is
   on screen.
3. **Lays the shots out over the scene's real runtime.** If the screenplay's
   own `shots.json` breaks the scene into the *same* number of shots, its
   timecodes are used verbatim. If not — and usually not, because the
   screenplay and the board break scenes differently — each shot is weighted by
   its type and the weights are normalised to the scene's runtime: a WIDE holds
   1.4, a CLOSE 1.0, an INSERT 0.7. The manifest records which rule was used.
4. **Keeps dialogue and sound on the screenplay's clock.** Dialogue and audio
   cues are placed at the timecodes the screenplay gives them, independent of
   where the board's shot boundaries fall. That is why a 7-shot screenplay and
   a 10-shot board can share one timeline without either being bent to fit.
5. **Writes the ExtendScript.** One layer per shot, fit to frame, with a move
   chosen from the shot type, cross-dissolves at every cut, a fade at the end,
   a marker per shot carrying the shot text and its Midjourney prompt, comp
   markers for sound and VFX notes, dialogue as guide subtitles, a slate and an
   empty adjustment layer for grading.
6. **Renders a reference animatic** with `--animatic`, so the cut can be
   watched before After Effects is opened.

### Image paths

The `.jsx` finds its images **relative to its own location**:

```js
var HERE = (new File($.fileName)).parent;
var IMG  = new Folder(HERE.fsName + "/" + CONF.imageDir);
```

So the whole folder — script, `images/`, manifest — can be copied to any
machine, any drive, any path, and still import. Nothing is hard-coded. Move the
`.jsx` out of its folder and it will say so instead of importing nothing.

Images are renamed on export to `NN_TYPE_asset.png` (`03_POV_c157adc0.png`), so
the folder reads in cut order while keeping the first eight characters of the
asset id for traceability back to the board.

---

## Running it

The three inputs are the scene's database document, its downloaded images, and
its screenplay folder.

```bash
# 1 · the scene's shots, out of the board's database
#     (ArtifactData: action "get", collection "scenes", doc_id "S-719")
#     saved to out/db/scenes/S-719.json

# 2 · the images, out of the artifact's asset store
#     (Artifact: action "read", path <asset id>) into out/S-719/images/

# 3 · build
python3 scripts/ae-sequence.py --scene S-719 \
  --db out/db/scenes/S-719.json \
  --images out/S-719/images \
  --screenplay ".../001 - E04-07 - The lone walk from the gate/screenplay.fountain" \
  --shotlist   ".../001 - E04-07 - The lone walk from the gate/shots.json" \
  --out out/S-719 --animatic
```

Then in After Effects: **File → Scripts → Run Script File…** and choose
`S-719.jsx`. The comp is built, opened, and the undo group is one step, so one
`Ctrl+Z` removes the whole thing if you want to re-run.

Useful switches: `--fps`, `--width/--height` (default 1680×720, the native size
of the generated frames), `--dissolve`, `--fade-out`, `--duration` to override
the scene runtime, `--no-subtitles`, `--no-slate`.

---

## Scaling to a sequence, and to the board

The exporter already takes a batch. A batch file is a list of the same three
inputs per scene, in the order you want them cut:

```json
[
  {"scene": "S-719", "db": "out/db/scenes/S-719.json",
   "images": "out/S-719/images",
   "screenplay": ".../001 - E04-07 - .../screenplay.fountain",
   "shotlist":   ".../001 - E04-07 - .../shots.json"},
  {"scene": "S-xxx", "...": "..."}
]
```

```bash
python3 scripts/ae-sequence.py --batch movement-I.json \
        --out out/movement-I --master "Movement I — A man walks out" --animatic
```

That writes one folder and one comp per scene, plus
`Movement_I_master.jsx`, which nests the scene comps end to end in batch order
and drops a comp marker at each scene boundary. Run the scene scripts first,
then the master: it looks the comps up by name and tells you if one is missing.

For a whole board, the batch is the board's `order` array — `data/boards/b7.json`
holds the braided order as 115 scene ids, so the batch is that list filtered to
the scenes whose shots are approved. A board-level master comp is the same
master script with 115 names in it.

**Two things to know before scaling.** First, the loop is per shot, so a scene
is only exportable once every shot in it has an approved image — the board's own
approval chain already enforces that, which is why scene approval is the right
gate for this export. Second, images are stored per scene in the artifact's
asset store, so the download step is one call per asset; at ~10 shots a scene,
a full board is ~1,000 downloads and should be run a movement at a time.

---

## This test: S-719, the lone walk from the gate

| | |
| --- | --- |
| scene | `S-719` · E04-07 · *The lone walk from the gate* (Board 7, cut position 1) |
| shots | 10, all approved |
| images | 12 uploaded, 10 used — the check rejected one on shot 3 and one on shot 10 |
| runtime | 120 s at 24 fps, 1680×720 |
| timing | weighted by shot type (the screenplay breaks this scene into 7 shots, the board into 10) |
| dialogue | 2 lines, at 35 s and 103 s, from the screenplay's own timecodes |
| cues | 7 sound/VFX markers, also from the screenplay |

The two rejections are the interesting part, because they prove the mechanism
is reading the checks rather than the uploads: shot 10 had an image of what the
check called "a Roman legionary, not an ancient Indian guard", and the export
used the second image instead. Shot 3 had an image where the figure was too
close and outside the gate, and the export used the first.

Shot order, as built:

| # | type | at | for | image |
| --- | --- | --- | --- | --- |
| 1 | WIDE | 0.0 | 15.4 | the gate at night, one torch, the guard under it |
| 2 | CLOSE | 15.4 | 11.0 | his face, eyes lifting down the street |
| 3 | POV | 26.4 | 13.2 | the dark street, a dim figure, pale lotus shapes |
| 4 | INSERT | 39.6 | 7.7 | open empty hands, garland at the wrists |
| 5 | CLOSE | 47.3 | 11.0 | the guard looks at the hands and says nothing |
| 6 | OVER | 58.4 | 12.1 | over his shoulder, the open gate, a hand at the frame edge |
| 7 | WIDE | 70.5 | 15.4 | the moonlit road, empty, the guard on the threshold |
| 8 | INSERT | 85.9 | 7.7 | one footprint, its edge still crumbling |
| 9 | WIDE | 93.6 | 15.4 | the two doors meeting |
| 10 | CLOSE | 109.0 | 11.0 | the guard facing the closed gate, torch on his face |

Note what the sequence never shows, and could not: a face. Every image on this
timeline is the guard, a hand, a garland, a footprint or a door — the film's
rule survives the export because it was enforced at the prompt.

---

## What to adjust by hand, and what to re-export

Adjust in After Effects: the moves (they are keyframes, not expressions),
the dissolve lengths, the grade layer, the subtitle type.

Re-export instead of hand-editing: anything that came from the board — a new
image, a changed prompt, a shot added or re-approved, a different runtime. The
`.jsx` is generated and says so at the top; re-running it builds a fresh comp
beside the old one rather than touching it, so two versions can be compared.
