#!/usr/bin/env python3
"""Write the After Effects templates, and a preview still of each layout.

Four layouts of the same cut, so one can be chosen before any of them is
wired into the board:

  clean    the picture full frame, nothing over it
  corners  a wider canvas, the picture centred in it, production data in the
           four corners, black surround
  paper    the same on white, dark text — for review documents and printing
  slate    the picture centred high with a wide margin and a bottom strip
           carrying everything, like a film slate

Each template is a complete ExtendScript. They read the same data block the
exporter writes, so a template can be swapped without re-exporting.

  python3 scripts/ae-templates.py --out out/templates --from out/S-719
"""
import argparse
import json
import pathlib
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- the templates
HEAD = '''/* %(name)s — template: %(tpl)s
 * %(blurb)s
 *
 * After Effects: File > Scripts > Run Script File... and choose this file.
 * The pictures are found next to this file, so this folder can be moved.
 * Every number below comes from the scene board; edit LOOK, not the data.
 */
#target aftereffects

(function () {
  var CONF  = %(conf)s;
  var SHOTS = %(shots)s;

  /* ---- the only part worth editing by hand ---- */
  var LOOK = %(look)s;

  var HERE = (new File($.fileName)).parent;
  var IMG  = new Folder(HERE.fsName + "/" + CONF.imageDir);
  if (!IMG.exists) { alert("Picture folder not found next to this script:\\n" + IMG.fsName); return; }

  function text(comp, body, size, colour, pos, just, lead) {
    var t = comp.layers.addText(body), d = t.property("Source Text").value;
    d.resetCharStyle();
    d.fontSize = size;
    d.fillColor = colour; d.applyFill = true;
    if (LOOK.stroke) {
      d.strokeColor = LOOK.strokeColour;
      d.strokeWidth = Math.max(1, Math.round(CONF.height * 0.0028));
      d.strokeOverFill = false; d.applyStroke = true;
    } else { d.applyStroke = false; }
    if (lead) d.leading = lead;
    d.justification = just;
    t.property("Source Text").setValue(d);
    t.property("Transform").property("Position").setValue(pos);
    t.guideLayer = LOOK.guides;
    return t;
  }
  function ease(p, a, b) {
    try { var e = new KeyframeEase(0, 55);
      p.setTemporalEaseAtKey(a, [e], [e]); p.setTemporalEaseAtKey(b, [e], [e]); } catch (err) {}
  }

  app.beginUndoGroup("Build " + CONF.name);

  var W = LOOK.width || CONF.width, H = LOOK.height || CONF.height;
  var comp = app.project.items.addComp(CONF.name + LOOK.suffix, W, H, 1.0,
                                       Math.max(CONF.duration, 1), CONF.fps);
  comp.bgColor = LOOK.bg;
  var bg = comp.layers.addSolid(LOOK.bg, "BACKGROUND", W, H, 1.0);
  bg.moveToEnd();
  var folder = app.project.items.addFolder(CONF.name + " \\u00b7 pictures");
  var missing = [];

  /* the rectangle the pictures live in */
  var PW = Math.round(W * LOOK.pictureWidth);
  var PH = Math.round(PW * (CONF.width / CONF.height) > 0 ? PW * CONF.height / CONF.width : 0);
  var PX = Math.round(W / 2), PY = Math.round(H * LOOK.pictureY);

  for (var i = 0; i < SHOTS.length; i++) {
    var s = SHOTS[i], lay, f = new File(IMG.fsName + "/" + s.file);
    if (s.file && f.exists) {
      var item = app.project.importFile(new ImportOptions(f));
      item.parentFolder = folder; item.name = s.label;
      lay = comp.layers.add(item);
    } else {
      missing.push(s.label + (s.file ? " (" + s.file + ")" : " (no picture)"));
      lay = comp.layers.addSolid([0.18, 0.05, 0.05], s.label + " \\u2014 NO PICTURE", PW, PH, 1.0);
    }
    lay.startTime = s.at; lay.inPoint = s.at; lay.outPoint = s.at + s.dur;
    lay.label = (i %% 15) + 1;

    var w = lay.source ? lay.source.width : PW, h = lay.source ? lay.source.height : PH;
    var fit = (LOOK.fill ? Math.max(PW / w, PH / h) : Math.min(PW / w, PH / h)) * 100;
    var sc = lay.property("Transform").property("Scale");
    var ps = lay.property("Transform").property("Position");
    sc.setValueAtTime(s.at, [fit * s.z0 / 100, fit * s.z0 / 100]);
    sc.setValueAtTime(s.at + s.dur, [fit * s.z1 / 100, fit * s.z1 / 100]);
    ease(sc, 1, 2);
    if (s.dx || s.dy) {
      ps.setValueAtTime(s.at, [PX - s.dx / 2, PY - s.dy / 2]);
      ps.setValueAtTime(s.at + s.dur, [PX + s.dx / 2, PY + s.dy / 2]);
      ease(ps, 1, 2);
    } else { ps.setValue([PX, PY]); }

    var op = lay.property("Transform").property("Opacity");
    op.setValueAtTime(s.at, 0); op.setValueAtTime(s.at + CONF.dissolve, 100);
    if (i === SHOTS.length - 1 && CONF.fadeOut > 0) {
      op.setValueAtTime(s.at + s.dur - CONF.fadeOut, 100);
      op.setValueAtTime(s.at + s.dur, 0);
    }
    if (LOOK.mask) {                       /* keep a move inside the picture box */
      var m = lay.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
      var sh = new Shape(); sh.closed = true;
      var hx = PW / 2, hy = PH / 2;
      sh.vertices = [[PX - hx, PY - hy], [PX + hx, PY - hy], [PX + hx, PY + hy], [PX - hx, PY + hy]];
      m.property("ADBE Mask Shape").setValue(sh);
      m.maskMode = MaskMode.ADD;
      m.property("ADBE Mask Shape").expression = "";
    }

    var mk = new MarkerValue(s.label);
    mk.comment = s.text + (s.dlg ? "\\n\\nDIALOGUE: " + s.dlg : "")
      + (s.mj ? "\\n\\nPROMPT: " + s.mj : "") + (s.why ? "\\n\\nPICTURE: " + s.why : "");
    lay.property("Marker").setValueAtTime(s.at + Math.min(0.2, s.dur / 4), mk);

    %(pershot)s
  }

  %(static)s

  var adj = comp.layers.addSolid([1, 1, 1], "GRADE (add effects here)", W, H, 1.0);
  adj.adjustmentLayer = true; adj.enabled = false; adj.moveToBeginning();

  comp.openInViewer();
  app.endUndoGroup();
  var msg = CONF.name + LOOK.suffix + "\\n" + SHOTS.length + " shots \\u00b7 "
          + Math.round(CONF.duration) + "s \\u00b7 " + W + "x" + H + " \\u00b7 " + CONF.fps + " fps";
  if (missing.length) msg += "\\n\\nNo picture for:\\n" + missing.join("\\n");
  alert(msg);
})();
'''

