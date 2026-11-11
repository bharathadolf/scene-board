# The biggest challenge in this project — and the task to hand over

## 1 · Which challenge is actually the biggest

Five things could stop this film. Only one of them is a *problem* rather than a
pile of work:

| | the challenge | kills the project? | cost to fix | verdict |
| --- | --- | --- | --- | --- |
| 1 | **Visual continuity at scale** — nothing makes shot 4 of scene 719 belong to the same film as shot 7 of scene 851 | **yes, and silently** | unknown — nobody has designed it | **this one** |
| 2 | Scale — 4 scenes of 115 done, ~1,000 shots to come | slows it | known engineering: batching, bulk upload, a readiness board | downstream of 1 |
| 3 | The work has one copy, in one artifact's database | yes, instantly | a day | urgent, but not hard |
| 4 | The story's protagonist problem | it would have | answered in `MODIFICATION_PLAN.md` — 13 rewritten lines, +0.5 min | handled |
| 5 | No way to see a change before After Effects renders it | costs round trips | two or three days | known |

3, 4 and 5 are **tasks**. Somebody who knows what to do can do them. 1 is a
**problem**: no one has yet decided what the answer looks like, it cannot be
tested on four scenes, and by the time it is visible it is too late to fix —
because the fix is regenerating everything that came before.

That is the one worth a frontier model.

## 2 · The challenge, stated in numbers

### 2.1 · The film is almost entirely made of repeated places

| | |
| --- | --- |
| distinct place strings in `data/scenes.json` | **89** |
| actual physical locations they describe | **~18** |
| scenes set somewhere another scene also uses | **99 of 115** |

Mathurā alone is written twelve different ways:

```
Mathurā                              The council room in Mathurā
Mathurā’s walls                      The wall of Mathurā, across seasons
Mathurā; a council                   The walls of Mathurā; the plain
Mathurā’s gate and the plain         The road outside Mathurā
Mathurā; Dvārakā at dawn             The road from Mathurā to Magadha
Brahmā’s abode; Mathurā              The road from Mathurā to the hills
```

One city, besieged seventeen times across years, which the audience must
recognise every time — and twelve strings, none of which knows about the others.
Nothing in the pipeline can tell that these are the same walls. Each shot's
prompt describes them from scratch, and a generative model asked twice gives two
cities.

### 2.2 · The hard case is the film's own signature

The `k` field records how Krishna is present in each scene. It is the most
valuable column in the data and nothing downstream reads it:

