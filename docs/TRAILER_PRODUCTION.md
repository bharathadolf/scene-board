# The Unseen Sun — trailer production folder

Everything here is generated from `pipeline/manifest.json` (the board's trailer cut) by the scripts in `pipeline/scripts`.

```
assets/<set|char|prop>/<id>/publish/<id>_proxy_v001.blend   48 proxy assets, one collection each
shots/MV<I-IV>/<unit>/<shot id>/
    shot.json                                 the shot's requirements, links, passes, solved camera
    blender/<id>_blocking_v001.blend          LINKS the assets; requirements are in the text block SHOT_REQUIREMENTS
    houdini/<id>_fx_v001.hiplc                only for the 34 shots that need FX; reads the layout USD
    publish/layout/<id>_layout_v001.usd       Blender → Houdini (Y-up, animated, with the shot camera)
    publish/camera/<id>_cam_v001.abc          the camera alone, with 8-frame handles
    renders/preview/                          still PNG and playblast MP4 with burn-in
    renders/blocking/v001/                    multilayer EXR, every pass, every frame of the cut
    cache/  comp/                             empty until FX and comp start
pipeline/  manifest.json, shotspec.json, TRAILER_CUT.md, dependency.json, status.json, DEPENDENCIES.md, logs/
edit/      trailer.edl
```

## Rules

- **Frames** start at 1001 in every shot file. The cut length is in `shot.json`; handles are 8 frames.
- **Assets are linked, never copied.** To upgrade one, publish `assets/<kind>/<id>/publish/<id>_<state>_v###.blend` with the
  same collection name (`<kind>_<id>`) and repoint the library in the shots that use it. States, in order:
  proxy, blocking, model_approved, rig_v1, lookdev_approved, final.
- **Generated versions carry a marker.** Every shot file the builder writes gets `<file>.generated` beside it. The
  builder rebuilds only files that have that marker; a file without one is treated as hand work and left alone, with
  a note in the log. To hand-edit a generated file, delete its `.generated` marker first, or save your work as the
  next version up.
- **Versions so far.** `v001`: grey blocking on proxy assets. `v002`: the Houdini temple (v002) with look-dev
  materials and a physical sky, MPFB characters with arms down (v002), Cycles stills and EEVEE playblasts.
- **FXPROXY_ objects** in a blocking file mark where an effect goes and how big it is. They are stand-ins for Houdini's work.
- **Krishna** is turned away from camera in every shot before `T-18_82ert`. Keep it that way.

## Commands (run from this folder)

```
status.bat                refresh pipeline/DEPENDENCIES.md, status.json and dependency.json from what is on disk
make_version.bat v003     build every shot at a new version, then playblasts, all-pass EXRs and the status
build_shots.bat           rebuild every v001 blocking file from the manifest (assets too)
render_blocking.bat       v001 playblasts and EXRs for every shot that does not have them yet
```

`pipeline/DEPENDENCIES.md` always says what is done, what is ready to start, and what each blocked step is waiting for.

## Sets built in Houdini

A set is modelled once, procedurally, and every shot that uses it links the same publish.

```
assets/set/<id>/houdini/<id>_model_v###.hip(lc)   the procedural network; knobs are on the set's /obj container
assets/set/<id>/publish/<id>_<state>_v###.usd      written by /stage/PUBLISH_USD
assets/set/<id>/publish/<id>_<state>_v###.blend    the USD wrapped in one collection, set_<id>, for Blender
```

1. Build in Houdini inside `/obj/set_<id>`, in metres, Y-up, on the same footprint as the proxy: Blender (x, y, z) is Houdini (x, z, -y).
   Give every branch a `name` so it becomes its own USD prim; the name picks the Blender look:
   `terrain`/`ground`, `canopy`/`leaf`, `trunk`/`bark`, `flag`, `pole`/`door`, `mural_panels`, and stone for anything else.
   Colour goes in `Cd` as you would pick it by eye; the look-dev converts it to linear and adds surface breakup.
2. Publish with `/stage/PUBLISH_USD`.
3. Wrap and relink:
   `blender -b --factory-startup --python pipeline/scripts/trailer_shots.py -- --root . --manifest pipeline/manifest.json --usd assets/set/<id>/publish/<id>_blocking_v002.usd --asset set/<id> --state blocking`, then `make_version.bat v00N`
   Shots always link the furthest published state of an asset, so this upgrades them.
4. `status.bat` then shows the renders of those shots as out of date.

## Characters (MPFB)

`pipeline/scripts/trailer_chars.py` makes every character and crowd agent with the MPFB (MakeHuman) add-on: build
from the SPEC table, garments, hair and eyes cut from MakeHuman's helper geometry, arms posed down with MPFB's
default rig and baked in. Publishes `assets/char/<id>/publish/<id>_blocking_v002.blend` (collection `char_<id>`,
custom property `height_m`, which the shot cameras use to frame each face). They are not rigged yet; `rig_v1` is
the next state and is what animation waits for.
