# -*- coding: utf-8 -*-
"""Trailer shot files: proxy assets published once, linked into one Blender
file per shot, staged to the shot's context, with every render pass on.

    blender --background --factory-startup --python trailer_shots.py -- \
        --root <TRAILER> --manifest <manifest.json> --assets --shots all --stills
    ... --shots all --playblast          workbench mp4 per shot, with burn-in
    ... --shots all --exr                Cycles, multilayer EXR, every pass, full range
    ... --shots T-18_82ert,T-19_dq0gi    any subset, by shot id

Layout it writes under <TRAILER>:
    assets/<set|char|prop>/<id>/publish/<id>_proxy_v001.blend     one collection each
    shots/MV<n>/<unit>/<shot id>/
        shot.json                                   the shot's requirements and its links
        blender/<shot id>_blocking_v001.blend       links the assets; nothing is copied in
        publish/layout/<shot id>_layout_v001.usd    what Houdini reads
        publish/camera/<shot id>_cam_v001.abc
        renders/preview/  renders/blocking/v001/  houdini/  cache/  comp/
    pipeline/logs/build_status.json

Everything in a shot file except hand edits is regenerated from the manifest and
the STAGING table below. Hand work belongs in a new version (v002), never in v001.
"""
import colorsys
import datetime
import json
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

GEN = "trailer_shots/3.0.0"
VER = "v001"          # the shot version being built; --version sets it
PROXY_VER = "v001"    # proxy assets are only ever v001
SENSOR_W, FIGURE = 36.0, 1.7
FILL = dict(EWS=.12, AERIAL=.05, WIDE=.42, MS=1.3, MCU=2.8, CLOSE=4.2, ECU=11, INSERT=4.2,
            MACRO=11, POV=.55, TRACKING=.8, CRANE=.3, ACTION=.8)
AIMH = dict(CLOSE=1.56, MCU=1.5, ECU=1.6, MS=1.25, WIDE=1.0, TRACKING=1.2, ACTION=1.2, CRANE=1.2, EWS=1.0)
STONE, EARTH, SAND = (.62, .58, .5, 1), (.42, .36, .28, 1), (.76, .68, .5, 1)
WATER, MILK, DARK, GRASS = (.2, .36, .5, 1), (.92, .92, .88, 1), (.2, .19, .18, 1), (.4, .46, .26, 1)


# ------------------------------------------------------------------ geometry
def colour_of(name):
    h = 2166136261
    for ch in name:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    h ^= h >> 15
    r, g, b = colorsys.hsv_to_rgb((h % 360) / 360.0, 0.55 + ((h >> 9) % 30) / 100.0, 0.85)
    return (r, g, b, 1.0)


def mat(name, rgba, emit=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if b is not None:
        b.inputs["Base Color"].default_value = rgba
        b.inputs["Roughness"].default_value = 0.85
        if emit:
            for k in ("Emission Color", "Emission"):
                if k in b.inputs:
                    b.inputs[k].default_value = rgba
                    break
            b.inputs["Emission Strength"].default_value = emit
    return m


def prim(col, name, kind, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), rgba=(.5, .5, .5, 1), emit=0.0, seg=16):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    if kind == "box":
        bmesh.ops.create_cube(bm, size=1.0)
    elif kind == "plane":
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    elif kind == "cyl":
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=.5, radius2=.5, depth=1.0)
    elif kind == "tube":
        bmesh.ops.create_cone(bm, cap_ends=False, segments=seg * 2, radius1=.5, radius2=.5, depth=1.0)
    elif kind == "cone":
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=.5, radius2=0.0, depth=1.0)
    elif kind == "frustum":
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=.5, radius2=.2, depth=1.0)
    elif kind == "ball":
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=10, radius=.5)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location, ob.scale, ob.rotation_euler = loc, scale, rot
    key = "M_%02x%02x%02x%s" % (int(rgba[0] * 255), int(rgba[1] * 255), int(rgba[2] * 255), "_e" if emit else "")
    me.materials.append(mat(key, rgba, emit))
    ob.color = rgba
    col.objects.link(ob)
    return ob


def rad(d):
    return math.radians(d)


# ---------------------------------------------------------------- the assets
def figure(col, cid, kind):
    rgba = colour_of(cid)
    if cid == "vasuki":      # the serpent as a rope: four kilometres, wrapped on the rod
        prim(col, "vasuki_body", "cyl", (0, 0, 1.0), (1.2, 1.2, 4000), (0, rad(90), 0), rgba)
        for i, z in enumerate((8, 13, 18)):
            prim(col, "vasuki_coil_%d" % i, "tube", (0, 0, z), (92 - i * 6, 92 - i * 6, 3), rgba=rgba)
        return
    if cid == "kurma":       # only the top of the shell is ever above the surface
        prim(col, "kurma_shell", "ball", (0, 0, -9), (300, 300, 22), rgba=rgba, seg=32)
        return
    if cid in ("c_elephants", "airavata"):   # war elephant: about 3 m at the shoulder
        rgba = (.42, .4, .38, 1) if cid == "c_elephants" else (.92, .92, .9, 1)
        prim(col, cid + "_body", "ball", (0, 0, 2.3), (2.4, 4.2, 2.6), rgba=rgba)
        for i, (x, y) in enumerate(((-.7, -1.3), (.7, -1.3), (-.7, 1.3), (.7, 1.3))):
            prim(col, cid + "_leg%d" % i, "cyl", (x, y, .8), (.7, .7, 1.6), rgba=rgba)
        prim(col, cid + "_head", "ball", (0, -2.3, 3.0), (1.6, 1.6, 1.7), rgba=rgba)
        prim(col, cid + "_trunk", "cone", (0, -3.0, 1.6), (.45, .45, 2.2), (rad(-12), 0, 0), rgba)
        for x in (-.9, .9):
            prim(col, cid + "_ear%+d" % x, "box", (x, -2.0, 3.1), (.12, 1.1, 1.3), rgba=rgba)
            prim(col, cid + "_tusk%+d" % x, "cone", (x * .35, -2.9, 2.2), (.12, .12, .9), (rad(-70), 0, 0), (.9, .88, .8, 1))
        prim(col, cid + "_howdah", "box", (0, .2, 3.9), (1.6, 1.8, .9), rgba=(.55, .2, .12, 1))
        return
    if kind == "creature":
        prim(col, cid + "_body", "box", (0, 0, .9), (1.2, 2.4, 1.6), rgba=rgba)
        return
    k = .62 if cid in ("fisher_child", "infant_shishupala") else 1.0
    prim(col, cid + "_body", "cyl", (0, 0, .72 * k), (.46 * k, .3 * k, 1.44 * k), rgba=rgba)
    prim(col, cid + "_head", "ball", (0, 0, 1.58 * k), (.24 * k, .26 * k, .28 * k), rgba=rgba)
    prim(col, cid + "_nose", "cone", (0, -.16 * k, 1.58 * k), (.07, .07, .12), (rad(90), 0, 0), (.1, .1, .1, 1))


def prop_geo(col, pid):
    W = (.95, .95, .92, 1)
    if pid == "mandara":
        prim(col, "mandara_rod", "frustum", (0, 0, 32), (90, 90, 70), rgba=STONE, seg=24)
    elif pid == "chariot":
        prim(col, "chariot_bed", "box", (0, 0, .58), (1.6, 2.2, .24), rgba=(.5, .34, .16, 1))
        prim(col, "chariot_rail", "box", (0, 1.05, 1.0), (1.6, .1, .6), rgba=(.5, .34, .16, 1))
        for x in (-.9, .9):
            prim(col, "chariot_wheel_%s" % ("L" if x < 0 else "R"), "cyl", (x, 0, .55), (1.1, 1.1, .12),
                 (0, rad(90), 0), DARK)
        prim(col, "chariot_pole", "box", (0, -2.3, .7), (.1, 2.6, .1), rgba=DARK)
        for x in (-.6, .6):
            prim(col, "horse_%s" % ("L" if x < 0 else "R"), "box", (x, -3.6, 1.0), (.5, 2.0, 1.3), rgba=(.3, .22, .16, 1))
    elif pid == "war_horse":
        H_ = (.35, .27, .2, 1)
        prim(col, "horse_body", "ball", (0, 0, 1.35), (.6, 1.7, .75), rgba=H_)
        prim(col, "horse_neck", "cyl", (0, -.95, 1.75), (.3, .3, .8), (rad(-40), 0, 0), H_)
        prim(col, "horse_head", "ball", (0, -1.3, 2.05), (.24, .6, .28), (rad(-30), 0, 0), H_)
        for i, (x, y) in enumerate(((-.2, -.6), (.2, -.6), (-.2, .6), (.2, .6))):
            prim(col, "horse_leg%d" % i, "cyl", (x, y, .5), (.12, .12, 1.0), rgba=H_)
    elif pid == "bow":
        prim(col, "bow_limb", "tube", (0, 0, 0), (.7, .7, .03), (0, rad(90), 0), (.45, .3, .15, 1))
    elif pid == "siege_ladder":
        for x in (-.3, .3):
            prim(col, "ladder_rail%+d" % x, "box", (x, 0, 6), (.08, .08, 12), rgba=(.45, .32, .18, 1))
        for i in range(24):
            prim(col, "ladder_rung%02d" % i, "box", (0, 0, .4 + i * .48), (.6, .05, .05), rgba=(.45, .32, .18, 1))
    elif pid == "letter":
        prim(col, "letter_leaf", "box", (0, 0, 0), (.22, .30, .004), rgba=W)
    elif pid in ("garland_lakshmi", "lotus_garland"):
        c = (.95, .8, .3, 1) if pid == "garland_lakshmi" else (.92, .55, .65, 1)
        prim(col, pid + "_ring", "tube", (0, 0, 0), (.44, .44, .07), (rad(70), 0, 0), c)
    elif pid == "conch":
        prim(col, "conch_shell", "cone", (0, 0, 0), (.14, .14, .26), (rad(90), 0, 0), W)
    elif pid == "lamp_kundina":
        prim(col, "lamp_base", "cyl", (0, 0, .04), (.12, .12, .08), rgba=(.6, .45, .2, 1))
        prim(col, "lamp_flame", "ball", (0, 0, .13), (.05, .05, .09), rgba=(1, .6, .2, 1), emit=40)
    elif pid == "chalk_marks":
        for i in range(17):
            prim(col, "chalk_%02d" % (i + 1), "box", (i * .07, 0, 0), (.02, .006, .16), rgba=W)
    elif pid == "plough":
        prim(col, "plough_beam", "box", (0, 0, 1.1), (.09, 2.3, .09), (rad(25), 0, 0), (.45, .3, .15, 1))
        prim(col, "plough_blade", "cone", (0, -1.05, .55), (.3, .12, .6), (rad(200), 0, 0), (.6, .6, .62, 1))
    elif pid == "wedding_dress":
        prim(col, "dress_skirt", "frustum", (0, 0, .55), (1.25, 1.25, 1.1), rgba=(.75, .12, .14, 1))
    else:
        prim(col, pid + "_proxy", "box", (0, 0, .15), (.3, .3, .3), rgba=colour_of(pid))


