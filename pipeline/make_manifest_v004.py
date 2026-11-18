#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Writes pipeline/manifest_v004.json: the recut trailer as the shot builder reads it.

    python pipeline/scripts/make_manifest_v004.py --root .

Order and lengths come from the paper cut (pipeline/paper_v004.json). Shots kept from v003 are copied from
pipeline/manifest.json with a `trim` (the frames of the v003 shot the cut uses); every slate in the paper
cut becomes a new shot record from NEW below, in the same order, and the paper cut file is updated so its
slates carry the new shot ids (the cut then uses each new shot's render as soon as it exists).
"""
import argparse
import json
import os

FPS = 24
# id, type, lens, height, angle, move, set, time of day, how Krishna appears, film scene, line id, what it is,
# what Houdini owes it
NEW = [
    ("N-01_gate", "WIDE", 35, 3.4, "eye", "push", "mathura", "dawn", "back", "E04-07", None,
     "Dawn at Mathura's gate. A guard on the wall watches one unarmed man walk out alone; we stay behind him.",
     "Dawn haze through the gate; dust kicked up at his heels."),
    ("N-01_feet", "INSERT", 50, .25, "low", "track", "mathura", "dawn", "feet", "E04-07", None,
     "His bare feet on the dust, from behind and below, walking toward the army.", "Dust puffs at each step."),
    ("N-02_army", "EWS", 24, 22, "high", "drift", "mathura", "dawn", "absent", "E04-01", None,
     "Thirty million Yavanas on the plain, banners to the horizon.", "Crowd of 220 agents to the horizon; banner cloth; haze."),
    ("N-02_kalayavana", "MS", 50, 2.3, "eye", "arc", "mathura", "dawn", "absent", "E05-02", None,
     "Kalayavana on his horse sees the man on foot and straightens.", "Horse breath, dust, banner flutter."),
    ("N-07_thunder", "WIDE", 24, 1.2, "low", "push", "milk_ocean", "dusk", "absent", "E01-15", None,
     "The war of the gods: Indra raises the thunderbolt and the sky splits over the two armies.",
     "Lightning bolt, storm clouds, sea spray."),
    ("N-07_bali", "MS", 50, 1.6, "eye", "arc", "milk_ocean", "dusk", "absent", "E01-15", None,
     "Bali in the middle of his illusions; shapes that are not there fill the field around him.",
     "Illusion volumes: smoke that holds shapes, then tears."),
    ("N-07_clash", "WIDE", 35, 4, "eye", "pan", "milk_ocean", "dusk", "absent", "E01-15", None,
     "Deva and Asura lines crash together in the storm.", "Dust, spray, weapons sparks; crowd collision."),
    ("N-08_rahu", "MS", 50, 1.6, "eye", "push", "milk_ocean", "dusk", "effect", "E01-14", None,
     "Rahu sits in the line of drinkers. A flash of the disc, and his head is gone.",
     "Disc streak (light only, no wielder), head separation, light flare."),
    ("N-13_pursuer", "TRACKING", 50, 1.4, "eye", "pan", "open_country", "dawn", "absent", "E06-05", None,
     "Rukmi's rider closes on the Brahmin on the empty road.", "Horse dust trail."),
    ("N-15_jarasandha", "CLOSE", 85, 1.6, "eye", "push", "mathura", "dusk", "absent", "E03-05", 1,
     "Jarasandha, close, in front of his fires: 'Tell Mathura their king is ash.'", "Camp fires and smoke behind him."),
    ("N-16_descent", "WIDE", 35, 14, "low", "drift", "mathura", "day", "absent", "E03-04", None,
     "Two radiant chariots come down out of the sky toward the plain.", "Glare volumes, light shafts, dust as they land."),
    ("N-16_glare", "MS", 50, 2, "eye", "push", "mathura", "day", "silhouette", "E03-04", None,
     "The conch; the glare swallows the figure on the chariot until only a silhouette is left.",
     "Glare that eats the silhouette; heat shimmer."),
    ("N-17_plough", "ACTION", 35, 1.1, "eye", "track", "mathura", "day", "absent", "E03-06", None,
     "Close: Balarama's plough sweeps a rank of infantry off their feet.", "Bodies thrown (ragdoll RBD), dust."),
    ("N-17_arrows", "WIDE", 35, 2, "eye", "drift", "mathura", "day", "effect", "E03-06", None,
     "Arrows from outside the frame tear through a line of elephants.",
     "Arrow volley particles, impacts, elephants falling (rigged creatures)."),
    ("N-18_firearrows", "INSERT", 24, 13.4, "low", "static", "mathura", "night", "absent", "E03-09", None,
     "Fire arrows rain on the wall.", "Burning arrow particles with trails."),
    ("N-18_elephants", "WIDE", 28, 3, "low", "static", "mathura", "night", "absent", "E03-09", None,
     "An elephant charge hits the gate; the beam splits.", "Gate RBD fracture, splinters, dust."),
    ("N-18_flood", "WIDE", 24, 13.4, "high", "static", "mathura", "night", "absent", "E03-09", None,
     "The flood assault: water climbing the wall.", "FLIP flood against the wall, whitewater."),
    ("N-19_mouth", "TRACKING", 28, 1.6, "eye", "static", "mucukunda_cave", "day", "absent", "E05-03", None,
     "The chase into the dark of the cave; Kalayavana a silhouette against the bright mouth.", "Dust in the light from the mouth."),
    ("N-19_eyes", "CLOSE", 85, 1.6, "eye", "push", "mucukunda_cave", "day", "absent", "E05-05", None,
     "A kick. In the dark, a sleeper's eyes open.", "Dust falling from his body as he wakes."),
    ("N-19_ash", "WIDE", 28, 1.5, "eye", "static", "mucukunda_cave", "day", "absent", "E05-05", None,
     "Fire: Kalayavana burns to ash where he stands.", "Pyro burn from the inside, ash dissolve, embers."),
    ("N-23_oath", "MS", 50, 1.6, "eye", "push", "open_country", "day", "absent", "E06-24", None,
     "Rukmi swears before the kings.", "—"),
    ("N-23_snap", "INSERT", 85, 2.0, "eye", "static", "open_country", "day", "effect", "E06-25", None,
     "His bow snaps: an arrow from nowhere.", "Bow fracture, splinters; the arrow is a streak only."),
    ("N-23_shield", "MS", 35, 2.0, "eye", "track", "open_country", "day", "effect", "E06-25", None,
     "A second bow, a third, then his shield, as his chariot runs.", "Shield RBD, road dust."),
    ("N-24_lines", "WIDE", 28, 6, "high", "static", "open_country", "day", "absent", "E06-22", None,
     "Chariot lines collide in a wide. No bride, and no direction of escape.", "Dust, collisions, horses (rigged)."),
    ("N-24_wheel", "ACTION", 24, .45, "low", "static", "open_country", "day", "absent", "E06-22", None,
     "Wheels, dust, a horse going down.", "Wheel fracture, horse fall, dust."),
    ("N-27_turn", "WIDE", 35, 1.8, "eye", "push", "kundina_temple", "day", "sound", "E06-18", None,
     "A sound off screen, wheels or hooves, and every king turns his head toward it.", "—"),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    pp = os.path.join(root, "pipeline", "paper_v004.json")
    paper = json.load(open(pp, encoding="utf8"))
    man = json.load(open(os.path.join(root, "pipeline", "manifest.json"), encoding="utf8"))
    by = {s["id"]: s for s in man["shots"]}
    lines = {}
    try:
        import importlib.util
        for cand in (os.path.join(root, "pipeline", "trailer_data.py"),):
            if os.path.exists(cand):
                spec = importlib.util.spec_from_file_location("td", cand)
                td = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(td)
                lines = td.LINES
    except Exception:
        pass
    new = iter(NEW)
    shots, at, n, movement = [], 0, 0, ""
    for p in paper["plan"]:
        if p["kind"] == "movement":
            movement = p["name"]
            continue
        if p["kind"] == "shot":
            sh = dict(by[p["id"]])
            sh.update(trim=dict(start=p["start"], frames=p["frames"]), cut_in=at, cut_out=at + p["frames"] - 1,
                      v004_movement=movement, n=n + 1)
            shots.append(sh)
            n += 1
        elif p["kind"] == "slate":
            sid, t, lens, h, ang, mv, sset, tod, kr, src, ln, text, fx = next(new)
            p["id"] = sid
            unit, frames = sid.split("_")[0], p["frames"]
            index = sum(1 for s in shots if s["unit"] == unit)
            line = None
            if ln is not None:
                who, en, te = lines.get(ln, ("Jarasandha", "Tell Mathurā their king is ash. Tell them who swept it.", ""))
                line = dict(kind="dialogue", speaker=who, en=en, te=te)
            shots.append(dict(
                id=sid, n=n + 1, movement="N", unit=unit, unit_title=movement, index=index, source_scene=src,
                rev="v004", type=t, text=text, set=sset + "/main", unit_set=sset + "/main", also=[], cast=[], off=[],
                props=[], krishna=kr, camera=dict(lens_mm=lens, height_m=h, angle=ang, move=mv), time_of_day=tod,
                frames=frames, duration_s=frames / float(FPS), cut_in=at, cut_out=at + frames - 1,
                frame_start=1001, frame_end=1000 + frames, handles=8, line=line, sound="", houdini=fx, nuke="—",
                staging="", hold=False, v004_movement=movement))
            n += 1
        at += p["frames"]
    out = dict(man, format="trailer-manifest/1", version="v004", total_frames=at, shots=shots, cards=[])
    json.dump(out, open(os.path.join(root, "pipeline", "manifest_v004.json"), "w", encoding="utf8"),
              ensure_ascii=False, indent=1)
    paper["new_version"] = "v004"
    json.dump(paper, open(pp, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print("manifest_v004.json: %d shots (%d new), %d frames" % (len(shots), sum(1 for s in shots if s["movement"] == "N"), at))


if __name__ == "__main__":
    main()
