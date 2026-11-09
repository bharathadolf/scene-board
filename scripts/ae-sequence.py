#!/usr/bin/env python3
"""Turn approved shots + checked images into an After Effects shot sequence.

This is the export half of the board's picture loop:

    shots  ->  Midjourney prompt  ->  image uploaded  ->  checked  ->  approved
                                                                        |
                                                  this script  <--------+
                                                        |
                                 <scene>.jsx  +  images/  +  manifest.json  (+ animatic.mp4)

What it does
  * takes the scene's shots exactly as the board holds them (db collection
    "scenes"), keeping only approved shots and, for each one, the image the
    check chose (chk.best) or the single image if there was no check;
  * lays those shots out over the scene's real runtime — reusing the
    screenplay's own timecodes when its shot list has the same number of
    shots, otherwise weighting each shot by its type (a WIDE holds longer
    than an INSERT);
  * reads the screenplay (Fountain) for dialogue and audio cues and places
    them by their own timecodes, so they stay right even when the screenplay
    breaks the scene into a different number of shots than the board does;
  * writes an ExtendScript .js that builds the comp in After Effects:
    one layer per shot, fit to frame, with a move chosen from the shot type,
    cross-dissolves, shot markers, audio-cue markers, dialogue as guide
    subtitles and an optional slate;
  * optionally renders a reference animatic here with ffmpeg, so the timing
    can be watched before After Effects is opened.

Image paths: the .js resolves images relative to its own location, so the
folder it sits in can be copied or moved anywhere and still import. Nothing
is hard-coded to this container.

Usage
  python3 scripts/ae-sequence.py --scene S-719 \
      --db out/db/scenes/S-719.json \
      --images out/S-719/images \
      --screenplay "…/001 - E04-07 - …/screenplay.fountain" \
      --shotlist   "…/001 - E04-07 - …/shots.json" \
      --out out/S-719 --animatic

  Several scenes at once (one comp each, plus a master comp that nests them
  in the order given):
  python3 scripts/ae-sequence.py --batch batch.json --out out/movement-I --master "Movement I"
"""
import argparse
import json
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# How long each kind of shot wants to hold, relative to the others.
WEIGHT = {
    "EWS": 1.5, "WIDE": 1.4, "WS": 1.4, "ESTABLISHING": 1.5,
    "POV": 1.2, "TRACKING": 1.2, "DOLLY": 1.2, "CRANE": 1.3, "AERIAL": 1.4,
    "OVER": 1.1, "OTS": 1.1, "TWO-SHOT": 1.1, "MS": 1.0, "MEDIUM": 1.0,
    "CLOSE": 1.0, "CU": 1.0, "MCU": 1.0, "ECU": 0.9,
    "INSERT": 0.7, "MACRO": 0.7, "DETAIL": 0.7, "CUTAWAY": 0.8,
}
# The camera move each kind of shot gets: (scale start, scale end, x drift px, y drift px)
MOVE = {
    "EWS": (106, 113, 0, 0), "WIDE": (106, 113, 0, 0), "WS": (106, 113, 0, 0),
    "POV": (104, 112, 0, 0), "AERIAL": (108, 100, 0, 0),
    "TRACKING": (112, 112, -70, 0), "DOLLY": (105, 115, 0, 0),
    "OVER": (108, 112, 26, 0), "OTS": (108, 112, 26, 0),
    "CLOSE": (110, 116, 0, -10), "CU": (110, 116, 0, -10), "MCU": (109, 115, 0, -8),
    "ECU": (112, 118, 0, 0), "MS": (107, 113, 0, 0),
    "INSERT": (112, 106, 18, 8), "MACRO": (112, 106, 18, 8), "DETAIL": (112, 106, 18, 8),
}
DEFAULT_MOVE = (107, 113, 0, 0)