| mode | scenes |
| --- | --- |
| Not present | 29 |
| Spoken of *(direct, indirect, hostile, voice only, prayer, in the letter)* | **51** |
| **Effect** *(what he did, not him)* | **10** |
| **Hands** | **10** |
| **Shadow or sound** | **8** |
| **Reflection (the witness's face)** | **1** |
| Face | **7** — including `Face (first)` at minute 126 |

**He is present in 86 of 115 scenes and his face appears in seven.**

Twenty-nine scenes must render him *partially* — hands, a shadow, a reflection,
the effect of him — and the audience has to read all of them as the same man,
with **no face available as the identity anchor**, across 175 minutes.

This is harder than ordinary character consistency, and the generative tools
actively fight it. A model asked for "a hand entering frame" will draw a face
whenever it can. The failure has already happened once in this project: a shot
of the cave came back as Roman architecture because the prompt said *ancient* and
*columns*. The same drift applied to Krishna produces a face in a Hands scene, in
a film whose entire structure is built on withholding it until minute 126.

So: **the film's central device is also its worst continuity problem, and the
data describing that device is already written and entirely unused.**

## 3 · Why it is unsolved rather than merely undone

Four structural reasons, each of which has to be dismantled:

1. **The prompt is the only carrier of look, and it is written per shot.** There
   is no entity that owns "the cave" and tells all seven cave scenes what it
   looks like. Consistency is currently whatever a human remembers to retype.
2. **The check cannot catch a continuity error, by construction.** It compares a
   picture against *its own prompt*. A picture of a completely different cave
   that matches its prompt perfectly passes. The judgement that has cost the most
   human effort in this project is structurally blind to the thing most likely
   to ruin the film.
3. **Midjourney cannot repeat itself.** Same prompt, new interpretation, every
   time — and no seed or model is stored on any of the 36 pictures made so far,
   so **not one of them can be re-created.**
4. **It is invisible until it is expensive.** At four scenes there is nothing to
   see. At forty, the only fix is regenerating thirty-six.

## 4 · The task to hand to Fable

> **Design and build the continuity system for a 115-scene generated feature,
> including the case of a character who must be recognisable in twenty-nine
> scenes without his face ever being shown.**

Six deliverables, in order. Each is testable against the repository alone.

| | deliverable | what "done" means |
| --- | --- | --- |
| **D1** | **The entity table.** Collapse 89 place strings into canonical locations; do the same for the 45 named figures and the recurring objects (the garland, the chalk marks, the chariot, the sandals and crown, the letter). One id each, every one of the 115 scenes mapped. | every scene resolves to canonical entity ids; no orphans |
| **D2** | **The reference-sheet spec.** What has to be pinned for an entity to stay itself: palette, architecture, material, costume, light direction, scale against a human, screen direction — *and its states*, because Mathurā across seventeen sieges is one location in several conditions, and the water-carrier's chalk marks accumulate. Consistency is not sameness. | a filled sheet for three entities: Mathurā, the cave, Rukmini |
| **D3** | **Prompt assembly.** A shot prompt becomes `entity blocks + shot-specific text`, so all seven cave scenes carry a byte-identical description of the cave. Versioned, so a changed sheet can re-emit every prompt that used it. | the cave block is identical across its 7 scenes; a change to the sheet propagates |
| **D4** | **The withholding grammar.** Turn the 16 `k` modes into a constraint set that shapes generation *and can be violated* — so "Hands" forbids a face, "Shadow or sound" forbids a body, "Reflection" permits exactly one. | a face in a Hands scene is a detectable, nameable failure |
| **D5** | **The continuity check.** A judgement that compares a picture against the entity's reference, not only against its own prompt. This does not exist today and is the heart of the task. | a deliberately wrong cave is rejected; a right one passes |
| **D6** | **The continuity audit.** A script in the shape of `scripts/audit-protagonist.py`: runs over a scene, a sequence or all 115, scores continuity, names what broke and where. | runs on the whole film and fails loudly on a planted error |

### Acceptance tests

The task is done when these pass, and not when the design reads well:

1. All 115 scenes map to canonical entities; 89 strings reduce to a defended
   count of locations, with the reasoning for every merge recorded.
2. `Mathurā's walls` and `The walls of Mathurā; the plain` resolve to one
   location in two states. `The shore` and `The shore of the Ocean of Milk` do
   **not** merge — they are different places.
3. A picture that matches its prompt but shows the wrong cave is **rejected**.
4. A picture with a face in any of the 29 partial-presence scenes is
   **rejected**, naming the mode it violated.
5. The audit runs over all 115 scenes and reports a planted continuity break.
6. Every generated picture can be re-created a year later — engine, model, seed,
   prompt version, reference-sheet version, all stored on the shot.

## 5 · What to hand over with the brief

**Give it the repository.** The file that matters is `data/scenes.json` — 115
scenes with `pl` (place), `k` (Krishna's mode of presence), `pov`, `turn`, `sum`.
Everything in section 2 above was computed from it, so the numbers are
verifiable rather than asserted.

Also: `docs/COMFYUI_TEST.md` (reproducibility, the licence constraints on
models, the five-styles finding), `docs/IMAGE_CHECK.md` (how the current check
works, so its blindness is visible), `docs/ROADMAP.md` (where this sits), and
`scripts/audit-protagonist.py` as the pattern for D6 — a test that fails.

**One warning about the inputs.** The 36 pictures, their prompts and the 28
written checks are **not in the repository**. They exist only inside the
artifact's database. Either export them first, or scope the task to the system
and the audit, which are fully testable on the repo alone. Do not let a fresh
session assume the picture data is available — it will plan around material it
cannot see.

## 6 · The traps

A capable model with no context will make these mistakes. Say so up front:

- **It will want to show Krishna.** Every instinct in character-consistency work
  reaches for a reference face. There is no face until minute 126, and the film
  does not survive giving it one early.
- **It will merge places by string similarity.** `Mathurā's walls` and `The walls
  of Mathurā` are the same wall; `The shore` and `The shore of the Ocean of Milk`
  are a thousand miles apart. This requires reading all 115 scenes, not fuzzy
  matching.
- **It will reach for a LoRA and call it solved.** A LoRA fixes *style*. It does
  not make this cave the same cave.
- **It will build a general asset-management system.** The loop is the asset:
  *scene → shots → approve → prompt → picture → check → kept or rewritten.*
  Anything that does not make that chain shorter, safer or possible at 115 scenes
  is a distraction.
- **It will assume one look.** Fifteen Midjourney frames produced five distinct
  media. An audience reads a change of medium as a change of meaning.
- **It will treat consistency as sameness.** Mathurā must age seventeen years.
  The chalk marks must accumulate. The system has to hold identity while
  permitting change, which is the genuinely hard half of D2.

## 7 · The brief, ready to paste

> You are picking up a 115-scene generated animated feature. Four scenes are
> done — 34 shots, 29 approved, 36 pictures, 28 written checks. The remaining
> 111 scenes are roughly 1,000 shots and 1,200 pictures.
>
> The film has no continuity system. `data/scenes.json` writes one city twelve
> different ways; 99 of the 115 scenes are set in a place another scene also
> uses; 89 place strings describe about 18 locations. Each shot's prompt
> describes its setting from scratch, and the check that judges each returned
> picture compares it only against its own prompt — so a picture of the wrong
> cave passes. None of the 36 existing pictures stores a seed or a model, so
> none can be re-created.
>
> The hardest case is the film's central device. The `k` field records how the
> central male character is present in each scene: he is present in 86 of 115,
> and his face appears in 7. Twenty-nine scenes must render him as hands, a
> shadow, a reflection, or the effect of him — and the audience has to read all
> twenty-nine as the same man, with no face to anchor identity, across 175
> minutes. His face must not appear before minute 126; the structure of the film
> depends on it. Generative models fight this: asked for a hand entering frame,
> they draw a face.
>
> Design and build the system that makes this possible: a canonical entity table
> for all 115 scenes, a reference-sheet spec that holds identity while permitting
> a city to age seventeen years, prompt assembly from entity blocks so the same
> cave is described identically everywhere, a formal grammar for the sixteen
> modes of partial presence that can be *violated* and therefore checked, a
> continuity check that compares a picture against its entity reference rather
> than its prompt, and an audit over all 115 scenes that fails loudly.
>
> Acceptance: a picture that matches its prompt but shows the wrong cave is
> rejected; a face in any of the twenty-nine partial-presence scenes is rejected,
> naming the mode it violated; `Mathurā's walls` and `The walls of Mathurā`
> resolve to one location in two states while `The shore` and `The shore of the
> Ocean of Milk` stay separate; every future picture is re-creatable from stored
> engine, model, seed and version. Use `scripts/audit-protagonist.py` as the
> pattern for a test that fails rather than a report that reassures.

---

*All figures computed from `data/scenes.json` (115 scenes). Context:
`docs/ROADMAP.md`, `docs/COMFYUI_TEST.md`, `docs/IMAGE_CHECK.md`.*