CORNER_PERSHOT = '''
    /* the two corners that change with the shot */
    var tr = text(comp, s.cTopRight, LOOK.small, LOOK.ink,
      [W - Math.round(W * LOOK.pad), Math.round(H * LOOK.pad) + LOOK.small],
      ParagraphJustification.RIGHT_JUSTIFY, Math.round(LOOK.small * 1.35));
    tr.name = "TR " + s.label; tr.inPoint = s.at; tr.outPoint = s.at + s.dur; tr.label = 5;

    var bl = text(comp, s.cBotLeft, LOOK.small, LOOK.ink,
      [Math.round(W * LOOK.pad), H - Math.round(H * LOOK.pad)],
      ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.35));
    bl.name = "BL " + s.label; bl.inPoint = s.at; bl.outPoint = s.at + s.dur; bl.label = 5;

    if (s.dlg) {
      var dl = text(comp, s.dlg, LOOK.dlg, LOOK.dlgInk,
        [PX, PY + PH / 2 + Math.round(H * 0.055)],
        ParagraphJustification.CENTER_JUSTIFY, 0);
      dl.name = "DLG " + s.label; dl.inPoint = s.at; dl.outPoint = s.at + s.dur; dl.label = 11;
    }
'''

CORNER_STATIC = '''
  /* the two corners that stay for the whole comp */
  var tl = text(comp, CONF.cTopLeft, LOOK.small, LOOK.ink,
    [Math.round(W * LOOK.pad), Math.round(H * LOOK.pad) + LOOK.small],
    ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.35));
  tl.name = "TL \\u00b7 scene"; tl.label = 14;

  var br = text(comp, CONF.cBotRight, LOOK.small, LOOK.ink,
    [W - Math.round(W * LOOK.pad), H - Math.round(H * LOOK.pad)],
    ParagraphJustification.RIGHT_JUSTIFY, Math.round(LOOK.small * 1.35));
  br.name = "BR \\u00b7 project"; br.label = 14;
'''

