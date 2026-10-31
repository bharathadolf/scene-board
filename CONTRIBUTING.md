# Working on the board

## Branches

| branch | what it is |
| --- | --- |
| `main` | what is published. Every commit here builds, passes the tests, and has `dist/scene_board.html` rebuilt. |
| `dev` | where work happens. Break it freely. |
| `feature/<name>` | anything larger than an afternoon, branched off `dev`. |

```bash
git switch dev
git switch -c feature/shot-timings     # start something
# …work…
npm run check                          # build + tests, both must pass
git add -A && git commit -m "shots: give each shot a duration"
git switch dev && git merge feature/shot-timings
```

When `dev` is good, merge it into `main` and publish from there:

```bash
git switch main && git merge dev && npm run check
```

## The loop

1. Edit `src/app.js`, `src/shell.html` or `src/ui.json`.
2. `npm run build`
3. `npm run serve`, open <http://localhost:8080>, look at it.
4. `npm test`
5. Commit the source **and** the rebuilt `dist/scene_board.html` together.

`dist/` is generated but committed, because the published artifact is that one
file. CI fails if `dist/` does not match what the sources build.

## House rules for the code

- No frameworks, no bundler, no runtime dependencies. One page, one script.
- The interface is English. Only story content follows the language switch:
  scene text, scene terms, sequence and board names. Interface strings live in
  `src/ui.json` and are reached through `T('key')`; story text goes through
  `sc()`, `term()`, `colName()`.
- Everything the page writes goes to the artifact database when it is running
  as an artifact, and to browser storage when it is not. A new piece of state
  needs both paths, or it will be lost locally.
- `claude.use(...)` may return `null` — a viewer without that capability. Hide
  the feature, never fail.
- Keep the page under about a megabyte. The data is already 250 KB of it.

## House rules for the story

- Rukmini is the protagonist. Krishna is heard of, argued about and seen in
  pieces — hands, shadow, effect — until *First sight* at the temple door.
- The film ends on the final episode. There is no wedding scene and nothing
  after it.
- Scene codes are frozen. `make-scenes.js` must stay deterministic; if the
  story gains a scene, give it a new code, do not renumber.
- A new or changed scene needs its source recorded in `data/sources.json`:
  the passage it follows, or *Written for this film*.

## Tests

`tests/run.js` opens the built page in headless Chromium with the claude.ai
runtime stubbed, and drives it. Add checks to the suite that fits:

- `language.test.js` — what switches language and what must not.
- `board.test.js` — scenes, shots, prompt editing, history, menus, read-through.
- `mobile.test.js` — both layouts and the switch.

Drag and drop is the one thing these tests cannot reach: Sortable is loaded
from a CDN and the tests run with the network blocked, so it is stubbed out.
Check dragging by hand before merging anything that touches `bindSortables`,
`fromDOM` or the card markup.