def shot_kind(t):
    """Normalise a shot-type label to a key in the tables above."""
    if not t:
        return ""
    first = re.split(r"[^A-Za-z-]+", str(t).strip().upper())
    for w in first:
        if w in WEIGHT or w in MOVE:
            return w
    return first[0] if first and first[0] else ""


def tc_to_sec(tc):
    """'01:26' or '00:01:26' -> seconds."""
    if tc is None:
        return None
    parts = str(tc).strip().split(":")
    try:
        nums = [float(p) for p in parts]
    except ValueError:
        return None
    if len(nums) == 1:
        return nums[0]
    if len(nums) == 2:
        return nums[0] * 60 + nums[1]
    return nums[0] * 3600 + nums[1] * 60 + nums[2]


def pick_image(shot):
    """The image this shot should use: the one the check chose, else the only one.

    Returns (asset_id, why) or (None, why-not).
    """
    imgs = shot.get("imgs") or []
    if not imgs:
        return None, "no image uploaded"
    chk = shot.get("chk") or {}
    best = chk.get("best")
    per = chk.get("per") or []
    if isinstance(best, int) and best >= 0 and best < len(imgs):
        return imgs[best].get("id"), f"checked: image {best + 1} of {len(imgs)} chosen"
    if isinstance(best, int) and best < 0:
        return None, "checked: none of the images fit the shot"
    oks = [p.get("i") for p in per if p.get("ok") and isinstance(p.get("i"), int)]
    if oks and oks[0] < len(imgs):
        return imgs[oks[0]].get("id"), f"checked: image {oks[0] + 1} passed"
    if len(imgs) == 1:
        return imgs[0].get("id"), "one image, not checked"
    return imgs[0].get("id"), f"{len(imgs)} images, not checked — first used"


def parse_fountain(text):
    """Pull the scene's sluglines and dialogue out of a Fountain file."""
    lines = text.splitlines()
    slugs, dialogue = [], []
    i = 0
    cue = re.compile(r"^([A-Z][A-Z0-9ĀĪŪṚṄÑṬḌṆŚṢ' .\-]{1,38})(\s*\(.*\))?$")
    while i < len(lines):
        ln = lines[i].rstrip()
        if re.match(r"^(INT\.|EXT\.|INT/EXT|I/E)", ln):
            slugs.append(ln.strip())
        m = cue.match(ln.strip()) if ln.strip() else None
        if m and i + 1 < len(lines) and lines[i + 1].strip():
            who = m.group(1).strip()
            if who in ("FADE IN", "FADE OUT", "CUT TO", "THE END") or who.endswith(":"):
                i += 1
                continue
            j, paren, said = i + 1, "", []
            while j < len(lines) and lines[j].strip():
                s = lines[j].strip()
                if s.startswith("(") and s.endswith(")") and not said:
                    paren = s
                else:
                    said.append(s)
                j += 1
            if said:
                dialogue.append({"who": who, "paren": paren, "text": " ".join(said)})
            i = j
            continue
        i += 1
    return slugs, dialogue


def layout(shots, total, screenplay_shots):
    """Give every shot a start and a duration inside `total` seconds."""
    # If the screenplay breaks the scene into the same number of shots, trust its clock.
    if screenplay_shots and len(screenplay_shots) == len(shots):
        out, ok = [], True
        for sp in screenplay_shots:
            a, b = tc_to_sec(sp.get("timecode_start")), tc_to_sec(sp.get("timecode_end"))
            d = sp.get("duration")
            if a is None or (b is None and not d):
                ok = False
                break
            out.append((a, (b - a) if b is not None else float(d)))
        if ok:
            return out, "screenplay timecodes (shot counts match)"
    ws = [WEIGHT.get(shot_kind(s.get("t")), 1.0) for s in shots]
    tot = sum(ws) or 1.0
    durs = [max(1.5, total * w / tot) for w in ws]
    scale = total / sum(durs)
    durs = [d * scale for d in durs]
    at, out = 0.0, []
    for d in durs:
        out.append((at, d))
        at += d
    return out, f"weighted by shot type across {total:g}s"