def set_geo(col, sid):
    g = lambda n, k, *a, **kw: prim(col, sid + "_" + n, k, *a, **kw)
    if sid == "milk_ocean":
        g("ocean", "plane", (0, 2000, 0), (12000, 5200, 1), rgba=MILK)
        g("beach", "plane", (0, -1100, .02), (12000, 1000, 1), rgba=SAND)
        g("shallows", "plane", (0, -590, .03), (12000, 22, 1), rgba=(.86, .86, .8, 1))
    elif sid == "kundina_temple":
        g("ground", "plane", (0, -60, 0), (400, 400, 1), rgba=EARTH)
        g("plinth", "box", (0, 7, .2), (18, 14, .4), rgba=STONE)
        g("sanctum", "box", (0, 9, 4.2), (10, 8, 8), rgba=STONE)
        g("shikhara", "cone", (0, 9, 13), (9, 9, 10), rgba=STONE)
        g("door", "box", (0, 4.96, 1.8), (2.2, .2, 3.2), rgba=DARK)
        for x in (-6, -3, 3, 6):
            g("pillar_%+d" % x, "cyl", (x, 1.2, 2.4), (.7, .7, 4.4), rgba=STONE)
        g("porch_roof", "box", (0, 2.2, 4.8), (15, 5, .4), rgba=STONE)
        g("forecourt", "plane", (0, -18, .02), (44, 36, 1), rgba=(.66, .62, .55, 1))
        g("road", "plane", (0, -96, .02), (9, 120, 1), rgba=(.58, .53, .44, 1))
        g("palace_gate", "box", (0, -158, 4), (14, 4, 8), rgba=STONE)
        # the painted wall stands apart, east of the temple, so nothing crowds it
        g("mural_wall", "box", (40, .35, 1.9), (11, .3, 3.8), rgba=(.7, .5, .36, 1))
        g("mural_paint", "box", (40, .19, 1.9), (9.6, .02, 2.6), rgba=(.5, .28, .22, 1))
        g("mural_floor", "plane", (40, -4, .03), (14, 10, 1), rgba=STONE)
    elif sid == "kundina_palace":
        g("ground", "plane", (20, 0, 0), (140, 80, 1), rgba=EARTH)
        w, d, h = 18, 14, 6
        g("hall_floor", "plane", (0, 5, .02), (w, d, 1), rgba=STONE)
        g("hall_back", "box", (0, 12, h / 2), (w, .4, h), rgba=STONE)
        g("hall_L", "box", (-w / 2, 5, h / 2), (.4, d, h), rgba=STONE)
        g("hall_R", "box", (w / 2, 5, h / 2), (.4, d, h), rgba=STONE)
        g("dais", "box", (0, 10.4, .25), (5, 2.4, .5), rgba=(.55, .42, .3, 1))
        for i, x in enumerate((-6, 6)):
            for j, y in enumerate((1, 8)):
                g("column_%d%d" % (i, j), "cyl", (x, y, h / 2), (.8, .8, h), rgba=STONE)
        # her quarters, forty metres east
        g("room_floor", "plane", (40, 2, .02), (7, 6, 1), rgba=(.6, .52, .44, 1))
        g("room_back", "box", (40, 5, 1.7), (7, .3, 3.4), rgba=STONE)
        g("room_L", "box", (36.5, 2, 1.7), (.3, 6, 3.4), rgba=STONE)
        g("room_R", "box", (43.5, 2, 1.7), (.3, 6, 3.4), rgba=STONE)
        g("window", "box", (40, 4.86, 1.7), (1.3, .06, 1.5), rgba=(.75, .82, .9, 1), emit=1.5)
        g("desk", "box", (40, 2.5, .37), (1.3, .6, .74), rgba=(.4, .28, .16, 1))
        g("bed", "box", (41.6, .2, .25), (1.4, 2.2, .5), rgba=(.5, .3, .28, 1))
    elif sid == "open_country":
        g("terrain", "plane", (0, 0, 0), (16000, 16000, 1), rgba=GRASS)
        g("road", "plane", (0, 0, .03), (5, 16000, 1), rgba=(.6, .54, .42, 1))
        for i, (x, y, r, hh) in enumerate(((-900, 3000, 900, 260), (1400, 4200, 1300, 380), (-2600, 5200, 1500, 420),
                                           (300, 6500, 1700, 520))):
            g("hill_%d" % i, "cone", (x, y, hh / 2), (r * 2, r * 2, hh), rgba=(.36, .4, .26, 1), seg=24)
    elif sid == "kundina_outskirts":
        g("ground", "plane", (0, 0, 0), (1200, 1200, 1), rgba=GRASS)
        g("river", "plane", (0, 0, .15), (1200, 30, 1), rgba=WATER)
        g("bank_s", "box", (0, -17, .3), (1200, 4, .6), rgba=EARTH)
        g("bank_n", "box", (0, 17, .3), (1200, 4, .6), rgba=EARTH)
        g("ferry", "box", (-6, -13.5, .45), (2, 5, .5), rgba=(.4, .28, .16, 1))
    elif sid == "mathura":
        g("plain", "plane", (0, -3000, 0), (12000, 6400, 1), rgba=(.55, .5, .36, 1))
        g("city_ground", "plane", (0, 300, 0), (2000, 560, 1), rgba=EARTH)
        g("wall", "box", (0, 0, 6), (700, 4, 12), rgba=STONE)
        g("parapet", "box", (0, -1.8, 12.6), (700, .4, 1.2), rgba=STONE)
        g("inner_wall", "box", (0, 2.1, 13.5), (700, .4, 3), rgba=(.66, .6, .5, 1))
        for x in (-150, -50, 50, 150):
            g("tower_%+d" % x, "box", (x, 0, 9), (9, 9, 18), rgba=STONE)
        g("gate", "box", (0, -2.05, 4), (6, .2, 8), rgba=DARK)
        for i in range(12):
            g("house_%02d" % i, "box", (-220 + i * 40, 40 + (i % 3) * 22, 3), (14, 12, 6), rgba=(.6, .52, .42, 1))
    elif sid == "pravarshana":
        g("ground", "plane", (0, 0, 0), (9000, 9000, 1), rgba=GRASS)
        g("hill", "frustum", (0, 0, 300), (2000, 2000, 600), rgba=(.3, .36, .22, 1), seg=32)
        g("peak_ledge", "cyl", (0, 0, 599.9), (26, 26, .4), rgba=(.4, .38, .32, 1))
        g("camp", "box", (0, -1300, 2), (300, 120, 4), rgba=(.6, .5, .36, 1))
    elif sid == "dvaraka_shore":
        g("sea", "plane", (0, 3000, 0), (12000, 6000, 1), rgba=WATER)
        g("beach", "plane", (0, -500, .03), (12000, 1000, 1), rgba=SAND)
        for i in range(4):
            g("boat_%d" % i, "box", (-30 + i * 18, -9 - (i % 2) * 4, .4), (2, 6, .8), rgba=(.4, .28, .16, 1))
    elif sid == "dvaraka_city":
        gold, cry = (.86, .7, .3, 1), (.8, .88, .92, 1)
        g("gate_L", "box", (-12, 0, 20), (14, 14, 40), rgba=gold)
        g("gate_R", "box", (12, 0, 20), (14, 14, 40), rgba=gold)
        g("gate_lintel", "box", (0, 0, 32), (12, 10, 8), rgba=gold)
        g("wall", "box", (0, 6, 12), (900, 8, 24), rgba=cry)
        for i in range(9):
            x = -400 + i * 100
            g("tower_%d" % i, "cyl", (x, 40 + (i % 2) * 60, 30 + (i % 3) * 14), (26, 26, 60 + (i % 3) * 28), rgba=cry)
            g("terrace_%d" % i, "box", (x + 40, 120, 14), (70, 90, 28), rgba=gold)
        g("citadel", "cone", (0, 220, 70), (160, 160, 140), rgba=gold, seg=24)
    elif sid == "mucukunda_cave":                         # the mouth faces -Y; the sleeper lies 10 m in
        g("ground", "plane", (0, -60, 0), (200, 140, 1), rgba=EARTH)
        g("hill", "ball", (0, 52, 0), (140, 100, 70), rgba=(.42, .38, .32, 1), seg=24)
        g("cave_floor", "plane", (0, 7, .02), (9, 26, 1), rgba=(.3, .27, .23, 1))
        for x in (-4.6, 4.6):
            g("cave_wall%+d" % x, "box", (x, 7, 3), (.6, 26, 6), rgba=(.25, .22, .2, 1))
        g("cave_roof", "box", (0, 7, 6.2), (9.8, 26, .6), rgba=(.25, .22, .2, 1))
        g("cave_back", "box", (0, 20, 3), (9.8, .6, 6), rgba=(.25, .22, .2, 1))
        g("mouth_rock", "box", (0, -5.8, 7.5), (16, 1.6, 4), rgba=(.42, .38, .32, 1))
        g("ledge", "box", (0, 12, .4), (3.4, 1.2, .8), rgba=(.4, .36, .3, 1))
        g("shaft", "cyl", (1.2, 11, 3.5), (.8, .8, 7), rgba=(1, .95, .85, 1), emit=4)
    elif sid == "kundina_city":
        g("ground", "plane", (0, 0, 0), (600, 600, 1), rgba=EARTH)
        g("street", "plane", (0, 0, .02), (10, 400, 1), rgba=(.6, .54, .44, 1))
        for i in range(16):
            for sx in (-1, 1):
                g("house_%02d%s" % (i, "L" if sx < 0 else "R"), "box", (sx * (11 + (i % 2) * 2), -190 + i * 25, 3.5 + (i % 3)),
                  (11, 20, 7 + 2 * (i % 3)), rgba=(.62, .54, .44, 1))


ASSET_STATES = ["proxy", "blocking", "model_approved", "rig_v1", "lookdev_approved", "final"]


def asset_path(root, kind, aid):
    return os.path.join(root, "assets", kind, aid, "publish", "%s_proxy_%s.blend" % (aid, PROXY_VER))


def best_asset(root, kind, aid):
    """The furthest state of an asset that has been published, at its newest version.
    Shots link whatever this returns, so publishing a later state upgrades them on the next build."""
    import glob
    pub = os.path.join(root, "assets", kind, aid, "publish")
    for state in reversed(ASSET_STATES):
        hits = sorted(glob.glob(os.path.join(pub, "%s_%s_v[0-9][0-9][0-9].blend" % (aid, state))))
        if hits:
            return hits[-1], state
    return asset_path(root, kind, aid), "proxy"


LOOK = [  # (match in the USD part name, look) -- first match wins
    (("flame", "fire"), "flame"), (("milk", "foam"), "milk"), (("water", "sea_", "ocean", "river", "pool_w"), "water"),
    (("gold", "brass"), "gold"), (("crystal",), "crystal"), (("windows_dark",), "dark"),
    (("terrain", "ground", "paving", "thatch"), "terrain"), (("canopy", "leaf", "foliage"), "foliage"),
    (("trunk", "bark"), "bark"),
    (("flag", "banner_cloth", "carpet", "rug", "drape", "cushion", "awning", "bunting"), "cloth"),
    (("pole", "door", "wood"), "wood"), (("mural_panels",), "paint"),
]


def look_of(name):
    n = name.lower()
    for keys, look in LOOK:
        if any(k in n for k in keys):
            return look
    return "stone"


def lookdev(name, look):
    """A procedural material that reads the per-point colour Houdini baked (displayColor)
    and adds the surface breakup a flat colour lacks. No textures, so it travels with the file."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    bsdf = next(n for n in N if n.type == "BSDF_PRINCIPLED")
    attr = N.new("ShaderNodeAttribute")
    attr.attribute_name = "displayColor"
    coord = N.new("ShaderNodeTexCoord")
    noise = N.new("ShaderNodeTexNoise")
    L.new(coord.outputs["Object"], noise.inputs["Vector"])
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = .62
    gam = N.new("ShaderNodeGamma")             # the colours were picked by eye on a display: make them linear
    gam.inputs["Gamma"].default_value = 2.0
    L.new(attr.outputs["Color"], gam.inputs["Color"])
    mix = N.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    L.new(gam.outputs["Color"], mix.inputs[6])
    ramp = N.new("ShaderNodeValToRGB")
    L.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    lo, hi = dict(stone=(.72, 1.08), terrain=(.62, 1.15), foliage=(.75, 1.15), bark=(.6, 1.0),
                  cloth=(.85, 1.05), wood=(.7, 1.0), paint=(.7, 1.05), water=(.9, 1.05), milk=(.96, 1.02),
                  gold=(.8, 1.05), crystal=(.92, 1.03), dark=(.8, 1.0), flame=(1, 1))[look]
    ramp.color_ramp.elements[0].color = (lo, lo, lo, 1)
    ramp.color_ramp.elements[1].color = (hi, hi, hi, 1)
    L.new(ramp.outputs["Color"], mix.inputs[7])
    mix.inputs["Factor"].default_value = 1.0
    L.new(mix.outputs[2], bsdf.inputs["Base Color"])
    rough, scale, bstr = dict(stone=(.82, 3.0, .35), terrain=(.95, .35, .5), foliage=(.55, 9.0, .15),
                              bark=(.9, 6.0, .45), cloth=(.75, 14.0, .08), wood=(.7, 5.0, .2),
                              paint=(.8, 2.0, .15), water=(.04, .9, .12), milk=(.28, .6, .06),
                              gold=(.32, 4.0, .1), crystal=(.14, 2.0, .05), dark=(.9, 3.0, .1),
                              flame=(.5, 1.0, 0.0))[look]
    noise.inputs["Scale"].default_value = scale
    bsdf.inputs["Roughness"].default_value = rough
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = bstr
    fine = N.new("ShaderNodeTexNoise")
    L.new(coord.outputs["Object"], fine.inputs["Vector"])
    fine.inputs["Scale"].default_value = scale * 9
    fine.inputs["Detail"].default_value = 6.0
    if look == "stone":                       # chipped edges and joints read as cracks
        vor = N.new("ShaderNodeTexVoronoi")
        vor.feature = "DISTANCE_TO_EDGE"
        L.new(coord.outputs["Object"], vor.inputs["Vector"])
        vor.inputs["Scale"].default_value = 2.2
        add = N.new("ShaderNodeMath")
        add.operation = "MULTIPLY_ADD"
        L.new(fine.outputs["Fac"], add.inputs[0])
        add.inputs[1].default_value = .6
        L.new(vor.outputs["Distance"], add.inputs[2])
        L.new(add.outputs[0], bump.inputs["Height"])
    else:
        L.new(fine.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    if look == "foliage":
        for k in ("Subsurface Weight", "Transmission Weight"):
            if k in bsdf.inputs:
                bsdf.inputs[k].default_value = .12
    if look == "cloth" and "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = .4
    if look == "gold":
        bsdf.inputs["Metallic"].default_value = 1.0
    if look in ("crystal", "water") and "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = .5 if look == "crystal" else .0
    if look == "water":
        bsdf.inputs["IOR"].default_value = 1.33
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = .7
    if look == "milk" and "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = .35
        if "Subsurface Radius" in bsdf.inputs:
            bsdf.inputs["Subsurface Radius"].default_value = (.4, .35, .3)
    if look == "flame":
        L.new(gam.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 25.0
    m.diffuse_color = (.6, .58, .52, 1)
    return m


def import_usd_asset(root, key, state, usd, names):
    """Wrap a USD published from Houdini in a .blend whose one collection carries the
    asset's name, which is what a shot file links."""
    kind, aid = key.split("/")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("%s_%s" % (kind, aid))
    bpy.context.scene.collection.children.link(col)
    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children[col.name]
    bpy.ops.wm.usd_import(filepath=usd)
    n = 0
    for ob in list(bpy.context.scene.objects):
        if col not in ob.users_collection:
            for c in ob.users_collection:
                c.objects.unlink(ob)
            col.objects.link(ob)
        if ob.type != "MESH":
            continue
        n += 1
        rgba = (.6, .6, .6, 1)
        ca = ob.data.color_attributes.get("displayColor") or (ob.data.color_attributes[0] if len(ob.data.color_attributes) else None)
        if ca is not None and len(ca.data):
            c = ca.data[0].color
            rgba = (c[0], c[1], c[2], 1)
        ob.data.materials.clear()
        look = look_of(ob.name)
        ob.data.materials.append(lookdev("M_%s_%s" % (aid, ob.name), look))
        ob["look"] = look
        ob.color = rgba
    label = (names.get("sets", {}).get(aid) or names.get("characters", {}).get(aid, {}).get("name")
             or names.get("props", {}).get(aid) or aid) if kind != "char" else names["characters"].get(aid, {}).get("name", aid)
    col["asset_id"], col["asset_kind"], col["asset_state"], col["asset_name"] = aid, kind, state, label
    col["source_usd"] = os.path.basename(usd)
    try:
        col.asset_mark()
    except Exception:
        pass
    m = __import__("re").search(r"_v(\d{3})", os.path.basename(usd))
    ver = "v" + (m.group(1) if m else "001")
    p = os.path.join(root, "assets", kind, aid, "publish", "%s_%s_%s.blend" % (aid, state, ver))
    bpy.ops.wm.save_as_mainfile(filepath=p)
    meta = os.path.join(root, "assets", kind, aid, "asset.json")
    rec = json.load(open(meta, encoding="utf8")) if os.path.exists(meta) else dict(id=aid, kind=kind, name=label)
    rec.update(state=state, version=ver, collection=col.name, publish=os.path.relpath(p, root).replace("\\", "/"),
               source="houdini", source_usd=os.path.relpath(usd, root).replace("\\", "/"), meshes=n)
    with open(meta, "w", encoding="utf8") as fh:
        json.dump(rec, fh, ensure_ascii=False, indent=1)
    return p, n


