"""The pipeline outside the page: entities, the bridge and its authority rule,
Blender blocking (when the bpy module is here) and the ComfyUI runner against a
stand-in server.

    python3 -m unittest discover -s tests/py -v
"""
import http.server
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
sys.path.insert(0, str(ROOT / "comfy"))
sys.path.insert(0, str(ROOT / "scripts"))
import dcc_bridge  # noqa: E402

try:
    import bpy  # noqa: F401
    HAVE_BPY = True
except ImportError:
    HAVE_BPY = False

PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
                    "0000000d49444154789c6360606060000000050001a5f645400000000049454e44ae426082")


def make_project(tmp, scene="S-719"):
    proj = pathlib.Path(tmp) / scene
    proj.mkdir(parents=True)
    subprocess.run(["node", "scripts/shotspec.js", "--board", "b7", "--scene", scene, "--db", "tests/fixtures/db",
                    "--out", str(proj / "shotspec.json")], cwd=ROOT, check=True, capture_output=True)
    return proj


class Entities(unittest.TestCase):
    def test_audit_passes(self):
        r = subprocess.run([sys.executable, "scripts/audit-entities.py"], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_the_numbers(self):
        ents = json.loads((ROOT / "data/entities.json").read_text(encoding="utf8"))
        se = json.loads((ROOT / "data/scene_entities.json").read_text(encoding="utf8"))
        self.assertEqual(len(se), 115)
        self.assertLessEqual(len(ents["sets"]), 20)
        self.assertTrue(all(e["cast"] for e in se.values()))

    def test_he_is_not_in_frame_before_the_temple(self):
        scenes = json.loads((ROOT / "data/scenes.json").read_text(encoding="utf8"))
        se = json.loads((ROOT / "data/scene_entities.json").read_text(encoding="utf8"))
        faces = sorted(s["src"] for s in scenes if se[s["c"]].get("krishna") == "face")
        self.assertEqual(faces[0], "E06-18")
        self.assertTrue(all(f.startswith(("E06", "E07")) for f in faces))

    def test_decisions_are_left_for_a_person(self):
        dec = json.loads((ROOT / "data/entity_decisions.json").read_text(encoding="utf8"))
        self.assertGreaterEqual(len(dec), 3)
        self.assertTrue(all(d["recommend"] and d["alternative"] for d in dec))

    def test_the_two_shores_are_two_places(self):
        """Settled by the director: the Ocean of Milk is the Churning's, the shore at Dvārakā is Dvāpara Yuga."""
        scenes = json.loads((ROOT / "data/scenes.json").read_text(encoding="utf8"))
        se = json.loads((ROOT / "data/scene_entities.json").read_text(encoding="utf8"))
        for s in scenes:
            e = se[s["c"]]
            places = [e["set"]] + [a.split("/")[0] for a in e.get("also", [])]
            self.assertFalse("milk_ocean" in places and "dvaraka_shore" in places, s["src"])
            if e["set"] == "milk_ocean":
                self.assertIn(s["ev"], (1, 2), s["src"])
            if e["set"] == "dvaraka_shore":
                self.assertIn(s["ev"], (4, 7), s["src"])


class Bridge(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.proj = make_project(self.tmp)
        self.b = dcc_bridge.Bridge(self.proj)
        self.sid = next(iter(self.b.shots))
        self.rev = self.b.shots[self.sid][1]["rev"]

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_reads_the_spec(self):
        s = self.b.summary()
        self.assertEqual(s["shots"], 10)
        self.assertEqual(s["sets"], ["dvaraka_city"])

    def test_takes_status(self):
        r = self.b.report(dict(shot_id=self.sid, app="blender", status="rendered", files=dict(block="renders/a.png"),
                               shot_rev=self.rev))
        self.assertEqual((r["version"], r["status"]), (1, "rendered"))
        r2 = self.b.report(dict(shot_id=self.sid, app="blender", status="rendered", shot_rev=self.rev))
        self.assertEqual(r2["version"], 2)
        status = json.loads((self.proj / "status.json").read_text())
        self.assertEqual([x["version"] for x in status["reports"]], [2])

    def test_refuses_structure(self):
        for key, val in (("camera", {"lens_mm": 50}), ("cast", ["rukmini"]), ("duration_s", 3), ("set", "x/y")):
            with self.assertRaises(dcc_bridge.Refused) as cm:
                self.b.report({"shot_id": self.sid, "app": "blender", "status": "rendered", key: val})
            self.assertIn("board’s to say", str(cm.exception))
        self.assertEqual(self.b.ledger["reports"], [])

    def test_refuses_unknown_shot_and_app(self):
        with self.assertRaises(dcc_bridge.Refused):
            self.b.report(dict(shot_id="S-000_zzzzz", app="blender", status="rendered"))
        with self.assertRaises(dcc_bridge.Refused):
            self.b.report(dict(shot_id=self.sid, app="maya", status="rendered"))

    def test_marks_work_from_a_changed_shot_as_stale(self):
        r = self.b.report(dict(shot_id=self.sid, app="blender", status="rendered", shot_rev="000000"))
        self.assertEqual(r["status"], "stale")

    def test_ingest_is_all_or_nothing(self):
        good = dict(shot_id=self.sid, app="blender", status="rendered")
        bad = dict(shot_id=self.sid, app="blender", status="rendered", lens_mm=50)
        f = self.proj / "r.json"
        f.write_text(json.dumps(dict(reports=[good, bad])))
        with self.assertRaises(dcc_bridge.Refused):
            self.b.ingest(f)
        self.assertEqual(self.b.ledger["reports"], [])

    def test_unbuilt_adapters_say_so(self):
        for app in ("houdini", "nuke", "unreal"):
            with self.assertRaises(dcc_bridge.Refused) as cm:
                self.b.generate(app)
            self.assertIn("not built yet", str(cm.exception))

    def test_speaks_mcp(self):
        msgs = [dict(jsonrpc="2.0", id=1, method="initialize", params=dict(protocolVersion="2025-06-18")),
                dict(jsonrpc="2.0", method="notifications/initialized"),
                dict(jsonrpc="2.0", id=2, method="tools/list"),
                dict(jsonrpc="2.0", id=3, method="tools/call", params=dict(name="get_shot", arguments=dict(shot_id=self.sid))),
                dict(jsonrpc="2.0", id=4, method="tools/call", params=dict(name="report", arguments=dict(
                    shot_id=self.sid, app="blender", status="rendered", camera=dict(lens_mm=50))))]
        r = subprocess.run([sys.executable, "pipeline/dcc_bridge.py", "serve", "--project", str(self.proj)], cwd=ROOT,
                           input="\n".join(json.dumps(m) for m in msgs) + "\n", capture_output=True, text=True)
        out = [json.loads(x) for x in r.stdout.strip().splitlines()]
        self.assertEqual([o["id"] for o in out], [1, 2, 3, 4])
        self.assertEqual(out[0]["result"]["serverInfo"]["name"], "dcc-bridge")
        self.assertIn("report", [t["name"] for t in out[1]["result"]["tools"]])
        self.assertEqual(json.loads(out[2]["result"]["content"][0]["text"])["shot"]["id"], self.sid)
        self.assertTrue(out[3]["result"]["isError"])


@unittest.skipUnless(HAVE_BPY, "the bpy module is not installed")
class Blocking(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import blender_blocking
        cls.B = blender_blocking
        cls.tmp = tempfile.mkdtemp()
        cls.proj = make_project(cls.tmp)
        cls.spec = json.loads((cls.proj / "shotspec.json").read_text(encoding="utf8"))

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp)

    def build(self, spec=None):
        spec = spec or self.spec
        return self.B.build_scene(spec["scenes"][0], spec)

    def test_one_camera_per_shot_with_its_lens(self):
        scene, cams = self.build()
        shots = self.spec["scenes"][0]["shots"]
        self.assertEqual(len(cams), len(shots))
        for sh, cam, f0, f1 in cams:
            self.assertEqual(cam.data.lens, sh["camera"]["lens_mm"])
            self.assertEqual(cam["shot_id"], sh["id"])

    def test_the_timeline_is_the_scene(self):
        scene, cams = self.build()
        sc = self.spec["scenes"][0]
        self.assertEqual(scene.frame_end, round(sc["duration_s"] * self.spec["fps"]))
        marks = sorted(scene.timeline_markers, key=lambda m: m.frame)
        self.assertEqual([m.name for m in marks], [sh["id"] for sh in sc["shots"]])
        self.assertTrue(all(m.camera is not None for m in marks))
        self.assertEqual(cams[0][2], 1)
        for (_, _, _, f1), (_, _, g0, _) in zip(cams, cams[1:]):
            self.assertEqual(g0, f1 + 1)

    def test_cameras_keep_one_side_of_the_line(self):
        scene, cams = self.build()
        for sh, cam, _, _ in cams:
            if sh["kind"] not in ("POV", "OVER", "OTS"):
                self.assertLess(cam.location.y, 0, sh["id"])

    def test_the_withheld_man_is_only_in_the_shots_that_name_him(self):
        import bpy
        scene, cams = self.build()
        root = bpy.data.objects["CH_krishna"]
        self.assertEqual(root["withheld"], "hands")
        bpy.context.window.scene = scene
        for sh, cam, f0, f1 in cams:
            scene.frame_set(f0)
            self.assertEqual(root.hide_render, "krishna" not in sh["cast"], sh["id"])

    def test_regenerating_follows_the_board_and_keeps_nothing_made_by_hand(self):
        import bpy
        scene, cams = self.build()
        stray = bpy.data.objects.new("made_by_hand", None)
        scene.collection.objects.link(stray)
        cams[0][1].data.lens = 200                     # an artist's tweak inside Blender
        spec = json.loads(json.dumps(self.spec))
        spec["scenes"][0]["shots"][1]["camera"]["lens_mm"] = 135   # a decision made on the board
        scene2, cams2 = self.build(spec)
        self.assertNotIn("made_by_hand", [o.name for o in scene2.collection.all_objects])
        self.assertEqual(cams2[0][1].data.lens, spec["scenes"][0]["shots"][0]["camera"]["lens_mm"])
        self.assertEqual(cams2[1][1].data.lens, 135)
        self.assertEqual(len([s for s in bpy.data.scenes if s.name.startswith("S719")]), 1)

    def test_a_full_run_reports_within_the_rule(self):
        out = pathlib.Path(self.tmp) / "run"
        reports = self.B.run(str(self.proj / "shotspec.json"), str(out), size=(210, 90))
        self.assertEqual(len(reports), 10)
        for r in reports:
            self.assertEqual(dcc_bridge.check_report(r), [])
            self.assertEqual(r["status"], "rendered")
            for k in ("block", "depth", "id"):
                self.assertTrue((out / r["files"][k]).exists(), r["files"][k])
        self.assertTrue((out / "contact.html").exists())
        again = self.B.run(str(self.proj / "shotspec.json"), str(out), size=(210, 90))
        self.assertEqual({r["version"] for r in again}, {2})
        self.assertTrue((out / reports[0]["files"]["block"]).exists(), "v1 is kept beside v2")
        shutil.copy(self.proj / "shotspec.json", out / "shotspec.json")
        took = dcc_bridge.Bridge(out).ingest(out / "report.json")
        self.assertEqual(len(took), 10)


class Comfy(unittest.TestCase):
    """The runner against a stand-in ComfyUI: the plumbing, not the picture."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.proj = make_project(self.tmp)
        b = dcc_bridge.Bridge(self.proj)
        (self.proj / "renders").mkdir()
        for sid, (_, sh) in b.shots.items():
            (self.proj / "renders" / f"{sid}_depth_v001.png").write_bytes(PNG)
            b.report(dict(shot_id=sid, app="blender", status="rendered", shot_rev=sh["rev"],
                          files=dict(block=f"renders/{sid}_block_v001.png", depth=f"renders/{sid}_depth_v001.png")))
        self.gen = b.generate("comfyui")
        seen = self.seen = dict(prompts=[], uploads=0)

        class H(http.server.BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _json(self, d):
                body = json.dumps(d).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_POST(self):
                data = self.rfile.read(int(self.headers["Content-Length"]))
                if self.path == "/upload/image":
                    seen["uploads"] += 1
                    self._json(dict(name="depth_%d.png" % seen["uploads"], subfolder="", type="input"))
                else:
                    seen["prompts"].append(json.loads(data)["prompt"])
                    self._json(dict(prompt_id="p%d" % len(seen["prompts"])))

            def do_GET(self):
                if self.path.startswith("/history/"):
                    pid = self.path.split("/")[-1]
                    self._json({pid: dict(status=dict(status_str="success", completed=True),
                                          outputs={"7": dict(images=[dict(filename="x.png", subfolder="", type="output")])})})
                else:
                    self.send_response(200)
                    self.send_header("Content-Type", "image/png")
                    self.send_header("Content-Length", str(len(PNG)))
                    self.end_headers()
                    self.wfile.write(PNG)

        self.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        self.server = "127.0.0.1:%d" % self.srv.server_address[1]

    def tearDown(self):
        self.srv.shutdown()
        shutil.rmtree(self.tmp)

    def run_comfy(self, *extra):
        import run_comfy
        return run_comfy.main([str(self.proj), "--server", self.server, "--checkpoint", "ck.safetensors",
                               "--controlnet", "depth.safetensors", *extra])

    def test_jobs_are_held_to_the_blocking(self):
        self.assertEqual(self.gen["jobs"], 10)
        jobs = json.loads((self.proj / "comfy_jobs.json").read_text())["jobs_list"]
        self.assertTrue(all(j["control"]["depth"].endswith("_depth_v001.png") for j in jobs))
        self.assertTrue(all("--" not in j["prompt"] for j in jobs), "Midjourney flags are taken off")

    def test_run_report_ingest(self):
        self.assertEqual(self.run_comfy("--only", *list(dcc_bridge.Bridge(self.proj).shots)[:3]), 0)
        self.assertEqual((self.seen["uploads"], len(self.seen["prompts"])), (3, 3))
        g = self.seen["prompts"][0]
        kinds = {n["class_type"]: n["inputs"] for n in g.values()}
        self.assertEqual(kinds["ControlNetLoader"]["control_net_name"], "depth.safetensors")
        self.assertEqual(kinds["LoadImage"]["image"], "depth_1.png")
        self.assertEqual((kinds["EmptyLatentImage"]["width"], kinds["EmptyLatentImage"]["height"]), (1680, 720))
        rep = json.loads((self.proj / "comfy_report.json").read_text())["reports"]
        self.assertTrue(all(dcc_bridge.check_report(r) == [] for r in rep))
        self.assertTrue(all((self.proj / r["files"]["render"]).exists() for r in rep))
        self.assertEqual(rep[0]["params"]["seed"], kinds["KSampler"]["seed"])
        b = dcc_bridge.Bridge(self.proj)
        b.ingest(self.proj / "comfy_report.json")
        self.assertEqual(b.status()["comfyui"]["rendered"], 3)

    def test_same_shot_same_seed_and_a_reroll_is_a_new_version(self):
        sid = next(iter(dcc_bridge.Bridge(self.proj).shots))
        self.run_comfy("--only", sid)
        first = json.loads((self.proj / "comfy_report.json").read_text())["reports"][0]
        self.run_comfy("--only", sid, "--reroll")
        self.run_comfy("--only", sid)                  # without --reroll a shot that has a picture is left alone
        both = json.loads((self.proj / "comfy_report.json").read_text())["reports"]
        self.assertEqual([r["version"] for r in both], [1, 2])
        second = both[1]
        self.assertEqual(second["params"]["seed"], first["params"]["seed"] + 1)
        jobs = json.loads((self.proj / "comfy_jobs.json").read_text())["jobs_list"]
        self.assertEqual(first["params"]["seed"], next(j["seed"] for j in jobs if j["shot_id"] == sid))

    def test_a_withheld_face_is_kept_out_of_the_prompt(self):
        import run_comfy
        jobs = json.loads((self.proj / "comfy_jobs.json").read_text())["jobs_list"]
        job = next(j for j in jobs if j["withheld"])
        wf = json.loads((ROOT / "comfy/workflows/sdxl_controlnet_depth.json").read_text())
        g = run_comfy.fill(wf, job, "d.png", "c", "n", 1)
        self.assertIn("face visible", g["3"]["inputs"]["text"])


if __name__ == "__main__":
    unittest.main()