JSX = r"""/* %(title)s
 * Built by scripts/ae-sequence.py from the scene board — do not hand-edit;
 * re-run the exporter instead. Images are resolved relative to this file,
 * so this folder can live anywhere.
 *
 * After Effects -> File -> Scripts -> Run Script File… -> this file.
 */
#target aftereffects

(function () {
  // ---- what the exporter decided -------------------------------------------
  var CONF = %(conf)s;
  var SHOTS = %(shots)s;
  var CUES  = %(cues)s;
  var LINES = %(lines)s;

  var HERE = (new File($.fileName)).parent;      // the folder this .jsx sits in
  var IMG  = new Folder(HERE.fsName + "/" + CONF.imageDir);

  function log(s) { $.writeln(s); }
  function fail(s) { alert("Scene sequence: " + s); }

  if (!IMG.exists) { fail("image folder not found next to this script:\n" + IMG.fsName); return; }

  app.beginUndoGroup("Build " + CONF.name);

  // ---- the comp ------------------------------------------------------------
  var comp = app.project.items.addComp(CONF.name, CONF.width, CONF.height, 1.0,
                                       Math.max(CONF.duration, 1), CONF.fps);
  comp.bgColor = [0, 0, 0];

  var folder = app.project.items.addFolder(CONF.name + " · footage");
  var missing = [];

  function ease(prop, kIn, kOut) {
    try {
      var e = new KeyframeEase(0, 55);
      prop.setTemporalEaseAtKey(kIn, [e], [e]);
      prop.setTemporalEaseAtKey(kOut, [e], [e]);
    } catch (e) {}
  }

  // ---- one layer per shot --------------------------------------------------
  for (var i = 0; i < SHOTS.length; i++) {
    var s = SHOTS[i];
    var lay, f = new File(IMG.fsName + "/" + s.file);

    if (s.file && f.exists) {
      var io = new ImportOptions(f);
      var item = app.project.importFile(io);
      item.parentFolder = folder;
      item.name = s.label;
      lay = comp.layers.add(item);
    } else {
      missing.push(s.label + (s.file ? "  (" + s.file + ")" : "  (no image)"));
      lay = comp.layers.addSolid([0.18, 0.05, 0.05], s.label + " — NO IMAGE",
                                 CONF.width, CONF.height, 1.0);
    }

    lay.startTime = s.at;
    lay.inPoint = s.at;
    lay.outPoint = s.at + s.dur;
    lay.label = (i %% 15) + 1;

    // fit to frame, then the move
    var w = lay.source ? lay.source.width : CONF.width;
    var h = lay.source ? lay.source.height : CONF.height;
    var fit = Math.max(CONF.width / w, CONF.height / h) * 100;
    var sc = lay.property("Transform").property("Scale");
    var ps = lay.property("Transform").property("Position");
    var cx = CONF.width / 2, cy = CONF.height / 2;

    sc.setValueAtTime(s.at, [fit * s.z0 / 100, fit * s.z0 / 100]);
    sc.setValueAtTime(s.at + s.dur, [fit * s.z1 / 100, fit * s.z1 / 100]);
    ease(sc, 1, 2);
    if (s.dx || s.dy) {
      ps.setValueAtTime(s.at, [cx - s.dx / 2, cy - s.dy / 2]);
      ps.setValueAtTime(s.at + s.dur, [cx + s.dx / 2, cy + s.dy / 2]);
      ease(ps, 1, 2);
    } else {
      ps.setValue([cx, cy]);
    }

    // cross-dissolve in, and out of the last shot
    var op = lay.property("Transform").property("Opacity");
    var d = CONF.dissolve;
    if (i === 0) {
      op.setValueAtTime(s.at, 0); op.setValueAtTime(s.at + d, 100);
    } else {
      op.setValueAtTime(s.at, 0); op.setValueAtTime(s.at + d, 100);
    }
    if (i === SHOTS.length - 1 && CONF.fadeOut > 0) {
      op.setValueAtTime(s.at + s.dur - CONF.fadeOut, 100);
      op.setValueAtTime(s.at + s.dur, 0);
    }

    // the shot's own marker, carrying everything the board knows about it
    var mk = new MarkerValue(s.label);
    mk.comment = s.text;
    if (s.mj) mk.comment += "\n\nPROMPT: " + s.mj;
    if (s.why) mk.comment += "\n\nIMAGE: " + s.why;
    lay.property("Marker").setValueAtTime(s.at + Math.min(0.2, s.dur / 4), mk);
  }

  // ---- audio cues and dialogue, on the screenplay's own clock --------------
  for (var c = 0; c < CUES.length; c++) {
    var cm = new MarkerValue(CUES[c].label);
    cm.comment = CUES[c].text;
    cm.duration = CUES[c].dur || 0;
    comp.markerProperty.setValueAtTime(Math.min(CUES[c].at, comp.duration - 0.04), cm);
  }

  if (CONF.subtitles && LINES.length) {
    for (var l = 0; l < LINES.length; l++) {
      var t = comp.layers.addText(LINES[l].text);
      var td = t.property("Source Text").value;
      td.resetCharStyle();
      td.fontSize = Math.round(CONF.height * 0.038);
      td.fillColor = [1, 1, 1];
      td.applyFill = true;
      td.applyStroke = false;
      td.justification = ParagraphJustification.CENTER_JUSTIFY;
      t.property("Source Text").setValue(td);
      t.property("Transform").property("Position").setValue(
        [CONF.width / 2, CONF.height - Math.round(CONF.height * 0.09)]);
      t.name = "DLG · " + LINES[l].who;
      t.inPoint = LINES[l].at;
      t.outPoint = LINES[l].at + LINES[l].dur;
      t.guideLayer = true;
      t.label = 11;
    }
  }

  // ---- slate -------------------------------------------------------------
  if (CONF.slate) {
    var sl = comp.layers.addText(CONF.slateText);
    var sd = sl.property("Source Text").value;
    sd.resetCharStyle();
    sd.fontSize = Math.round(CONF.height * 0.03);
    sd.fillColor = [1, 0.85, 0.3];
    sd.applyFill = true;
    sd.justification = ParagraphJustification.LEFT_JUSTIFY;
    sl.property("Source Text").setValue(sd);
    sl.property("Transform").property("Position").setValue(
      [Math.round(CONF.width * 0.035), Math.round(CONF.height * 0.1)]);
    sl.name = "SLATE";
    sl.guideLayer = true;
    sl.moveToBeginning();
    sl.label = 14;
  }

  // ---- a grade slot, left empty on purpose --------------------------------
  var adj = comp.layers.addSolid([1, 1, 1], "GRADE (add effects here)",
                                 CONF.width, CONF.height, 1.0);
  adj.adjustmentLayer = true;
  adj.moveToBeginning();
  adj.enabled = false;
  adj.label = 9;

  comp.openInViewer();
  app.endUndoGroup();

  var msg = CONF.name + "\n" + SHOTS.length + " shots · "
          + (Math.round(CONF.duration * 10) / 10) + "s · " + CONF.fps + " fps";
  if (missing.length) msg += "\n\nNo image for:\n" + missing.join("\n");
  log(msg);
  if (CONF.quiet !== true) alert(msg);
})();
"""