def build_asset(root, kind, aid, names):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("%s_%s" % (kind, aid))
    bpy.context.scene.collection.children.link(col)
    if kind == "set":
        set_geo(col, aid)
        label = names["sets"].get(aid, aid)
    elif kind == "char":
        figure(col, aid, names["characters"].get(aid, {}).get("kind", "role"))
        label = names["characters"].get(aid, {}).get("name", aid)
    else:
        prop_geo(col, aid)
        label = names["props"].get(aid, aid)
    col["asset_id"], col["asset_kind"], col["asset_state"], col["asset_name"] = aid, kind, "proxy", label
    try:
        col.asset_mark()
        col.asset_data.description = "%s — proxy %s. Replace by publishing a later state under the same collection name." % (label, PROXY_VER)
    except Exception:
        pass
    p = asset_path(root, kind, aid)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=p)
    with open(os.path.join(os.path.dirname(os.path.dirname(p)), "asset.json"), "w", encoding="utf8") as fh:
        json.dump(dict(id=aid, kind=kind, name=label, state="proxy", version=PROXY_VER, collection=col.name,
                       publish=os.path.relpath(p, root).replace("\\", "/"),
                       next_states=["blocking", "model_approved", "rig_v1", "lookdev_approved", "final"],
                       generator=GEN), fh, ensure_ascii=False, indent=1)
    return p


