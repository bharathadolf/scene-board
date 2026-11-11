# The biggest challenge, and the task list that follows from it

> **Where this stands.** Gates 0 and 1 and the first two integrations are built.
>
> | task | state |
> | --- | --- |
> | T0 back up / restore | **built** — toolbar, one zip with pictures; restore tested by wiping and comparing |
> | T1 entity layer | **built** — 89 place strings → 17 sets, 76 characters, 26 props; three merges left for you in `docs/ENTITY_DECISIONS.md` (the two shores are settled: separate places) |
> | T2 shot schema v2 | **built** — set, cast, camera, continuity on every shot; lengths marked as guesses until set. *Not done:* importing the ~1,000 Fountain shots |
> | T3 identity and provenance | **built** — a re-order changes no shot id, no fingerprint and no file name |
> | T4 `shotspec` | **built** — After Effects now reads it |
> | T5 `dcc-bridge` + authority rule | **built** — `docs/DCC_AUTHORITY.md` |
> | T6 Blender blocking | **built**, run headless on S-719. *Not done:* a run inside your own Blender |
> | T7 ComfyUI control bridge | **runner built**, tested against a stand-in server only — no GPU here |
> | T8 Houdini · T9 Nuke · T10 Unreal | not built; the bridge refuses them by name |
> | T11 readiness board · T12 frame preview | not built |
>
> One correction to the text below: the story-bearing props are the garlands,
> the chalk marks, the letter and the two lamps. "The broken ring" was the ring
> of kings, not an object, and the crown and sandals exist only in draft scene
> `D-05`.

## 1 · The challenge, in one sentence

**Scene Board does not know what is inside a shot.**

Not the connectors. Not the MCP servers. Not ComfyUI consistency, not Houdini
procedurals. Every one of the four integrations asks the board the same three
questions on its first call — *which set, which characters, which camera* — and
the board cannot answer any of them today.

Here is the proof, and it is a short one. **The Blender MCP tools are already
wired into this session.** `execute_blender_code`, `get_objects_summary`,
`render_viewport_to_path` — twenty-six of them, registered and callable. I
called one. The only thing missing was Blender being open.

So the plumbing for integration #2 is *already built*, and it still cannot be
used for a single shot of this film — because there is nothing in the board to
send down it. That is the whole problem in one observation: **the connectors are
the easy part, and building five of them before the data layer means building
five adapters against a schema that cannot feed them, then rewriting all five.**

---

## 2 · The evidence

### 2.1 · The board has 89 locations. A CG film has about fifteen sets.

115 scenes carry **89 distinct place strings, 76 of them used exactly once.**
They are prose, not entities, and they collide in ways no script can resolve:

| the strings | the question nobody can answer from the data |
| --- | --- |
| `The shore` ×4 · `The shore of the Ocean of Milk` ×3 · `The shore at Dvārakā` ×2 | three sets, two, or one? |
| `The Ocean of Milk` ×3 · `The shore of the Ocean of Milk` ×3 | is one inside the other? |
| `Bhīṣmaka's palace` ×4 · `The palace` ×2 · `The forecourt` ×2 · `Rukmini's quarters` ×3 | four sets, or one set with three dressings? |
| `The cave` ×5 · `The mountain road` ×2 | adjacent, or unrelated? |

For a CG realism film the built-set count **is** the budget. It is the first
number the production needs and the board cannot produce it. There is also no
hierarchy, so nothing can express *this shot is on the same set as that one,
redressed* — which is the single largest cost saving available in CG.

### 2.2 · `pov` is not a cast list

`E06-26` — the climax — records `pov: Rukmini`. Who is actually in the shot:
Rukmini, Krishna, Rukmī, a raised sword, and an army on a plain.

The board stores **whose eyes we are behind**, which is a storytelling field. It
has never stored **who is in frame**, which is the asset field. Across 115
scenes there are 39 `pov` strings and **no cast list anywhere**. Ask Blender to
block `E06-26` and the first question is "which characters do I load?" — and the
honest answer is that the information exists only inside English prose in `sum`
and `story`.

