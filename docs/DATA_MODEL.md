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
      "ap": true, "apAt": "…",                // approved: name, note and order are locked
      "ids": ["S-470", "S-231", "S-247"] }    // scenes, in order
  ],
  "order": ["S-470", "…"],                    // every id, flattened; for reading outside the page
  "updated": "2026-11-01T…"
}
```

## Approval

A shot, a scene or a sequence can be approved by hand. Approval is given from
the bottom up and taken off from the top down.

| to approve | what has to be true first | what it freezes |
| --- | --- | --- |
| a **shot** | nothing | its wording and its place in the list; a regenerated list rebuilds around it. An approved shot is the only kind that has a Midjourney prompt. |
| an **image prompt** | its shot is approved | the prompt itself — a check never rewrites it, and the bulk writer skips it |
| a **scene** | every one of its shots is approved | its text, its category, renaming, restoring from history — and all of its shots, their prompts and their images |
| a **sequence** | every scene in it is approved | its name, its story context, the order of its scenes, deleting it, dragging in or out — and the approval of every scene in it |

So a scene cannot be approved before its shots are, and a shot cannot be
unapproved while its scene is approved. The page says which approval is in the
way rather than silently refusing.

## An edited scene — the `scenes` collection

One document per edited scene, keyed by scene code. Only what changed is
stored; the page merges it over `data/scenes.json`.

```jsonc
{
  "t": "…", "sum": "…", "why": "…", "turn": "…", "story": "…",
  "mins": "2", "tier": 4, "rasa": "…", "pov": "…", "pl": "…", "k": "…",
  "carrier": false, "gen": ["Thriller"],
  "te":    { "t": "…", "sum": "…", "why": "…", "turn": "…", "story": "…" },
  "shots": [ { "t": "WIDE", "x": "what the camera does", "te": "…",
               "mj": "the Midjourney prompt written from this shot",
               "imgs": [ { "id": "<asset id>" } ],      // the pictures it made
               "chk": { "best": 1,                       // index of the one that fits, -1 for none
                        "note": "why", "at": "…",
                        "per": [ { "i": 0, "ok": false, "note": "too close" } ] },
               "a": true, "ma": true } ],               // a: shot approved, ma: prompt approved
  "ap": true, "apAt": "…",                               // the scene is approved
  "shotp": "the last instruction for the shots",
  "mjp": "the last instruction for the prompts",
  "hist":  [ { "at": "…", "prompt": "…", "t": "…", "…": "…", "base": true } ],
  "prompt": "the instruction that produced this", "shotp": "…",
  "updated": "…"
}
```

A shot carries everything about itself: the line of direction, the Midjourney
prompt written from it, the pictures that prompt produced, and Claude's
judgement of them. They cannot drift apart — deleting a shot takes its prompt
and pictures with it, and reordering carries them along.

The pictures themselves are not in the database. `assets.upload()` stores a
file and returns an id; `imgs` holds those ids, and the page builds
`"/_blob/" + id` to show each one. Removing a picture deletes the asset and
drops the id in one action. A shot holds at most eight.

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

`src/app.js` contains `__DATA__`, `__TE__`, `__UI__`, `__SRC__` and
`__BOARDS__`. The build replaces them with `data/scenes.json`, the three Telugu
files, `src/ui.json`, `data/sources.json` and every file in `data/boards/`.
Nothing else is injected, and the page fetches nothing at runtime except the
Sortable library and the fonts — and if that library cannot be reached, the
page says dragging is off and everything else still works.

`__BOARDS__` is what makes the page useful on its own: with no database behind
it, and nothing in browser storage, the board starts from those five orders
rather than empty. A published artifact whose database is empty does the same.

## What a scene is built from — `data/entities.json`, `data/scene_entities.json`

Written by `scripts/make-entities.py` (authored rows, not text matching) and
checked by `scripts/audit-entities.py`.

- `entities.json` — `sets` (`name`, `form`, `ext`, `why`, `subs`), `characters`
  (`name`, `kind`: lead / role / creature / crowd, `alias`), `props`, and
  `oblique`: the words shot lists use for Krishna while he is withheld.
- `scene_entities.json` — per scene code: `set`, `sub`, `also` (other sets seen),
  `cast`, `off` (in the scene, never in frame), `props`, `krishna`
  (`face` / `hands` / `shadow` / `offscreen`), and `place`, the prose it was read from.
- `entity_decisions.json` — the merges left for a person; see `docs/ENTITY_DECISIONS.md`.

## More on a shot

| field | meaning |
| --- | --- |
| `sid` | the shot's own stamp, five characters, made once and kept. The shot's id is `<scene code>_<sid>`. |
| `cam` | `{lens, h, dur, ang, mv}` — only what has been set by hand. Everything else is worked out from the kind of shot and marked `derived` in the shotspec. |
| `cast`, `set` | set by hand only when the words of the shot do not say it |
| `cont` | `{dir, tod}` — screen direction, time of day |
| `dlg` | dialogue that belongs to this shot |
| `pv` | per application, what it last reported: `{st, v, at, rev, img, f, note}`. Written by *Bring back the renders*; never by an edit. |

The shotspec — the resolved form every application reads — is described in
`docs/DCC_AUTHORITY.md`.