# ---------------------------------------------------------------- the staging
# Coordinates are metres in the set's own space, relative to `o`. A figure with
# rot 0 faces -Y (toward a camera in the default position); rot 90 faces +X,
# 180 faces +Y. Camera az is measured the same way: az 0 puts the camera at -Y.
#   cast   (id, x, y, rot[, opts])       opts: z, walk=(dx,dy,dz), on=<prop id>
#   crowd  (id, form, args, n, rot[, opts])  form: line (x0,y0,x1,y1) | ring (cx,cy,r,gap°) | block (cx,cy,w,d)
#   props  (id, x, y, z, rot[, opts])    opts: held=<cast id>, walk
#   fx     (name, kind, loc, scale, rgba[, opts])   a stand-in for what Houdini will make; opts: grow=(k0,k1), walk
#   cam    pos=(x,y,z) aim=(x,y,z)  or  on=<cast id | (crowd id, i)> with front=<deg off the face> or az=<deg>,
#          dist=, aimh=, h=;  amt= how far the move travels;  follow=True to travel with the subject
MILK_LINE = [("c_devas", "line", (150, -1.1, 2000, -1.1), 60, 180), ("c_asuras", "line", (-150, -1.1, -2000, -1.1), 60, 180)]
CLAIM = [("c_devas", "line", (-20, -4, -1, -4), 12, 180), ("c_asuras", "line", (1, -4, 20, -4), 12, 180)]
KINGS = [("c_kings", "line", (-5, -8, -5, -30), 12, 90), ("c_kings", "line", (5, -8, 5, -30), 12, -90)]
QUART = dict(set="kundina_palace", o=(40, 2, 0), tod="night")
S = {
 ("T-01", 0): dict(cast=[("vasuki", 0, 0, 0), ("kurma", 0, 0, 0)], crowd=MILK_LINE, props=[("mandara", 0, 0, 0, 0)],
                   cam=dict(pos=(-6, -300, 90), aim=(0, 0, 22), amt=12)),
 ("T-01", 1): dict(cast=[("vasuki", 0, 0, 0)], crowd=[("c_devas", "line", (196, -1.1, 214, -1.1), 10, 180)],
                   cam=dict(aim=(200, -.6, 1.0), az=25, dist=2.4, h=1.0)),
 ("T-01", 2): dict(cast=[("vasuki", 0, 0, 0)], crowd=[("c_asuras", "line", (-200, -1.1, -214, -1.1), 8, 180)],
                   fx=[("serpent_smoke", "ball", (-197.5, -1.6, 1.9), (1.6, 1.6, 1.2), (.5, .5, .5, .5))],
                   cam=dict(on=("c_asuras", 0), az=-40, dist=3.4)),
 ("T-01", 3): dict(cast=[("vasuki", 0, 0, 0), ("kurma", 0, 0, 0)], props=[("mandara", 0, 0, 0, 0)],
                   cam=dict(pos=(40, -260, 1.2), aim=(0, 0, 26))),
 ("T-02", 0): dict(fx=[("halahala_stain", "cyl", (0, -220, .12), (60, 60, .08), (.02, .02, .03, 1), dict(grow=(1, 7.5)))],
                   cam=dict(pos=(-170, -572, 14), aim=(0, -330, 0), amt=40)),
 ("T-02", 1): dict(o=(0, -600, 0), crowd=[("c_devas", "block", (-6, -10, 30, 7), 26, 90, dict(walk=(9, 0, 0))),
                                          ("c_asuras", "block", (4, -12, 30, 7), 26, 90, dict(walk=(9, 0, 0)))],
                   cam=dict(pos=(-4, -40, 1.6), aim=(-4, -11, 1.2), pan=(9, 0, 0))),
 ("T-02", 2): dict(o=(0, -600, 0), cast=[("fisher_child", 0, -1.2, 180)],
                   fx=[("halahala_edge", "cyl", (0, 30, .12), (90, 56, .08), (.02, .02, .03, 1), dict(walk=(0, -3, 0)))],
                   cam=dict(on="fisher_child", az=65, dist=5.0, aimh=.8, h=1.1)),
 ("T-02", 3): dict(o=(0, -600, 0), cast=[("fisher_child", 0, -1.2, 180)],
                   fx=[("halahala_edge", "cyl", (0, 28.4, .12), (90, 56, .08), (.02, .02, .03, 1), dict(walk=(0, -1.6, 0)))],
                   cam=dict(aim=(0, -1.2, .06), az=150, dist=1.5, h=.3)),
 ("T-03", 0): dict(o=(0, -600, 0), crowd=CLAIM, cam=dict(pos=(-36, 2, 2.4), aim=(8, -4, 1.2))),
 ("T-03", 1): dict(o=(0, -600, 0), crowd=CLAIM, cast=[("lakshmi", -8, -1.5, 90, dict(walk=(12, 0, 0)))],
                   props=[("garland_lakshmi", 0, -.3, 1.15, 0, dict(held="lakshmi"))],
                   cam=dict(on="lakshmi", az=180, dist=6.0, aimh=1.3, h=1.6, follow=True)),
 ("T-03", 2): dict(o=(0, -600, 0), cast=[("lakshmi", 18.9, -1.5, 90), ("krishna", 20.2, -1.5, -90)],
                   props=[("garland_lakshmi", 19.55, -1.5, 1.28, 90)],
                   cam=dict(aim=(19.55, -1.5, 1.2), az=0, dist=2.5, h=1.25)),
 ("T-04", 0): dict(o=(40, 0, 0), cast=[("priest", 4.3, -1.6, 60)], cam=dict(pos=(-1.2, -8, 1.6), aim=(.4, 0, 1.8), amt=1.6)),
 ("T-04", 1): dict(o=(40, 0, 0), cast=[("rukmini", 0, -1.3, 180)], cam=dict(on="rukmini", az=118, dist=2.2)),
 ("T-04", 2): dict(o=(40, 0, 0), cast=[("rukmini", .05, -.55, 180)],
                   fx=[("fingertip", "ball", (.3, .12, 1.4), (.03, .03, .03), (.8, .6, .5, 1))],
                   cam=dict(aim=(.3, .18, 1.4), az=-38, dist=.9, h=1.4)),
 ("T-05", 0): dict(o=(0, 5, 0), cast=[("bhishmaka", 0, 5.2, 0, dict(z=.5)), ("rukmi", -2, 1, 90), ("rukmini", 3.4, .6, -90)],
                   crowd=[("c_court", "line", (-7, -3, -7, 5), 8, 90), ("c_court", "line", (7, -3, 7, 5), 8, -90)],
                   cam=dict(pos=(0, -6.6, 1.6), aim=(0, 2.2, 1.4))),
 ("T-05", 1): dict(o=(0, 5, 0), cast=[("rukmi", -2, 1, 90)], cam=dict(on="rukmi", front=-28)),
 ("T-05", 2): dict(o=(0, 5, 0), cast=[("bhishmaka", 0, 5.2, 0, dict(z=.5))], cam=dict(on="bhishmaka", front=18)),
 ("T-05", 3): dict(o=(0, 5, 0), cast=[("rukmini", 3.4, .6, -90)], cam=dict(on="rukmini", front=30)),
 ("T-05", 4): dict(o=(0, 5, 0), cast=[("rukmini", 3.4, .6, -90), ("rukmi", -2, 1, 90)],
                   cam=dict(on="rukmini", front=38, amt=.9)),
 ("T-06", 0): dict(QUART, cast=[("rukmini", 0, -.35, 180)], props=[("letter", 0, .42, .75, 8), ("lamp_kundina", .45, .6, .74, 0)],
                   cam=dict(pos=(.16, .12, 1.12), aim=(0, .42, .75))),
 ("T-06", 1): dict(QUART, cast=[("rukmini", 0, -.35, 180)], props=[("letter", 0, .42, .75, 8), ("lamp_kundina", .45, .6, .74, 0)],
                   cam=dict(on="rukmini", az=132, dist=3.4, aimh=1.2, h=1.2)),
 ("T-06", 2): dict(QUART, cast=[("rukmini", 0, -.35, 180)], props=[("letter", 0, .42, .75, 8), ("lamp_kundina", .45, .6, .74, 0)],
                   cam=dict(pos=(-.34, -.02, 1.3), aim=(0, .42, .76))),
 ("T-06", 3): dict(QUART, cast=[("rukmini", 0, -.35, 180)], props=[("letter", 0, .42, .75, 8), ("lamp_kundina", .45, .6, .74, 0)],
                   cam=dict(on="rukmini", front=24)),
 ("T-06", 4): dict(QUART, cast=[("rukmini", -.45, -1.5, -90), ("brahmin", -1.45, -1.5, 90)],
                   props=[("letter", -.95, -1.5, 1.08, 0)], cam=dict(aim=(-.95, -1.5, 1.08), az=0, dist=1.5, h=1.2)),
 ("T-07", 0): dict(cast=[("brahmin", 0, 400, 180, dict(walk=(0, 4, 0)))], cam=dict(pos=(-30, -10, 40), aim=(0, 400, 0), amt=7)),
 ("T-07", 1): dict(set="kundina_outskirts", cast=[("brahmin", 0, -5, 180, dict(walk=(0, 3.2, 0), z=-.55)), ("ferryman", -6, -13.5, 150, dict(z=.7))],
                   props=[("letter", 0, 0, 2.02, 0, dict(held="brahmin"))],
                   cam=dict(on="brahmin", az=118, dist=4.2, aimh=1.3, h=1.3, follow=True)),
 ("T-08", 0): dict(fx=[("camp_mass", "box", (0, -2300, 1.5), (3600, 3200, 3), (.62, .5, .34, 1)),
                                       ("camp_fires", "box", (0, -2300, 3.2), (3400, 3000, .2), (1, .5, .1, 1), dict(emit=3, wire=True))],
                   crowd=[("c_magadha_army", "block", (0, -2300, 3600, 3200), 140, 180)],
                   cam=dict(pos=(-8, .6, 30), aim=(0, -2600, 0), amt=10)),
 ("T-08", 1): dict(o=(0, 0, 12), cast=[("water_carrier", -.45, 1.1, 180)], props=[("chalk_marks", .32, 1.86, 1.5, 0)],
                   cam=dict(on="water_carrier", az=104, dist=2.3)),
 ("T-09", 0): dict(crowd=[("c_women_mathura", "line", (-7, -1.1, 7, -1.1), 12, 0, dict(z=12)),
                          ("c_magadha_army", "block", (0, -420, 600, 240), 90, 180)],
                   props=[("chariot", -6, -300, 0, 0), ("chariot", 7, -292, 0, 0)],
                   fx=[("battle_dust", "box", (0, -330, 14), (420, 200, 28), (.7, .62, .46, .35))],
                   cam=dict(pos=(3.5, 1.0, 16.8), aim=(0, -300, 0))),     # high over the women's shoulders
 ("T-09", 1): dict(o=(0, -300, 0), cast=[("balarama", 0, 0, 0, dict(walk=(-2.5, 0, 0)))],
                   crowd=[("c_magadha_army", "block", (0, -9, 26, 12), 36, 180)],
                   props=[("plough", 0, -.5, 0, 0, dict(held="balarama"))],
                   fx=[("battle_dust", "box", (0, -6, 4), (60, 40, 8), (.7, .62, .46, .35))],
                   cam=dict(on="balarama", az=28, dist=7.5, aimh=1.3, h=1.4, follow=True)),
 ("T-09", 2): dict(crowd=[("c_women_mathura", "line", (-2, -1.1, 2, -1.1), 5, 0, dict(z=12))],
                   cam=dict(on=("c_women_mathura", 2), front=22)),
 ("T-10", 0): dict(o=(0, 0, 12), cast=[("water_carrier", -.45, 1.1, 180)], props=[("chalk_marks", .32, 1.86, 1.5, 0)],
                   cam=dict(aim=(.9, 1.86, 1.5), az=12, dist=.95, h=1.5)),
 ("T-10", 1): dict(tod="night", crowd=[("c_magadha_army", "block", (0, -150, 300, 120), 80, 180)],
                   fx=[("torches", "box", (0, -150, 2.4), (300, 120, .3), (1, .5, .1, 1), dict(emit=6))],
                   cam=dict(pos=(0, -.4, 20), aim=(0, -150, 0))),
 ("T-10", 3): dict(crowd=[("c_magadha_army", "block", (0, -60, 160, 60), 50, 180)],
                   fx=[("siege_tower_fire", "box", (12, -7, 7), (5, 5, 14), (1, .4, .08, 1), dict(emit=8))],
                   cam=dict(pos=(-16, -.4, 20), aim=(12, -7, 8))),
 ("T-10", 5): dict(o=(0, 0, 12), cast=[("water_carrier", -.45, .95, 180, dict(walk=(0, -1.2, 0)))],
                   props=[("chalk_marks", .32, 1.86, 1.5, 0)], cam=dict(pos=(.9, .1, 1.6), aim=(.9, 1.86, 1.5), amt=1.4)),
 ("T-11", 0): dict(fx=[("wildfire", "frustum", (0, 0, 296), (1900, 1900, 590), (1, .35, .05, 1), dict(emit=4, wire=True))],
                   cast=[("balarama", -1, 0, 0, dict(z=600)), ("krishna", 1.4, 2.4, 180, dict(z=600))],
                   cam=dict(pos=(-140, -1500, 660), aim=(0, 0, 360), amt=40)),
 ("T-11", 1): dict(o=(0, 0, 600), cast=[("balarama", -1, 0, 0), ("krishna", 1.6, 3.2, 180)],
                   fx=[("smoke_bank", "box", (2, 9, 4), (30, 12, 9), (.35, .33, .3, .5)),
                       ("fire_glow", "box", (0, 16, 2), (40, 2, 6), (1, .35, .05, 1), dict(emit=10))],
                   cam=dict(on="balarama", front=-16, dist=3.4)),
 ("T-11", 2): dict(o=(0, 0, 600), cast=[("krishna", 0, -24, 180, dict(walk=(0, -14, -42))), ("balarama", -1.8, -23, 180, dict(walk=(0, -13, -40)))],
                   fx=[("fire_wall", "box", (0, 6, -20), (120, 4, 80), (1, .35, .05, 1), dict(emit=10))],
                   cam=dict(on="krishna", az=18, dist=22, aimh=1.0, h=-14, follow=True)),
 ("T-12", 0): dict(cast=[("kalayavana", 0, 0, 180)], crowd=[("c_yavana_army", "block", (0, -40, 70, 50), 60, 180)],
                   fx=[("dropped_sword", "box", (.7, .4, .05), (.08, 1.0, .03), (.7, .7, .72, 1))],
                   cam=dict(on="kalayavana", az=78, dist=11, aimh=1.2)),
 ("T-12", 1): dict(cast=[("kalayavana", 0, 0, 180)], crowd=[("c_yavana_army", "block", (0, -40, 70, 50), 60, 180)],
                   cam=dict(on="kalayavana", front=-20)),
 ("T-12", 2): dict(cast=[("krishna", 0, 60, 180, dict(walk=(0, 8, 0))), ("kalayavana", -1.6, 56.8, 180, dict(walk=(0, 8, 0)))],
                   props=[("lotus_garland", 0, 0, 1.36, 0, dict(held="krishna"))],
                   cam=dict(on="krishna", az=14, dist=3.3, aimh=1.05, h=.9, follow=True)),
 ("T-13", 0): dict(sets=[("dvaraka_shore", (0, 0, 0), None), ("dvaraka_city", (0, 320, -74), (0, 320, 0))],
                   fx=[("displaced_water", "tube", (0, 400, 2), (1000, 420, 4), (.9, .95, 1, .5), dict(grow=(.9, 1.15)))],
                   cam=dict(pos=(-90, 26, 18), aim=(0, 320, 26), amt=22)),
 ("T-13", 1): dict(crowd=[("c_sailors", "line", (-3, -6, 3, -6.6), 5, 180)], cam=dict(on=("c_sailors", 2), front=-22, dist=5.5)),
 ("T-14", 0): dict(set="kundina_city", crowd=[("c_kings", "block", (0, 0, 6, 240), 70, 180, dict(walk=(0, 4, 0)))],
                   cam=dict(pos=(-3.5, -150, 14), aim=(0, -20, 2), amt=5)),
 ("T-14", 1): dict(o=(0, 5, 0), cast=[("jarasandha", -1, 1.2, 0), ("shishupala", 1.1, 1.5, 0)],
                   crowd=[("c_kings", "block", (0, 5, 12, 4), 18, 0)],
                   fx=[("fire_bowl", "cyl", (0, -1.4, .4), (1.1, 1.1, .5), (1, .45, .1, 1), dict(emit=12))],
                   cam=dict(on="jarasandha", az=8, dist=4.4, aimh=1.4, h=.9, amt=.8)),
 ("T-14", 2): dict(QUART, tod="day", cast=[("rukmini", 0, 2.35, 180)], cam=dict(on="rukmini", az=102, dist=2.2)),
 ("T-14", 3): dict(set="open_country", cast=[("balarama", 0, 0, 0)], cam=dict(on="balarama", front=14)),
 ("T-15", 0): dict(QUART, cast=[("rukmini", 1.0, -1.7, 0)], props=[("wedding_dress", 0, 0, 0, 0, dict(held="rukmini")), ("lamp_kundina", 1.9, -1.2, .5, 0)],
                   cam=dict(on="rukmini", front=20)),
 ("T-15", 1): dict(QUART, cast=[("rukmini", 1.0, -1.7, 0)], props=[("wedding_dress", 0, 0, 0, 0, dict(held="rukmini"))],
                   fx=[("hand_on_fold", "ball", (1.12, -1.98, 1.0), (.09, .07, .05), (.8, .6, .5, 1))],
                   cam=dict(aim=(1.12, -1.98, 1.0), az=12, dist=.75, h=1.2)),
 ("T-16", 0): dict(o=(0, -96, 0), cast=[("rukmini", 0, 0, 180, dict(walk=(0, 3, 0)))],
                   props=[("wedding_dress", 0, 0, 0, 0, dict(held="rukmini"))],
                   crowd=[("c_guards", "ring", (0, 0, 3.6, 0), 16, 180, dict(walk=(0, 3, 0))),
                          ("c_procession", "line", (-7, -44, -7, 50), 24, 90), ("c_procession", "line", (7, -44, 7, 50), 24, -90)],
                   cam=dict(pos=(0, -30, 9), aim=(0, 30, 1.5), amt=4.5)),
 ("T-16", 1): dict(o=(0, -96, 0), crowd=[("c_guards", "ring", (0, 0, 3.6, 0), 16, 180)], cam=dict(on=("c_guards", 6), front=-24)),
 ("T-16", 2): dict(o=(0, -96, 0), cast=[("rukmini", 0, 0, 180, dict(walk=(0, 2, 0)))],
                   crowd=[("c_guards", "ring", (0, 0, 3.6, 0), 16, 180, dict(walk=(0, 2, 0)))],
                   cam=dict(on="rukmini", front=10, follow=True)),
 ("T-17", 0): dict(o=(0, 4.4, 0), cast=[("rukmini", 0, -1.2, 0, dict(z=.4)), ("maid", -.95, -.5, 0, dict(z=.4))], cam=dict(on="rukmini", front=10)),
 ("T-17", 1): dict(o=(0, 4.4, 0), cast=[("rukmini", 0, -1.2, 0, dict(z=.4))], cam=dict(on="rukmini", front=-22)),
 ("T-17", 2): dict(cast=[("rukmini", 0, -6, 0, dict(walk=(0, -5, 0)))], crowd=KINGS,
                   fx=[("dropped_cup", "cyl", (-4.2, -11.5, .06), (.1, .1, .12), (.8, .7, .3, 1))],
                   cam=dict(on="rukmini", az=14, dist=4.6, aimh=1.3, h=1.5, follow=True)),
 ("T-18", 0): dict(cast=[("rukmini", 0, -16, 0)], crowd=KINGS, cam=dict(on="rukmini", front=16)),
 ("T-18", 1): dict(cast=[("krishna", 0, -34, 180, dict(z=.7))], crowd=KINGS, props=[("chariot", 0, -34, 0, 180)],
                   cam=dict(pos=(0, -16.45, 1.55), aim=(0, -34, 2.0))),
 ("T-18", 2): dict(cast=[("rukmini", 0, -16, 0)], crowd=KINGS, cam=dict(on="rukmini", front=-12, amt=.5)),
 ("T-19", 0): dict(cast=[("krishna", 0, -20, 90, dict(z=.7)), ("rukmini", 1.7, -20, -90, dict(walk=(-1.0, 0, .7)))],
                   props=[("chariot", 0, -20, 0, 0)], crowd=[("c_kings", "ring", (0, -20, 15, 40), 26, 0)],
                   cam=dict(pos=(5.4, -25.5, 1.0), aim=(.6, -20, 1.5), amt=1.2)),
 ("T-19", 1): dict(props=[("chariot", 0, -20, 0, 0, dict(walk=(0, -25, 0)))],
                   cast=[("krishna", 0, .1, 0, dict(z=.7, on="chariot")), ("rukmini", .55, .35, 0, dict(z=.7, on="chariot")),
                         ("daruka", -.4, -.75, 0, dict(z=.7, on="chariot")), ("balarama", 7, -42, 180)],
                   crowd=[("c_kings", "ring", (0, -20, 15, 40), 26, 0)],
                   cam=dict(pos=(11, -52, 1.2), aim=(0, -22, 1.4), pan=(0, -22, 0))),
 ("T-19", 2): dict(props=[("chariot", 0, -60, 0, 0, dict(walk=(0, -15, 0)))],
                   cast=[("krishna", 0, .1, 150, dict(z=.7, on="chariot")), ("rukmini", .55, .35, 0, dict(z=.7, on="chariot"))],
                   cam=dict(pos=(-1.9, -56.6, 1.35), aim=(0, -59.9, 2.2), travel=(0, -15, 0))),
 ("T-19", 3): dict(crowd=[("c_kings", "ring", (0, -20, 15, 40), 30, 0)],
                   fx=[("dust_wall", "box", (0, -44, 3), (30, 6, 6), (.7, .62, .46, .35))],
                   cam=dict(pos=(-13, -7, 3.0), aim=(0, -20, 1.2), pan=(2, -16, 0))),
 ("T-19", 4): dict(props=[("conch", 0, -70, 1.6, 20)], cam=dict(aim=(0, -70, 1.6), az=30, dist=.85, h=1.6)),
}
# ---- v004: the shots the recut adds (beats from the plan; Krishna is never seen from the front)
FIRE = (1, .55, .22)
NIGHT_WALL = dict(set="mathura", tod="night", sun=1.4, amb=.6,
                  fill=[((x, -4, 14), 6000, FIRE) for x in (-24, -8, 8, 24)] +
                       [((x, -30, 3), 20000, FIRE) for x in (-30, 0, 30)])
