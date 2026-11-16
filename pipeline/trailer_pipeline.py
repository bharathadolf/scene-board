#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The trailer's dependency chain, read off the disk.

    python trailer_pipeline.py --root <TRAILER>            writes the three files below
    python trailer_pipeline.py --root <TRAILER> --next     prints only what can be started now

Nothing here is typed in by hand. A step is done when its file exists under the
naming rule; it is out of date when something upstream of it is newer; it is
stale when the board has changed the shot since the file was made. So the answer
to "where do we pick this up" is always a fresh run of this script.

Writes into <TRAILER>/pipeline:
    dependency.json     every node and edge: assets, asset states, shot steps, the edit
    status.json         the state of each, and the list of work that is ready to start
    DEPENDENCIES.md     the same, to read

Naming rule, relative to a shot folder  shots/MV<n>/<unit>/<shot id>/ :
    layout      blender/<id>_blocking_v###.blend  + publish/layout/<id>_layout_v###.usd + publish/camera/<id>_cam_v###.abc
    preview     renders/preview/<id>_blocking_v###.mp4
    passes      renders/blocking/v###/<id>_blocking_v###.####.exr      (every frame of the cut)
    animation   blender/<id>_anim_v###.blend      + publish/anim/<id>_anim_v###.usd
    fx          houdini/<id>_fx_v###.hip*         + cache/<id>_fx_v###.####.bgeo.sc | .vdb
    lighting    blender/<id>_light_v###.blend
    render      renders/final/v###/<id>_final_v###.####.exr
    comp        comp/<id>_comp_v###.nk            + renders/comp/v###/<id>_comp_v###.####.exr
Assets:  assets/<kind>/<id>/publish/<id>_<state>_v###.blend, state one of ASSET_STATES.
"""
import argparse
import datetime
import glob
import json
import os
import re

ASSET_STATES = ["proxy", "blocking", "model_approved", "rig_v1", "lookdev_approved", "final"]
STEPS = ["layout", "preview", "passes", "animation", "fx", "lighting", "render", "comp"]
# what each shot step waits for: other steps of the same shot, and the least state its assets must have reached
NEEDS = {
    "layout":    dict(steps=[], assets="proxy"),
    "preview":   dict(steps=["layout"], assets="proxy"),
    "passes":    dict(steps=["layout"], assets="proxy"),
    "animation": dict(steps=["layout"], assets="rig_v1", kinds=("char",), fallback="model_approved"),
    "fx":        dict(steps=["layout"], assets="proxy"),          # a draft sim starts on the layout; it is redone on animation
    "lighting":  dict(steps=["animation", "fx"], assets="lookdev_approved"),
    "render":    dict(steps=["lighting"], assets="lookdev_approved"),
    "comp":      dict(steps=["render"], assets="proxy"),
}
WHO = dict(layout="Blender", preview="Blender", passes="Blender", animation="Blender", fx="Houdini",
           lighting="Blender", render="Blender", comp="Nuke")


def latest(pattern):
    """(version, path, mtime) of the highest v### matching, or None."""
    best = None
    for p in glob.glob(pattern):
        m = re.search(r"_v(\d{3})", os.path.basename(p)) or re.fullmatch(r"v(\d{3})", os.path.basename(p))
        v = int(m.group(1)) if m else 0
        if best is None or v > best[0]:
            best = (v, p, os.path.getmtime(p))
    return best


def seq_count(folder, stem, ext):
    return len(glob.glob(os.path.join(folder, "%s.[0-9][0-9][0-9][0-9]%s" % (stem, ext))))


def asset_state(root, key):
    kind, aid = key.split("/")
    pub = os.path.join(root, "assets", kind, aid, "publish")
    best = None
    for i, st in enumerate(ASSET_STATES):
        hit = latest(os.path.join(pub, "%s_%s_v[0-9][0-9][0-9].blend" % (aid, st)))
        if hit:
            best = dict(state=st, rank=i, version="v%03d" % hit[0],
                        file=os.path.relpath(hit[1], root).replace("\\", "/"), mtime=hit[2])
    return best or dict(state="missing", rank=-1, version="", file="", mtime=0)


