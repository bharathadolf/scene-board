#!/usr/bin/env python3
"""Build story/SCENE_LIST.md — every scene, in the braided (non-linear) order.

Sources of truth:
  data/scenes.json        the scenes themselves
  data/orders/braided.json the order, its movements, and why each
                           interleaved scene sits where it sits
  data/sources.json       citations
Run: python3 scripts/make-scene-list.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCENES = json.loads((ROOT / "data" / "scenes.json").read_text(encoding="utf8"))
ORDER = json.loads((ROOT / "data" / "orders" / "braided.json").read_text(encoding="utf8"))
SOURCES = json.loads((ROOT / "data" / "sources.json").read_text(encoding="utf8"))
OUT = ROOT / "story" / "SCENE_LIST.md"

EVENT = {
    1: ("E01", "Kṣīra Sāgara Manthanam — the churning of the Ocean of Milk"),
    2: ("E02", "Bhūbhāram — the Earth's burden"),
    3: ("E03", "Jarasandha's attacks on Mathurā"),
    4: ("E04", "Dvārakā rises from the sea"),
    5: ("E05", "Mucukunda and the man on foot"),
    6: ("E06", "Rukmiṇī Kalyāṇam — the letter and the abduction"),
    7: ("E07", "The final episode: together"),
    8: ("E08", "The backstories"),
}
CAT = {"A": "action", "D": "drama"}

BY = {s["src"]: s for s in SCENES}
lines = []
w = lines.append


def esc(s):
    return s.replace("|", "\\|").replace("\n", " ").strip()


def mm(x):
    return f"{x:g}"


# walk the order once, recording positions
seq = []           # (pos, scene, why, movement)
pos = 0
clock = 0.0
for m in ORDER["movements"]:
    for item in m["scenes"]:
        s = BY[item["c"]]
        pos += 1
        seq.append((pos, s, item.get("why"), m, clock))
        clock += s["mid"]
POSOF = {s["src"]: p for p, s, _, _, _ in seq}

total = sum(s["mid"] for s in SCENES)
n_act = sum(1 for s in SCENES if s["cat"] == "A")
n_carrier = sum(1 for s in SCENES if s.get("carrier"))
n_braid = sum(1 for _, _, why, _, _ in seq if why)

# ---------- header ----------
w(f"""# Every scene, in the braided order

All {len(SCENES)} scenes, in the order the film plays them — not in event order.
Each scene keeps its event label (`E01`–`E08`) so the context it came from is
always visible, but the events are no longer told one after another.

