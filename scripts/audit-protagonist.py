#!/usr/bin/env python3
"""Measure whether the protagonist is actually driving the film.

Turns three claims that are usually argued about into numbers that can be
re-measured after a rewrite:

  presence  how much of the film has no scene of hers in it, and where
  share     how many placed scenes are hers
  grammar   in how many of her scenes is SHE the subject of the turn —
            "she speaks" counts, "he lowers the sword" does not

Run it against any order:
    python3 scripts/audit-protagonist.py                       # the draft
    python3 scripts/audit-protagonist.py --who Rukmini --from story/DRAFT_SCREENPLAY.md
"""
import argparse
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# a turn is hers when she is the one doing it
ACTIVE = re.compile(r"^(she|her \w+ (leaves|finds|lifts))\b", re.I)
SEEING = re.compile(r"^she (sees|notices|watches|realises|realizes|hears|stops)\b", re.I)

THRESHOLDS = {
    "first_scene_by": 10.0,      # minutes
    "max_gap": 12.0,             # minutes with no scene of hers
    "second_half_agency": 0.60,  # share of her turns where she acts
    "closing_seeing": 2,         # how many of the last 8 turns may be "she sees"
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--who", default="Rukmini")
    p.add_argument("--order", default="story/DRAFT_SCREENPLAY.md")
    p.add_argument("--half", type=float, default=95.0, help="where the second half starts")
    a = p.parse_args()

    sc = {s["src"]: s for s in json.loads(
        (ROOT / "data" / "scenes.json").read_text(encoding="utf8"))}
    txt = (ROOT / a.order).read_text(encoding="utf8")
    rows = re.findall(r"^\| (\d+) \| ([^|]+?) \| ([\d.]+)–([\d.]+) \| ([\d.]+) \| ([^|]*) \|",
                      txt, re.M)
    if not rows:
        raise SystemExit(f"no sequence table found in {a.order}")

    hers, placed, first, gaps, run = 0, 0, None, [], 0.0
    second, active, closing = [], 0, []
    print(f"{'#':>2}  {'sequence':30} {'runs':>13} {'hers':>5} {'of':>3}")
    for n, name, s0, s1, mins, codes in rows:
        cs = [c for c in re.findall(r"E0\d-\d\d", codes) if c in sc]
        mine = [c for c in cs if a.who in sc[c]["pov"]]
        hers += len(mine)
        placed += len(cs)
        if mine and first is None:
            first = float(s0)
        if mine:
            if run:
                gaps.append((run, float(s0)))
            run = 0.0
        else:
            run += float(mins)
        for c in mine:
            t = sc[c]["turn"].strip()
            if float(s0) >= a.half:
                second.append((c, t))
                if ACTIVE.match(t) and not SEEING.match(t):
                    active += 1
            closing.append((c, t))
        print(f"{n:>2}  {name.strip():30} {s0:>5}–{s1:<6} {len(mine):>5} {len(cs):>3}")
    if run:
        gaps.append((run, float(rows[-1][3])))
    gaps.sort(reverse=True)
    closing = closing[-8:]
    saw = sum(1 for _, t in closing if SEEING.match(t))

    share = hers / placed if placed else 0
    agency = active / len(second) if second else 0
    print(f"\n{a.who} holds the point of view in {hers} of {placed} placed scenes "
          f"({share:.0%})")
    print(f"first scene of hers: minute {first:g}")
    print("longest stretches without her: " +
          ", ".join(f"{g:g} min to minute {e:g}" for g, e in gaps[:3]))
    print(f"second half: she is the subject of the turn in {active} of {len(second)} "
          f"of her scenes ({agency:.0%})")
    print(f"last eight turns: {saw} are 'she sees/notices/watches'")

    print("\nagainst the thresholds")
    checks = [
        ("on screen by minute %g" % THRESHOLDS["first_scene_by"],
         first is not None and first <= THRESHOLDS["first_scene_by"], f"{first:g}"),
        ("no gap longer than %g min" % THRESHOLDS["max_gap"],
         not gaps or gaps[0][0] <= THRESHOLDS["max_gap"],
         f"{gaps[0][0]:g} min" if gaps else "none"),
        ("she acts in %.0f%% of her second-half turns" % (THRESHOLDS["second_half_agency"] * 100),
         agency >= THRESHOLDS["second_half_agency"], f"{agency:.0%}"),
        ("at most %d of the last eight turns are watching" % THRESHOLDS["closing_seeing"],
         saw <= THRESHOLDS["closing_seeing"], str(saw)),
    ]
    for label, ok, got in checks:
        print(f"  [{'pass' if ok else 'FAIL'}] {label:52} {got}")
    bad = sum(1 for _, ok, _ in checks if not ok)
    print(f"\n{len(checks) - bad} of {len(checks)} pass")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
