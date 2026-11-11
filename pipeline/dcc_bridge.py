#!/usr/bin/env python3
"""dcc-bridge — one bridge between the Scene Board and every application after it.

The board says what a shot IS: its set, its cast, its camera, its length. An
application says what it MADE of that: a file, a version, a status. This file
is where that line is held, in code, for every application at once.

    board  ──shotspec.json──▶  bridge ──▶ adapter ──▶ Blender / ComfyUI / …
    board  ◀──status.json────  bridge ◀── report  ◀── the application

A report that tries to change what a shot is — its cast, its lens, its
duration — is refused, with a sentence saying where that change belongs.

Run it three ways:

    python3 pipeline/dcc_bridge.py serve    --project previz/S-719     an MCP server on stdio
    python3 pipeline/dcc_bridge.py generate --project previz/S-719 blender
    python3 pipeline/dcc_bridge.py ingest   --project previz/S-719 previz/S-719/report.json
    python3 pipeline/dcc_bridge.py status   --project previz/S-719

A project is a folder holding one shotspec.json, written by the board (the
“Previz” section of a scene, a sequence or the board) or by scripts/shotspec.js.
No dependencies: the MCP side is plain JSON-RPC over stdio.
"""
import datetime
import hashlib
import json
import os
import shutil
import sys

VERSION = "1.0.0"
HERE = os.path.dirname(os.path.abspath(__file__))

# ---- the authority rule — the same lists as src/shotspec.js, and a test keeps them equal
REPORT_FIELDS = ["shot_id", "app", "status", "version", "files", "at", "note",
                 "generator_version", "board_version", "params", "shot_rev"]
REPORT_STATUS = ["queued", "built", "rendered", "failed", "stale"]
APPS = ["ae", "blender", "comfyui", "houdini", "nuke", "unreal"]
STRUCTURE = ["set", "cast", "off", "props", "camera", "continuity", "duration_s", "text", "type",
             "kind", "approved", "lens_mm", "height_m", "id", "n"]


class Refused(Exception):
    """A report the bridge will not take, and why."""


def check_report(r):
    errs = []
    if not isinstance(r, dict):
        return ["a report is an object"]
    for k in r:
        if k in REPORT_FIELDS:
            continue
        if k in STRUCTURE:
            errs.append(f"“{k}” is the board’s to say. Change it on the board and regenerate — "
                        "an application reports status, files and versions only.")
        else:
            errs.append(f"“{k}” is not part of a report.")
    if not isinstance(r.get("shot_id"), str) or not r.get("shot_id"):
        errs.append("a report names its shot_id")
    if r.get("app") not in APPS:
        errs.append("app is one of " + ", ".join(APPS))
    if r.get("status") not in REPORT_STATUS:
        errs.append("status is one of " + ", ".join(REPORT_STATUS))
    if "version" in r and not (isinstance(r["version"], int) and not isinstance(r["version"], bool) and r["version"] > 0):
        errs.append("version is a whole number from 1")
    if "files" in r:
        if not isinstance(r["files"], dict):
            errs.append("files is a map of name to path")
        else:
            errs += [f"files.{k} is a path" for k, v in r["files"].items() if not isinstance(v, str)]
    if "params" in r and not isinstance(r["params"], dict):
        errs.append("params is a map of the application's own settings")
    return errs


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


