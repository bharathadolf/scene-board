#!/usr/bin/env python3
"""Run a project's ComfyUI jobs, each one held to the geometry Blender blocked.

    python3 pipeline/dcc_bridge.py generate --project previz/S-719 comfyui     # writes comfy_jobs.json
    python3 comfy/run_comfy.py previz/S-719 --checkpoint sd_xl_base_1.0.safetensors \\
            --controlnet controlnet-depth-sdxl-1.0.safetensors
    python3 pipeline/dcc_bridge.py ingest --project previz/S-719 previz/S-719/comfy_report.json

This runs on the machine that has ComfyUI. For every job it uploads the shot's
depth pass, fills comfy/workflows/sdxl_controlnet_depth.json, submits it, waits,
and saves the picture as <project>/comfy/<shot_id>_v###.png. It then writes
comfy_report.json — status, file, version, and the seed and models used, so any
frame can be made again exactly.

The seed is fixed per shot. The same shot, the same board, the same models give
the same picture; to roll a shot again pass --reroll and the version goes up.
"""
import argparse
import datetime
import json
import os
import pathlib
import sys
import urllib.request
import uuid

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from run_tests import run_one          # submit, wait on /history, fetch from /view

NEGATIVE = ("text, watermark, signature, logo, frame, border, modern clothing, modern buildings, "
            "greek column, roman helmet, gothic, european medieval, blurry, deformed hands, extra fingers")
WITHHELD = "face visible, portrait, looking at camera, front view of the man"


def upload(server, path):
    """Put a control image where ComfyUI's LoadImage can find it."""
    boundary = uuid.uuid4().hex
    name = os.path.basename(path)
    with open(path, "rb") as fh:
        blob = fh.read()
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{name}\"\r\n"
            "Content-Type: image/png\r\n\r\n").encode() + blob + (
            f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{boundary}--\r\n").encode()
    req = urllib.request.Request(f"http://{server}/upload/image", data=body,
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        got = json.loads(r.read())
    sub = got.get("subfolder", "")
    return (sub + "/" if sub else "") + got["name"]


def fill(workflow, job, depth_name, checkpoint, controlnet, seed, strength=None, steps=None):
    g = json.loads(json.dumps(workflow))
    negative = NEGATIVE + (", " + WITHHELD if job.get("withheld") else "")
    for node in g.values():
        i = node.get("inputs", {})
        for k, v in list(i.items()):
            if v == "POSITIVE":
                i[k] = job["prompt"]
            elif v == "NEGATIVE":
                i[k] = negative
            elif v == "CKPT":
                i[k] = checkpoint
            elif v == "CONTROLNET":
                i[k] = controlnet
            elif v == "DEPTH_IMAGE":
                i[k] = depth_name
        ct = node["class_type"]
        if ct == "KSampler":
            i["seed"] = seed
            if steps:
                i["steps"] = steps
        elif ct == "EmptyLatentImage":
            i["width"], i["height"] = job["width"], job["height"]
        elif ct == "ControlNetApplyAdvanced" and strength is not None:
            i["strength"] = strength
        elif ct == "SaveImage":
            i["filename_prefix"] = "sceneboard_" + job["shot_id"]
    return g


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("--server", default="127.0.0.1:8188")
    ap.add_argument("--checkpoint", required=True)
    ap.add_argument("--controlnet", required=True)
    ap.add_argument("--workflow", default=str(HERE / "workflows" / "sdxl_controlnet_depth.json"))
    ap.add_argument("--strength", type=float)
    ap.add_argument("--steps", type=int)
    ap.add_argument("--only", nargs="*", help="only these shot ids")
    ap.add_argument("--reroll", action="store_true", help="a new seed and a new version for each shot run")
    a = ap.parse_args(argv)

    proj = pathlib.Path(a.project)
    doc = json.loads((proj / "comfy_jobs.json").read_text(encoding="utf8"))
    workflow = json.loads(pathlib.Path(a.workflow).read_text(encoding="utf8"))
    out = proj / "comfy"
    out.mkdir(exist_ok=True)
    rep_path = proj / "comfy_report.json"
    earlier, kept = {}, []
    if rep_path.exists():
        kept = json.loads(rep_path.read_text(encoding="utf8")).get("reports", [])
        for r in kept:
            if r.get("status") == "rendered":
                earlier[r["shot_id"]] = max(earlier.get(r["shot_id"], 0), r.get("version", 0))
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    reports = []
    for n, job in enumerate(doc["jobs_list"], 1):
        sid = job["shot_id"]
        if a.only and sid not in a.only:
            continue
        version = earlier.get(sid, 0) + 1
        if earlier.get(sid) and not a.reroll:
            print(f"[{n}] have {sid} v{earlier[sid]} — pass --reroll for another")
            continue
        seed = job["seed"] + (version - 1 if a.reroll else 0)
        rel = f"comfy/{sid}_v{version:03d}.png"
        base = dict(shot_id=sid, app="comfyui", version=version, at=now, board_version=job["board_version"],
                    shot_rev=job.get("shot_rev", ""),
                    generator_version="run_comfy/1.0.0",
                    params=dict(seed=seed, checkpoint=a.checkpoint, controlnet=a.controlnet,
                                workflow=os.path.basename(a.workflow), control_from=job["control_from"]))
        print(f"[{n}/{len(doc['jobs_list'])}] {sid} seed {seed} …", flush=True)
        try:
            depth = upload(a.server, str(proj / job["control"]["depth"]))
            pics = run_one(a.server, fill(workflow, job, depth, a.checkpoint, a.controlnet, seed, a.strength, a.steps))
            (proj / rel).write_bytes(pics[0])
            reports.append(dict(base, status="rendered", files=dict(render=rel)))
        except Exception as e:                     # one bad shot must not stop the run
            print(f"    failed: {e}")
            reports.append(dict(base, status="failed", note=str(e)[:300]))
    # earlier versions stay in the report: a re-roll adds to the record, it does not replace it
    rep_path.write_text(json.dumps(dict(report="shotspec-report/1", reports=kept + reports), indent=1), encoding="utf8")
    ok = sum(1 for r in reports if r["status"] == "rendered")
    print(f"{ok} of {len(reports)} rendered → {rep_path}")
    return 0 if ok == len(reports) else 1


if __name__ == "__main__":
    raise SystemExit(main())
