# The data

## A scene — `data/scenes.json`

115 objects, in event order. Everything the board shows about a scene starts
here; edits made in the board are stored separately and merged over the top.

| field | meaning |
| --- | --- |
| `c` | scene code, `S-438`. Drawn from a seeded shuffle of 100–999 so that no code implies a position. **Frozen.** |
| `src` | story id, `E06-18`: event 6, scene 18. The stable name used by `scripts/make-boards.js` and the story documents. |
| `t` | title |
| `carrier` | a scene that carries the story to Rukmini — a mural, a bard, a sailor's tale |
| `ev`, `evn` | event number and name (1 Churning, 2 Earth's burden, 3 Jarasandha, 4 Dvārakā, 5 Mucukunda, 6 Abduction, 7 Final episode, 8 Backstories) |
| `cat` | `D` drama or `A` action. 22 scenes are action. |
| `tier` | how heavy the CG is, 1–5 |
| `mins` | runtime as written, `"1–2"` |
| `mid` | that runtime as one number, used for every total |
| `rasa` | the rasa it plays (Śṛṅgāra, Raudra, Karuṇa…) |
| `pov` | whose eyes we are behind |
| `pl` | place |
| `k` | how much of Krishna is present: *Not present*, *Spoken of*, *Shadow or sound*, *Hands*, *Effect*, *Face* |
| `sum` | what happens |
| `why` | why it is in the film |
| `turn` | the turn, one sentence |
| `story` | how it is filmed in CG |
| `gen` | the closest genres |

## Where a scene comes from — `data/sources.json`

Keyed by scene code:

```json
"S-413": { "k": "TEXT", "c": "SB 10.53.52", "u": "https://vedabase.net/sb/10/53/52.htm" }
```

`k` is how the scene stands to the texts — `TEXT` (follows it), `SOURCE`,
`TRADITION`, `ADAPTATION` — `c` the citation, `u` the link, and `n` a note when
one is needed. 97 scenes carry a link; 18 say *Written for this film* and have
no `u`.

## Telugu — `data/te/`

- `scenes.json` — per code, `{t, sum, why, turn, story}`.
- `terms.json` — the recurring values: `evn`, `k`, `rasa`, `gen`, `pov`, `pl`.
- `sequences.json` — sequence names, board names and board descriptions.

Nothing else is translated. If an English field is edited and no Telugu comes
with it, the page shows the English rather than stale Telugu.

## A board — `data/boards/b1…b5.json`, and the `boards` collection

```jsonc
{
  "name": "Board 5 · The action cut",
  "desc": "…",
  "te":   { "name": "…", "desc": "…" },      // optional
  "cols": [                                   // sequences, in order
    { "id": "s1",
      "name": "Cold open: the burning hill",
      "note": "…",                            // story context, optional
      "te":   { "name": "…", "note": "…" },   // optional
      "lastp": "the last instruction given",  // optional
      "ids": ["S-470", "S-231", "S-247"] }    // scenes, in order
  ],
  "order": ["S-470", "…"],                    // every id, flattened; for reading outside the page
  "updated": "2026-11-01T…"
}
```

## An edited scene — the `scenes` collection

One document per edited scene, keyed by scene code. Only what changed is
stored; the page merges it over `data/scenes.json`.

```jsonc
{
  "t": "…", "sum": "…", "why": "…", "turn": "…", "story": "…",
  "mins": "2", "tier": 4, "rasa": "…", "pov": "…", "pl": "…", "k": "…",
  "carrier": false, "gen": ["Thriller"],
  "te":    { "t": "…", "sum": "…", "why": "…", "turn": "…", "story": "…" },
  "shots": [ { "t": "WIDE", "x": "what the camera does", "te": "…" } ],
  "hist":  [ { "at": "…", "prompt": "…", "t": "…", "…": "…", "base": true } ],
  "prompt": "the instruction that produced this", "shotp": "…",
  "updated": "…"
}
```

`hist` holds up to ten earlier versions, newest first; the one marked `base` is
the scene as it was written. Restoring a version pushes the current one onto
`hist` first, so nothing is lost.

Category changes do not live here — they are in `meta/cats`, a single document
of `{ "S-438": "A" }` overrides, because a scene is drama or action across every
board.

## Browser storage

Per viewer, per browser; never shared, never read back by Claude:

| key | what |
| --- | --- |
| `sceneboard.v2` | a local copy of the boards, used when the page runs without the artifact database |
| `sceneboard.ov` | the same for scene edits |
| `sceneboard.lang` | `en` or `te` |
| `sceneboard.view` | `desktop` or `mobile`, once chosen by hand |
| `sceneboard.folded` | which sequences are folded in the mobile layout |

## Build placeholders

`src/app.js` contains `__DATA__`, `__TE__`, `__UI__` and `__SRC__`. The build
replaces them with `data/scenes.json`, the three Telugu files, `src/ui.json`
and `data/sources.json`. Nothing else is injected, and the page fetches
nothing at runtime except the Sortable library and the fonts.