class Bridge:
    def __init__(self, project):
        self.project = os.path.abspath(project)
        self.spec_path = os.path.join(self.project, "shotspec.json")
        self.ledger_path = os.path.join(self.project, "ledger.json")
        if not os.path.exists(self.spec_path):
            raise FileNotFoundError(f"no shotspec.json in {self.project} — export one from the board first")
        with open(self.spec_path, encoding="utf8") as fh:
            self.spec = json.load(fh)
        if not str(self.spec.get("spec", "")).startswith("shotspec/"):
            raise ValueError("shotspec.json is not a shotspec")
        self.shots = {sh["id"]: (sc, sh) for sc in self.spec["scenes"] for sh in sc["shots"]}
        self.ledger = {"ledger": "shotspec-ledger/1", "reports": []}
        if os.path.exists(self.ledger_path):
            with open(self.ledger_path, encoding="utf8") as fh:
                self.ledger = json.load(fh)

    # ------------------------------------------------------------- reading
    @property
    def board_version(self):
        return self.spec["provenance"]["board_version"]

    def summary(self):
        s = self.spec
        return dict(scope=s["scope"], board_version=self.board_version, generated_at=s["provenance"]["generated_at"],
                    scenes=len(s["scenes"]), shots=len(self.shots),
                    seconds=round(sum(sc["duration_s"] for sc in s["scenes"]), 3),
                    sets=sorted(s["entities"]["sets"]), characters=sorted(s["entities"]["characters"]),
                    derived_durations=sum(1 for _, sh in self.shots.values() if sh["camera"]["duration_src"] == "derived"))

    def latest(self):
        """The newest report per shot per application."""
        out = {}
        for r in self.ledger["reports"]:
            k = (r["shot_id"], r["app"])
            if k not in out or r.get("version", 0) >= out[k].get("version", 0):
                out[k] = r
        return out

    def list_shots(self, app=None):
        last = self.latest()
        rows = []
        for sid, (sc, sh) in self.shots.items():
            st = {a: last[(sid, a)]["status"] for a in APPS if (sid, a) in last}
            if app and app not in st:
                st[app] = "none"
            rows.append(dict(shot_id=sid, scene=sc["code"], n=sh["n"], type=sh["type"], set=sh["set"],
                             cast=sh["cast"], duration_s=sh["camera"]["duration_s"], status=st))
        return rows

    def get_shot(self, shot_id):
        if shot_id not in self.shots:
            raise Refused(f"no shot {shot_id} in this shotspec")
        sc, sh = self.shots[shot_id]
        last = self.latest()
        return dict(shot=sh, scene={k: v for k, v in sc.items() if k != "shots"},
                    reports={a: last[(shot_id, a)] for a in APPS if (shot_id, a) in last})

    # ------------------------------------------------------------- writing
    def report(self, entry, save=True):
        """Take one report from an application. Status, files and versions only."""
        errs = check_report(entry)
        if errs:
            raise Refused(" ".join(errs))
        if entry["shot_id"] not in self.shots:
            raise Refused(f"no shot {entry['shot_id']} in this shotspec — it may have been built from an older board")
        r = dict(entry)
        r.setdefault("at", now())
        mine = [x for x in self.ledger["reports"] if x["shot_id"] == r["shot_id"] and x["app"] == r["app"]]
        r.setdefault("version", max((x.get("version", 0) for x in mine), default=0) + 1)
        rev = self.shots[r["shot_id"]][1].get("rev")
        if r.get("shot_rev") and rev and r["shot_rev"] != rev and r["status"] != "failed":
            r["note"] = (r.get("note", "") + " — the shot has changed on the board since this was made").strip(" —")
            r["status"] = "stale"
        self.ledger["reports"] = [x for x in self.ledger["reports"]
                                  if not (x["shot_id"] == r["shot_id"] and x["app"] == r["app"]
                                          and x.get("version") == r["version"])] + [r]
        if save:
            self.save()
        return r

    def ingest(self, path):
        """Take a whole report file an application wrote. All of it or none of it."""
        with open(path, encoding="utf8") as fh:
            doc = json.load(fh)
        rows = doc.get("reports", doc if isinstance(doc, list) else [])
        bad = []
        for i, r in enumerate(rows):
            errs = check_report(r)
            if not errs and r["shot_id"] not in self.shots:
                errs = [f"no shot {r['shot_id']} in this shotspec"]
            if errs:
                bad.append(f"report {i + 1}: " + " ".join(errs))
        if bad:
            raise Refused("\n".join(bad))
        took = [self.report(r, save=False) for r in rows]
        self.save()
        return took

    def save(self):
        with open(self.ledger_path, "w", encoding="utf8") as fh:
            json.dump(self.ledger, fh, indent=1, ensure_ascii=False)
        # the file the board takes back: the newest report per shot per application
        with open(os.path.join(self.project, "status.json"), "w", encoding="utf8") as fh:
            json.dump(dict(status="shotspec-status/1", board_version=self.board_version,
                           reports=sorted(self.latest().values(), key=lambda r: (r["shot_id"], r["app"]))),
                      fh, indent=1, ensure_ascii=False)

    def status(self):
        last = self.latest()
        out = {}
        for a in APPS:
            got = [r for (sid, app), r in last.items() if app == a]
            if got:
                tally = {}
                for r in got:
                    tally[r["status"]] = tally.get(r["status"], 0) + 1
                out[a] = dict(shots=len(got), of=len(self.shots), **tally)
        return out

    def generate(self, app):
        if app not in ADAPTERS:
            raise Refused("app is one of " + ", ".join(APPS))
        return ADAPTERS[app](self)


