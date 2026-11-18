#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prints where the final renders stand, one line per shot: frames done of frames needed, broken frames, movie.

    python pipeline/scripts/render_status.py --root . --manifest pipeline/manifest_v004.json --version v004 --new

--new limits it to the shots that are new in that manifest (movement "N"); --shots a,b picks shots by id.
A broken frame is a PNG that is empty or was cut off when a render stopped mid-frame (no IEND chunk).
"""
import argparse
import json
import math
import os


def handles(root, ver, sid):
    p = os.path.join(root, "pipeline", "transitions_%s.json" % ver)
    pre = post = 0
    if os.path.exists(p):
        for t in json.load(open(p, encoding="utf8"))["transitions"]:
            if "dissolve" in t["type"] and t["frames"]:
                h = int(math.ceil(t["frames"] / 2.0)) + 2
                if t["after"] == sid:
                    post = max(post, h)
                if t["before"] == sid:
                    pre = max(pre, h)
    return pre, post


def ok_png(fp):
    try:
        n = os.path.getsize(fp)
        with open(fp, "rb") as fh:
            fh.seek(max(0, n - 12))
            return n > 100 and fh.read().endswith(b"IEND\xaeB`\x82")
    except OSError:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--manifest", default="pipeline/manifest_v004.json")
    ap.add_argument("--version", default="v004")
    ap.add_argument("--new", action="store_true")
    ap.add_argument("--shots", default="")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    man = json.load(open(os.path.join(root, a.manifest), encoding="utf8"))
    want = set(x for x in a.shots.split(",") if x)
    shots = [s for s in man["shots"] if (not a.new or s["movement"] == "N") and (not want or s["id"] in want)]
    tot_need = tot_done = n_ok = 0
    print("  %-18s %9s  %6s  %s" % ("shot", "frames", "broken", "movie"))
    for s in shots:
        d = os.path.join(root, "shots", "MV" + s["movement"], s["unit"], s["id"], "renders", "final")
        pre, post = handles(root, a.version, s["id"])
        need = list(range(s["frame_start"] - pre, s["frame_end"] + post + 1))
        done = bad = 0
        for f in need:
            fp = os.path.join(d, a.version, "%s_%s.%04d.png" % (s["id"], a.version, f))
            if os.path.exists(fp):
                if ok_png(fp):
                    done += 1
                else:
                    bad += 1
        mp4 = os.path.exists(os.path.join(d, "%s_final_%s.mp4" % (s["id"], a.version)))
        state = "DONE" if (mp4 and done == len(need)) else ("rendering / partial" if done or bad else "not started")
        n_ok += state == "DONE"
        tot_need += len(need)
        tot_done += done
        print("  %-18s %4d/%-4d  %6s  %-4s  %s" % (s["id"], done, len(need), bad or "", "yes" if mp4 else "-", state))
    print("  %d of %d shots done, %d of %d frames (%.0f%%)" % (
        n_ok, len(shots), tot_done, tot_need, 100.0 * tot_done / max(1, tot_need)))


if __name__ == "__main__":
    main()