def shot_steps(root, sh, d):
    sid, n = sh["id"], sh["frames"]
    out = {}

    def put(step, hit, extra=None, complete=True):
        if not hit:
            out[step] = dict(state="todo")
            return
        out[step] = dict(state="done" if complete else "partial", version="v%03d" % hit[0],
                         file=os.path.relpath(hit[1], root).replace("\\", "/"), mtime=hit[2])
        out[step].update(extra or {})

    b = latest(os.path.join(d, "blender", sid + "_blocking_v[0-9][0-9][0-9].blend"))
    usd = latest(os.path.join(d, "publish", "layout", sid + "_layout_v[0-9][0-9][0-9].usd*"))
    abc = latest(os.path.join(d, "publish", "camera", sid + "_cam_v[0-9][0-9][0-9].abc"))
    put("layout", b, dict(layout_usd=bool(usd), camera_abc=bool(abc)), complete=bool(b and usd and abc))
    put("preview", latest(os.path.join(d, "renders", "preview", sid + "_blocking_v[0-9][0-9][0-9].mp4")))
    vdir = latest(os.path.join(d, "renders", "blocking", "v[0-9][0-9][0-9]"))
    if vdir:
        got = seq_count(vdir[1], "%s_blocking_v%03d" % (sid, vdir[0]), ".exr")
        put("passes", vdir if got else None, dict(frames=got, of=n), complete=got >= n)
    else:
        put("passes", None)
    put("animation", latest(os.path.join(d, "blender", sid + "_anim_v[0-9][0-9][0-9].blend")))
    if sh["houdini"] and sh["houdini"] != "—":
        hip = latest(os.path.join(d, "houdini", sid + "_fx_v[0-9][0-9][0-9].hip*"))
        cache = len(glob.glob(os.path.join(d, "cache", sid + "_fx_v[0-9][0-9][0-9].*")))
        if hip:
            out["fx"] = dict(state="done" if cache >= n else "set_up", version="v%03d" % hip[0],
                             file=os.path.relpath(hip[1], root).replace("\\", "/"), mtime=hip[2],
                             cache_frames=cache, of=n, owes=sh["houdini"])
        else:
            out["fx"] = dict(state="todo", owes=sh["houdini"])
    else:
        out["fx"] = dict(state="not_needed")
    put("lighting", latest(os.path.join(d, "blender", sid + "_light_v[0-9][0-9][0-9].blend")))
    fdir = latest(os.path.join(d, "renders", "final", "v[0-9][0-9][0-9]"))
    got = seq_count(fdir[1], "%s_final_v%03d" % (sid, fdir[0]), ".exr") if fdir else 0
    put("render", fdir if got else None, dict(frames=got, of=n), complete=got >= n)
    put("comp", latest(os.path.join(d, "comp", sid + "_comp_v[0-9][0-9][0-9].nk")))
    return out