### 2.3 · There is no camera, and the durations are guesses

The shot record holds a type (`t`), a description (`x`), a Telugu line (`te`), a
prompt (`mj`), images, a check and an approval flag. It does not hold a lens, a
height, an angle, a move, or a duration.

`scripts/ae-sequence.py` currently derives shot durations by **weighting shot
types** whenever the screenplay's timecode count doesn't match the shot count.
That is a reasonable guess for an animatic and worthless for blocking: a 3-second
guess becomes a 3-second Blender scene, a 3-second Houdini sim cache and a
3-second Nuke comp, and the first time a real edit says 5 seconds, every one of
them is wrong and nobody knows which were guesses.

### 2.4 · The arithmetic of doing this at scale

4 scenes of 115 have picture work. The projection is ~1,000 shots. Every shot
needs a set, a cast, a camera and a duration. **That is roughly 4,000 facts the
board does not currently have a field for** — and they must be derived once,
reviewed once, and then be authoritative forever, because five downstream
applications will read them.

---

## 3 · Why all four integrations are blocked identically

| integration | what it must ask on its first call | what the board answers today |
| --- | --- | --- |
| **ComfyUI** (consistency) | "is this the same character and set as shot 7?" | nothing — no entity is shared between two shots |
| **Blender** (blocking) | "which set, which characters, which camera, how long?" | a free-text place string; no cast; no camera; a guessed duration |
| **Houdini** (procedural env) | "which environment, with what parameters?" | one of 89 prose strings; no parameters |
| **Nuke** (comp) | "which renders, which version, which passes?" | no versioning of anything |
| **Unreal** (virtual previz) | "which sets and cameras exist?" | neither concept exists |

One missing layer, five blocked integrations. Build it once and all five adapters
become small. Skip it and each adapter grows its own private, incompatible
guess about what a shot contains — and then the board is no longer the basis for
anything.

---

## 4 · The second face of the problem: who wins a disagreement

This one is cheaper to fix now than at any later moment, and it is the one that
usually kills tools like this.

**The story is not locked.** Yesterday we re-ordered act one, moved her entry to
minute 8 and rewrote thirteen scene hinges. In a markdown file that is free. If
two hundred Blender scenes had been keyed to sequence numbers and minute marks,
it would have been a catastrophe.

So the pipeline needs two rules decided **before** the first adapter ships:

**Rule 1 — identity never encodes position.** `S-719` is permanent. Sequence
number, minute mark and act are a *view*, computed on demand, never stored in a
filename, a comp name or a Houdini path. The board half-does this already; the AE
exporter does not.

**Rule 2 — downstream is generated, never authored.** Board → DCC generates.
DCC → board reports **only** status, renders and versions, never structure. The
day an artist hand-tweaks a blocking camera and that tweak exists only inside the
`.blend`, the board stops being the source of truth and this whole plan is dead.

Rule 2 is in genuine tension with how artists work in Blender, Houdini and Nuke,
and pretending otherwise is how pipelines rot. The resolution is to make the
board the place where *intent* lives (camera, duration, cast, set, continuity)
and the DCC the place where *craft* lives (animation curves, sim parameters,
shader graphs) — and to define, per application, which fields belong to which
side. That boundary is a design decision, not code, and it should be written
down before T6.

---

## 5 · One change to the plan: swap your items 1 and 2

Your order is ComfyUI first, Blender second. **For a CG realism film it should be
the other way round, and this is the most valuable recommendation in this
document.**

Shot-to-shot consistency is the hard, unsolved problem in a 2D AI pipeline — the
same face, the same gate, the same light across ten shots. `COMFYUI_TEST.md`
treats it as the deciding factor, and for a 2D film it is.