# ------------------------------------------------------------------- adapters
# An adapter takes the bridge and returns {files: [...], run: "...", note: "..."}.
# It reads the shotspec and nothing else; it writes into the project folder.
def adapter_blender(b):
    dst = os.path.join(b.project, "blender_blocking.py")
    shutil.copyfile(os.path.join(HERE, "blender_blocking.py"), dst)
    proj = b.project.replace("\\", "/")
    return dict(
        files=["blender_blocking.py"],
        run=f'blender --background --python "{proj}/blender_blocking.py" -- "{proj}/shotspec.json" --out "{proj}"',
        mcp=("import sys; sys.path.insert(0, r'%s'); import importlib, blender_blocking; "
             "importlib.reload(blender_blocking); blender_blocking.run(r'%s/shotspec.json', r'%s')" % (proj, proj, proj)),
        then=f'python3 pipeline/dcc_bridge.py ingest --project "{proj}" "{proj}/report.json"',
        note="Rebuilds every scene in the shotspec from nothing. `mcp` is the same run as one line for "
             "Blender's execute_blender_code tool, when Blender is open with its MCP add-on.")


MJ_FLAGS = ("--ar", "--v", "--version", "--style", "--s", "--stylize", "--c", "--chaos", "--q", "--niji",
            "--no", "--seed", "--w", "--weird", "--raw", "--tile", "--iw", "--sref", "--cref", "--p")


def plain_prompt(mj):
    """A Midjourney prompt with its flags taken off, for a model that has none."""
    words, out, skip = str(mj or "").split(), [], False
    for w in words:
        if w.startswith("--"):
            skip = w in ("--ar", "--v", "--version", "--style", "--s", "--stylize", "--c", "--chaos", "--q",
                         "--no", "--seed", "--w", "--weird", "--iw", "--sref", "--cref", "--p")
            continue
        if skip:
            skip = False
            continue
        out.append(w)
    return " ".join(out).strip(" ,")


def adapter_comfyui(b):
    """Jobs for comfy/run_comfy.py: each shot's prompt, held to the geometry
    Blender blocked — the depth pass is the control image, so the same set under
    the same camera comes back as the same frame."""
    last = b.latest()
    jobs, waiting = [], []
    for sid, (sc, sh) in b.shots.items():
        blk = last.get((sid, "blender"))
        if not blk or blk["status"] not in ("rendered",) or "depth" not in blk.get("files", {}):
            waiting.append(sid)
            continue
        text = plain_prompt(sh["prompt"]) or sh["text"]
        seed = int(hashlib.sha1(sid.encode()).hexdigest()[:8], 16)
        jobs.append(dict(shot_id=sid, scene=sc["code"], prompt=text,
                         control=dict(depth=blk["files"]["depth"], id=blk["files"].get("id", "")),
                         control_from=dict(app="blender", version=blk["version"]),
                         seed=seed, width=b.spec["frame"][0] // 16 * 16, height=b.spec["frame"][1] // 16 * 16,
                         withheld=sh.get("withheld", {}), board_version=b.board_version, shot_rev=sh.get("rev", "")))
    with open(os.path.join(b.project, "comfy_jobs.json"), "w", encoding="utf8") as fh:
        json.dump(dict(jobs="shotspec-comfy/1", board_version=b.board_version, jobs_list=jobs), fh, indent=1,
                  ensure_ascii=False)
    proj = b.project.replace("\\", "/")
    return dict(files=["comfy_jobs.json"], jobs=len(jobs), waiting_for_blocking=waiting,
                run=f'python3 comfy/run_comfy.py "{proj}" --checkpoint <your checkpoint> --controlnet <your depth controlnet>',
                then=f'python3 pipeline/dcc_bridge.py ingest --project "{proj}" "{proj}/comfy_report.json"',
                note="Run on the machine that has ComfyUI. Shots still waiting need Blender blocking first.")


def adapter_ae(b):
    return dict(files=[], note="After Effects is built from the board itself: open the scene, sequence or board "
                               "and use Build under After Effects. It reads the same shotspec.")


def not_built(name, needs):
    def adapter(b):
        raise Refused(f"The {name} adapter is not built yet. It plugs in here — a function that takes the bridge "
                      f"and reads the shotspec — and needs {needs}. See docs/DCC_AUTHORITY.md.")
    return adapter


ADAPTERS = dict(
    blender=adapter_blender, comfyui=adapter_comfyui, ae=adapter_ae,
    houdini=not_built("Houdini", "parameters on the set entities, and renders from blocking"),
    nuke=not_built("Nuke", "renders from Blender or Houdini to comp"),
    unreal=not_built("Unreal", "the set and character assets to exist as Unreal assets"),
)