S.update({
 ("N-01", 0): dict(set="mathura", tod="dawn", cast=[("krishna", 0, 14, 0, dict(walk=(0, -18, 0)))],
                   props=[("lotus_garland", 0, 0, 1.36, 0, dict(held="krishna"))],
                   crowd=[("c_guards", "line", (3, 1.0, 5, 1.0), 2, 0, dict(z=12))],
                   cam=dict(pos=(2.6, 32, 3.4), aim=(0, -8, 2.6))),
 ("N-01", 1): dict(set="mathura", tod="dawn", cast=[("krishna", 0, -6, 0, dict(walk=(0, -3.4, 0)))],
                   cam=dict(on="krishna", az=180, dist=1.7, aimh=.12, h=.25, follow=True)),
 ("N-02", 0): dict(set="mathura", tod="dawn", crowd=[("c_yavana_army", "block", (0, -420, 900, 300), 220, 180)],
                   cam=dict(pos=(-22, -2.5, 22), aim=(0, -500, 0))),
 ("N-02", 1): dict(set="mathura", tod="dawn", cast=[("kalayavana", 0, -120, 180, dict(z=1.25))],
                   props=[("war_horse", 0, -120, 0, 180)],
                   crowd=[("c_yavana_army", "block", (0, -150, 80, 40), 60, 180)],
                   cam=dict(on="kalayavana", front=-65, dist=9, aimh=.6, h=2.6)),
 ("N-07", 0): dict(set="milk_ocean", tod="dusk", o=(0, -640, 0),
                   cast=[("indra", 0, -8, 180)],
                   crowd=[("c_devas", "block", (0, -16, 60, 10), 40, 180, dict(walk=(0, 6, 0))),
                          ("c_asuras", "block", (0, 24, 60, 10), 40, 0, dict(walk=(0, -6, 0)))],
                   fx=[("thunderbolt", "box", (0, 6, 40), (.6, .6, 80), (.85, .9, 1, 1), dict(emit=30, show=True))],
                   cam=dict(pos=(5, -24, 1.4), aim=(0, -8, 4))),
 ("N-07", 1): dict(set="milk_ocean", tod="dusk", o=(0, -640, 0), cast=[("bali", 0, 22, 0)],
                   crowd=[("c_asuras", "block", (0, 28, 30, 8), 20, 0)],
                   fx=[("illusion_veil", "ball", (0, 24, 3), (14, 10, 8), (.4, .3, .6, .4))],
                   cam=dict(on="bali", front=20, dist=5.5)),
 ("N-07", 2): dict(set="milk_ocean", tod="dusk", o=(0, -640, 0),
                   crowd=[("c_devas", "block", (0, -12, 50, 8), 36, 180, dict(walk=(0, 9, 0))),
                          ("c_asuras", "block", (0, 12, 50, 8), 36, 0, dict(walk=(0, -9, 0)))],
                   fx=[("storm_dust", "box", (0, 0, 3), (60, 10, 6), (.6, .58, .55, .35))],
                   cam=dict(pos=(-32, 0, 4), aim=(0, 0, 1.5), pan=(0, 4, 0))),
 ("N-08", 0): dict(set="milk_ocean", tod="dusk", o=(0, -600, 0), cast=[("rahu", 0, -2, 180)],
                   crowd=[("c_devas", "line", (-10, -2, -1.2, -2), 6, 180), ("c_devas", "line", (1.2, -2, 10, -2), 6, 180)],
                   fx=[("disc_flash", "ball", (0, -2.2, 1.6), (.5, .5, .5), (1, .9, .6, 1), dict(emit=60))],
                   cam=dict(on="rahu", front=8, dist=4.2)),
 ("N-13", 0): dict(set="open_country", tod="dawn", cast=[("brahmin", 0, 400, 180, dict(walk=(0, 5, 0)))],
                   props=[("war_horse", .6, 360, 0, 180, dict(walk=(0, 42, 0)))],
                   crowd=[("c_guards", "line", (.6, 360, .6, 360.1), 1, 180, dict(z=1.25, walk=(0, 42, 0)))],
                   cam=dict(pos=(7, 384, 1.4), aim=(0, 398, 1.3), pan=(0, 6, 0))),
 ("N-15", 0): dict(set="mathura", tod="dusk", cast=[("jarasandha", 0, -2300, 180)],
                   fx=[("camp_fires", "box", (0, -2312, 1), (40, 6, 2), (1, .5, .1, 1), dict(emit=6))],
                   cam=dict(on="jarasandha", front=14)),
 ("N-16", 0): dict(set="mathura", tod="day",
                   props=[("chariot", -6, -110, 40, 0, dict(walk=(0, 0, -38))), ("chariot", 7, -102, 50, 0, dict(walk=(0, 0, -48)))],
                   fx=[("glare_a", "ball", (-6, -110.5, 41.2), (3, 3, 3), (1, .95, .8, 1), dict(emit=25, walk=(0, 0, -38), show=True)),
                       ("glare_b", "ball", (7, -102.5, 51.2), (3, 3, 3), (1, .95, .8, 1), dict(emit=25, walk=(0, 0, -48), show=True))],
                   cam=dict(pos=(0, -8, 15), aim=(0, -110, 30))),
 ("N-16", 1): dict(set="mathura", tod="day", props=[("chariot", 0, -300, 0, 0)],
                   cast=[("krishna", 0, .1, 0, dict(z=.7, on="chariot"))],
                   fx=[("glare", "ball", (0, -301, 2.4), (6, 6, 6), (1, .95, .8, 1), dict(emit=40))],
                   cam=dict(pos=(1.2, -284, 2.0), aim=(0, -300, 2.4))),
 ("N-17", 0): dict(set="mathura", o=(0, -300, 0), cast=[("balarama", 0, 0, 0, dict(walk=(-1.5, 0, 0)))],
                   props=[("plough", 0, -.5, 0, 0, dict(held="balarama"))],
                   crowd=[("c_magadha_army", "block", (0, -3.2, 8, 3), 14, 180)],
                   fx=[("battle_dust", "box", (0, -6, 3), (40, 30, 6), (.7, .62, .46, .35))],
                   cam=dict(on="balarama", az=62, dist=3.4, aimh=1.2, h=1.1, follow=True)),
 ("N-17", 1): dict(set="mathura", o=(0, -300, 0),
                   crowd=[("c_elephants", "line", (-20, -40, 20, -40), 6, 180, dict(walk=(0, 10, 0)))],
                   fx=[("arrow_streaks", "box", (-30, -38, 3.2), (14, .04, .04), (1, .9, .7, 1), dict(emit=20, walk=(70, 0, -1)))],
                   cam=dict(pos=(-26, -25, 2), aim=(0, -38, 2.6))),
 ("N-18", 0): dict(NIGHT_WALL, o=(0, 0, 12),
                   fx=[("fire_arrow_%d" % i, "box", (x, -60 + 3 * i, 20 + 2 * (i % 3)), (.05, 2.2, .05), (1, .5, .1, 1),
                        dict(emit=40, walk=(0, 56, -18), show=True))
                       for i, x in enumerate((-9, -5, -2, 1, 3, 6, 9, 12))],
                   cam=dict(pos=(4, 3, 1.8), aim=(0, -40, 10))),
 ("N-18", 1): dict(NIGHT_WALL, crowd=[("c_elephants", "line", (-4, -30, 4, -30), 3, 180, dict(walk=(0, 24, 0)))],
                   fx=[("torches", "box", (0, -40, 2.4), (40, 20, .3), (1, .5, .1, 1), dict(emit=6))],
                   cam=dict(pos=(16, -24, 3), aim=(0, -14, 3.5))),
 ("N-18", 2): dict(NIGHT_WALL, fx=[("flood", "box", (0, -40, 2), (700, 60, 4), (.2, .25, .3, .9), dict(walk=(0, 0, 8), show=True))],
                   cam=dict(pos=(14, -9, 16), aim=(-12, -36, 6))),
 ("N-19", 0): dict(set="mucukunda_cave", cast=[("kalayavana", 0, -22, 180, dict(walk=(0, 16, 0)))],
                   cam=dict(pos=(0, 13, 1.6), aim=(0, -15, 1.6))),
 ("N-19", 1): dict(set="mucukunda_cave", cast=[("mucukunda", 0, 12, 0, dict(z=.8))],
                   fill=[((.9, 10.6, 2.2), 60, (1, .8, .6))],
                   cam=dict(on="mucukunda", front=0)),
 ("N-19", 2): dict(set="mucukunda_cave", cast=[("kalayavana", 0, 9, 180), ("mucukunda", 0, 12, 0, dict(z=.8))],
                   fx=[("burn", "ball", (0, 9, 1), (1.2, 1.2, 2.2), (1, .45, .1, 1), dict(emit=40, grow=(.3, 1.6)))],
                   cam=dict(pos=(3.2, 3.5, 1.5), aim=(0, 9, 1.2))),
 ("N-23", 0): dict(set="open_country", tod="day", cast=[("rukmi", 0, 0, 180)],
                   crowd=[("c_kings", "block", (0, 7, 14, 4), 16, 0)],
                   cam=dict(on="rukmi", front=-20)),
 ("N-23", 1): dict(set="open_country", tod="day",
                   cast=[("rukmi", 0, .1, 0, dict(z=.7, on="chariot"))],
                   props=[("chariot", 0, 0, 0, 0), ("bow", .35, -.35, 1.3, 0, dict(held="rukmi"))],
                   fx=[("bow_snap", "ball", (.35, -.5, 2.1), (.1, .1, .1), (1, .9, .6, 1), dict(emit=50, show=True))],
                   cam=dict(pos=(3.4, -3.0, 2.4), aim=(.3, -.4, 2.0))),
 ("N-23", 2): dict(set="open_country", tod="day", props=[("chariot", 0, 0, 0, 0, dict(walk=(0, -18, 0)))],
                   cast=[("rukmi", 0, .1, 0, dict(z=.7, on="chariot"))],
                   fx=[("road_dust", "box", (0, 6, 1.5), (8, 12, 3), (.7, .62, .46, .35), dict(walk=(0, -18, 0)))],
                   cam=dict(pos=(4.5, -2, 2.0), aim=(0, 0, 1.6), travel=(0, -18, 0))),
 ("N-24", 0): dict(set="open_country", tod="day",
                   props=[("chariot", x, -40, 0, 0, dict(walk=(0, 34, 0))) for x in (-12, -4, 4, 12)] +
                         [("chariot", x, 40, 0, 180, dict(walk=(0, -34, 0))) for x in (-10, -2, 6, 14)],
                   fx=[("clash_dust", "box", (0, 0, 3), (50, 14, 6), (.7, .62, .46, .35))],
                   cam=dict(pos=(-48, 0, 6), aim=(0, 0, 1.5))),
 ("N-24", 1): dict(set="open_country", tod="day", props=[("chariot", 0, -8, 0, 0, dict(walk=(0, 10, 0)))],
                   fx=[("clash_dust", "box", (0, 0, 1.5), (14, 8, 3), (.7, .62, .46, .35))],
                   cam=dict(pos=(3.4, -4, .45), aim=(0, -1, .8))),
 ("N-27", 0): dict(set="kundina_temple", crowd=KINGS + [("c_guards", "line", (-9, -12, 9, -12), 10, 0)],
                   cast=[("rukmini", 0, -16, 0)],
                   cam=dict(pos=(0, -36, 1.8), aim=(0, -18, 1.6))),
})
S[("T-10", 2)] = S[("T-10", 0)]
S[("T-10", 4)] = S[("T-10", 0)]

# From v003 every shot moves. A shot the board calls "static" gets the move its size suggests (a slow push
# on faces and inserts, a few degrees of arc on mediums, a slow drift on wides); ACTION and POV shots get a
# hand-held float. MOVES overrides that per shot or per unit.
MOVES = {
    "T-01_waoex": dict(rise=-14.0),                 # the aerial sinks toward the churning
    "T-02_347qc": dict(rise=-3.0),
    "T-13_sgipu": dict(push=12.0),                  # crane up and in as the city rises
    "T-16_ieqeu": dict(push=6.0),
    "T-18_82ert": dict(move="push", amt=1.2, shake=.002),
    "T-10": dict(shake=.004),                       # the siege night: everything is restless
    "T-11": dict(shake=.003),
    "T-19": dict(shake=.004),
    # v004 action: hand-held and restless
    "N-07": dict(shake=.005), "N-17": dict(shake=.007), "N-18": dict(shake=.006), "N-19": dict(shake=.004),
    "N-23": dict(shake=.006), "N-24": dict(shake=.008),
    "N-01_gate": dict(push=5.0),
    "N-16_glare": dict(push=4.0),
}


def camera_move(sh, c, mv, amt, kind, dist):
    extra = {}
    if mv == "static" and not c.get("pan"):
        if kind in ("CLOSE", "MCU", "ECU", "INSERT", "MACRO"):
            mv, amt = "push", dist * .08
        elif kind == "POV":
            mv, amt = "push", dist * .04
        elif kind == "MS":
            mv, amt = "arc", 5.0
        else:
            mv, amt = "drift", dist * .025
    if kind == "ACTION":
        extra["shake"] = .006
    elif kind == "POV":
        extra["shake"] = .0025
    if mv == "track":
        extra["linear"] = True
    for key in (sh["unit"], sh["id"]):
        o = MOVES.get(key, {})
        mv, amt = o.get("move", mv), o.get("amt", amt)
        for k in ("rise", "push", "shake", "linear"):
            if k in o:
                extra[k] = o[k]
    return mv, amt, extra


