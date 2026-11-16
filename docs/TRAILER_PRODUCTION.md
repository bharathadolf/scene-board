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
- **v001 is generated.** Rebuilding overwrites it. Hand work goes in v002 and later, which the scripts never touch.
- **FXPROXY_ objects** in a blocking file mark where an effect goes and how big it is. They are stand-ins for Houdini's work.
- **Krishna** is turned away from camera in every shot before `T-18_82ert`. Keep it that way.

## Commands (run from this folder)

```
status.bat            refresh pipeline/DEPENDENCIES.md, status.json and dependency.json from what is on disk
build_shots.bat       rebuild every v001 blocking file from the manifest (assets too)
render_blocking.bat   playblasts and all-pass EXRs for every shot that does not have them yet
```

`pipeline/DEPENDENCIES.md` always says what is done, what is ready to start, and what each blocked step is waiting for.
