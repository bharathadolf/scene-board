# Where this is, what the process has shown, and what to build next

## 1 · Where it actually stands

| | |
| --- | --- |
| Tool | 7 boards, 115 scenes, 18 published versions, ~5,600 lines of code |
| Tests | 264 checks across 6 suites, all passing |
| Story | 9 documents, ~70,000 words, two orders of the same 115 scenes, one Telugu telling |
| Screenplays | two complete Fountain drafts, 115 scenes each, with per-scene shot lists |
| Picture work done | **4 scenes of 115** — 34 shots, 29 approved, 36 pictures, 28 checked |
| After Effects | 4 layouts, export at scene / sequence / board level, one scene built end to end |
| Source control | 24 commits on `dev`, **23 of them unpushed** |

That last line and the picture line are the two numbers that matter. Everything
built so far has been proven on about 3% of the film, and almost none of it
exists anywhere durable.

## 2 · What the process has shown

### The loop is the asset

One thing has survived every redesign:

> scene → shots → approve a shot → it earns a prompt → picture comes back →
> **check** → the picture is kept or the prompt is rewritten → scene approved →
> the comp is built from what the check kept

That chain is the product. Everything else — boards, orders, Telugu, read-through,
templates — is scaffolding around it. When in doubt about whether to build
something, ask whether it makes that chain shorter, safer or possible at 115
scenes. If it doesn't, it is probably a distraction.

### Three failures this week, one cause