def build(root):
    man = json.load(open(os.path.join(root, "pipeline", "manifest.json"), encoding="utf8"))
    nodes, edges, ready, shots_out = {}, [], [], []
    assets = {}
    for sh in man["shots"]:
        d = os.path.join(root, "shots", "MV" + sh["movement"], sh["unit"], sh["id"])
        rec = {}
        p = os.path.join(d, "shot.json")
        if os.path.exists(p):
            rec = json.load(open(p, encoding="utf8"))
        uses = rec.get("assets", [])
        for a in uses:
            if a not in assets:
                assets[a] = asset_state(root, a)
                assets[a]["used_by"] = []
            assets[a]["used_by"].append(sh["id"])
        steps = shot_steps(root, sh, d)
        stale = bool(rec) and rec.get("rev") != sh["rev"]
        for st in STEPS:
            s = steps[st]
            nid = "%s:%s" % (sh["id"], st)
            if s["state"] == "not_needed":
                continue
            need = NEEDS[st]
            ups = [u for u in need["steps"] if steps[u]["state"] != "not_needed"]
            for u in ups:
                edges.append(["%s:%s" % (sh["id"], u), nid])
            kinds = need.get("kinds")
            wait_assets = []
            for a in uses:
                if kinds and a.split("/")[0] not in kinds:
                    continue
                edges.append(["asset:%s@%s" % (a, need["assets"]), nid])
                if assets[a]["rank"] < ASSET_STATES.index(need["assets"]):
                    wait_assets.append("%s (%s, needs %s)" % (a, assets[a]["state"], need["assets"]))
            wait_steps = [u for u in ups if steps[u]["state"] not in ("done",)]
            if s["state"] in ("done", "partial", "set_up"):
                newer = [u for u in ups if steps[u].get("mtime", 0) > s.get("mtime", 0) + 2]
                if stale:
                    s["state"], s["why"] = "stale", "the board changed this shot (rev %s → %s); rebuild from layout" % (rec.get("rev"), sh["rev"])
                elif newer and s["state"] == "done":
                    s["state"], s["why"] = "out_of_date", "newer upstream: " + ", ".join(newer)
            if s["state"] in ("todo", "partial", "set_up", "stale", "out_of_date"):
                s["waiting_on"] = wait_steps + wait_assets
                if not s["waiting_on"]:
                    ready.append(dict(shot=sh["id"], step=st, app=WHO[st], state=s["state"],
                                      note=s.get("owes") or s.get("why") or ""))
            nodes[nid] = dict(kind="step", shot=sh["id"], step=st, app=WHO[st], **s)
        nodes["edit:" + sh["id"]] = dict(kind="edit", shot=sh["id"], cut_in=sh["cut_in"], cut_out=sh["cut_out"])
        for st in ("preview", "passes", "comp"):
            edges.append(["%s:%s" % (sh["id"], st), "edit:" + sh["id"]])
        best = next((st for st in ("comp", "render", "passes", "preview") if steps[st]["state"] == "done"), None)
        shots_out.append(dict(id=sh["id"], n=sh["n"], movement=sh["movement"], unit=sh["unit"], type=sh["type"],
                              frames=sh["frames"], rev=sh["rev"], stale=stale, steps=steps,
                              edit_source=best, assets=uses))
    for a, st in assets.items():
        for i, name in enumerate(ASSET_STATES):
            nid = "asset:%s@%s" % (a, name)
            nodes[nid] = dict(kind="asset_state", asset=a, state_name=name,
                              state="done" if st["rank"] >= i else "todo")
            if i:
                edges.append(["asset:%s@%s" % (a, ASSET_STATES[i - 1]), nid])
        nxt = ASSET_STATES[st["rank"] + 1] if st["rank"] + 1 < len(ASSET_STATES) else None
        st["next"] = nxt
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    dep = dict(format="trailer-dependency/1", generated_at=now, board_version=man["board_version"],
               steps=STEPS, needs=NEEDS, asset_states=ASSET_STATES, nodes=nodes, edges=edges)
    count = {}
    for s in shots_out:
        for st in STEPS:
            count.setdefault(st, {}).setdefault(s["steps"][st]["state"], 0)
            count[st][s["steps"][st]["state"]] += 1
    status = dict(format="trailer-status/1", generated_at=now, total_shots=len(shots_out), total_frames=man["total_frames"],
                  counts=count, ready=ready, assets=assets, shots=shots_out)
    return man, dep, status