SKY = dict(day=((.55, .68, .9), 3.5, 1.0), dawn=((.75, .6, .55), 2.2, .6), dusk=((.7, .45, .4), 2.0, .5),
           night=((.02, .03, .07), .25, .25))


# ------------------------------------------------------------------ the shot
def shot_dir(root, sh):
    return os.path.join(root, "shots", "MV" + sh["movement"], sh["unit"], sh["id"])


def link_asset(root, kind, aid, here):
    p, _state = best_asset(root, kind, aid)
    name = "%s_%s" % (kind, aid)
    col = next((c for c in bpy.data.collections if c.name == name and c.library), None)
    if col is None:
        with bpy.data.libraries.load(p, link=True, relative=True) as (src, dst):
            dst.collections = [name]
        col = dst.collections[0]
    return col


def inst(col, name, into, loc, rot=0.0, tag=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = .4
    e.instance_type, e.instance_collection = "COLLECTION", col
    e.location, e.rotation_euler = loc, (0, 0, rad(rot))
    into.objects.link(e)
    for k, v in (tag or {}).items():
        e[k] = v
    return e


def key_move(ob, f0, f1, d):
    if not d or not any(d):
        return
    a = Vector(ob.location)
    ob.keyframe_insert("location", frame=f0)
    ob.location = a + Vector(d)
    ob.keyframe_insert("location", frame=f1)
    ob.location = a


def crowd_points(form, a, n):
    pts = []
    if form == "line":
        x0, y0, x1, y1 = a
        for i in range(n):
            t = i / max(n - 1, 1)
            pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    elif form == "ring":
        cx, cy, r, gap = a
        for i in range(n):
            ang = rad(gap / 2 + (360 - gap) * i / max(n - 1, 1)) - math.pi / 2
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    else:
        cx, cy, w, d = a
        cols = max(1, int(round(math.sqrt(n * w / max(d, .1)))))
        rows = int(math.ceil(n / cols))
        for i in range(n):
            c, r = i % cols, i // cols
            jx, jy = ((i * 37) % 11 - 5) / 22.0, ((i * 53) % 13 - 6) / 26.0
            pts.append((cx - w / 2 + (c + .5 + jx) * w / cols, cy - d / 2 + (r + .5 + jy) * d / rows))
    return pts


def aim_rot(pos, aim, compat=None):
    q = (Vector(aim) - Vector(pos)).to_track_quat("-Z", "Y")
    return q.to_euler("XYZ", compat) if compat is not None else q.to_euler()


def enable_passes(scene, vl):
    on = []
    for name in ("combined", "z", "mist", "position", "normal", "vector", "uv", "object_index", "material_index",
                 "diffuse_direct", "diffuse_indirect", "diffuse_color", "glossy_direct", "glossy_indirect",
                 "glossy_color", "transmission_direct", "transmission_indirect", "transmission_color",
                 "emit", "environment", "ambient_occlusion", "shadow",
                 "cryptomatte_object", "cryptomatte_material", "cryptomatte_asset"):
        attr = "use_pass_" + name
        if hasattr(vl, attr):
            try:
                setattr(vl, attr, True)
                on.append(name)
            except Exception:
                pass
    if hasattr(vl, "pass_cryptomatte_depth"):
        vl.pass_cryptomatte_depth = 6
    cy = getattr(vl, "cycles", None)
    if cy is not None:
        for name in ("use_pass_volume_direct", "use_pass_volume_indirect", "use_pass_shadow_catcher",
                     "denoising_store_passes"):
            if hasattr(cy, name):
                try:
                    setattr(cy, name, True)
                    on.append(name.replace("use_pass_", ""))
                except Exception:
                    pass
    for g in ("key", "sky", "practical"):
        try:
            if g not in [x.name for x in vl.lightgroups]:
                vl.lightgroups.add(name=g)
            on.append("lightgroup_" + g)
        except Exception:
            pass
    return on


def exr_output(scene, path):
    r = scene.render
    im = r.image_settings
    if hasattr(im, "media_type"):
        try:
            im.media_type = "MULTI_LAYER_IMAGE"
        except Exception:
            pass
    im.file_format = "OPEN_EXR_MULTILAYER"
    im.color_depth = "16"
    try:
        im.exr_codec = "DWAA"
    except Exception:
        im.exr_codec = "ZIP"
    r.filepath = path


def requirements_text(sh, names, links, passes):
    nm = lambda c: names["characters"].get(c, {}).get("name", c)
    L = ["SHOT REQUIREMENTS — %s" % sh["id"], "=" * 60,
         "%s · movement %s · unit %s (%s) · from %s" % (sh["type"], sh["movement"], sh["unit"], sh["unit_title"], sh["source_scene"]),
         "cut %d–%d on the trailer timeline · %d frames · file frames %d–%d (+%d handles)"
         % (sh["cut_in"], sh["cut_out"], sh["frames"], sh["frame_start"], sh["frame_end"], sh["handles"]),
         "board rev %s — if the manifest shows another rev for this shot, this file is stale" % sh["rev"], "",
         "ON SCREEN", sh["text"], ""]
    if sh.get("line"):
        L += ["SPOKEN (%s)" % sh["line"]["kind"], "%s: %s" % (sh["line"]["speaker"], sh["line"]["en"]), sh["line"]["te"], ""]
    c = sh["camera"]
    L += ["CAMERA", "%smm · %sm · %s · %s" % (c["lens_mm"], c["height_m"], c["angle"], c["move"]), "",
          "SET", "%s (%s)" % (sh["set"], names["sets"].get(sh["set"].split("/")[0], "")), "",
          "IN FRAME", ", ".join(nm(x) for x in sh["cast"]) or "nobody",
          "PROPS", ", ".join(names["props"].get(p, p) for p in sh["props"]) or "none",
          "KRISHNA", "%s — %s" % (sh["krishna"], "his face may be shown" if sh["krishna"] == "face"
                                  else "his face must not be in this shot"), "",
          "TIME OF DAY", sh["time_of_day"], "",
          "STAGING", sh["staging"] or "stand-in distances; see the STAGING table in trailer_shots.py", "",
          "HOUDINI OWES", sh["houdini"], "", "NUKE OWES", sh["nuke"], "", "SOUND", sh["sound"], "",
          "LINKED ASSETS (proxy — swap the library path when a later state is published)"]
    L += ["  " + x for x in links]
    L += ["", "RENDER PASSES ON", ", ".join(passes), "",
          "Generated by %s. Hand work goes in a new version file, not this one." % GEN]
    return "\n".join(L)


def build_shot(root, sh, names):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = sh["id"]
    d = shot_dir(root, sh)
    for sub in ("blender", "houdini", "publish/layout", "publish/camera", "cache", "renders/preview",
                "renders/blocking/" + VER, "comp"):
        os.makedirs(os.path.join(d, sub), exist_ok=True)
    blend = os.path.join(d, "blender", "%s_blocking_%s.blend" % (sh["id"], VER))
    bpy.ops.wm.save_as_mainfile(filepath=blend)          # saved first so library paths can be relative

    st = S.get((sh["unit"], sh["index"]), {})
    o = Vector(st.get("o", (0, 0, 0)))
    f0, f1 = sh["frame_start"], sh["frame_end"]
    scene.frame_start, scene.frame_end = f0, f1
    scene.frame_set(f0)
    scene.render.fps = 24
    cols = {}
    for n in ("SET", "CAST", "PROPS", "FX_PROXY", "CAM", "LIGHTS"):
        cols[n] = bpy.data.collections.new(n)
        scene.collection.children.link(cols[n])
    links = []

    # --- sets
    set_id = st.get("set") or sh["set"].split("/")[0]
    sets = st.get("sets") or [(set_id, (0, 0, 0), None)]
    for sid, at, to in sets:
        e = inst(link_asset(root, "set", sid, blend), "SET_" + sid, cols["SET"], at, 0, dict(asset="set/" + sid))
        if to is not None:
            key_move(e, f0, f1, Vector(to) - Vector(at))
        links.append("set/%s  →  %s" % (sid, os.path.relpath(best_asset(root, "set", sid)[0], root).replace("\\", "/")))

    # --- props first: people may ride them
    where, props = {}, {}
    for row in st.get("props", []):
        pid, x, y, z, rot = row[:5]
        op = row[5] if len(row) > 5 else {}
        e = inst(link_asset(root, "prop", pid, blend), "PROP_%s" % pid, cols["PROPS"],
                 o + Vector((x, y, z)), rot, dict(asset="prop/" + pid))
        props.setdefault(pid, e)
        e["_held"] = op.get("held", "")
        e["_local"] = (x, y, z)
        key_move(e, f0, f1, op.get("walk"))
        links.append("prop/%s  →  %s" % (pid, os.path.relpath(best_asset(root, "prop", pid)[0], root).replace("\\", "/")))

    # --- cast
    for row in st.get("cast", []):
        cid, x, y, rot = row[:4]
        op = row[4] if len(row) > 4 else {}
        z = op.get("z", 0)
        ccol = link_asset(root, "char", cid, blend)
        e = inst(ccol, "CH_" + cid, cols["CAST"], o + Vector((x, y, z)), rot, dict(asset="char/" + cid))
        hk = ccol.get("height_m")
        walk = op.get("walk")
        if op.get("on") and op["on"] in props:
            par = props[op["on"]]
            e.parent = par
            e.location = (x, y, z)
            pos = Vector(par.location) + Vector((x, y, z))
        else:
            pos = o + Vector((x, y, z))
            key_move(e, f0, f1, walk)
        if cid == "krishna" and sh["krishna"] != "face":
            e["withheld"] = sh["krishna"]
        k = (float(hk) / FIGURE) if hk else (.62 if cid == "fisher_child" else 1)
        where[cid] = dict(pos=pos, rot=rot, walk=Vector(walk) if walk else Vector((0, 0, 0)), k=k)
        links.append("char/%s  →  %s" % (cid, os.path.relpath(best_asset(root, "char", cid)[0], root).replace("\\", "/")))
    for e in cols["PROPS"].objects:                       # things in a hand travel with the hand
        h = e.get("_held", "")
        if h and ("CH_" + h) in bpy.data.objects:
            e.parent = bpy.data.objects["CH_" + h]
            e.location = tuple(e["_local"])
            e.animation_data_clear()

    # --- crowds
    for row in st.get("crowd", []):
        cid, form, a, n, rot = row[:5]
        op = row[5] if len(row) > 5 else {}
        col = link_asset(root, "char", cid, blend)
        grp = bpy.data.objects.new("CROWD_%s_%d" % (cid, len([x for x in cols["CAST"].objects if x.name.startswith("CROWD_" + cid)])), None)
        grp.location = o
        cols["CAST"].objects.link(grp)
        grp["asset"], grp["agents"] = "char/" + cid, n
        key_move(grp, f0, f1, op.get("walk"))
        z = op.get("z", 0)
        for i, (x, y) in enumerate(crowd_points(form, a, n)):
            face = rot
            if form == "ring":
                face = math.degrees(math.atan2(a[0] - x, -(a[1] - y)))
            e = inst(col, "%s_%03d" % (grp.name, i), cols["CAST"], (x, y, z), face)
            e.parent = grp
            where.setdefault((cid, i), dict(pos=o + Vector((x, y, z)), rot=face, walk=Vector(op.get("walk") or (0, 0, 0)), k=1))
        tag = "char/%s  →  %s" % (cid, os.path.relpath(best_asset(root, "char", cid)[0], root).replace("\\", "/"))
        if tag not in links:
            links.append(tag)

    # --- stand-ins for what Houdini will make
    for row in st.get("fx", []):
        name, kind, loc, scale, rgba = row[:5]
        op = row[5] if len(row) > 5 else {}
        ob = prim(cols["FX_PROXY"], "FXPROXY_" + name, kind, o + Vector(loc), scale, rgba=rgba, emit=op.get("emit", 0), seg=24)
        ob["fx_note"] = sh["houdini"]
        ob.display_type = "WIRE" if op.get("wire") else "TEXTURED"
        if rgba[3] < 1:
            ob.show_transparent = True
        if op.get("grow"):
            k0, k1 = op["grow"]
            base = Vector(ob.scale)
            ob.scale = (base.x * k0, base.y * k0, base.z)
            ob.keyframe_insert("scale", frame=f0)
            ob.scale = (base.x * k1, base.y * k1, base.z)
            ob.keyframe_insert("scale", frame=f1)
        key_move(ob, f0, f1, op.get("walk"))
        # From v003 the renders are meant to be watched: a stand-in that would read as a big grey or glowing
        # box is left out of the render (it stays in the viewport for layout); fire leaves its light behind.
        big = max(scale) > 6
        if VER not in ("v001", "v002") and not op.get("show") and (op.get("emit", 0) or rgba[3] < 1 or big):
            ob.hide_render = True
            if op.get("emit", 0):
                ld = bpy.data.lights.new("FXLIGHT_" + name, "POINT")
                ld.color = (1, .5, .18)
                ld.energy = min(2.0e6, 150.0 * op["emit"] * max(1.0, scale[0] * scale[1]) ** .5)
                ld.shadow_soft_size = max(.2, min(scale[0], scale[1]) * .3)
                lo = bpy.data.objects.new("FXLIGHT_" + name, ld)
                lo.location = o + Vector(loc) + Vector((0, 0, scale[2] * .5))
                cols["LIGHTS"].objects.link(lo)

    # --- camera
    c = st.get("cam", {})
    lens = float(sh["camera"]["lens_mm"])
    sensor_h = SENSOR_W * 1716.0 / 4096.0
    kind = sh["type"]
    subj = where.get(c.get("on")) if c.get("on") is not None else None
    travel = Vector(c.get("travel") or (0, 0, 0))
    if "pos" in c:
        pos, aim = o + Vector(c["pos"]), o + Vector(c["aim"])
        dist = (aim - pos).length
    else:
        if subj is not None:
            aimh = c.get("aimh", AIMH.get(kind, 1.2)) * subj["k"]
            aim = subj["pos"] + Vector((0, 0, aimh))
            az = c["az"] if "az" in c else subj["rot"] + c.get("front", 0)
        else:
            aim, az = o + Vector(c.get("aim", (0, 0, 1))), c.get("az", 0)
            aimh = aim.z - o.z
        dist = c.get("dist") or (FIGURE / FILL.get(kind, .8)) * lens / sensor_h
        pos = aim + Vector((math.sin(rad(az)) * dist, -math.cos(rad(az)) * dist, 0))
        pos.z = (subj["pos"].z if subj is not None else o.z) + c.get("h", aimh if kind in ("CLOSE", "MCU", "ECU") else sh["camera"]["height_m"])
        if c.get("follow") and subj is not None:
            travel = subj["walk"]
    cam_d = bpy.data.cameras.new("CAM_" + sh["id"])
    cam_d.lens, cam_d.sensor_width, cam_d.sensor_fit = lens, SENSOR_W, "HORIZONTAL"
    cam_d.clip_start, cam_d.clip_end = .05, 20000
    cam_d.dof.focus_distance = dist
    cam = bpy.data.objects.new("CAM_" + sh["id"], cam_d)
    cols["CAM"].objects.link(cam)
    scene.camera = cam
    mv, amt = sh["camera"]["move"], c.get("amt")
    if VER not in ("v001", "v002"):
        mv, amt, extra = camera_move(sh, c, mv, amt, kind, dist)
    else:
        extra = {}
    fwd = (aim - pos).normalized()
    right = fwd.cross(Vector((0, 0, 1))).normalized() if abs(fwd.z) < .999 else Vector((1, 0, 0))
    p1, a1 = pos.copy() + travel, aim.copy() + travel
    if c.get("pan"):
        a1 = aim + Vector(c["pan"])
    elif mv == "push":
        p1 = pos + fwd * (amt or dist * .14)
    elif mv == "pull":
        p1 = pos - fwd * (amt or dist * .5)
    elif mv == "drift" or (mv == "track" and not travel.length):
        p1 = pos + right * (amt or dist * .05)
        a1 = aim + right * (amt or dist * .05) * (0 if mv == "drift" else 1)
    elif mv == "crane":
        p1 = pos + Vector((0, 0, amt or 4))
    elif mv == "pan" and not travel.length:
        a1 = aim + right * dist * .2
    elif mv == "arc":                                   # orbit the subject by `amt` degrees
        ang = rad(amt or 6)
        off = pos - aim
        off = Vector((off.x * math.cos(ang) - off.y * math.sin(ang), off.x * math.sin(ang) + off.y * math.cos(ang), off.z))
        p1 = aim + off + travel
    if extra.get("rise"):
        p1 = p1 + Vector((0, 0, extra["rise"]))
    if extra.get("push"):
        p1 = p1 + (a1 - p1).normalized() * extra["push"]
    prev = None
    for f, p, a in ((f0, pos, aim), (f1, p1, a1)):
        e = aim_rot(p, a, prev)                    # the euler closest to the last key, so the camera never spins
        prev = e
        cam.location, cam.rotation_euler = p, e
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
    if cam.animation_data and cam.animation_data.action:
        fcs = cam.animation_data.action.fcurves if hasattr(cam.animation_data.action, "fcurves") else []
        try:
            fcs = list(fcs) or [fc for layer in cam.animation_data.action.layers for strip in layer.strips
                                for bag in strip.channelbags for fc in bag.fcurves]
        except Exception:
            fcs = list(fcs)
        for fc in fcs:
            for kp in fc.keyframe_points:              # follow shots move at the subject's pace; the rest ease
                kp.interpolation = "LINEAR" if (travel.length or extra.get("linear")) else "BEZIER"
                kp.easing = "AUTO"
            if extra.get("shake") and fc.data_path == "rotation_euler":
                m = fc.modifiers.new("NOISE")
                m.strength, m.scale, m.phase = extra["shake"], 9.0, 7.0 * fc.array_index + len(sh["id"])
    cam["shot_id"], cam["move"], cam["subject_distance_m"] = sh["id"], mv, round(dist, 3)
    cam_d.dof.use_dof = VER not in ("v001", "v002") and kind in ("CLOSE", "MCU", "ECU", "INSERT", "MACRO", "MS")
    cam_d.dof.aperture_fstop = 2.8 if kind in ("CLOSE", "MCU", "MS") else 4.0
    tgt = bpy.data.objects.new("AIM_" + sh["id"], None)
    tgt.location, tgt.empty_display_size = aim, .2
    cols["CAM"].objects.link(tgt)
    if VER not in ("v001", "v002"):
        for f, a in ((f0, aim), (f1, a1)):
            tgt.location = a
            tgt.keyframe_insert("location", frame=f)
        cam_d.dof.focus_object = tgt

    # --- light
    tod = st.get("tod") or sh["time_of_day"]
    sky, sun_e, amb = SKY.get(tod, SKY["day"])
    sun_e, amb = st.get("sun", sun_e), st.get("amb", amb)      # per-shot moon / ambient override
    for i, (at, energy, colr) in enumerate(st.get("fill", [])):  # per-shot practical fills (torches, fires)
        ld = bpy.data.lights.new("FILL_%d" % i, "POINT")
        ld.energy, ld.color, ld.shadow_soft_size = energy, colr, .4
        lo = bpy.data.objects.new("FILL_%d" % i, ld)
        lo.location = at                                        # world space, not shifted by the shot's o
        cols["LIGHTS"].objects.link(lo)
    sun_d = bpy.data.lights.new("SUN_key", "SUN")
    sun_d.energy, sun_d.color = sun_e, ((.65, .75, 1) if tod == "night" else (1, .95, .86))
    sun = bpy.data.objects.new("SUN_key", sun_d)
    el = dict(day=52, dawn=10, dusk=8, night=40).get(tod, 50)
    sun.rotation_euler = (rad(90 - el), 0, rad(-35))
    cols["LIGHTS"].objects.link(sun)
    world = bpy.data.worlds.new("WORLD_" + tod)
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (sky[0], sky[1], sky[2], 1)
        bg.inputs[1].default_value = amb
        if tod != "night":                     # a physical sky; the sun lamp carries the direct light
            try:
                tex = world.node_tree.nodes.new("ShaderNodeTexSky")
                types = [i.identifier for i in tex.bl_rna.properties["sky_type"].enum_items]
                tex.sky_type = "SINGLE_SCATTERING" if "SINGLE_SCATTERING" in types else types[0]
                tex.sun_disc = False
                tex.sun_elevation = rad(el)
                tex.sun_rotation = rad(-35)
                world.node_tree.links.new(tex.outputs["Color"], bg.inputs[0])
                bg.inputs[1].default_value = dict(day=.09, dawn=.07, dusk=.06).get(tod, .08)
            except Exception:
                pass
    scene.world = world
    for e in list(cols["PROPS"].objects):
        if e.name.startswith("PROP_lamp"):
            ld = bpy.data.lights.new("LAMP_practical", "POINT")
            ld.energy, ld.color, ld.shadow_soft_size = 60, (1, .62, .3), .05
            lo = bpy.data.objects.new("LAMP_practical", ld)
            lo.location = Vector(e.matrix_world.translation) + Vector((0, 0, .2)) if e.parent is None else Vector(e.location) + Vector((0, 0, .2))
            cols["LIGHTS"].objects.link(lo)
    if VER not in ("v001", "v002") and any(s[0] == "kundina_palace" for s in sets):
        night = tod == "night"
        moon, warm = (.55, .65, 1.0), (1.0, .9, .78)
        for nm, at, rx, size, energy, colr in (
                ("AREA_hall_well", (0, 4.6, 5.9), 0, (5, 4), 3000, warm),
                ("AREA_hall_bounce", (0, 5.0, 5.55), 0, (15, 11), 5000, warm),
                ("AREA_hall_door", (0, -1.9, 2.4), 90, (3, 4), 1500, warm),
                ("AREA_room_window", (40, 4.72, 1.7), -90, (1.3, 1.5), 140 if night else 700, moon if night else warm),
                ("AREA_room_front", (40, -1.4, 1.5), 90, (6, 2.2), 40 if night else 1200, moon if night else warm)):
            ld = bpy.data.lights.new(nm, "AREA")
            ld.shape, ld.size, ld.size_y = "RECTANGLE", size[0], size[1]
            ld.energy, ld.color = energy, colr
            lo = bpy.data.objects.new(nm, ld)
            lo.location, lo.rotation_euler = at, (rad(rx), 0, 0)
            cols["LIGHTS"].objects.link(lo)
            try:
                lo.lightgroup = "practical"
            except Exception:
                pass
        for lo in cols["LIGHTS"].objects:
            if lo.name.startswith("LAMP_practical"):
                lo.data.energy = 140 if night else 60

    # --- render set-up: Cycles, every pass, multilayer EXR
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = 4096, 1716, 25
    r.engine = "CYCLES"
    scene.cycles.samples, scene.cycles.use_denoising, scene.cycles.device = 16, False, "GPU"
    scene.cycles.use_adaptive_sampling = False
    r.use_motion_blur = False                             # the vector pass needs it off
    r.use_persistent_data = True
    vl = scene.view_layers[0]
    vl.name = "blocking"
    passes = enable_passes(scene, vl)
    for ob, g in ((sun, "key"),):
        try:
            ob.lightgroup = g
        except Exception:
            pass
    try:
        world.lightgroup = "sky"
        for ob in cols["LIGHTS"].objects:
            if ob.name.startswith("LAMP"):
                ob.lightgroup = "practical"
    except Exception:
        pass
    exr_output(scene, "//../renders/blocking/%s/%s_blocking_%s." % (VER, sh["id"], VER))
    r.use_stamp = False
    r.stamp_note_text = "%s  %s  %smm  %s" % (sh["id"], sh["type"], sh["camera"]["lens_mm"], sh["camera"]["move"])

    # --- the requirements, inside the file
    txt = bpy.data.texts.new("SHOT_REQUIREMENTS")
    txt.write(requirements_text(sh, names, links, passes))
    txt.use_fake_user = True
    for k in ("id", "rev", "unit", "movement", "type", "source_scene", "krishna", "frames", "cut_in", "cut_out", "handles"):
        scene["shot_" + k] = sh[k]
    scene["shot_text"], scene["shot_houdini"], scene["shot_nuke"] = sh["text"], sh["houdini"], sh["nuke"]
    scene["shot_sound"], scene["shot_staging"], scene["generator"] = sh["sound"], sh["staging"], GEN
    scene["pipeline_step"], scene["pipeline_version"] = "blocking", VER

    try:
        bpy.ops.file.make_paths_relative()
    except Exception:
        pass
    bpy.ops.wm.save_mainfile()

    # --- publishes for the applications downstream
    pub = {}
    usd = os.path.join(d, "publish", "layout", "%s_layout_%s.usd" % (sh["id"], VER))
    try:
        bpy.ops.wm.usd_export(filepath=usd, export_animation=True, selected_objects_only=False,
                              convert_orientation=True, export_global_forward_selection="NEGATIVE_Z",
                              export_global_up_selection="Y")      # Houdini is Y-up
        pub["layout_usd"] = os.path.relpath(usd, d).replace("\\", "/")
    except Exception as ex:
        pub["layout_usd_error"] = str(ex)[:200]
    abc = os.path.join(d, "publish", "camera", "%s_cam_%s.abc" % (sh["id"], VER))
    try:
        for ob in bpy.context.view_layer.objects:
            ob.select_set(ob == cam)
        bpy.context.view_layer.objects.active = cam
        bpy.ops.wm.alembic_export(filepath=abc, start=f0 - sh["handles"], end=f1 + sh["handles"], selected=True)
        pub["camera_abc"] = os.path.relpath(abc, d).replace("\\", "/")
    except Exception as ex:
        pub["camera_abc_error"] = str(ex)[:200]

    rec = dict(sh)
    rec.update(files=dict(blender="blender/%s_blocking_%s.blend" % (sh["id"], VER), **pub,
                          exr="renders/blocking/%s/%s_blocking_%s.####.exr" % (VER, sh["id"], VER),
                          playblast="renders/preview/%s_blocking_%s.mp4" % (sh["id"], VER),
                          still="renders/preview/%s_blocking_%s_still.png" % (sh["id"], VER)),
               assets=sorted({x.split("  ")[0] for x in links}), passes=passes,
               fx_proxies=[ob.name for ob in cols["FX_PROXY"].objects],
               camera_solved=dict(position=[round(v, 3) for v in pos], aim=[round(v, 3) for v in aim],
                                  distance_m=round(dist, 3)),
               staged=bool(st), generator=GEN, built_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
    with open(os.path.join(d, "shot.json"), "w", encoding="utf8") as fh:
        json.dump(rec, fh, ensure_ascii=False, indent=1)
    return rec


# -------------------------------------------------------------------- renders
def gpu_on():
    try:
        p = bpy.context.preferences.addons["cycles"].preferences
        for t in ("OPTIX", "CUDA"):
            try:
                p.compute_device_type = t
                break
            except Exception:
                continue
        p.get_devices()
        for dv in p.devices:
            dv.use = dv.type != "CPU"
    except Exception:
        pass


def still(root, sh):
    scene = bpy.context.scene
    r = scene.render
    keep = (r.engine, r.filepath, r.resolution_percentage, scene.cycles.samples, scene.cycles.use_denoising)
    if VER == "v001":                          # v001 stayed a grey blocking pass
        r.engine = "BLENDER_WORKBENCH"
        scene.display.shading.light, scene.display.shading.color_type = "STUDIO", "MATERIAL"
        scene.display.shading.show_shadows = True
    else:
        gpu_on()
        r.engine = "CYCLES"
        scene.cycles.device = "GPU"
        scene.cycles.samples, scene.cycles.use_denoising = 48, True
    r.resolution_percentage = 25
    if hasattr(r.image_settings, "media_type"):
        r.image_settings.media_type = "IMAGE"
    r.image_settings.file_format = "PNG"
    r.filepath = os.path.join(shot_dir(root, sh), "renders", "preview", "%s_blocking_%s_still.png" % (sh["id"], VER))
    scene.frame_set((sh["frame_start"] + sh["frame_end"]) // 2)
    bpy.ops.render.render(write_still=True)
    r.engine, r.resolution_percentage = keep[0], keep[2]
    scene.cycles.samples, scene.cycles.use_denoising = keep[3], keep[4]
    exr_output(scene, keep[1])


def playblast(root, sh):
    scene = bpy.context.scene
    r = scene.render
    if VER == "v001":
        r.engine = "BLENDER_WORKBENCH"
        scene.display.shading.light, scene.display.shading.color_type = "STUDIO", "MATERIAL"
        scene.display.shading.show_shadows = True
    else:                                      # EEVEE: the look-dev, at playblast speed
        r.engine = "BLENDER_EEVEE"
        try:
            scene.eevee.taa_render_samples = 16
        except Exception:
            pass
    r.resolution_x, r.resolution_y, r.resolution_percentage = 1024, 430, 100     # H.264 wants even sides
    r.use_stamp, r.use_stamp_note, r.use_stamp_frame, r.use_stamp_lens = True, True, True, True
    for k in ("use_stamp_date", "use_stamp_time", "use_stamp_render_time", "use_stamp_filename", "use_stamp_scene",
              "use_stamp_camera", "use_stamp_memory", "use_stamp_hostname"):
        if hasattr(r, k):
            setattr(r, k, False)
    r.stamp_font_size = 10
    im = r.image_settings
    if hasattr(im, "media_type"):
        im.media_type = "VIDEO"
    im.file_format = "FFMPEG"
    r.ffmpeg.format, r.ffmpeg.codec = "MPEG4", "H264"
    r.ffmpeg.constant_rate_factor = "MEDIUM"
    r.filepath = os.path.join(shot_dir(root, sh), "renders", "preview", "%s_blocking_%s.mp4" % (sh["id"], VER))
    bpy.ops.render.render(animation=True)


def exr(root, sh):
    gpu_on()
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.render.use_stamp = False
    bpy.ops.render.render(animation=True)


FINAL = dict(res=(1920, 804), samples=40)


def final_paths(root, sh):
    d = os.path.join(shot_dir(root, sh), "renders", "final", VER)
    return d, os.path.join(d, "%s_%s.####.png" % (sh["id"], VER)), \
        os.path.join(shot_dir(root, sh), "renders", "final", "%s_final_%s.mp4" % (sh["id"], VER))


def bad_frames(root, sh):
    """Frames of the final range that exist but are broken: empty placeholders or PNGs cut off when a render was
    stopped mid-frame (no IEND chunk at the end). Blender would skip them on a resume, so they must go."""
    d, pattern, _ = final_paths(root, sh)
    pre, post = dissolve_handles(root, sh)
    bad = []
    for f in range(sh["frame_start"] - pre, sh["frame_end"] + post + 1):
        fp = pattern.replace("####", "%04d" % f)
        if not os.path.exists(fp):
            continue
        try:
            n = os.path.getsize(fp)
            with open(fp, "rb") as fh:
                fh.seek(max(0, n - 12))
                ok = n > 100 and fh.read().endswith(b"IEND\xaeB`\x82")
        except OSError:
            ok = False
        if not ok:
            bad.append(fp)
    return bad


def clean_frames(root, sh):
    """Deletes broken frames (and the shot movie, which was made from them); returns how many went."""
    bad = bad_frames(root, sh)
    for fp in bad:
        os.remove(fp)
        print("trailer_shots: removed broken frame %s" % os.path.basename(fp), flush=True)
    mp4 = final_paths(root, sh)[2]
    if bad and os.path.exists(mp4):
        os.remove(mp4)
    return len(bad)


def dissolve_handles(root, sh):
    """Frames to render before and after the cut, so the editor has picture under every dissolve."""
    p = os.path.join(root, "pipeline", "transitions_%s.json" % VER)
    if not os.path.exists(p):
        return 0, 0
    pre = post = 0
    for t in json.load(open(p, encoding="utf8"))["transitions"]:
        if "dissolve" in t["type"] and t["frames"]:
            h = int(math.ceil(t["frames"] / 2.0)) + 2
            if t["after"] == sh["id"]:
                post = max(post, h)
            if t["before"] == sh["id"]:
                pre = max(pre, h)
    return pre, post


def final(root, sh):
    """The watchable render: Cycles on the GPU, denoised, motion blur on, every frame of the cut, written as a
    PNG sequence (it resumes where it stopped) and then encoded to an H.264 movie of exactly the cut length."""
    gpu_on()
    scene = bpy.context.scene
    r = scene.render
    r.engine = "CYCLES"
    cy = scene.cycles
    cy.device = "GPU"
    cy.samples, cy.use_adaptive_sampling, cy.adaptive_threshold = FINAL["samples"], True, .03
    cy.use_denoising = True
    try:
        cy.denoiser = "OPENIMAGEDENOISE"
        cy.denoising_use_gpu = True
    except Exception:
        pass
    cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces = 6, 3, 3, 4
    cy.caustics_reflective = cy.caustics_refractive = False
    cy.sample_clamp_indirect = 8.0
    r.use_motion_blur, r.motion_blur_shutter = True, .5
    r.resolution_x, r.resolution_y, r.resolution_percentage = FINAL["res"][0], FINAL["res"][1], 100
    r.use_persistent_data = True
    r.use_stamp = False
    vs = scene.view_settings
    try:
        vs.view_transform = "AgX"
        for lk in ("AgX - Medium High Contrast", "Medium High Contrast"):
            try:
                vs.look = lk
                break
            except Exception:
                continue
    except Exception:
        pass
    vl = scene.view_layers[0]
    for k in dir(vl):                      # the beauty only; the all-pass EXRs are a separate job
        if k.startswith("use_pass_") and k != "use_pass_combined":
            try:
                setattr(vl, k, False)
            except Exception:
                pass
    try:
        scene.use_nodes = False
    except Exception:
        pass
    im = r.image_settings
    if hasattr(im, "media_type"):
        im.media_type = "IMAGE"
    im.file_format, im.color_mode, im.color_depth = "PNG", "RGB", "8"
    d, pattern, mp4 = final_paths(root, sh)
    os.makedirs(d, exist_ok=True)
    clean_frames(root, sh)
    r.filepath = pattern.replace("####.png", "")          # Blender adds the frame number and .png
    r.use_overwrite, r.use_placeholder = False, True
    pre, post = dissolve_handles(root, sh)
    scene.frame_start, scene.frame_end = sh["frame_start"] - pre, sh["frame_end"] + post
    bpy.ops.render.render(animation=True)
    import shutil
    import subprocess
    ff = shutil.which("ffmpeg")
    if ff:
        subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", "24", "-start_number", str(sh["frame_start"]),
                        "-i", pattern.replace("####", "%04d"), "-frames:v", str(sh["frames"]),
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", mp4], check=False)


# ----------------------------------------------------------------------- main
def main(argv):
    o = dict(root=None, manifest=None, shots=None, assets=False, stills=False, playblast=False, exr=False, missing=False,
             wait=False, usd=None, asset=None, state="blocking", log="build_status.json", version="v001", force=False,
             final=False)
    i = 0
    while i < len(argv):
        k = argv[i].lstrip("-")
        if k in ("assets", "stills", "playblast", "exr", "missing", "wait", "force", "final"):
            o[k] = True
        else:
            o[k] = argv[i + 1]
            i += 1
        i += 1
    root = os.path.abspath(o["root"])
    global VER
    VER = o["version"]
    man = json.load(open(o["manifest"], encoding="utf8"))
    names = man["names"]
    os.makedirs(os.path.join(root, "pipeline", "logs"), exist_ok=True)
    log_p = os.path.join(root, "pipeline", "logs", o["log"])
    wait_p = os.path.join(root, "pipeline", "logs", "build_status.json")
    if o["wait"]:                 # queue behind a run that is already going
        import time
        while os.path.exists(wait_p) and json.load(open(wait_p, encoding="utf8")).get("phase") != "finished":
            time.sleep(20)
    if o["usd"]:
        p, n = import_usd_asset(root, o["asset"], o["state"], os.path.abspath(o["usd"]), names)
        print("asset %s → %s (%d meshes)" % (o["asset"], p, n))
    log = dict(started=datetime.datetime.now(datetime.timezone.utc).isoformat(), args=o, done=[], errors=[], phase="")

    def save():
        log["updated"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with open(log_p, "w", encoding="utf8") as fh:
            json.dump(log, fh, indent=1)

    want = man["shots"]
    if o["shots"] and o["shots"] != "all":
        ids = set(o["shots"].split(","))
        want = [s for s in want if s["id"] in ids or s["unit"] in ids]

    if o["assets"]:
        log["phase"] = "assets"
        need = dict(set=set(), char=set(), prop=set())
        for sh in man["shots"]:
            st = S.get((sh["unit"], sh["index"]), {})
            for sid, _, _ in (st.get("sets") or [(st.get("set") or sh["set"].split("/")[0], 0, 0)]):
                need["set"].add(sid)
            for row in st.get("cast", []) + st.get("crowd", []):
                need["char"].add(row[0])
            for row in st.get("props", []):
                need["prop"].add(row[0])
        for kind in ("set", "char", "prop"):
            for aid in sorted(need[kind]):
                build_asset(root, kind, aid, names)
        log["assets"] = {k: sorted(v) for k, v in need.items()}
        save()

    if o["shots"]:
        building = not (o["playblast"] or o["exr"] or o["final"])
        log["phase"] = "build" if building else ("playblast" if o["playblast"] else ("final" if o["final"] else "exr"))
        for sh in want:
            try:
                d = shot_dir(root, sh)
                blend = os.path.join(d, "blender", "%s_blocking_%s.blend" % (sh["id"], VER))
                if building:
                    mark = blend + ".generated"
                    if os.path.exists(blend) and not os.path.exists(mark) and not o["force"]:
                        log["errors"].append(dict(shot=sh["id"], error="%s exists and was not written by the builder; "
                                                  "left alone (hand work). Use a new --version." % os.path.basename(blend)))
                        save()
                        continue
                    build_shot(root, sh, names)
                    with open(mark, "w") as fh:
                        fh.write(GEN)
                    if o["stills"]:
                        still(root, sh)
                else:
                    if o["missing"]:
                        if o["final"] and os.path.exists(final_paths(root, sh)[2]) and not bad_frames(root, sh):
                            continue
                        if o["playblast"] and os.path.exists(os.path.join(d, "renders", "preview", "%s_blocking_%s.mp4" % (sh["id"], VER))):
                            continue
                        last = os.path.join(d, "renders", "blocking", VER, "%s_blocking_%s.%04d.exr" % (sh["id"], VER, sh["frame_end"]))
                        if o["exr"] and os.path.exists(last):
                            continue
                    bpy.ops.wm.open_mainfile(filepath=blend)
                    if o["final"]:
                        final(root, sh)
                        log["done"].append(sh["id"])
                        save()
                        continue
                    if o["playblast"]:
                        playblast(root, sh)
                    if o["exr"]:
                        if o["playblast"]:
                            bpy.ops.wm.open_mainfile(filepath=blend)
                        exr(root, sh)
                log["done"].append(sh["id"])
            except Exception as ex:
                import traceback
                log["errors"].append(dict(shot=sh["id"], error=str(ex), trace=traceback.format_exc()[-1500:]))
            save()
    log["phase"] = "finished"
    log["finished"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    save()
    print("trailer_shots: %d done, %d errors → %s" % (len(log["done"]), len(log["errors"]), root))


if __name__ == "__main__":
    main(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