**Blocking makes it mostly disappear.** Once a shot has a real set, real
characters and a real camera in Blender, you can render a depth pass, a normal
pass and an ID matte, and feed them to ComfyUI as ControlNet inputs. Consistency
then comes from *geometry*, not from a LoRA holding its nerve across 1,000
generations. The same asset in the same set under the same camera produces the
same frame because it is the same object.

Which also means ComfyUI's job changes, and should be scoped accordingly:

| | 2D AI film | **this film (CG realism)** |
| --- | --- | --- |
| ComfyUI's role | generates the final frames | **concept art, lookdev reference, textures and mattes, final-stage detail in Nuke** |
| what holds consistency | LoRAs, seeds, hope | **the CG assets themselves** |
| what the storyboard is | AI stills | **blocked Blender renders** |

So: **Blender blocking is the real previz automation**, and ComfyUI becomes a
lookdev and concept tool hanging off it. Building ComfyUI first means solving the
hardest problem in the 2D pipeline in order to feed a pipeline that was never
going to be 2D.

One more note on Unreal: for *real-time* previz it is arguably a stronger target
than Blender, and if you ever want a director to sit with a virtual camera, it is
the only option on your list. It stays last here only because it is the largest
adapter and because Blender's is already wired.

---

# 6 · The task list for Fable

Thirteen tasks. Each is written to be handed over whole, each names its
deliverable and its acceptance test, and the gates are hard — **T1–T3 must land
before T6, or the adapters get rewritten.**

Tasks marked ∥ can run in parallel with the one above them.

## Gate 0 — make the work safe and give it a vocabulary

### T0 · Export and import the board database
*Still outstanding from `ROADMAP.md`, and everything below multiplies the value
of data that currently exists in exactly one copy.*

> Build export and import for the Scene Board artifact database. Export: every
> board, scene override, shot, prompt, image, check and approval as one JSON
> file, plus every picture, as a single downloadable zip. Import: the same file
> restores a complete board into a fresh artifact. Make the export resumable —
> a board export is ~1,200 image fetches and must survive a closed tab. Commit
> the picture metadata (prompts and checks, not pixels) to the repository as
> `data/pictures/*.json`.
>
> **Acceptance:** export a board, import it into a new artifact, and prove the
> two are identical by diffing their exports. The 264 existing tests still pass.

### T1 · Derive the production entity layer  ← *the blocker*

> Scene Board stores locations as 89 free-text strings across 115 scenes, 76 of
> them used once, and stores no cast at all (`pov` is the point-of-view
> character, not who is in frame). Build the missing entity layer.
>
> Produce `data/entities.json` with three normalized lists — **sets**
> (hierarchical: set → sub-location → dressing), **characters**, and
> **story-bearing props** (the garland, the chalk marks, the letter, the crown
> and sandals, the second lamp, the broken ring) — and
> `data/scene_entities.json` mapping each of the 115 scenes to exactly one set
> id, a cast list of character ids, and its prop ids. Derive the cast from the
> `sum`, `story` and `turn` text, not from `pov`.
>
> Do not guess the ambiguous merges. The shore cluster (`The shore` /
> `The shore of the Ocean of Milk` / `The shore at Dvārakā`), the palace cluster
> (`Bhīṣmaka's palace` / `The palace` / `The forecourt` / `Rukmini's quarters`)
> and the cave/mountain-road pair must each be presented as a decision with the
> scenes listed and a recommendation, for a human to settle.
>
> **Acceptance:** `scripts/audit-entities.py` proves every scene resolves to
> exactly one set and every scene has a non-empty cast; the set list is ≤ 20
> top-level sets with a written one-line justification for every merge; the
> ambiguous clusters appear in a decisions file, unresolved, not silently merged.

### T2 · Shot schema v2 — camera, cast, duration  ∥ *(after T1)*