MASTER_JSX = r"""/* %(title)s — master comp
 * Nests the scene comps this export built, in board order.
 */
#target aftereffects
(function () {
  var NAMES = %(names)s;
  var MASTER = %(master)s;
  function findComp(n) {
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem && it.name === n) return it;
    }
    return null;
  }
  var found = [], total = 0, w = 0, h = 0, fps = 24;
  for (var i = 0; i < NAMES.length; i++) {
    var c = findComp(NAMES[i]);
    if (!c) { alert("Run the scene scripts first — missing comp:\n" + NAMES[i]); return; }
    found.push(c); total += c.duration; w = c.width; h = c.height; fps = 1 / c.frameDuration;
  }
  app.beginUndoGroup("Build " + MASTER);
  var m = app.project.items.addComp(MASTER, w, h, 1.0, Math.max(total, 1), fps);
  var at = 0;
  for (var j = 0; j < found.length; j++) {
    var l = m.layers.add(found[j]);
    l.startTime = at;
    l.inPoint = at;
    l.outPoint = at + found[j].duration;
    var mk = new MarkerValue(found[j].name);
    m.markerProperty.setValueAtTime(at + 0.001, mk);
    at += found[j].duration;
  }
  m.openInViewer();
  app.endUndoGroup();
  alert(MASTER + "\n" + found.length + " scenes · " + (Math.round(total * 10) / 10) + "s");
})();
"""