{len(SCENES)} scenes · ≈ {int(total)} min (about {int(total)//60} h {int(total)%60} min) ·
{n_act} action, {len(SCENES)-n_act} drama · {n_carrier} carrier scenes ·
{n_braid} scenes placed as deliberate rhymes · interval at minute 100

## Why this order exists

Told event by event, this story is episodic: everything about the churning of
the ocean arrives in the first half-hour, is finished with, and never returns.
That buys clarity and spends all the curiosity.

So the earlier events are **broken up and braided through the film**. Every
scene from the churning, the Earth's burden and the backstories is placed
immediately beside the present-tense scene it rhymes with, and the cut makes
the argument instead of a character explaining it. The clearest case is the one
this order is built around:

> **{POSOF['E01-10']} · `E01-10` Lakshmi chooses** — the goddess rises with a garland, passes
> every claimant who stepped forward, and garlands the one who did not — runs
> **immediately before {POSOF['E06-19']} · `E06-19`, the lift**. Cut together, the two scenes say
> that the abduction *is* the choosing, and that the balance of the world is
> restored by a woman deciding rather than by a man taking.

**Two doorways license the whole method.** Once the audience has seen her
standing in front of the painted wall at Ambikā ({POSOF['E01-18']} · `E01-18`) and heard the bard
recite the churning to a hall of kings ({POSOF['E01-19']} · `E01-19`), the film may cut to a
painted panel or a sung verse at any moment without explaining itself. Every
interleaved scene below carries a **why here** line.

## The ten movements

| | movement | runs | min | scenes | what it is for |
| --- | --- | --- | --- | --- | --- |""")

for m in ORDER["movements"]:
    a, b = m["runs"].split("-")
    w(f"| **{m['n']}** | {m['name']} | {a}–{b} | {mm(m['min'])} | "
      f"{len(m['scenes'])} | {esc(m['job'])} |")
    if m.get("interval"):
        w(f"| | **— INTERVAL, minute {b} —** | | | | |")

w("")
w("""## How to read the entries

Each elaborated entry carries one field line:

`minutes · action or drama · CG tier 1–5 · how Krishna appears · rasa`

**How Krishna appears** is the law of this film: before `E06-18` he may only be
*Not present*, *Spoken of*, *Shadow or sound*, *Hands*, *Effect* or a
*Reflection in the witness's face*. **CG tier** runs 1 (nothing) to 5 (a full
visual-effects scene). **Rasa** is the register: *Vīra* heroic, *Bhayānaka*
fear, *Raudra* fury, *Adbhuta* wonder, *Karuṇa* grief, *Śānta* stillness,
*Śṛṅgāra* love, *Hāsya* comedy. A **carrier** scene is one of the ordinary
people — the water-carrier, the potter, the ferryman — who feel the result and
never learn the cause.

---

# 1 · The whole list, in order

| scene | scene info | story event |
| --- | --- | --- |""")

cur = None
for p, s, why, m, at in seq:
    if m is not cur:
        cur = m
        a, b = m["runs"].split("-")
        w(f"| | **MOVEMENT {m['n']} — {m['name']}** · *minutes {a}–{b}* | |")
    code, _ = EVENT[s["ev"]]
    tag = " · *carrier*" if s.get("carrier") else ""
    info = (f"**{esc(s['t'])}** — {esc(s['sum'])}"
            f" <br>*{s['mins']} min · {CAT[s['cat']]} · tier {s['tier']} · "
            f"Krishna: {esc(s['k'])}{tag}*")
    if why:
        info += f" <br>**Why here.** *{esc(why)}*"
    w(f"| **{p}** · `{s['src']}` | {info} | {code} · {esc(s['evn'])} |")
    if m.get("interval") and s["src"] == m["scenes"][-1]["c"]:
        w("| | **— INTERVAL —** | |")

w("")
w("---")
w("")
w("# 2 · The scenes, elaborated")

cur = None
for p, s, why, m, at in seq:
    if m is not cur:
        cur = m
        a, b = m["runs"].split("-")
        w("")
        w(f"## Movement {m['n']} — {m['name']}")
        w("")
        w(f"*{len(m['scenes'])} scenes · minutes {a}–{b} · {mm(m['min'])} min*")
        w("")
        w(f"{m['job']}")
    w("")
    w(f"### {p} · `{s['src']}` · {s['t']}")
    meta = (f"`{s['mins']} min` · **{CAT[s['cat']]}** · CG tier {s['tier']}"
            f" · Krishna: *{s['k']}* · rasa *{s['rasa']}*")
    if s.get("carrier"):
        meta += " · **carrier scene**"
    w(meta + "  ")
    ec, en = EVENT[s["ev"]]
    w(f"**Event** {ec} · {s['evn']} — *{en}*  ")
    w(f"**POV** {s['pov']} · **Place** {s['pl']} · "
      f"**Genre** {', '.join(s.get('gen') or [])}")
    if why:
        w("")
        w(f"**Why here.** {why}")
    w("")
    w(f"**What happens.** {s['sum']}")
    w("")
    w(f"**Why it is in the film.** {s['why']}")
    w("")
    w(f"**The turn.** {s['turn']}")
    w("")
    w(f"**How it plays.** {s['story']}")
    r = SOURCES.get(s["c"])
    if r:
        cite = f"[{r['c']}]({r['u']})" if r.get("u") else r["c"]
        note = f" — {r['n']}" if r.get("n") else ""
        w("")
        w(f"**Source.** {cite}{note}")
    if m.get("interval") and s["src"] == m["scenes"][-1]["c"]:
        w("")
        w(f"> ### INTERVAL — minute {m['runs'].split('-')[1]}")
        w("> The enemy counts him dead. The second half opens on a woman"
          " writing to a man the audience last saw jumping off a cliff.")

# ---------- appendix: the episodic view ----------
w("")
w("---")
w("")
w("""# 3 · Appendix: the same scenes by event

The episodic view, kept for context. **Cut** is where the scene now falls in
the braided order above — so this table is also the map of how far each event
has been scattered.""")

for ev in sorted(EVENT):
    code, name = EVENT[ev]
    rows = [s for s in SCENES if s["ev"] == ev]
    ps = sorted(POSOF[s["src"]] for s in rows)
    spread = f"{ps[0]}–{ps[-1]}"
    w("")
    w(f"### {code} — {name}")
    w("")
    w(f"*{len(rows)} scenes · ≈ {mm(sum(s['mid'] for s in rows))} min · "
      f"now spread across cut positions {spread}*")
    w("")
    w("| scene | title | cut |")
    w("| --- | --- | --- |")
    for s in rows:
        w(f"| `{s['src']}` | {esc(s['t'])} | **{POSOF[s['src']]}** |")

w("")
w("---")
w("")
w("""*Generated by `scripts/make-scene-list.py` from `data/scenes.json` and
`data/orders/braided.json`. To change the order, edit the order file and run
the script again. `THE_STORY.md` tells the story in prose · `REFERENCE.md`
names the people and places · `EVENTS.md` tells the eight events as continuous
narrative · `ACTION.md` elaborates the action with staging and tags ·
`COMMERCIAL_CUT.md` and `DRAFT_SCREENPLAY.md` are two other orders of this same
material.*""")

OUT.write_text("\n".join(lines) + "\n", encoding="utf8")
kb = len(OUT.read_bytes()) // 1024
print(f"built {OUT.relative_to(ROOT)} — {kb} KB, {len(SCENES)} scenes, "
      f"{len(ORDER['movements'])} movements, {n_braid} rhymed placements, "
      f"{int(total)} min")