> Extend the shot record with the fields a CG pipeline requires:
> `set`, `cast[]`, `props[]`,
> `camera { lens_mm, height_m, angle, move, duration_s }`, and
> `continuity { prev_shot, screen_direction, time_of_day, light }`.
>
> **`duration_s` becomes authoritative.** Today `scripts/ae-sequence.py` guesses
> durations by weighting shot types whenever the screenplay timecodes don't
> match the shot count. Replace the guess with the stored value, and mark every
> duration that was derived rather than authored so the guesses are visible.
>
> Migrate the 34 existing shots, and import the ~1,000 per-scene shots from the
> Fountain drafts' `shots.json` files, resolving each to the T1 entities.
>
> **Acceptance:** all 264 tests pass; the S-719 After Effects comp comes out the
> same length as before the migration; every imported shot has a set and a
> cast; a report lists every shot whose duration is still a guess.

### T3 · Identity and the regeneration contract

> Enforce two rules across the codebase. **One:** a shot's identity never
> encodes its narrative position — `S-719` is permanent, and sequence number,
> minute mark and act are computed views, never stored in a filename, comp name
> or output path. Audit the After Effects exporter, which currently violates
> this. **Two:** every generated downstream file carries
> `provenance { board_version, shot_id, generated_at, generator_version }`.
>
> **Acceptance:** apply the act-one re-order from `story/MODIFICATION_PLAN.md`
> (her entry to minute 8, inciting incident to 17, sale at 45) and prove with a
> test that **zero shot IDs change** and every previously generated file still
> resolves to its shot.

## Gate 1 — one bridge, built once

### T4 · The `shotspec` contract

> Define one JSON document — `shotspec` — that is the single thing every DCC
> adapter consumes: the shot's entities, camera, duration, continuity, chosen
> images, dialogue and approval state, resolved and flattened.
>
> Then **refactor the After Effects exporter to be its first consumer** rather
> than a special case, so the contract is proven against something that already
> works before any new adapter is written.
>
> **Acceptance:** the AE export driven through `shotspec` produces a
> test-equivalent comp for S-719; the `ae` suite passes unchanged; the exporter
> contains no direct reads of the scene or shot records.

### T5 · The `dcc-bridge` MCP server and the one-way rule

> Build one MCP server with a per-application adapter interface, not five
> servers. Implement the authority rule in code: **board → DCC generates;
> DCC → board may write only status, render paths and version numbers, never
> structure.** A DCC attempting to change a shot's cast, set, camera or duration
> must be rejected with an explanatory error.
>
> Write `docs/DCC_AUTHORITY.md` first: for each of Blender, Houdini, Nuke and
> Unreal, which fields are the board's (intent) and which are the
> application's (craft). This is a design decision and it must be written down
> before the first adapter.
>
> **Acceptance:** a full round trip on S-719 that changes only status fields in
> the board, plus a test proving a structural write from a DCC is refused.

## Gate 2 — the integrations, in dependency order

### T6 · Blender blocking  ← *your item 2, promoted to first*

> Using the already-wired Blender MCP tools, generate blocking for any scene,
> sequence or board from `shotspec`: load or proxy the set, place stand-in
> characters, build the camera with the stored lens and height, set the shot's
> duration on the timeline, and render a viewport pass per shot.
>
> Start with S-719 (10 shots, already approved and checked end to end) so the
> output can be compared against existing work. Scale to a full sequence next,
> not a full board.
>
> **Acceptance:** S-719 blocked from the board with no manual steps; the
> viewport renders come back into the board as a contact sheet; re-running
> after a camera change in the board updates the blocking and leaves nothing
> hand-made behind.

### T7 · Blender → ComfyUI control bridge  ← *your item 1, re-scoped*

> Now that shots have real geometry, make consistency structural. Render depth,
> normal and ID-matte passes from the T6 blocking and feed them to ComfyUI as
> ControlNet inputs, with the shot's prompt, model, seed and LoRA stored on the
> shot record so any frame is re-creatable a year later.
>
> Use the existing `comfy/` test kit and the local-runner approach from
> `docs/COMFYUI_TEST.md` section 6 — the published board is on https and
> ComfyUI is on http localhost, which browsers block; the runner sidesteps it.
>
> **Acceptance:** the same character in the same set across three different
> shots comes back recognisably identical, judged by the board's existing image
> check; and re-running one shot with one seed changed is a one-field edit.