# ------------------------------------------------------------------ MCP server
TOOLS = [
    dict(name="shotspec_summary", description="What this project holds: scope, board version, scenes, shots, sets, cast.",
         inputSchema=dict(type="object", properties={})),
    dict(name="list_shots", description="Every shot with its set, cast, duration and its status in each application.",
         inputSchema=dict(type="object", properties=dict(app=dict(type="string", enum=APPS)))),
    dict(name="get_shot", description="One shot in full — set, cast, camera, continuity — and its latest report from each application. Read-only: what a shot is can only be changed on the board.",
         inputSchema=dict(type="object", properties=dict(shot_id=dict(type="string")), required=["shot_id"])),
    dict(name="generate", description="Write what an application needs to build these shots, and say how to run it.",
         inputSchema=dict(type="object", properties=dict(app=dict(type="string", enum=APPS)), required=["app"])),
    dict(name="report", description="Report what an application made of a shot: status, files, version, note, params. Nothing else — a report that carries a shot's cast, set, camera or duration is refused.",
         inputSchema=dict(type="object", properties=dict(
             shot_id=dict(type="string"), app=dict(type="string", enum=APPS),
             status=dict(type="string", enum=REPORT_STATUS), version=dict(type="integer"),
             files=dict(type="object"), note=dict(type="string"), params=dict(type="object"),
             board_version=dict(type="string"), generator_version=dict(type="string")),
             required=["shot_id", "app", "status"])),
    dict(name="ingest", description="Take a whole report file an application wrote (for example Blender's report.json).",
         inputSchema=dict(type="object", properties=dict(path=dict(type="string")), required=["path"])),
    dict(name="status", description="How far each application has got, across all shots.",
         inputSchema=dict(type="object", properties={})),
]


def call_tool(b, name, args):
    if name == "shotspec_summary":
        return b.summary()
    if name == "list_shots":
        return b.list_shots(args.get("app"))
    if name == "get_shot":
        return b.get_shot(args.get("shot_id", ""))
    if name == "generate":
        return b.generate(args.get("app", ""))
    if name == "report":
        return b.report(args)
    if name == "ingest":
        return b.ingest(args.get("path", ""))
    if name == "status":
        return b.status()
    raise Refused(f"no tool {name}")


def serve(b, fin=None, fout=None):
    fin, fout = fin or sys.stdin, fout or sys.stdout
    for line in fin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        mid, method = msg.get("id"), msg.get("method", "")
        if mid is None:                       # a notification; nothing to answer
            continue
        res, err = None, None
        if method == "initialize":
            res = dict(protocolVersion=msg.get("params", {}).get("protocolVersion", "2025-06-18"),
                       capabilities=dict(tools={}), serverInfo=dict(name="dcc-bridge", version=VERSION),
                       instructions="The board decides what a shot is. Read shots here, build them in the "
                                    "application, and report back status, files and versions only.")
        elif method == "ping":
            res = {}
        elif method == "tools/list":
            res = dict(tools=TOOLS)
        elif method == "tools/call":
            p = msg.get("params", {})
            try:
                out = call_tool(b, p.get("name", ""), p.get("arguments") or {})
                res = dict(content=[dict(type="text", text=json.dumps(out, ensure_ascii=False, indent=1))])
            except (Refused, FileNotFoundError, ValueError) as e:
                res = dict(content=[dict(type="text", text=str(e))], isError=True)
        else:
            err = dict(code=-32601, message="method not found: " + method)
        out = dict(jsonrpc="2.0", id=mid)
        out["error" if err else "result"] = err or res
        fout.write(json.dumps(out, ensure_ascii=False) + "\n")
        fout.flush()


def main(argv):
    if len(argv) < 1 or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd, rest, project = argv[0], argv[1:], "."
    if "--project" in rest:
        i = rest.index("--project")
        project = rest[i + 1]
        rest = rest[:i] + rest[i + 2:]
    try:
        b = Bridge(project)
        if cmd == "serve":
            serve(b)
        elif cmd == "generate":
            print(json.dumps(b.generate(rest[0] if rest else ""), indent=1, ensure_ascii=False))
        elif cmd == "ingest":
            took = b.ingest(rest[0])
            print(f"took {len(took)} reports → {os.path.join(project, 'status.json')}")
        elif cmd == "status":
            print(json.dumps(dict(summary=b.summary(), status=b.status()), indent=1, ensure_ascii=False))
        else:
            print(__doc__)
            return 2
    except (Refused, FileNotFoundError, ValueError) as e:
        print("refused: " + str(e), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
