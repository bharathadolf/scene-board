# Scene Board

A tool for ordering the 115 scenes of **The Unseen Sun** (*Loka Kalyāṇam*), a
feature film about Rukmini and Krishna told out of chronological order — and
the story data the tool runs on.

The whole tool is one self-contained HTML page. There is no framework, no
bundler and no build step beyond pasting data into a script: `npm run build`
reads `src/` and `data/` and writes `dist/scene_board.html`.

## What the board does

- **Five seeded orders** of the same 115 scenes (Rukmini's frame, a
  chronological reference, flight and memory, two worlds converging, the
  action cut), and as many copies as you want to make.
- **Drag** scenes between sequences; left to right, top to bottom is the story
  order. A rhythm strip shows drama against action across the whole board.
- **Edit a scene or a sequence with a prompt** — Claude rewrites it, in English
  and Telugu, and every earlier version is kept with a word-by-word diff.
- **One page per scene**: the story, then its shots, then the options, then the
  history. Nothing behind a tab.
- **Shot lists** per scene, by hand or by prompt. Approve a shot and it earns a
  **Midjourney prompt**: paste it into Midjourney, drop the pictures back onto
  the shot, and Claude says which of them is the shot — or rewrites the prompt
  when none of them is.
- **Approval, in a chain**: a shot on its own; a scene once all its shots are
  approved; a sequence once all its scenes are. An approved thing is frozen,
  and it freezes everything under it.
- **A read-through**: the board as one continuous document, built to print —
  with the images, it is a storyboard.
- **English / Telugu**: the story switches language, the interface stays
  English.
- **Desktop / mobile layouts**, chosen automatically and switchable by hand.
- **Where every scene comes from**: chapter and verse, with a link.

## Running it

```bash
npm install          # playwright, for the tests only
npm run build        # writes dist/scene_board.html
npm run serve        # http://localhost:8080
npm test             # 183 checks in headless Chromium
```

Opened locally the page has no claude.ai runtime behind it. It starts from the
five board orders in `data/boards/`, which are built into the page, and saves
what you change to browser storage — the status reads *Saved in this browser
only*. Everything that does not need Claude works: the boards, dragging,
sequences, shots by hand, the read-through, the CSV export, both languages and
both layouts.

Three things need the published artifact, and are simply hidden or refused
locally: **editing by prompt** (scene, sequence, shots, image prompts),
**uploading a picture to a shot**, and **the check** that compares a picture
with its shot. See [docs/DEPLOY.md](docs/DEPLOY.md).

| where the data lives | what is in it |
| --- | --- |
| `data/scenes.json`, `data/te/`, `data/sources.json` | the 115 scenes, their Telugu, and where each one comes from — built into the page |
| `data/boards/b1…b5.json` | the five seeded orders — built into the page, and the starting point when nothing is saved yet |
| browser storage (local) | your changes to the boards, and scene edits |
| the artifact database (published) | the same, shared and kept — plus shots, image prompts and approvals |
| the artifact asset store (published) | the pictures dropped onto shots |

## Layout

```
src/
  shell.html          markup and CSS; ends at the opening <script>
  app.js              the whole application; data arrives via placeholders
  ui.json             every interface string (English only, by design)
data/
  scenes.json         the 115 scenes: text, runtime, rasa, place, CG tier…
  sources.json        per scene: the text it follows, and a link
  te/                 the Telugu of the scenes, the terms and the names
  boards/b1…b5.json   the five seeded orders
story/
  REFERENCE.md        the people, the places and the eight story events
  COMMERCIAL_CUT.md   the same story as a 2h30 action film, scene by scene
  events/             the scene definitions the data is generated from
  docs/               the story documents (events, framework, guides)
scripts/
  build.js            src + data → dist/scene_board.html
  make-scenes.js      story/events → data/scenes.json
  make-sources.js     story/events → data/sources.json
  make-boards.js      the five board orders, with their checks
  serve.js            a static server for dist/
tests/                headless-browser checks (see tests/run.js)
dist/scene_board.html the built page — generated, but committed
```

`app.js` holds four placeholders — `__DATA__`, `__TE__`, `__UI__`, `__SRC__` —
which the build replaces with the JSON above. That is the only reason a build
step exists; editing `src/app.js` and re-running `npm run build` is the whole
development loop.

## The data

[docs/DATA_MODEL.md](docs/DATA_MODEL.md) describes every field of a scene, the
shape of a board, what the artifact database holds, and what the page keeps in
browser storage.

Two rules hold across all the data, and the board checks them:

- **Krishna is not seen before the abduction.** No scene whose Krishna field
  says *Face* may be placed before `E06-18`, *First sight*.
- **Nothing follows the final episode.** The eight scenes of event 7 end every
  board, and there is no wedding scene.

Scene codes (`S-438`) are drawn from a seeded shuffle so that no code implies a
position in the story; `src` (`E06-18`) is the stable story id. **Changing the
seed in `make-scenes.js` renumbers every scene and breaks every saved board.**

## Branches

`main` is what is published. `dev` is where work happens. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Rights

The story, its scene text and the Telugu are the author's own work. The
underlying events come from the Bhāgavata Purāṇa, the Mahābhārata, the Viṣṇu
Purāṇa and the Harivaṃśa, which are in the public domain; `data/sources.json`
says, scene by scene, which passage each one follows and which were written for
the film.
