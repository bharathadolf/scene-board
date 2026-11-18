#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Builds a timing cut ("paper cut") from a plan file before any new shot exists.

    python pipeline/scripts/paper_cut.py --root . --plan pipeline/paper_v004.json

The plan lists, in order: v003 shots to reuse (id, first frame to use, length), slates for shots that
still have to be built (beat number + what the shot is + length), black, and cards. Reused shots come from
shots/.../renders/final/<source>_final_<source_version>.mp4; slates are drawn as dark frames with the
shot's description so the pacing can be judged with the holes in place. Writes
edit/trailer_<version>.mp4 and edit/trailer_<version>_timing.md (every event with its timecode).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

W, H = 1920, 804
FONT = "C\\:/Windows/Fonts/georgia.ttf" if os.name == "nt" else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def esc(t):
    return (t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace(",", "\\,")
            .replace("%", "\\%"))


def tc(f, fps):
    return "%02d:%02d:%02d" % (f // (60 * fps), (f // fps) % 60, f % fps)


def script_flag(ff):
    try:
        v = subprocess.run([ff, "-version"], capture_output=True, text=True).stdout.split()[2]
        major = int("".join(c for c in v.split(".")[0] if c.isdigit()) or 0)
    except Exception:
        major = 7
    return "-/filter_complex" if major >= 7 else "-filter_complex_script"


def wrap(text, n=58):
    out, line = [], ""
    for w in text.split():
        if len(line) + len(w) + 1 > n:
            out.append(line)
            line = w
        else:
            line = (line + " " + w).strip()
    out.append(line)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--plan", default="pipeline/paper_v004.json")
    ap.add_argument("--labels", type=int, default=1, help="burn the shot id or beat into the corner")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    plan = json.load(open(os.path.join(root, a.plan), encoding="utf8"))
    fps, src_v = plan["fps"], plan["source_version"]
    man = json.load(open(os.path.join(root, "pipeline", "manifest.json"), encoding="utf8"))
    by = {s["id"]: s for s in man["shots"]}

    args, filt, segs, k = [], [], [], -1
    timing, at, movement = [], 0, ""
    for p in plan["plan"]:
        if p["kind"] == "movement":
            movement = p["name"]
            continue
        n = p["frames"]
        if p["kind"] == "shot":
            sh = by[p["id"]]
            mp4 = os.path.join(root, "shots", "MV" + sh["movement"], sh["unit"], sh["id"], "renders", "final",
                               "%s_final_%s.mp4" % (sh["id"], src_v))
            if os.path.exists(mp4):
                args += ["-i", mp4]
                k += 1
                ch = "[%d:v]trim=start_frame=%d:end_frame=%d,setpts=PTS-STARTPTS,scale=%d:%d,setsar=1,format=yuv420p" % (
                    k, p["start"], p["start"] + n, W, H)
                label = "v003  " + sh["id"]
            else:
                p = dict(p, kind="slate", text="%s (not rendered)" % sh["id"], beat="")
        if p["kind"] == "slate" and p.get("id") and plan.get("new_version"):
            unit = p["id"].split("_")[0]
            mp4 = os.path.join(root, "shots", "MVN", unit, p["id"], "renders", "final",
                               "%s_final_%s.mp4" % (p["id"], plan["new_version"]))
            if os.path.exists(mp4):
                args += ["-i", mp4]
                k += 1
                ch = "[%d:v]trim=end_frame=%d,setpts=PTS-STARTPTS,scale=%d:%d,setsar=1,format=yuv420p" % (k, n, W, H)
                label = "%s  %s" % (plan["new_version"], p["id"])
                p = dict(p, kind="newshot")
        if p["kind"] in ("slate", "black", "card"):
            col = "0x161616" if p["kind"] == "slate" else "black"
            args += ["-f", "lavfi", "-i", "color=c=%s:s=%dx%d:r=%d:d=%.4f" % (col, W, H, fps, n / float(fps) + .1)]
            k += 1
            ch = "[%d:v]trim=end_frame=%d,setpts=PTS-STARTPTS,setsar=1,format=yuv420p" % (k, n)
            label = ""
            if p["kind"] == "slate":
                lines = wrap(p["text"])
                y0 = H / 2 - 30 * len(lines)
                ch += ",drawtext=fontfile='%s':text='NEW SHOT  ·  beat %s':fontcolor=0xC8A040:fontsize=30:x=(w-tw)/2:y=%d" % (
                    FONT, p.get("beat", ""), y0 - 70)
                for i, ln in enumerate(lines):
                    ch += ",drawtext=fontfile='%s':text='%s':fontcolor=0xD8D0C0:fontsize=40:x=(w-tw)/2:y=%d" % (
                        FONT, esc(ln), y0 + i * 56)
            elif p["kind"] == "card":
                size = dict(title=96, voice=44, logo=30)[p.get("style", "voice")]
                colr = dict(title="0xE8DCC0", voice="0xD0C8B8", logo="0x808080")[p.get("style", "voice")]
                ch += ",drawtext=fontfile='%s':text='%s':fontcolor=%s:fontsize=%d:x=(w-tw)/2:y=(h-th)/2" % (
                    FONT, esc(p["text"]), colr, size)
                ch += ",fade=t=in:st=0:d=0.5,fade=t=out:st=%.3f:d=0.5" % (n / float(fps) - .5)
        if a.labels and label:
            ch += ",drawtext=fontfile='%s':text='%s':fontcolor=0xFFFFFF@0.55:fontsize=22:x=24:y=h-44" % (FONT, esc(label))
        t = p.get("t_in", {})
        if t.get("type") == "dip":
            ch += ",fade=t=in:st=0:d=%.4f" % (t["frames"] / float(fps))
        filt.append(ch + ",fps=%d,settb=1/%d[p%d]" % (fps, fps, len(segs)))
        segs.append((n, t))
        timing.append((tc(at, fps), movement, p["kind"], p.get("id") or ("beat %s" % p.get("beat", "")) if p["kind"] != "card" else "card",
                       n, p.get("text", "") or by.get(p.get("id"), {}).get("text", "")))
        at += n
    acc, acc_len = "p0", segs[0][0]
    for i in range(1, len(segs)):
        n, t = segs[i]
        out = "a%d" % i
        if t.get("type") == "dissolve":
            d = t["frames"]
            filt.append("[%s][p%d]xfade=transition=fade:duration=%.4f:offset=%.4f,settb=1/%d[%s]" % (
                acc, i, d / float(fps), (acc_len - d) / float(fps), fps, out))
            acc_len += n - d
        else:
            filt.append("[%s][p%d]concat=n=2:v=1:a=0,settb=1/%d[%s]" % (acc, i, fps, out))
            acc_len += n
        acc = out
    os.makedirs(os.path.join(root, "edit"), exist_ok=True)
    ver = plan["version"]
    fg = os.path.join(root, "edit", "%s.filter" % ver)
    open(fg, "w", encoding="utf8").write(";\n".join(filt))
    mp4 = os.path.join(root, "edit", "trailer_%s.mp4" % ver)
    ff = shutil.which("ffmpeg") or "ffmpeg"
    r = subprocess.run([ff, "-y", "-loglevel", "error"] + args + [script_flag(ff), fg, "-map", "[%s]" % acc, "-r", str(fps),
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", mp4])
    with open(os.path.join(root, "edit", "trailer_%s_timing.md" % ver), "w", encoding="utf8") as fh:
        fh.write("# %s timing\n\n| At | Movement | Kind | Shot / beat | Frames | What |\n| --- | --- | --- | --- | --- | --- |\n" % ver)
        for row in timing:
            fh.write("| %s | %s | %s | %s | %d | %s |\n" % row)
    print("%s: %d frames (%.1f s), %d events, ffmpeg exit %d" % (mp4, acc_len, acc_len / float(fps), len(segs), r.returncode))
    return r.returncode


if __name__ == "__main__":
    sys.exit(main())