SLATE_PERSHOT = '''
    /* the strip under the picture, replaced at every cut */
    var st = text(comp, s.strip, LOOK.small, LOOK.ink,
      [Math.round(W * LOOK.pad), Math.round(H * 0.845)],
      ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.45));
    st.name = "STRIP " + s.label; st.inPoint = s.at; st.outPoint = s.at + s.dur; st.label = 5;

    if (s.dlg) {
      var dl = text(comp, s.dlg, LOOK.dlg, LOOK.dlgInk,
        [PX, PY + PH / 2 + Math.round(H * 0.050)],
        ParagraphJustification.CENTER_JUSTIFY, 0);
      dl.name = "DLG " + s.label; dl.inPoint = s.at; dl.outPoint = s.at + s.dur; dl.label = 11;
    }
'''

SLATE_STATIC = '''
  /* the rule above the strip, and the fixed half of it */
  var rule = comp.layers.addSolid(LOOK.ink, "RULE", W - Math.round(W * LOOK.pad * 2),
                                  Math.max(1, Math.round(H * 0.0018)), 1.0);
  rule.property("Transform").property("Position").setValue([W / 2, Math.round(H * 0.805)]);
  rule.property("Transform").property("Opacity").setValue(45);

  var head = text(comp, CONF.cTopLeft, LOOK.small, LOOK.ink,
    [Math.round(W * LOOK.pad), Math.round(H * 0.062)],
    ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.4));
  head.name = "HEAD"; head.label = 14;

  var foot = text(comp, CONF.cBotRight, LOOK.small, LOOK.ink,
    [W - Math.round(W * LOOK.pad), Math.round(H * 0.955)],
    ParagraphJustification.RIGHT_JUSTIFY, Math.round(LOOK.small * 1.4));
  foot.name = "FOOT"; foot.label = 14;
'''

TPL = {
    "clean": {
        "blurb": "The cut and nothing else: the picture fills the frame, no production data.",
        "look": {"suffix": " · clean", "width": 1680, "height": 720,
                 "bg": [0, 0, 0], "ink": [1, 1, 1], "dlgInk": [1, 1, 1],
                 "pictureWidth": 1.0, "pictureY": 0.5, "fill": True, "mask": False,
                 "pad": 0.03, "small": 19, "dlg": 29, "stroke": True,
                 "strokeColour": [0, 0, 0], "guides": False},
        "pershot": "", "static": "",
    },
    "corners": {
        "blurb": "A wider black canvas, the picture centred, production data in the four corners.",
        "look": {"suffix": " · corners", "width": 1920, "height": 1080,
                 "bg": [0, 0, 0], "ink": [0.78, 0.80, 0.84], "dlgInk": [1, 1, 1],
                 "pictureWidth": 0.80, "pictureY": 0.47, "fill": False, "mask": True,
                 "pad": 0.028, "small": 20, "dlg": 30, "stroke": False,
                 "strokeColour": [0, 0, 0], "guides": False},
        "pershot": CORNER_PERSHOT, "static": CORNER_STATIC,
    },
    "paper": {
        "blurb": "The corners layout on white with dark text, for review documents and printing.",
        "look": {"suffix": " · paper", "width": 1920, "height": 1080,
                 "bg": [1, 1, 1], "ink": [0.13, 0.15, 0.18], "dlgInk": [0.08, 0.09, 0.11],
                 "pictureWidth": 0.80, "pictureY": 0.46, "fill": False, "mask": True,
                 "pad": 0.030, "small": 20, "dlg": 29, "stroke": False,
                 "strokeColour": [1, 1, 1], "guides": False},
        "pershot": CORNER_PERSHOT, "static": CORNER_STATIC,
    },
    "slate": {
        "blurb": "The picture high on a black canvas with a wide margin, everything on a strip beneath it.",
        "look": {"suffix": " · slate", "width": 1920, "height": 1080,
                 "bg": [0.04, 0.04, 0.05], "ink": [0.93, 0.93, 0.95], "dlgInk": [1, 1, 1],
                 "pictureWidth": 0.86, "pictureY": 0.40, "fill": False, "mask": True,
                 "pad": 0.035, "small": 21, "dlg": 30, "stroke": False,
                 "strokeColour": [0, 0, 0], "guides": False},
        "pershot": SLATE_PERSHOT, "static": SLATE_STATIC,
    },
}