### T8 · Houdini procedural environments

> Via a custom MCP adapter, drive procedural environment and simulation
> generation from the shot's set entity and its parameters — and add those
> parameters to the set entity, which T1 deliberately left thin. Only shots
> whose `shotspec` requests a simulation get one.
>
> **Acceptance:** one environment and one simulation generated for a named
> shot from the board alone, with the cache path reported back as status.

### T9 · Nuke comp  ∥ *(after T8)*

> A custom MCP adapter that builds a comp script per shot from the renders T6
> and T8 produced, with versioning — the first place in this pipeline where
> versions are mandatory.
>
> **Acceptance:** a comp assembled for one shot from board data alone; a second
> run after a re-render produces v2 without destroying v1.

### T10 · Unreal virtual previz

> A custom MCP adapter that builds a level and a Sequencer timeline from a
> sequence's `shotspec`, so previz can be reviewed in real time and a virtual
> camera can be used.
>
> **Acceptance:** one full sequence playable in Sequencer, built from the board,
> with shot boundaries matching the board's durations.

## Gate 3 — what turns it into a pipeline

### T11 · The readiness board across departments

> One screen: for every scene, its state in every department — shots written,
> approved, prompted, pictured, checked, blocked, simulated, comped, and what
> is blocking it. Today the only way to know where the film stands is to open
> 115 scenes.
>
> **Acceptance:** the readiness of all 115 scenes visible on one page, derived,
> never hand-maintained.

### T12 · The in-board frame preview  ∥

> From `ROADMAP.md` phase 1, and now more valuable: draw the frame in the board
> itself — the canvas, the picture box, the four corners, the brief and the
> dialogue — for any layout and any shot, so a change can be seen before it
> ships. Every visual failure in this project so far cost a round trip through
> After Effects because nothing could be seen before it reached you.
>
> **Acceptance:** the preview and the rendered AE frame agree, proved by a
> screenshot diff on one shot per layout.

---

## 7 · What not to build

- **Not five MCP servers.** One bridge, four adapters, one contract (T4, T5).
- **Not an asset manager.** The board holds what a shot *contains*; the DCCs
  hold the geometry. Do not try to own `.blend` files.
- **Not ComfyUI as a frame generator.** For a CG realism film its jobs are
  concept, lookdev, texture and final detail.
- **Not blocking before the entities exist.** This is the one that will be
  tempting, because the Blender tools are right there and it will feel like
  progress for one scene and be unrepeatable for the other 114.
- **Not locking the story to unlock the pipeline.** T3 exists so the story can
  keep moving while the pipeline is built. Previz is how story problems get
  found; it must survive the story changing.

---

## 8 · If Fable does three things first

1. **T1.** Nothing else is possible, and it is the only task on the list that
   needs human decisions baked into it. Do it first and review it carefully.
2. **T2 + T3.** The schema and the identity rules. Cheap now, a rewrite later.
3. **T6 on S-719 only.** One scene, blocked end to end from board data with no
   manual steps, is the proof that the layer above is right. Prove it on ten
   shots before building four more adapters.

The order matters more than the speed. Four adapters built on T1–T4 are small;
four adapters built without them are four private guesses about what a shot is,
and the board stops being the basis for anything.

---

*Measured against `data/scenes.json` (115 scenes, 89 place strings, 39 `pov`
strings), the shot schema in `src/app.js`, the duration weighting in
`scripts/ae-sequence.py`, and the Blender MCP tools wired into this session but
not reachable (Blender not running). Builds on `docs/ROADMAP.md` and
`docs/COMFYUI_TEST.md`.*
