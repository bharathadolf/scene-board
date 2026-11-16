#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Builds everything the trailer needs out of trailer_data.py.

    python3 story/trailer/build_trailer.py

Writes
    data/trailer/scenes.json          the cut units as board scene records
    data/trailer/scene_entities.json  their sets, cast and props
    data/trailer/board.json           four columns, one per movement
    data/trailer/db/scenes/T-xx.json  the shots
    previz/trailer/shotspec.json      via scripts/trailer-spec.js (the board's own code)
    story/TRAILER_CUT.md              the document
    story/trailer/trailer.edl         a CMX3600 edit list for Premiere or Resolve
    story/trailer/trailer_shots.csv   one row per shot, for a tracker or a spreadsheet
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import trailer_data as T  # noqa: E402

FPS = T.FPS


def tc(seconds):
    f = int(round(seconds * FPS))
    h, rem = divmod(f, 3600 * FPS)
    m, rem = divmod(rem, 60 * FPS)
    s, fr = divmod(rem, FPS)
    return "%02d:%02d:%02d:%02d" % (h, m, s, fr)


def mmss(seconds):
    f = int(round(seconds * FPS))
    s, fr = divmod(f, FPS)
    m, s = divmod(s, 60)
    return "%d:%02d" % (m, s)


def frames(seconds):
    return int(round(seconds * FPS))


def quantize():
    """A cut lands on a frame or it is not a cut: every length becomes a whole
    number of frames before anything is written, so the document, the shotspec,
    the EDL and the CSV cannot disagree by a rounding."""
    for u in T.UNITS:
        for sh in u["shots"]:
            f = max(1, int(round(sh["dur"] * FPS)))
            sh["dur"] = f / float(FPS)
    for c in T.CARDS:
        c["dur"] = max(1, int(round(c["dur"] * FPS))) / float(FPS)


def write(rel, text):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf8") as fh:
        fh.write(text)
    return rel


def dump(rel, obj):
    return write(rel, json.dumps(obj, ensure_ascii=False, indent=1) + "\n")


# ---------------------------------------------------------------- board data

def build_board_data():
    ents = json.load(open(os.path.join(ROOT, "data", "entities.json"), encoding="utf8"))
    scenes, scene_ents, cols = [], {}, []
    by_mv = {}
    for u in T.UNITS:
        by_mv.setdefault(u["mv"], []).append(u["code"])
        total = sum(sh["dur"] for sh in u["shots"])
        scenes.append(dict(
            c=u["code"], src=u["src"], t=u["title"], carrier=False,
            ev=0, evn="Trailer", cat="A" if any(s["t"] in ("ACTION", "TRACKING", "CRANE") for s in u["shots"]) else "D",
            tier=5, mins="%.1f" % (total / 60.0), mid=total / 60.0,
            rasa=u.get("rasa", ""), pov="Rukmini", pl=u["place"],
            k=u.get("krishna", "absent"),
            sum="Trailer cut unit, from %s." % u["src"],
            why="Trailer.", turn="", story="", gen=["Trailer"]))
        row = dict(set=u["set"], sub=u["sub"], cast=list(u["cast"]),
                   props=list(u.get("props", [])), place=u["place"])
        if u.get("also"):
            row["also"] = list(u["also"])
        if u.get("krishna") and u["krishna"] != "absent":
            row["krishna"] = u["krishna"]
        scene_ents[u["code"]] = row
        # every id the unit names must exist in the film's entity tables
        for c in u["cast"]:
            assert c in ents["characters"], "unknown character %s in %s" % (c, u["code"])
        for p in u.get("props", []):
            assert p in ents["props"], "unknown prop %s in %s" % (p, u["code"])
        for s in [u["set"]] + [a.split("/")[0] for a in u.get("also", [])]:
            assert s in ents["sets"], "unknown set %s in %s" % (s, u["code"])

    for num, name, why in T.MOVEMENTS:
        cols.append(dict(id="mv" + num.lower(), name="%s · %s" % (num, name),
                         ids=by_mv.get(num, []), note=why))
    dump("data/trailer/scenes.json", scenes)
    dump("data/trailer/scene_entities.json", scene_ents)
    dump("data/trailer/board.json", dict(name="The Unseen Sun — trailer", cols=cols))

    for u in T.UNITS:
        shots = []
        for sh in u["shots"]:
            o = dict(a=True, t=sh["t"], x=sh["x"],
                     cam=dict(lens=sh["lens"], h=sh["h"], ang=sh["ang"],
                              mv=sh["mv"], dur=sh["dur"]))
            if sh.get("cast") is not None:
                o["cast"] = list(sh["cast"])
            if sh.get("dlg"):
                who, en, te = T.LINES[sh["dlg"]]
                o["dlg"] = "%s: %s" % (who, en)
                o["te"] = te
            if sh.get("vo"):
                v = sh["vo"]
                o["vo"] = T.NARRATION[v][0] if isinstance(v, str) else "%s (V.O.): %s" % (T.LINES[v][0], T.LINES[v][1])
            shots.append(o)
        dump("data/trailer/db/scenes/%s.json" % u["code"],
             dict(ap=True, shots=shots, shotp="trailer cut", updated=""))
    return len(scenes)


# ------------------------------------------------------------------ timeline

def timeline(spec):
    """One flat list of cuts: every built shot, then the cards."""
    rows, at = [], 0.0
    by_code = {s["code"]: s for s in spec["scenes"]}
    for u in T.UNITS:
        sc = by_code[u["code"]]
        for i, sh in enumerate(u["shots"]):
            s = sc["shots"][i]
            rows.append(dict(kind="shot", unit=u, data=sh, spec=s,
                             id=s["id"], dur=sh["dur"], at=at,
                             n=len(rows) + 1))
            at += sh["dur"]
    for c in T.CARDS:
        rows.append(dict(kind="card", card=c, id=c["code"], dur=c["dur"],
                         at=at, n=len(rows) + 1, unit=None))
        at += c["dur"]
    return rows, at


# ---------------------------------------------------------------- the writing

def cam_cell(sh):
    mv = {"static": "locked", "push": "push in", "pull": "pull back", "track": "tracking",
          "pan": "pan", "drift": "slow drift", "crane": "crane"}[sh["mv"]]
    return "%dmm · %.2gm · %s · %s" % (sh["lens"], sh["h"], sh["ang"], mv)


def doc(spec, rows, total, ents):
    L = []
    w = L.append
    nshots = len([r for r in rows if r["kind"] == "shot"])
    nfx = len([r for r in rows if r["kind"] == "shot" and r["data"].get("fx", "—") != "—"])
    w("# The trailer — *%s*" % T.TITLE)
    w("")
    w("A %s trailer in four movements, cut from the board and built to be made: "
      "%d shots, %d cut units, every shot carrying its set, its cast, its camera and its length. "
      "Krishna's face arrives at %s, and not one frame before it."
      % (mmss(total), len([r for r in rows if r["kind"] == "shot"]), len(T.UNITS),
         mmss([r for r in rows if r["id"].startswith("T-18")][1]["at"])))
    w("")
    w("Generated from `story/trailer/trailer_data.py`. Change a length or a lens there and "
      "run `python3 story/trailer/build_trailer.py`; this document, the board data, the "
      "shotspec, the EDL and the CSV are all written from it.")
    w("")

    # ---- technical
    w("## Technical specification")
    w("")
    w("| | |")
    w("| --- | --- |")
    w("| Aspect and resolution | 2.39:1 scope, %d × %d (DCI 4K). The board previews at 1680 × 720. |" % T.FRAME)
    w("| Frame rate | %d fps, whole-frame cuts throughout |" % FPS)
    w("| Colour | ACEScg working space, ACES 1.3; deliver Rec.709 for online, DCI-P3 for theatrical |")
    w("| Render | Cycles, multi-layer OpenEXR, 16-bit half, linear |")
    w("| Passes | beauty, depth (Z), cryptomatte (object + material), position, normal, motion vector, diffuse/specular/emission split |")
    w("| Audio | 24-bit / 48 kHz; 5.1 for theatrical, stereo fold-down for online |")
    w("| Total running time | %s (%d frames) including cards |" % (mmss(total), frames(total)))
    w("")

    # ---- shape
    w("## The shape")
    w("")
    w("| Movement | Runs | Length | What it does | Krishna |")
    w("| --- | --- | --- | --- | --- |")
    for num, name, why in T.MOVEMENTS:
        codes = [u["code"] for u in T.UNITS if u["mv"] == num]
        mr = [r for r in rows if r["kind"] == "shot" and r["unit"]["code"] in codes]
        start, length = mr[0]["at"], sum(r["dur"] for r in mr)
        pres = sorted({u.get("krishna", "absent") for u in T.UNITS if u["mv"] == num})
        pres = ", ".join(p for p in pres if p != "absent") or "not present"
        w("| **%s · %s** | %s | %ss | %s | %s |"
          % (num, name, mmss(start), ("%.1f" % length).rstrip("0").rstrip("."), why, pres))
    cards = [r for r in rows if r["kind"] == "card"]
    w("| Cards | %s | %ss | Title, the last line over black, logos | — |"
      % (mmss(cards[0]["at"]), ("%.1f" % sum(c["dur"] for c in cards)).rstrip("0").rstrip(".")))
    w("")
    w("The withholding is the trailer's engine as much as the film's. Through the first three "
      "movements he is a pair of hands, a silhouette in smoke, a man seen from behind, an effect "
      "on other people's faces. The audience is told about him for two minutes by people who are "
      "afraid of him, in love with him or chasing him, and then they see him at the same moment "
      "she does.")
    w("")

    # ---- the cut, movement by movement
    w("## The cut")
    w("")
    for num, name, why in T.MOVEMENTS:
        w("### Movement %s · %s" % (num, name))
        w("")
        w(why)
        w("")
        units = [u for u in T.UNITS if u["mv"] == num]
        for u in units:
            ur = [r for r in rows if r["kind"] == "shot" and r["unit"]["code"] == u["code"]]
            w("**%s · %s** — from %s · %s · %s" % (u["code"], u["title"], u["src"],
                                                   u["place"], u.get("rasa", "")))
            w("")
            w("| # | Shot id | In | Sec | Type | Camera | On screen |")
            w("| --- | --- | --- | --- | --- | --- | --- |")
            for r in ur:
                sh = r["data"]
                text = sh["x"]
                if sh.get("dlg"):
                    who, en, te = T.LINES[sh["dlg"]]
                    text += "<br>**%s:** “%s”" % (who, en)
                if sh.get("vo"):
                    v = sh["vo"]
                    vo = T.NARRATION[v][0] if isinstance(v, str) else T.LINES[v][1]
                    who = "Narration" if isinstance(v, str) else T.LINES[v][0] + ", V.O."
                    text += "<br>*%s:* “%s”" % (who, vo)
                w("| %d | `%s` | %s | %s | %s | %s | %s |"
                  % (r["n"], r["id"], tc(r["at"]), ("%.1f" % sh["dur"]).rstrip("0").rstrip("."),
                     sh["t"], cam_cell(sh), text))
            w("")
    w("**Cards**")
    w("")
    w("| # | Id | In | Sec | What |")
    w("| --- | --- | --- | --- | --- |")
    for r in rows:
        if r["kind"] != "card":
            continue
        c = r["card"]
        what = c["text"]
        if c.get("line"):
            who, en, te = T.LINES[c["line"]]
            what += "<br>**%s:** “%s”" % (who, en)
        w("| %d | `%s` | %s | %s | %s |" % (r["n"], r["id"], tc(r["at"]),
                                            ("%.1f" % c["dur"]).rstrip("0").rstrip("."), what))
    w("")

    # ---- department sheet
    w("## Department sheet")
    w("")
    w("What each shot needs from each application. A dash means the shot is Blender and comp only.")
    w("")
    for num, name, why in T.MOVEMENTS:
        w("### Movement %s" % num)
        w("")
        w("| Shot id | Set | In frame | Props | Houdini | Nuke | Sound |")
        w("| --- | --- | --- | --- | --- | --- | --- |")
        for r in rows:
            if r["kind"] != "shot" or r["unit"]["mv"] != num:
                continue
            s, sh = r["spec"], r["data"]
            cast = ", ".join(ents["characters"][c]["name"] for c in s["cast"]
                             if c in ents["characters"]) or "—"
            if s["off"]:
                cast += " *(off: %s)*" % ", ".join(ents["characters"][c]["name"]
                                                   for c in s["off"] if c in ents["characters"])
            props = ", ".join(ents["props"][p]["name"] for p in s["props"]
                              if p in ents["props"]) or "—"
            w("| `%s` | %s | %s | %s | %s | %s | %s |"
              % (r["id"], s["set"], cast, props, sh.get("fx", "—"),
                 sh.get("comp", "—"), sh.get("sfx", "—")))
        w("")

    # ---- dialogue
    w("## Every word spoken")
    w("")
    w("Eight of the film's fifteen approved lines (`story/COMMERCIAL_CUT.md` section 5) and three "
      "narration lines written for the trailer. The narration is new and needs your approval; "
      "nothing else here is invented.")
    w("")
    w("| At | Shot | Speaker | English | తెలుగు |")
    w("| --- | --- | --- | --- | --- |")
    spoken = []
    for r in rows:
        if r["kind"] == "card" and r["card"].get("line"):
            who, en, te = T.LINES[r["card"]["line"]]
            spoken.append((r["at"], r["id"], who + " (over black)", en, te))
            continue
        if r["kind"] != "shot":
            continue
        sh = r["data"]
        if sh.get("dlg"):
            who, en, te = T.LINES[sh["dlg"]]
            spoken.append((r["at"], r["id"], who, en, te))
        if sh.get("vo"):
            v = sh["vo"]
            if isinstance(v, str):
                en, te = T.NARRATION[v]
                spoken.append((r["at"], r["id"], "Narration *(new)*", en, te))
            else:
                who, en, te = T.LINES[v]
                spoken.append((r["at"], r["id"], who + " (V.O.)", en, te))
    for at, sid, who, en, te in spoken:
        w("| %s | `%s` | %s | “%s” | “%s” |" % (mmss(at), sid, who, en, te))
    w("")

    # ---- music
    w("## Music and sound")
    w("")
    w("One cue that changes state on a cut and never across one. Each change lands on the shot "
      "named in the last column, so the edit and the score can be built against the same frame "
      "numbers.")
    w("")
    w("| From | State | Tempo | Instrumentation | Lands on |")
    w("| --- | --- | --- | --- | --- |")
    at_of = {}
    for r in rows:
        if r["kind"] == "shot":
            at_of.setdefault(r["unit"]["code"], []).append(r)
        else:
            at_of[r["id"]] = [r]
    MUSIC = [
        (("T-01", 0), "Drone", "no pulse",
         "Contrabass and tanpura on D, one struck bronze bell every eight seconds"),
        (("T-05", 0), "Breath", "free time",
         "Bass flute alone; it stops under every line and returns after it"),
        (("T-08", 0), "Pulse", "92 BPM",
         "Frame drums and chenda enter on the first frame of the shot; low strings under them"),
        (("T-12", 0), "Break", "none",
         "Percussion stops dead on the sword hitting the dust; wind only under the line"),
        (("T-12", 2), "Drive", "132 BPM",
         "Full percussion back in on the chase, conch stabs across the beat"),
        (("T-13", 0), "Lift", "132 BPM",
         "Brass and low strings over the same pulse; the only major-key bars in the trailer"),
        (("T-14", 0), "Drive", "132 BPM",
         "Back to minor on the kings arriving; the cue tightens rather than grows"),
        (("T-17", 1), "Out", "silence",
         "Everything stops. One breath of room tone"),
        (("T-18", 1), "Voice", "free time",
         "One unaccompanied female voice on a single syllable"),
        (("T-19", 0), "Full", "132 BPM",
         "Ensemble, voice on top, conch; hard stop into black"),
        (("T-20", 0), "Tail", "no pulse",
         "The conch decays across the title, one bell, then nothing under the last line"),
    ]
    for (code, i), state, tempo, inst in MUSIC:
        r = at_of[code][i]
        w("| %s | **%s** | %s | %s | `%s` |" % (mmss(r["at"]), state, tempo, inst, r["id"]))
    w("")
    quiet = at_of["T-17"][1]
    t18 = at_of["T-18"][1]
    w("Three sound rules the cut depends on:")
    w("")
    w("- **The quietest frame comes before the loudest.** The silence at `%s` is what makes the "
      "reveal land; if it is scored, the trailer has no third act." % quiet["id"])
    w("- **The conch is the only sound that crosses a cut.** It starts on the last shot and runs "
      "two seconds into the black under the title.")
    w("- **Dialogue is never under music at full.** Every line above has the cue drop to a bed or "
      "to nothing.")
    w("")

    # ---- assets
    w("## What has to exist before the trailer can be built")
    w("")
    used_sets, used_chars, used_props = set(), set(), set()
    for s in spec["scenes"]:
        used_sets.add(s["set"])
        for a in s.get("also", []):
            used_sets.add(a.split("/")[0])
        for sh in s["shots"]:
            if sh["set"]:
                used_sets.add(sh["set"].split("/")[0])
            used_chars.update(sh["cast"])
            used_chars.update(sh["off"])
            used_props.update(sh["props"])
    w("The trailer touches **%d of the film's 17 sets, %d of its 76 characters and crowds, and "
      "%d of its 26 props**. That is the real cost of a trailer on a CG film: it is a "
      "cross-section of the whole build, not a slice of it, and the sets alone are most of the "
      "environment work in the picture."
      % (len(used_sets), len(used_chars), len(used_props)))
    w("")
    w("**Sets** (%d): %s" % (len(used_sets), "; ".join(sorted(
        ents["sets"][s]["name"] for s in used_sets if s in ents["sets"]))))
    w("")
    w("**Characters and crowds** (%d): %s" % (len(used_chars), "; ".join(sorted(
        ents["characters"][c]["name"] for c in used_chars if c in ents["characters"]))))
    w("")
    w("**Props** (%d): %s" % (len(used_props), "; ".join(sorted(
        ents["props"][p]["name"] for p in used_props if p in ents["props"]))))
    w("")
    w("Six of these are hero builds the trailer cannot fake, because the camera is close or the "
      "shot is long: Rukmini, Krishna (hands and silhouette first, face last), Balarama, "
      "Kālayavana, the water-carrier, and His chariot.")
    w("")

    # ---- staging
    w("## Staging the stand-in blocking cannot guess")
    w("")
    w("The blocking puts figures two and a half metres apart on one action line, because the "
      "board holds no layout for any set. For most of the trailer that is enough to frame "
      "against. For these eleven shots the distance *is* the shot, so each one carries the "
      "staging it needs. Until a set layout exists, these are the numbers to key in by hand.")
    w("")
    w("| Shot id | Type | Staging |")
    w("| --- | --- | --- |")
    for r in rows:
        if r["kind"] != "shot" or not r["data"].get("stage"):
            continue
        w("| `%s` | %s | %s |" % (r["id"], r["data"]["t"], r["data"]["stage"]))
    w("")
    w("The reveal is the one that matters most. In the stand-in blocking her POV puts the camera "
      "two and a half metres from him and he fills the frame; the shot is written for eighteen "
      "metres across a forecourt. Set that distance before anything else is lit.")
    w("")

    # ---- how to build
    w("## How to build it")
    w("")
    w("1. **Blocking, in Blender, from the shotspec.** The trailer is already a board object: ")
    w("   ```")
    w("   node scripts/trailer-spec.js                       # previz/trailer/shotspec.json")
    w("   blender --background --factory-startup \\")
    w("     --python pipeline/blender_blocking.py -- previz/trailer/shotspec.json --out previz/trailer/blocking")
    w("   ```")
    w("   This has been run end to end: it built and rendered all %d shots as block, depth and "
      "object-id passes with a `contact.html` and a `report.json`. `previz/` is not committed, so "
      "run the two commands to get them. It writes one Blender "
      "scene per cut unit, one camera per shot named by its shot id, timeline markers on the "
      "cuts, and the withheld character hidden in every shot that does not name him. None of it "
      "is final; it is the thing you light and replace, shot by shot." % nshots)
    w("2. **Lay the edit first, on the blocking.** Import `story/trailer/trailer.edl` into Premiere "
      "or Resolve and conform it to the blocking renders. The cut is locked at this stage, before "
      "a single final asset exists, which is the only way a trailer of this size stays affordable.")
    w("3. **Houdini takes the %d shots in the department sheet that name it.** Three of them " % nfx +
      "are the expensive ones: the churning ocean, the burning hill, and the city rising. Cache to "
      "the shot's folder and report back through the bridge rather than editing the board.")
    w("4. **Nuke conforms to the same shot ids.** Every render carries `shot_id` and `shot_rev` in "
      "its report; a comp whose `shot_rev` no longer matches the board is marked stale "
      "automatically and should be re-pulled, not patched.")
    w("5. **Grade in Resolve against the one rule in the look:** everything before `%s` is warm, "
      "dusty and earthbound, and the reveal is the first cool light in the picture. If that "
      "contrast is graded away the trailer has no reveal." % t18["id"])
    w("")
    w("### A 60-second teaser out of the same material")
    w("")
    w("If the full trailer is too large a build to start with, these units cut to roughly a minute "
      "and keep the structure: **T-02** (the poison), **T-04** (the wall), **T-06** (Ink), "
      "**T-08** (the divisions), **T-11** (the burning hill), **T-13** (the city rises), "
      "**T-17** (breaking her silence), **T-18** (first sight), and the cards. That is %d shots "
      "instead of %d, and it still ends on the face."
      % (sum(len(u["shots"]) for u in T.UNITS if u["code"] in
             {"T-02", "T-04", "T-06", "T-08", "T-11", "T-13", "T-17", "T-18"}),
         len([r for r in rows if r["kind"] == "shot"])))
    w("")

    # ---- open
    w("## What is open")
    w("")
    w("- **The three narration lines are new.** Everything else spoken in the trailer is from the "
      "approved fifteen. If you would rather have no narration at all, movement I plays silent "
      "and gains about four seconds.")
    w("- **The last line is the film's last line.** Using it as the button is the strongest end "
      "the trailer has, and it spends the film's final beat. The alternative is in the card note.")
    w("- **No Telugu title yet.** `story/THE_STORY.md` lists four candidates; the title card needs "
      "one of them chosen.")
    w("- **Shot lengths are authored, not tested.** They are written to be cut to, but a trailer "
      "is found in the edit. Expect every length here to move once there is picture.")
    w("- **The story is not locked**, so a scene that changes changes its trailer unit. Every shot "
      "carries a `rev` fingerprint; when the source scene changes, the shot goes stale and says so.")
    w("")
    return "\n".join(L) + "\n"


def ascii_only(t):
    """EDL comments go into Premiere and Resolve, which are happiest with plain ASCII."""
    sub = {"\u00b7": "-", "\u2014": "-", "\u2013": "-", "\u2019": "'", "\u2018": "'",
           "\u201c": '"', "\u201d": '"', "\u2026": "..."}
    for k, v in sub.items():
        t = t.replace(k, v)
    return t.encode("ascii", "replace").decode("ascii")


def edl(rows):
    L = ["TITLE: THE UNSEEN SUN - TRAILER", "FCM: NON-DROP FRAME", ""]
    at = 0.0
    for i, r in enumerate(rows, 1):
        d = r["dur"]
        src_in, src_out = tc(0), tc(d)
        rec_in, rec_out = tc(at), tc(at + d)
        name = r["id"].replace("-", "")[:8].upper()
        L.append("%03d  %-8s V     C        %s %s %s %s" % (i, name, src_in, src_out, rec_in, rec_out))
        if r["kind"] == "shot":
            L.append("* FROM CLIP NAME: %s" % r["id"])
            L.append(ascii_only("* COMMENT: %s | %s | %s" % (r["data"]["t"], cam_cell(r["data"]),
                                                            r["data"]["x"][:90])))
        else:
            L.append("* FROM CLIP NAME: %s" % r["id"])
            L.append(ascii_only("* COMMENT: CARD | %s" % r["card"]["text"]))
        L.append("")
        at += d
    return "\n".join(L) + "\n"


def csv_rows(spec, rows, ents):
    import csv
    import io
    out = io.StringIO()
    wr = csv.writer(out)
    wr.writerow(["shot_id", "n", "movement", "unit", "unit_title", "source_scene",
                 "tc_in", "tc_out", "frames", "duration_s", "type", "lens_mm", "height_m",
                 "angle", "move", "set", "cast", "off", "props", "krishna",
                 "action", "dialogue", "sound", "houdini", "nuke", "staging", "shot_rev"])
    for r in rows:
        if r["kind"] != "shot":
            wr.writerow([r["id"], r["n"], "", "", r["card"]["text"], "", tc(r["at"]),
                         tc(r["at"] + r["dur"]), frames(r["dur"]), r["dur"], "CARD",
                         "", "", "", "", "", "", "", "", "", r["card"]["note"], "",
                         r["card"]["sfx"], "", "", "", ""])
            continue
        u, sh, s = r["unit"], r["data"], r["spec"]
        dlg = ""
        if sh.get("dlg"):
            who, en, te = T.LINES[sh["dlg"]]
            dlg = "%s: %s" % (who, en)
        elif sh.get("vo"):
            v = sh["vo"]
            dlg = ("Narration (V.O.): " + T.NARRATION[v][0]) if isinstance(v, str) \
                else "%s (V.O.): %s" % (T.LINES[v][0], T.LINES[v][1])
        wr.writerow([r["id"], r["n"], u["mv"], u["code"], u["title"], u["src"],
                     tc(r["at"]), tc(r["at"] + r["dur"]), frames(sh["dur"]), sh["dur"],
                     sh["t"], sh["lens"], sh["h"], sh["ang"], sh["mv"], s["set"],
                     "; ".join(ents["characters"][c]["name"] for c in s["cast"] if c in ents["characters"]),
                     "; ".join(ents["characters"][c]["name"] for c in s["off"] if c in ents["characters"]),
                     "; ".join(ents["props"][p]["name"] for p in s["props"] if p in ents["props"]),
                     u.get("krishna", "absent"), sh["x"], dlg, sh.get("sfx", ""),
                     sh.get("fx", ""), sh.get("comp", ""), sh.get("stage", ""), s["rev"]])
    return out.getvalue()


def main():
    quantize()
    n = build_board_data()
    r = subprocess.run(["node", "scripts/trailer-spec.js"], cwd=ROOT,
                       capture_output=True, text=True)
    if r.returncode:
        print(r.stdout, r.stderr)
        raise SystemExit("shotspec failed")
    print(r.stdout.strip())
    spec = json.load(open(os.path.join(ROOT, "previz", "trailer", "shotspec.json"), encoding="utf8"))
    ents = json.load(open(os.path.join(ROOT, "data", "entities.json"), encoding="utf8"))
    rows, total = timeline(spec)
    print(write("story/TRAILER_CUT.md", doc(spec, rows, total, ents)))
    print(write("story/trailer/trailer.edl", edl(rows)))
    print(write("story/trailer/trailer_shots.csv", csv_rows(spec, rows, ents)))
    print("%d units, %d cuts, %s (%d frames)"
          % (n, len(rows), mmss(total), frames(total)))


if __name__ == "__main__":
    main()