- The slate and dialogue vanished from the render. *(Guide layers don't render.)*
- The corner text, the brief and the dialogue vanished from the frame.
  *(Placement maths displaced every element by half the canvas.)*
- The After Effects controls "weren't there". *(They were; a cached page.)*

Different bugs, same root: **nothing could be seen before it reached you.** The
board writes a script, you run it in After Effects, and the first honest look at
the result is after a render. Every correction so far has cost a round trip.

That is the single biggest process problem, and it is fixable: the board already
knows every number the script uses, so it can draw the frame itself.

### Your corrections have all pointed the same way

Prompt boxes → buttons. Right-click menus → one page. Tabs → no tabs.
"The interface should help first-time users and non-writers." The direction is
consistent: **fewer inputs, more defaults, nothing hidden.** Keep applying it —
the next candidates are the sequence page (still has a prompt box) and the
shot card (still asks for a type and a description by hand).

### Nothing has been tested at scale

4 scenes took a week of conversation. 115 scenes at the same shape is roughly
**1,000 shots, 1,200 pictures, 1,200 prompts, 1,200 checks**. At that size,
things that are fine today become impossible: downloading pictures one call at a
time, approving shots one click at a time, exporting a board that needs every
asset in memory at once.

### The data lives in three places and syncs in none

| Where | What | Risk |
| --- | --- | --- |
| The artifact's database | boards, shot lists, prompts, images, checks, approvals | the only copy; no export; no backup |
| This repository | the 115 scenes, the orders, the story documents, the generators | 23 commits that exist on one container |
| Your computer | the Fountain screenplays, per-scene shot lists, the After Effects output | not visible to the board |

The board cannot see the screenplays. The repository cannot see the shots. Your
disk cannot see either. Three truths, no reconciliation.

---

## 3 · The risks, worst first

1. **The work is not backed up.** The picture work — 36 images, 29 approved
   shots, 28 checks — exists only inside one artifact's database and asset
   store. There is no export, no download, no copy. One accident and a week is
   gone.
2. **Twenty-three commits are stranded.** The tool's source, the generators and
   the story documents exist on an ephemeral container and in the chat. The
   repository on GitHub is 23 commits behind.
3. **The method is unproven past 3%.** Everything is "works for one scene".
4. **Changes cannot be seen before they ship**, so every visual fix costs a
   round trip through After Effects.
5. **The screenplay and the board have diverged** — the drafts carry dialogue,
   sound and VFX notes per shot that the board cannot use.

---

## 4 · What to build, in order

### Phase 0 — make the work safe *(do this first; days, not weeks)*

- **Unblock the push.** Install the Claude GitHub App for `bharathadolf/scene-board`
  or apply the patch bundle by hand. Until then nothing in the tool is really saved.
- **Export the database.** One button: every board, every scene override, every
  shot, prompt, check and approval as a single JSON file, plus every picture, as
  a zip. It is a day's work and it ends the "one copy" problem.
- **Import it back.** The same file restores a board into a fresh artifact. Then
  the artifact stops being the only home.
- **Commit the picture data to the repository** as `data/pictures/*.json` — the
  checks and prompts are the expensive part, not the pixels.

### Phase 1 — see it before it ships *(the highest-value week of work)*

- **Draw the frame in the board.** The export already computes the canvas, the
  picture box, the four corners, the brief and the dialogue. Render that same
  layout to a canvas element in the scene page: a live preview of exactly what
  After Effects will build, for any of the four layouts, at any shot. No render,
  no round trip. *This would have caught all three failures above.*
- **A contact sheet per scene** — every shot's chosen picture in cut order on one
  page, with its timecode and brief. Printable. This is what a director actually
  looks at.
- **Picture-level history.** Keep rejected pictures with their verdict instead of
  only marking them, so a shot's attempts can be compared later.

### Phase 2 — make 115 scenes possible *(the real work)*

- **Batch everything that is currently per-scene.** Write shots for a whole
  sequence; write prompts for every approved shot on the board; check every
  picture in a sequence in one pass. Each with a progress line and a stop.
- **Bulk picture upload.** Drop forty files at once and assign them to shots by
  filename (`S-719_03.png` → shot 3), instead of one upload per shot.
- **A readiness board.** One screen: for every scene, shots written / approved /
  prompted / pictured / checked / scene approved, and what is blocking it.
  Right now the only way to know where the film stands is to open 115 scenes.
- **Resumable exports.** A board export is ~1,200 image fetches; it must survive
  a closed tab.
- **A cost line.** Prompts and checks cost money and time. Show the count per
  scene and per board before a batch runs.

### Phase 3 — join the screenplay to the board

- **Import the Fountain drafts.** Each scene's `screenplay.fountain` carries
  dialogue, sound cues and VFX notes with timecodes; each `shots.json` carries a
  shot breakdown. Pull them into the scene as fields, and three things happen at
  once: the exports gain dialogue everywhere (not just where I hand-fed it), the
  read-through becomes a real screenplay view, and the board's shot list can be
  compared against the screenplay's.
- **Export back to Fountain.** The board is now ahead of the drafts in places.
  A scene should be able to write its screenplay back out.
- **Reconcile the two shot lists.** The screenplay breaks S-719 into 7 shots,
  the board into 10. Show the difference and let one side win per scene.

### Phase 4 — the edit

- **EDL / FCP XML export** beside the After Effects script, so the cut opens in
  Premiere or Resolve without going through After Effects at all.
- **A timeline strip per scene** — drag shot boundaries to change durations
  instead of accepting the weighted guess.
- **A scratch audio track** — one audio file per scene, with the shot timings
  snapping to it. The moment there is a temp track, the timings stop being
  guesses.
- **Render the animatic in the browser** (the exporter already does it with
  ffmpeg locally) so the board can show a scene moving without any desktop tool.

### Phase 5 — past the still frame

- **Image → video.** Each shot already holds everything an image-to-video prompt
  needs: the still, the shot type, the move the layout would have applied, the
  duration. Add a second prompt field for a video model and the same check loop
  applies to clips instead of stills.
- **Consistency.** The hardest unsolved problem in this pipeline: the same
  guard, the same gate, the same light across ten shots. Needs character and
  location reference sheets, stored seeds or style references per entity, and a
  check that compares a new picture against the reference rather than only
  against the shot text.
- **Continuity checks across a scene** — screen direction, time of day, the
  level of a torch. Claude can be asked to look at all ten pictures together and
  say what breaks.

### Phase 6 — more than one person

- **Comments on shots and scenes**, so a cinematographer or an editor can mark a
  frame without editing it.
- **A review link** that shows the contact sheet and the animatic read-only.
- **Approval by name** — who approved this shot, and when.
- **A change log** per scene, which the history already half-implements.

---

## 5 · What not to build

- **Not a non-linear editor.** Hand the cut to Premiere or Resolve; do not grow
  a timeline with transitions and effects.
- **Not a screenplay editor.** The Fountain files are written elsewhere; import
  and export them, do not try to own them.
- **Not a prompt library.** Prompts belong to shots. A general prompt manager
  would add a second place where truth lives.
- **Not a render farm.** Generating pictures stays in Midjourney; the board's job
  is to say what to generate and judge what comes back.

---

## 6 · If you do five things next

1. **Push the 23 commits.** Install the GitHub App; it takes two minutes and
   makes everything else recoverable.
2. **Build the export/import of the board database.** A day. Ends the
   single-copy risk for the picture work.
3. **Build the in-board frame preview.** Two or three days. Pays for itself the
   first time a layout changes.
4. **Build the readiness board.** A day. You cannot manage 115 scenes you cannot
   see the state of.
5. **Take one full sequence through the loop end to end** — fourteen scenes, not
   one — and let that expose what breaks at scale before building anything else.

---

## 7 · On the working process itself

Three things would make this collaboration cheaper:

**Ask for proof, not description.** When I say something is built, the useful
question is "show me the frame" rather than reading my summary. Phase 1 exists
to make that possible without After Effects.

**One change at a time, verified.** The costly loops this week were all batches
of changes where one of them was wrong and the whole thing had to come back.

**Keep the data in the repository.** Every time something only exists in the
artifact, it becomes something I cannot test and you cannot recover.

And the thing worth protecting: the board is now the only place where the story,
the shots, the prompts, the pictures and the judgement about them live together.
That is unusual and it is the reason this is worth continuing. Everything in the
roadmap above is in service of getting the other 111 scenes through the same
loop the first four went through.