def corner_text(man, shot, i):
    """The four corners, and the slate strip, for one shot."""
    code, title = man["scene"], man["title"]
    ctx = man.get("context") or ""
    n, tot = shot["n"], man["shots_used"]
    tr = f"{shot['tc_in']} – {shot['tc_out']}\r{shot['dur']:.1f}s"
    bl = (f"{n:02d} · {shot['type'] or 'SHOT'}   shot {n} of {tot}\r"
          f"{(shot.get('image_choice') or '')}")
    strip = (f"{n:02d} · {shot['type'] or 'SHOT'}    {shot['tc_in']} – {shot['tc_out']}"
             f"    ({shot['dur']:.1f}s)    shot {n} of {tot}\r"
             f"{(shot.get('image_choice') or '')}    ·    move ×{shot.get('move_factor', 1)}")
    return tr, bl, strip


def build(man_path, out, which=None, images_from=None):
    man = json.loads(pathlib.Path(man_path).read_text(encoding="utf8"))
    src = pathlib.Path(images_from or (pathlib.Path(man_path).parent / "images"))
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    imgdir = out / "images"
    imgdir.mkdir(exist_ok=True)
    for f in src.glob("*"):
        if f.is_file():
            shutil.copy2(f, imgdir / f.name)

    shots = []
    for i, sh in enumerate(man["shots"]):
        tr, bl, strip = corner_text(man, sh, i)
        shots.append({
            "label": f"{sh['n']:02d} · {sh['type'] or 'SHOT'}",
            "file": sh.get("image_file") or "",
            "at": sh["at"], "dur": sh["dur"],
            "z0": sh.get("z0", 107), "z1": sh.get("z1", 113),
            "dx": sh.get("dx", 0), "dy": sh.get("dy", 0),
            "text": sh.get("text", ""), "mj": "", "dlg": sh.get("dlg", ""),
            "why": sh.get("image_choice", ""),
            "cTopRight": tr, "cBotLeft": bl, "strip": strip,
        })
    # the exporter's manifest keeps z/dx/dy only in the script, so recover them
    script = (pathlib.Path(man_path).parent / man.get("script", "")).read_text(encoding="utf8") \
        if (pathlib.Path(man_path).parent / man.get("script", "")).exists() else ""
    if script and "var SHOTS = " in script:
        a = script.index("var SHOTS = ") + 12
        try:
            orig = json.loads(script[a:script.index("\n];", a) + 2])
            for s, o in zip(shots, orig):
                for k in ("z0", "z1", "dx", "dy", "mj", "dlg"):
                    if k in o:
                        s[k] = o[k]
        except Exception:
            pass

    for d in man.get("dialogue", []):
        if d.get("shot") and 1 <= d["shot"] <= len(shots):
            shots[d["shot"] - 1]["dlg"] = d["text"]

    used = sum(1 for s in shots if s["file"])
    conf = {
        "name": man["comp"], "imageDir": "images",
        "width": man["frame"][0], "height": man["frame"][1],
        "fps": man["fps"], "duration": man["runtime_seconds"],
        "dissolve": man.get("dissolve", 0.5), "fadeOut": 1.0,
        "cTopLeft": f"{man['scene']}  ·  {man['title']}\r{man.get('context') or ''}",
        "cBotRight": (f"{man['shots_used']} shots  ·  {used} pictures of "
                      f"{man.get('images_uploaded', used)}\r"
                      f"{man['runtime_seconds']:.0f}s  ·  {man['fps']:g} fps  ·  "
                      f"{man.get('timing', '')}"),
    }
    made = []
    for name, t in TPL.items():
        if which and name not in which:
            continue
        body = HEAD % {
            "name": man["comp"], "tpl": name, "blurb": t["blurb"],
            "conf": json.dumps(conf, ensure_ascii=False, indent=2),
            "shots": json.dumps(shots, ensure_ascii=False, indent=2),
            "look": json.dumps(t["look"], ensure_ascii=False, indent=2),
            "pershot": t["pershot"], "static": t["static"],
        }
        f = out / f"{man['scene']}_{name}.js"
        f.write_text(body, encoding="utf8")
        made.append((name, f, conf, shots, t))
    return man, conf, shots, made