def build_scene(cfg):
    """Build one scene's images folder, .jsx and manifest. Returns the manifest."""
    code = cfg["scene"]
    doc = json.loads(pathlib.Path(cfg["db"]).read_text(encoding="utf8"))
    doc = doc.get("data", doc)
    shots_all = doc.get("shots") or []
    out = pathlib.Path(cfg["out"])
    imgdir = out / "images"
    out.mkdir(parents=True, exist_ok=True)
    imgdir.mkdir(parents=True, exist_ok=True)

    meta = cfg.get("meta") or {}
    title = meta.get("title") or code
    total = float(cfg.get("duration") or meta.get("duration_seconds") or 0)

    sp_slugs, sp_lines, sp_shots = [], [], []
    if cfg.get("screenplay"):
        sp_slugs, sp_lines = parse_fountain(
            pathlib.Path(cfg["screenplay"]).read_text(encoding="utf8"))
    if cfg.get("shotlist"):
        sl = json.loads(pathlib.Path(cfg["shotlist"]).read_text(encoding="utf8"))
        sp_shots = sl.get("shots") or []
        total = total or float(sl.get("duration_seconds") or 0)
        title = meta.get("title") or sl.get("title") or title
    total = total or 90.0

    # approved shots only — the picture loop ends at approval
    keep = [s for s in shots_all if s.get("a")] if not cfg.get("all_shots") else shots_all[:]
    skipped = [(i + 1, "not approved") for i, s in enumerate(shots_all)
               if not s.get("a") and not cfg.get("all_shots")]
    if not keep:
        raise SystemExit(f"{code}: no approved shots — approve shots on the board first")

    times, how = layout(keep, total, sp_shots)

    src = pathlib.Path(cfg["images"])
    jshots, man_shots = [], []
    for n, (s, (at, dur)) in enumerate(zip(keep, times), 1):
        kind = shot_kind(s.get("t"))
        aid, why = pick_image(s)
        fname = ""
        if aid:
            found = sorted(src.glob(aid + "*"))
            if found:
                ext = found[0].suffix or ".png"
                fname = f"{n:02d}_{(kind or 'SHOT')}_{aid[:8]}{ext}"
                tgt = imgdir / fname
                if found[0].resolve() != tgt.resolve():
                    shutil.copy2(found[0], tgt)
            else:
                why += " — file not downloaded"
        z0, z1, dx, dy = MOVE.get(kind, DEFAULT_MOVE)
        label = f"{n:02d} · {s.get('t') or 'SHOT'}"
        jshots.append({"label": label, "file": fname, "at": round(at, 3),
                       "dur": round(dur, 3), "z0": z0, "z1": z1, "dx": dx, "dy": dy,
                       "text": (s.get("x") or "").strip(),
                       "mj": (s.get("mj") or "").strip(), "why": why})
        man_shots.append({"n": n, "type": s.get("t"), "kind": kind,
                          "at": round(at, 3), "dur": round(dur, 3),
                          "image_asset": aid, "image_file": fname, "image_choice": why,
                          "text": (s.get("x") or "").strip(),
                          "approved": bool(s.get("a")),
                          "prompt_approved": bool(s.get("ma"))})

    # audio cues and dialogue keep the screenplay's own clock
    cues, lines = [], []
    for sp in sp_shots:
        at = tc_to_sec(sp.get("timecode_start"))
        if at is None:
            continue
        bits = []
        if sp.get("type") or sp.get("lens") or sp.get("angle"):
            bits.append(" · ".join(x for x in [sp.get("type"), sp.get("lens"),
                                               sp.get("angle")] if x))
        if sp.get("audio_cues"):
            bits.append("SOUND: " + sp["audio_cues"])
        if sp.get("vfx") and sp["vfx"].lower() not in ("none.", "none"):
            bits.append("VFX: " + sp["vfx"])
        cues.append({"at": round(at, 3), "label": f"sp {sp.get('shot_number')}",
                     "dur": round(float(sp.get("duration") or 0), 3),
                     "text": "\n".join(bits)})
        dlg = sp.get("dialogue")
        if dlg:
            end = tc_to_sec(sp.get("timecode_end"))
            lines.append({"at": round(at, 3),
                          "dur": round((end - at) if end else 3.0, 3),
                          "who": str(dlg).split(":")[0][:24],
                          "text": re.sub(r"\s+", " ", str(dlg)).strip()})
    if not lines and sp_lines:          # no timecoded dialogue: spread the script's lines
        span = total / max(len(sp_lines), 1)
        for i, d in enumerate(sp_lines):
            lines.append({"at": round(i * span, 3), "dur": round(min(span, 4.0), 3),
                          "who": d["who"], "text": d["text"]})

    name = f"{code} · {title}"
    conf = {
        "name": name, "imageDir": "images",
        "width": int(cfg.get("width") or 1680), "height": int(cfg.get("height") or 720),
        "fps": float(cfg.get("fps") or 24),
        "duration": round(sum(s["dur"] for s in jshots), 3),
        "dissolve": float(cfg.get("dissolve") or 0.5),
        "fadeOut": float(cfg.get("fade_out") or 1.0),
        "subtitles": not cfg.get("no_subtitles"),
        "slate": not cfg.get("no_slate"),
        "slateText": f"{code}  ·  {title}\n{meta.get('movement') or ''}\n"
                     f"{len(jshots)} shots  ·  {how}",
        "quiet": bool(cfg.get("quiet")),
    }
    jsx = JSX % {"title": name, "conf": json.dumps(conf, ensure_ascii=False, indent=2),
                 "shots": json.dumps(jshots, ensure_ascii=False, indent=2),
                 "cues": json.dumps(cues, ensure_ascii=False, indent=2),
                 "lines": json.dumps(lines, ensure_ascii=False, indent=2)}
    (out / f"{code}.js").write_text(jsx, encoding="utf8")

    # if the download folder is the output folder, leave only the ordered copies
    if src.resolve() == imgdir.resolve():
        keepnames = {s["file"] for s in jshots if s["file"]}
        for f in imgdir.iterdir():
            if f.is_file() and f.name not in keepnames and re.fullmatch(r"[0-9a-f]{32}\..+", f.name):
                f.unlink()

    man = {"scene": code, "title": title, "comp": name,
           "runtime_seconds": conf["duration"], "fps": conf["fps"],
           "frame": [conf["width"], conf["height"]],
           "timing": how, "shots_total": len(shots_all), "shots_used": len(jshots),
           "shots_skipped": skipped, "sluglines": sp_slugs,
           "dialogue": lines, "cues": cues, "shots": man_shots,
           "images_from": str(src), "script": f"{code}.js"}
    (out / "manifest.json").write_text(
        json.dumps(man, ensure_ascii=False, indent=1), encoding="utf8")
    return man