def markdown(man, status):
    L = ["# Trailer — dependency chain and status", "",
         "Read off the disk at %s. Run `python pipeline/scripts/trailer_pipeline.py --root .` to refresh." % status["generated_at"][:19].replace("T", " "), "",
         "## The chain", "",
         "```",
         "asset: proxy → blocking → model_approved → rig_v1 → lookdev_approved → final",
         "         │                                  │            │",
         "shot:  layout ──► preview                   │            │",
         "         ├──────► passes (blocking EXR)     │            │",
         "         ├──────► animation ◄───────────────┘            │",
         "         ├──────► fx (draft on layout, final on animation)",
         "         │           └──────────┐                        │",
         "         └─► animation ─► lighting ◄─────────────────────┘",
         "                              └─► render ─► comp ─► edit",
         "```", "",
         "A step is **ready** when everything it waits for is done. It is **out of date** when something upstream is newer than it, "
         "and **stale** when the board has changed the shot since its files were made.", "",
         "## Where it stands", "", "| Step | Application | " + " | ".join(["done", "partial", "set_up", "todo", "out_of_date", "stale", "not_needed"]) + " |",
         "| --- | --- | " + " | ".join(["---"] * 7) + " |"]
    for st in STEPS:
        c = status["counts"].get(st, {})
        L.append("| %s | %s | %s |" % (st, WHO[st], " | ".join(str(c.get(k, 0)) for k in ("done", "partial", "set_up", "todo", "out_of_date", "stale", "not_needed"))))
    L += ["", "## Ready to start now", ""]
    by = {}
    for r in status["ready"]:
        by.setdefault((r["step"], r["app"]), []).append(r)
    if not by:
        L.append("Nothing is waiting on you: every step that can run has run.")
    for (st, app), rows in by.items():
        L.append("**%s** (%s) — %d shots: %s" % (st, app, len(rows), ", ".join("`%s`" % r["shot"] for r in rows)))
        L.append("")
    L += ["## Blocked, and by what", ""]
    blocked = {}
    for s in status["shots"]:
        for st in STEPS:
            for w in s["steps"][st].get("waiting_on", []):
                if "needs" in w:
                    blocked.setdefault((st, w), []).append(s["id"])
    if not blocked:
        L.append("No step is waiting on an asset.")
    rows = sorted(blocked.items(), key=lambda kv: -len(kv[1]))
    if rows:
        L += ["| Step | Waiting on | Shots held |", "| --- | --- | --- |"]
        for (st, w), ids in rows[:60]:
            L.append("| %s | %s | %d |" % (st, w, len(ids)))
    L += ["", "## Assets", "", "| Asset | State | Version | Next state | Shots using it |", "| --- | --- | --- | --- | --- |"]
    for a, st in sorted(status["assets"].items(), key=lambda kv: -len(kv[1]["used_by"])):
        L.append("| %s | %s | %s | %s | %d |" % (a, st["state"], st["version"], st.get("next") or "—", len(st["used_by"])))
    L += ["", "## Every shot", "", "| # | Shot | Type | Frames | " + " | ".join(STEPS) + " | Edit takes |", "| --- | --- | --- | --- | " + " | ".join(["---"] * len(STEPS)) + " | --- |"]
    mark = dict(done="✔", partial="◐", set_up="◐", todo="·", out_of_date="↻", stale="✖", not_needed="–")
    for s in status["shots"]:
        L.append("| %d | `%s` | %s | %d | %s | %s |" % (s["n"], s["id"], s["type"], s["frames"],
                                                    " | ".join(mark[s["steps"][st]["state"]] for st in STEPS), s["edit_source"] or "—"))
    L += ["", "✔ done · ◐ started · · to do · ↻ out of date · ✖ stale · – not needed", ""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--next", action="store_true")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    man, dep, status = build(root)
    for name, obj in (("dependency.json", dep), ("status.json", status)):
        with open(os.path.join(root, "pipeline", name), "w", encoding="utf8") as fh:
            json.dump(obj, fh, ensure_ascii=False, indent=1)
    with open(os.path.join(root, "pipeline", "DEPENDENCIES.md"), "w", encoding="utf8") as fh:
        fh.write(markdown(man, status))
    if a.next:
        for r in status["ready"]:
            print("%-10s %-8s %s  %s" % (r["step"], r["app"], r["shot"], r["note"][:80]))
    print("%d shots · %d nodes · %d edges · %d ready" % (len(status["shots"]), len(dep["nodes"]), len(dep["edges"]), len(status["ready"])))
    return status


if __name__ == "__main__":
    main()