# ------------------------------------------------------------------- previews
PREVIEW = """<!doctype html><html><head><meta charset=utf8><style>
 html,body{margin:0;padding:0}
 .f{position:relative;width:%(W)spx;height:%(H)spx;background:%(bg)s;color:%(ink)s;
    font:%(small)spx/1.35 'DejaVu Sans',system-ui,sans-serif;overflow:hidden}
 .pic{position:absolute;left:50%%;top:%(py)s%%;transform:translate(-50%%,-50%%);
      width:%(pw)spx;background:#333;display:block}
 .pic img{display:block;width:100%%;height:auto}
 .c{position:absolute;white-space:pre-line}
 .tl{left:%(pad)spx;top:%(pad)spx}
 .tr{right:%(pad)spx;top:%(pad)spx;text-align:right}
 .bl{left:%(pad)spx;bottom:%(pad)spx}
 .br{right:%(pad)spx;bottom:%(pad)spx;text-align:right}
 .strip{position:absolute;left:%(pad)spx;right:%(pad)spx;top:81.5%%;white-space:pre-line}
 .rule{position:absolute;left:%(pad)spx;right:%(pad)spx;top:80.5%%;height:1px;background:%(ink)s;opacity:.45}
 .dlg{position:absolute;left:50%%;transform:translateX(-50%%);top:%(dlgy)s%%;
      font-size:%(dlg)spx;color:%(dlgink)s;text-align:center;max-width:70%%}
 .tag{position:absolute;right:0;bottom:0;background:#111;color:#fff;font:600 22px system-ui;
      padding:6px 14px;letter-spacing:.04em}
</style></head><body><div class="f">
 <div class="pic"><img src="%(img)s"></div>
 %(parts)s
 <div class="tag">%(tpl)s</div>
</div></body></html>"""


def preview(man, conf, shots, made, out):
    """A still of each layout, so the choice can be made by looking."""
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        return []
    out = pathlib.Path(out)
    sh = next((s for s in shots if s["file"]), shots[0])
    pics = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for name, f, _c, _s, t in made:
            lk = t["look"]
            W, H = lk.get("width") or conf["width"], lk.get("height") or conf["height"]
            bg = "#%02x%02x%02x" % tuple(int(x * 255) for x in lk["bg"])
            ink = "#%02x%02x%02x" % tuple(int(x * 255) for x in lk["ink"])
            dink = "#%02x%02x%02x" % tuple(int(x * 255) for x in lk["dlgInk"])
            parts = ""
            if name in ("corners", "paper"):
                parts = (f'<div class="c tl">{conf["cTopLeft"]}</div>'
                         f'<div class="c tr">{sh["cTopRight"]}</div>'
                         f'<div class="c bl">{sh["cBotLeft"]}</div>'
                         f'<div class="c br">{conf["cBotRight"]}</div>')
            elif name == "slate":
                parts = (f'<div class="rule"></div>'
                         f'<div class="c tl">{conf["cTopLeft"]}</div>'
                         f'<div class="strip">{sh["strip"]}</div>'
                         f'<div class="c br">{conf["cBotRight"]}</div>')
            if sh.get("dlg") and name != "clean":
                dy = lk["pictureY"] * 100 + (lk["pictureWidth"] * (conf["height"] / conf["width"])
                                             * 100 / 2) + 5
                parts += f'<div class="dlg" style="top:{dy:.1f}%">{sh["dlg"]}</div>'
            html = PREVIEW % {
                "W": W, "H": H, "bg": bg, "ink": ink, "dlgink": dink,
                "small": lk["small"], "dlg": lk["dlg"],
                "pad": int(min(W, H) * lk["pad"]),
                "pw": int(W * lk["pictureWidth"]), "py": lk["pictureY"] * 100,
                "dlgy": 70, "img": "images/" + sh["file"], "parts": parts, "tpl": name,
            }
            hp = out / f"_preview_{name}.html"
            hp.write_text(html.replace("\r", "\n"), encoding="utf8")
            pg = b.new_page(viewport={"width": W, "height": H})
            pg.goto("file://" + str(hp.resolve()))
            pg.wait_for_timeout(350)
            png = out / f"{man['scene']}_{name}_preview.png"
            pg.screenshot(path=str(png))
            pg.close()
            hp.unlink(missing_ok=True)
            pics.append(png)
        b.close()
    return pics


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--from", dest="src", required=True,
                    help="a folder the exporter wrote (holding manifest.json and images/)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", nargs="*", choices=sorted(TPL), help="build only these")
    ap.add_argument("--no-preview", action="store_true")
    a = ap.parse_args()
    man_path = pathlib.Path(a.src) / "manifest.json"
    man, conf, shots, made = build(man_path, a.out, a.only)
    for name, f, *_ in made:
        print(f"{name:8} {f}")
    if not a.no_preview:
        for p in preview(man, conf, shots, made, a.out):
            print(f"preview  {p}")


if __name__ == "__main__":
    main()