def animatic(man, out):
    """Render a reference animatic with ffmpeg, so timing can be checked here."""
    if not shutil.which("ffmpeg"):
        return None
    out = pathlib.Path(out)
    imgs = out / "images"
    lst = out / "animatic.txt"
    rows = []
    for s in man["shots"]:
        f = s.get("image_file")
        if not f or not (imgs / f).exists():
            continue
        rows.append(f"file '{(imgs / f).resolve()}'\nduration {s['dur']:.3f}")
    if not rows:
        return None
    last = [s for s in man["shots"] if s.get("image_file")][-1]["image_file"]
    lst.write_text("\n".join(rows) + f"\nfile '{(imgs / last).resolve()}'\n", encoding="utf8")
    mp4 = out / f"{man['scene']}_animatic.mp4"
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
           "-vf", f"scale={man['frame'][0]}:{man['frame'][1]}:force_original_aspect_ratio=increase,"
                  f"crop={man['frame'][0]}:{man['frame'][1]},fps={man['fps']:g}",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", str(mp4)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    lst.unlink(missing_ok=True)
    return str(mp4) if r.returncode == 0 else None


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--scene", help="scene id as the board holds it, e.g. S-719")
    p.add_argument("--db", help="the scene's document from the boards database (JSON)")
    p.add_argument("--images", help="folder holding the downloaded image assets")
    p.add_argument("--screenplay", help="the scene's Fountain file")
    p.add_argument("--shotlist", help="the scene's shots.json from the screenplay folder")
    p.add_argument("--batch", help="JSON list of scene configs, built in order")
    p.add_argument("--master", help="also write a master .jsx nesting the scene comps")
    p.add_argument("--out", required=True)
    p.add_argument("--duration", type=float, help="override the scene runtime in seconds")
    p.add_argument("--fps", type=float, default=24)
    p.add_argument("--width", type=int, default=1680)
    p.add_argument("--height", type=int, default=720)
    p.add_argument("--dissolve", type=float, default=0.5)
    p.add_argument("--fade-out", type=float, default=1.0)
    p.add_argument("--no-subtitles", action="store_true")
    p.add_argument("--no-slate", action="store_true")
    p.add_argument("--all-shots", action="store_true",
                   help="include shots that are not approved (default: approved only)")
    p.add_argument("--animatic", action="store_true", help="also render a reference mp4")
    a = p.parse_args()

    jobs = []
    if a.batch:
        jobs = json.loads(pathlib.Path(a.batch).read_text(encoding="utf8"))
    elif a.scene and a.db and a.images:
        jobs = [{"scene": a.scene, "db": a.db, "images": a.images,
                 "screenplay": a.screenplay, "shotlist": a.shotlist}]
    else:
        p.error("give --scene with --db and --images, or --batch")

    base = pathlib.Path(a.out)
    mans = []
    for j in jobs:
        cfg = dict(vars(a))
        cfg.update(j)
        cfg["out"] = str(base / j["scene"]) if len(jobs) > 1 else str(base)
        man = build_scene(cfg)
        if a.animatic:
            man["animatic"] = animatic(man, cfg["out"])
        mans.append(man)
        print(f"{man['scene']}: {man['shots_used']}/{man['shots_total']} shots · "
              f"{man['runtime_seconds']:g}s · {man['timing']} · "
              f"{cfg['out']}/{man['script']}" + (f" · {man.get('animatic')}"
                                              if man.get("animatic") else ""))

    if a.master and mans:
        jsx = MASTER_JSX % {"title": a.master,
                            "names": json.dumps([m["comp"] for m in mans], ensure_ascii=False),
                            "master": json.dumps(a.master, ensure_ascii=False)}
        mp = base / (re.sub(r"[^A-Za-z0-9]+", "_", a.master).strip("_") + "_master.js")
        mp.write_text(jsx, encoding="utf8")
        print(f"master: {mp} ({len(mans)} scenes, "
              f"{sum(m['runtime_seconds'] for m in mans):g}s)")


if __name__ == "__main__":
    sys.exit(main())
