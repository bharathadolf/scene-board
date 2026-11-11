#!/usr/bin/env python3
"""Check the entity layer against the scenes it describes.

    python3 scripts/audit-entities.py

Fails if a scene has no set or no cast, if a set has no justification, if
anything is named that does not exist, if an entity is never used, or if what
the story says about Krishna's presence disagrees with the cast.
"""
import collections
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_SETS = 20
IN_FRAME = ("face", "hands", "shadow")


def audit():
    load = lambda p: json.loads((ROOT / "data" / p).read_text(encoding="utf8"))
    scenes, ents, se, dec = load("scenes.json"), load("entities.json"), load("scene_entities.json"), load("entity_decisions.json")
    fails, used = [], collections.defaultdict(set)
    for s in scenes:
        e = se.get(s["c"])
        if not e:
            fails.append(f"{s['src']}: no entities")
            continue
        st = ents["sets"].get(e.get("set"))
        if not st or e.get("sub") not in st["subs"]:
            fails.append(f"{s['src']}: set {e.get('set')}/{e.get('sub')} does not exist")
        if not e.get("cast"):
            fails.append(f"{s['src']}: empty cast")
        for c in e.get("cast", []) + e.get("off", []):
            if c not in ents["characters"]:
                fails.append(f"{s['src']}: unknown character {c}")
            used["characters"].add(c)
        for p in e.get("props", []):
            if p not in ents["props"]:
                fails.append(f"{s['src']}: unknown prop {p}")
            used["props"].add(p)
        for place in [e["set"] + "/" + e["sub"]] + e.get("also", []):
            used["sets"].add(place.split("/")[0])
            used["subs"].add(place)
        k = e.get("krishna")
        if k in IN_FRAME and "krishna" in e.get("off", []):
            fails.append(f"{s['src']}: Krishna is given as {k} and as off-frame")
        if "krishna" in e.get("cast", []) and not k:
            fails.append(f"{s['src']}: Krishna is in the cast with no presence level")
        if e.get("place") != s["pl"]:
            fails.append(f"{s['src']}: the place it was read from has changed — re-run make-entities.py")
    if len(ents["sets"]) > MAX_SETS:
        fails.append(f"{len(ents['sets'])} sets — more than {MAX_SETS}")
    for k, st in ents["sets"].items():
        if not st.get("why"):
            fails.append(f"set {k}: no justification")
        if k not in used["sets"]:
            fails.append(f"set {k}: never used")
        for sub in st["subs"]:
            if f"{k}/{sub}" not in used["subs"]:
                fails.append(f"sub-location {k}/{sub}: never used")
    for kind in ("characters", "props"):
        for k in ents[kind]:
            if k not in used[kind]:
                fails.append(f"{kind[:-1]} {k}: never used")
    for d in dec:
        for f in ("title", "found", "recommend", "alternative", "applied", "strings"):
            if not d.get(f):
                fails.append(f"decision {d.get('id')}: no {f}")
    strings = len({s["pl"] for s in scenes})
    face = [s["src"] for s in scenes if se.get(s["c"], {}).get("krishna") == "face"]
    stats = dict(scenes=len(scenes), place_strings=strings, sets=len(ents["sets"]), subs=len(used["subs"]),
                 characters=len(ents["characters"]),
                 crowds=sum(1 for c in ents["characters"].values() if c["kind"] == "crowd"),
                 props=len(ents["props"]), decisions=len(dec), first_face=min(face) if face else None)
    return fails, stats, se, ents


if __name__ == "__main__":
    fails, st, se, ents = audit()
    print(f"{st['scenes']} scenes · {st['place_strings']} place strings → {st['sets']} sets, {st['subs']} sub-locations")
    print(f"{st['characters']} characters ({st['crowds']} crowds) · {st['props']} props · {st['decisions']} decisions for a person to settle")
    by = collections.Counter(e["set"] for e in se.values())
    for k, n in by.most_common():
        print(f"  {n:3}  {ents['sets'][k]['name']}")
    print(f"his face is first in frame at {st['first_face']}")
    for f in fails:
        print("FAIL " + f)
    print("pass" if not fails else f"{len(fails)} failed")
    raise SystemExit(1 if fails else 0)
