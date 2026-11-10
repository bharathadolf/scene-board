#!/usr/bin/env python3
"""Run a style test matrix against a local ComfyUI and build a contact sheet.

This runs on YOUR machine, next to ComfyUI — not in the chat. Nothing here
needs a GPU except ComfyUI itself.

    python3 comfy/run_tests.py --list                 # what will be run
    python3 comfy/run_tests.py --models "illustrious_xl.safetensors"
    python3 comfy/run_tests.py --matrix comfy/matrix.json --out comfy/out

What it does
  * takes the three reference shots in comfy/prompts.json — the same shots the
    board already holds for S-719 and S-937 — and the style recipes beside them;
  * submits one job per (shot x recipe x model x seed) to ComfyUI's /prompt;
  * waits on /history, pulls each picture from /view;
  * writes them as <out>/<model>/<recipe>/<shot>_<seed>.png and builds one
    contact sheet per model so the looks can be compared side by side.

The point of the matrix is not to find a pretty picture. It is to find the
combination that gives the SAME look twice, because that is what 1,000 shots
need and what Midjourney will not do.
"""
import argparse
import itertools
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
DEFAULT_SERVER = "127.0.0.1:8188"


# ----------------------------------------------------------------- the server
def post(server, path, payload):
    req = urllib.request.Request(f"http://{server}{path}",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def get(server, path):
    with urllib.request.urlopen(f"http://{server}{path}", timeout=30) as r:
        return json.loads(r.read())


def view(server, info):
    q = urllib.parse.urlencode({"filename": info["filename"],
                                "subfolder": info.get("subfolder", ""),
                                "type": info.get("type", "output")})
    with urllib.request.urlopen(f"http://{server}/view?{q}", timeout=120) as r:
        return r.read()


def run_one(server, graph, timeout=600):
    """Submit a graph, wait for it, return the bytes of every picture it saved."""
    pid = post(server, "/prompt", {"prompt": graph})["prompt_id"]
    waited = 0.0
    while waited < timeout:
        time.sleep(1.0)
        waited += 1.0
        try:
            hist = get(server, f"/history/{pid}")
        except urllib.error.HTTPError:
            continue
        if pid not in hist:
            continue
        entry = hist[pid]
        status = entry.get("status", {})
        if status.get("status_str") == "error" or status.get("completed") is False and status.get("messages") and any(
                m[0] == "execution_error" for m in status.get("messages", [])):
            raise RuntimeError(f"ComfyUI reported an error for {pid}: "
                               f"{json.dumps(status)[:400]}")
        if entry.get("outputs"):
            shots = []
            for node in entry["outputs"].values():
                for img in node.get("images", []):
                    shots.append(view(server, img))
            if shots:
                return shots
    raise TimeoutError(f"{pid} did not finish inside {timeout}s")


# ------------------------------------------------------------------ the graph
def build(workflow, *, positive, negative, model, seed, width, height,
          steps=None, cfg=None, lora=None, lora_strength=None):
    """Fill a workflow's placeholders. Keeps the graph itself untouched."""
    g = json.loads(json.dumps(workflow))
    for node in g.values():
        i = node.get("inputs", {})
        for k, v in list(i.items()):
            if v == "POSITIVE":
                i[k] = positive
            elif v == "NEGATIVE":
                i[k] = negative
            elif v == "CKPT":
                i[k] = model
            elif v == "LORA" and lora:
                i[k] = lora
        if node["class_type"] == "KSampler":
            i["seed"] = seed
            if steps:
                i["steps"] = steps
            if cfg is not None:
                i["cfg"] = cfg
        if node["class_type"] in ("EmptyLatentImage", "EmptySD3LatentImage"):
            i["width"], i["height"] = width, height
        if node["class_type"] == "LoraLoader" and lora_strength is not None:
            i["strength_model"] = i["strength_clip"] = lora_strength
    return g


# ----------------------------------------------------------- the contact sheet
def contact_sheet(paths, out, cols=3, pad=12, label_h=26):
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return None
    if not paths:
        return None
    ims = [(p, Image.open(p).convert("RGB")) for p in paths]
    w = max(i.width for _, i in ims)
    h = max(i.height for _, i in ims)
    scale = min(1.0, 520 / w)
    w, h = int(w * scale), int(h * scale)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w + (cols + 1) * pad,
                              rows * (h + label_h) + (rows + 1) * pad), (18, 18, 20))
    d = ImageDraw.Draw(sheet)
    for n, (p, im) in enumerate(ims):
        im = im.resize((w, h))
        x = pad + (n % cols) * (w + pad)
        y = pad + (n // cols) * (h + label_h + pad)
        sheet.paste(im, (x, y))
        d.text((x + 2, y + h + 6), pathlib.Path(p).stem[:70], fill=(210, 210, 215))
    sheet.save(out)
    return out


# ------------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--server", default=DEFAULT_SERVER)
    ap.add_argument("--matrix", default=str(ROOT / "matrix.json"))
    ap.add_argument("--prompts", default=str(ROOT / "prompts.json"))
    ap.add_argument("--out", default=str(ROOT / "out"))
    ap.add_argument("--models", nargs="*", help="override the matrix's model list")
    ap.add_argument("--recipes", nargs="*", help="only these style recipes")
    ap.add_argument("--shots", nargs="*", help="only these shots")
    ap.add_argument("--seeds", nargs="*", type=int, help="override the seeds")
    ap.add_argument("--list", action="store_true", help="print the jobs and stop")
    a = ap.parse_args()

    matrix = json.loads(pathlib.Path(a.matrix).read_text(encoding="utf8"))
    book = json.loads(pathlib.Path(a.prompts).read_text(encoding="utf8"))
    shots = {s["id"]: s for s in book["shots"]}
    recipes = {r["id"]: r for r in book["recipes"]}

    models = a.models or matrix["models"]
    use_r = a.recipes or matrix.get("recipes") or list(recipes)
    use_s = a.shots or matrix.get("shots") or list(shots)
    seeds = a.seeds or matrix.get("seeds", [1])

    jobs = list(itertools.product(models, use_r, use_s, seeds))
    print(f"{len(jobs)} jobs — {len(models)} model(s) x {len(use_r)} recipe(s) "
          f"x {len(use_s)} shot(s) x {len(seeds)} seed(s)")
    if a.list:
        for m, r, s, sd in jobs:
            print(f"  {pathlib.Path(m).stem:28} {r:14} {s:10} seed {sd}")
        return

    out = pathlib.Path(a.out)
    made = {}
    for n, (model, rid, sid, seed) in enumerate(jobs, 1):
        rec, shot = recipes[rid], shots[sid]
        wf_name = rec.get("workflow", matrix.get("workflow", "sdxl_txt2img.json"))
        wf = json.loads((ROOT / "workflows" / wf_name).read_text(encoding="utf8"))
        pos = rec["prefix"] + shot["text"] + rec.get("suffix", "")
        graph = build(wf, positive=pos, negative=rec.get("negative", ""),
                      model=model, seed=seed,
                      width=matrix.get("width", 1344), height=matrix.get("height", 768),
                      steps=rec.get("steps"), cfg=rec.get("cfg"),
                      lora=rec.get("lora"), lora_strength=rec.get("lora_strength"))
        tag = f"{pathlib.Path(model).stem}/{rid}"
        d = out / tag
        d.mkdir(parents=True, exist_ok=True)
        f = d / f"{sid}_seed{seed}.png"
        if f.exists():
            print(f"[{n}/{len(jobs)}] have {f}")
            made.setdefault(pathlib.Path(model).stem, []).append(f)
            continue
        print(f"[{n}/{len(jobs)}] {tag} {sid} seed {seed} …", flush=True)
        try:
            pics = run_one(a.server, graph)
        except Exception as e:                       # one bad combination must not stop the run
            print(f"    failed: {e}")
            continue
        f.write_bytes(pics[0])
        made.setdefault(pathlib.Path(model).stem, []).append(f)

    for model, paths in made.items():
        sheet = contact_sheet(sorted(str(p) for p in paths), out / f"_sheet_{model}.jpg")
        if sheet:
            print(f"contact sheet: {sheet}")
    print(f"\n{sum(len(v) for v in made.values())} pictures under {out}")
    print("Now score them with comfy/SCORING.md — consistency first, prettiness second.")


if __name__ == "__main__":
    main()
