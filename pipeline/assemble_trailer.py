#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assembles the rendered trailer from the per-shot final renders and the transition plan.

    python pipeline/scripts/assemble_trailer.py --root . --version v003

Reads pipeline/manifest.json (cut order and lengths) and pipeline/transitions_<ver>.json (what happens at
every cut), takes each shot's PNG sequence from shots/.../renders/final/<ver>/, and writes
edit/trailer_<ver>_assembly.mp4 at 24 fps with exactly the cut's length. Dissolves are centred on the cut and
use the handles the renderer wrote; dips to black are fades inside the shots; the title, voice and logo
cards are black cards with type. A shot that has not been rendered yet shows a labelled slate, so the cut
always holds its timing. Also writes edit/trailer_<ver>.edl with the dissolves in it.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

FPS = 24
W, H = 1920, 804
FONT = "C\\:/Windows/Fonts/georgia.ttf" if os.name == "nt" else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def shot_dir(root, sh):
    return os.path.join(root, "shots", "MV" + sh["movement"], sh["unit"], sh["id"])


def esc(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace(",", "\\,")


def tc(frames):
    f = int(frames)
    return "%02d:%02d:%02d:%02d" % (f // (3600 * FPS), (f // (60 * FPS)) % 60, (f // FPS) % 60, f % FPS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--version", default="v003")
    ap.add_argument("--crf", default="16")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    man = json.load(open(os.path.join(root, "pipeline", "manifest.json"), encoding="utf8"))
    tr = json.load(open(os.path.join(root, "pipeline", "transitions_%s.json" % a.version), encoding="utf8"))
    tby = {t["after"]: t for t in tr["transitions"]}
    first = next(t for t in tr["transitions"] if t["after"] == "OPEN")

    pieces = []                  # (label, input args, frames available before/after the cut, cut frames)
    for sh in man["shots"]:
        d = os.path.join(shot_dir(root, sh), "renders", "final", a.version)
        pat = os.path.join(d, "%s_%s.%%04d.png" % (sh["id"], a.version))
        frames = sorted(int(f.split(".")[-2]) for f in os.listdir(d) if f.endswith(".png")
                        and os.path.getsize(os.path.join(d, f)) > 0) if os.path.isdir(d) else []
        ok = bool(frames) and frames[0] <= sh["frame_start"] and frames[-1] >= sh["frame_end"]
        pieces.append(dict(id=sh["id"], n=sh["frames"], ok=ok, pat=pat,
                           pre=(sh["frame_start"] - frames[0]) if ok else 0,
                           post=(frames[-1] - sh["frame_end"]) if ok else 0,
                           first=frames[0] if ok else 0))
    for c in man["cards"]:
        pieces.append(dict(id=c["id"], n=c["frames"], ok=False, card=c))

    args, filt = [], []
    lab = []
    k = -1
    for i, p in enumerate(pieces):
        t_in = tby.get(pieces[i - 1]["id"]) if i else first
        t_out = tby.get(p["id"], dict(type="cut", frames=0))
        din = t_in["frames"] if t_in and "dissolve" in t_in["type"] else 0
        dout = t_out["frames"] if "dissolve" in t_out["type"] else 0
        hin, hout = din // 2, dout - dout // 2          # how far this piece reaches past each cut
        L = p["n"] + hin + hout
        if p.get("ok"):
            hin, hout = min(hin, p["pre"]), min(hout, p["post"])
            L = p["n"] + hin + hout
            args += ["-thread_queue_size", "64", "-framerate", str(FPS), "-start_number", str(p["first"] + p["pre"] - hin), "-i", p["pat"]]
            k += 1
            ch = "[%d:v]trim=end_frame=%d,setpts=PTS-STARTPTS,scale=%d:%d,setsar=1,format=yuv420p" % (k, L, W, H)
        else:
            args += ["-f", "lavfi", "-i", "color=c=black:s=%dx%d:r=%d:d=%.4f" % (W, H, FPS, L / float(FPS))]
            k += 1
            ch = "[%d:v]trim=end_frame=%d,setpts=PTS-STARTPTS,setsar=1,format=yuv420p" % (k, L)
            c = p.get("card")
            if c is None:
                ch += ",drawtext=fontfile='%s':text='%s  not rendered yet':fontcolor=gray:fontsize=34:x=(w-tw)/2:y=(h-th)/2" % (
                    FONT, p["id"])
            elif c["kind"] == "title":
                ch += (",drawtext=fontfile='%s':text='%s':fontcolor=0xE8DCC0:fontsize=96:x=(w-tw)/2:y=(h-th)/2:"
                       "alpha='if(lt(t,0.5),t/0.5,if(gt(t,%.3f),(%.3f-t)/0.5,1))'") % (FONT, esc(c["text"]), L / 24.0 - .5, L / 24.0)
            elif c["kind"] == "logo":
                ch += ",drawtext=fontfile='%s':text='PRODUCTION LOGOS  /  RELEASE DATE':fontcolor=0x808080:fontsize=30:x=(w-tw)/2:y=(h-th)/2" % FONT
        # dips and fades happen inside the piece
        if t_in and t_in["type"] in ("dip_black", "fade_in") and t_in["frames"]:
            n = t_in["frames"] if t_in["type"] == "fade_in" else t_in["frames"] // 2
            ch += ",fade=t=in:st=0:d=%.4f" % (n / float(FPS))
        if t_out["type"] == "dip_black" and t_out["frames"]:
            n = t_out["frames"] - t_out["frames"] // 2
            ch += ",fade=t=out:st=%.4f:d=%.4f" % ((L - n) / float(FPS), n / float(FPS))
        filt.append(ch + ",fps=%d,settb=1/%d[p%d]" % (FPS, FPS, i))
        lab.append((i, L, hin, hout))
    acc, acc_len = "p0", lab[0][1]
    for j in range(1, len(lab)):
        i, L, hin, _ = lab[j]
        din = lab[j - 1][3] + hin
        out = "a%d" % i
        if din:
            filt.append("[%s][p%d]xfade=transition=fade:duration=%.4f:offset=%.4f,settb=1/%d[%s]" % (
                acc, i, din / float(FPS), (acc_len - din) / float(FPS), FPS, out))
            acc_len += L - din
        else:
            filt.append("[%s][p%d]concat=n=2:v=1:a=0,settb=1/%d[%s]" % (acc, i, FPS, out))
            acc_len += L
        acc = out
    os.makedirs(os.path.join(root, "edit"), exist_ok=True)
    fg = os.path.join(root, "edit", "assembly_%s.filter" % a.version)
    with open(fg, "w", encoding="utf8") as fh:
        fh.write(";\n".join(filt))
    mp4 = os.path.join(root, "edit", "trailer_%s_assembly.mp4" % a.version)
    ff = shutil.which("ffmpeg") or "ffmpeg"
    cmd = [ff, "-y", "-loglevel", "error"] + args + ["-filter_complex_script", fg, "-map", "[%s]" % acc,
                                                     "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast",
                                                     "-crf", a.crf, "-pix_fmt", "yuv420p", mp4]
    r = subprocess.run(cmd)
    print("assembly %s: %d frames planned (manifest says %d), %d of %d shots rendered, ffmpeg exit %d" % (
        mp4, acc_len, man["total_frames"], sum(1 for p in pieces if p.get("ok")), len(man["shots"]), r.returncode))

    # an EDL the editor can conform from: one event per shot, dissolves as D events
    ev, rec, n = [], 0, 1
    title = "THE UNSEEN SUN TRAILER %s" % a.version.upper()
    lines = ["TITLE: " + title, "FCM: NON-DROP FRAME", ""]
    for i, p in enumerate(pieces):
        t_in = tby.get(pieces[i - 1]["id"]) if i else first
        src = 3600 * FPS                       # each clip's own timecode starts at 01:00:00:00 + handles
        d = t_in["frames"] if t_in and "dissolve" in t_in["type"] else 0
        reel = p["id"].replace("-", "")[:8]
        if d and i:
            prev = pieces[i - 1]
            r0 = rec - d // 2
            o = src + prev["n"] + (d - d // 2) - d
            lines.append("%03d  %-8s V     C        %s %s %s %s" % (n, prev["id"].replace("-", "")[:8], tc(o), tc(o),
                                                                 tc(r0), tc(r0)))
            lines.append("%03d  %-8s V     D    %03d %s %s %s %s" % (n, reel, d, tc(src - d // 2), tc(src + p["n"]),
                                                                    tc(r0), tc(rec + p["n"])))
        else:
            lines.append("%03d  %-8s V     C        %s %s %s %s" % (n, reel, tc(src), tc(src + p["n"]), tc(rec),
                                                                 tc(rec + p["n"])))
        lines.append("* FROM CLIP NAME: %s_final_%s.mp4" % (p["id"], a.version))
        if t_in and t_in["type"] != "cut":
            lines.append("* TRANSITION IN: %s %d frames" % (t_in["type"], t_in["frames"]))
        lines.append("")
        rec += p["n"]
        n += 1
    with open(os.path.join(root, "edit", "trailer_%s.edl" % a.version), "w", encoding="utf8") as fh:
        fh.write("\n".join(lines))
    return 0 if r.returncode == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
