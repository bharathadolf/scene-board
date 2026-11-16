#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Writes previz/trailer/manifest.json: one record per trailer shot holding
everything a shot file has to carry — what the board says the shot is (from the
shotspec) and what each department owes it (from trailer_data.py).

    python3 story/trailer/build_trailer.py && python3 story/trailer/make_manifest.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import trailer_data as T  # noqa: E402
import build_trailer as B  # noqa: E402

START = 1001      # first frame of every shot file
HANDLES = 8       # frames of handle either side, kept outside the cut range


def main():
    B.quantize()
    spec = json.load(open(os.path.join(ROOT, "previz", "trailer", "shotspec.json"), encoding="utf8"))
    ents = json.load(open(os.path.join(ROOT, "data", "entities.json"), encoding="utf8"))
    by = {s["code"]: s for s in spec["scenes"]}
    shots, at, n = [], 0, 0
    for u in T.UNITS:
        sc = by[u["code"]]
        for i, sh in enumerate(u["shots"]):
            s = sc["shots"][i]
            frames = int(round(sh["dur"] * T.FPS))
            n += 1
            line = None
            if sh.get("dlg"):
                who, en, te = T.LINES[sh["dlg"]]
                line = dict(kind="dialogue", speaker=who, en=en, te=te)
            elif sh.get("vo"):
                v = sh["vo"]
                if isinstance(v, str):
                    line = dict(kind="narration", speaker="Narration", en=T.NARRATION[v][0], te=T.NARRATION[v][1])
                else:
                    who, en, te = T.LINES[v]
                    line = dict(kind="voice-over", speaker=who, en=en, te=te)
            shots.append(dict(
                id=s["id"], n=n, movement=u["mv"], unit=u["code"], unit_title=u["title"],
                index=i, source_scene=u["src"], rev=s["rev"],
                type=sh["t"], text=sh["x"],
                set=s["set"], unit_set=u["set"] + "/" + u["sub"], also=u.get("also", []),
                cast=s["cast"], off=s["off"], props=sh.get("props", []),
                krishna=u.get("krishna", "absent"),
                camera=dict(lens_mm=sh["lens"], height_m=sh["h"], angle=sh["ang"], move=sh["mv"]),
                time_of_day=s["continuity"]["time_of_day"],
                frames=frames, duration_s=frames / float(T.FPS),
                cut_in=at, cut_out=at + frames - 1,
                frame_start=START, frame_end=START + frames - 1, handles=HANDLES,
                line=line, sound=sh.get("sfx", ""), houdini=sh.get("fx", "—"),
                nuke=sh.get("comp", "—"), staging=sh.get("stage", ""), hold=bool(sh.get("hold"))))
            at += frames
    cards = []
    for c in T.CARDS:
        frames = int(round(c["dur"] * T.FPS))
        cards.append(dict(id=c["code"], kind=c["kind"], text=c["text"], frames=frames,
                          cut_in=at, cut_out=at + frames - 1, sound=c["sfx"], note=c["note"]))
        at += frames
    names = dict(
        sets={k: v["name"] for k, v in ents["sets"].items()},
        characters={k: dict(name=v["name"], kind=v["kind"]) for k, v in ents["characters"].items()},
        props={k: v["name"] for k, v in ents["props"].items()})
    out = dict(format="trailer-manifest/1", title=T.TITLE, fps=T.FPS, frame=list(T.FRAME),
               total_frames=at, board_version=spec["provenance"]["board_version"],
               movements=[dict(id=a, name=b, note=c) for a, b, c in T.MOVEMENTS],
               names=names, shots=shots, cards=cards)
    p = os.path.join(ROOT, "previz", "trailer", "manifest.json")
    with open(p, "w", encoding="utf8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print("previz/trailer/manifest.json — %d shots, %d cards, %d frames" % (len(shots), len(cards), at))


if __name__ == "__main__":
    main()
