"""Basic blocking in Blender, built from a shotspec.

For every scene in the shotspec this makes one Blender scene holding a stand-in
set, stand-in characters, one camera per shot with the shot's lens and height,
and a timeline on which each shot runs for its duration with its camera bound
to it. Then it renders a block frame, a depth pass and an ID matte per shot,
and writes a report the board can take back.

Everything here is GENERATED. Run it again and the scenes it made are thrown
away and rebuilt from the shotspec; nothing made by hand inside them survives.
That is the rule that keeps the board the source of truth: change the shot on
the board, regenerate, and the blocking follows.

Three ways to run it:

    blender --background --python blender_blocking.py -- shotspec.json --out previz/S-719
    python3 blender_blocking.py shotspec.json --out previz/S-719        (with the bpy module)
    inside Blender, or through the Blender MCP tools:
        import blender_blocking; blender_blocking.run("shotspec.json", "previz/S-719")
"""
import datetime
import json
import math
import os
import sys

import bpy
from mathutils import Vector

GENERATOR = "blender_blocking/1.0.0"
SENSOR_W = 36.0
FIGURE = 1.7                    # metres; what `fill` in the shotspec is measured against
TAG = "shotspec"                # custom property on everything this script makes

# --------------------------------------------------------------------- helpers
def safe(s):
    return "".join(c for c in str(s) if c.isalnum() or c == "_")


def colour_of(name):
    import colorsys
    h = 2166136261
    for ch in name:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    h ^= h >> 15
    r, g, b = colorsys.hsv_to_rgb((h % 360) / 360.0, 0.55 + ((h >> 9) % 30) / 100.0, 0.85)
    return (r, g, b, 1.0)


def material(name, rgba, emit=0.0):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = 0.9
        if emit and "Emission Strength" in bsdf.inputs:
            for key in ("Emission Color", "Emission"):
                if key in bsdf.inputs:
                    bsdf.inputs[key].default_value = rgba
                    break
            bsdf.inputs["Emission Strength"].default_value = emit
    return m


class Stage:
    """One Blender scene being built: knows its collections and tags what it makes."""

    def __init__(self, scene, code):
        self.scene, self.code = scene, code
        self.cols = {}
        for name in ("SET", "CAST", "PROPS", "CAMERAS", "LIGHTS"):
            c = bpy.data.collections.new(f"{safe(code)}_{name}")
            scene.collection.children.link(c)
            self.cols[name] = c

    def add(self, obj, col):
        self.cols[col].objects.link(obj)
        obj[TAG] = self.code
        return obj

    def mesh(self, name, kind, col, loc=(0, 0, 0), scale=(1, 1, 1), rgba=(0.5, 0.5, 0.5, 1), rot=(0, 0, 0)):
        import bmesh
        me = bpy.data.meshes.new(name)
        bm = bmesh.new()
        if kind == "box":
            bmesh.ops.create_cube(bm, size=1.0)
        elif kind == "plane":
            bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
        elif kind == "cyl":
            bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.5, radius2=0.5, depth=1.0)
        elif kind == "cone":
            bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.5, radius2=0.0, depth=1.0)
        elif kind == "ball":
            bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=0.5)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new(name, me)
        ob.location, ob.scale, ob.rotation_euler = loc, scale, rot
        me.materials.append(material("M_" + name, rgba))
        ob.color = rgba
        return self.add(ob, col)

    def empty(self, name, loc, col="CAMERAS"):
        ob = bpy.data.objects.new(name, None)
        ob.empty_display_size = 0.3
        ob.location = loc
        return self.add(ob, col)


# --------------------------------------------------------------- stand-in sets
STONE, EARTH, WATER, DARK = (0.62, 0.58, 0.5, 1), (0.42, 0.36, 0.28, 1), (0.2, 0.36, 0.5, 1), (0.2, 0.19, 0.18, 1)


def build_set(st, form, ext, sub):
    """A stand-in for a set: enough geometry to stage and frame against. +Y is
    upstage, the cameras live at -Y, the action line is the X axis."""
    g = lambda *a, **k: st.mesh(*a, col="SET", **k)
    g("ground", "plane", scale=(120, 120, 1), rgba=EARTH)
    focus = Vector((0, 5, 2))
    if form == "gate":
        for x in (-4, 4):
            g(f"gate_tower_{'L' if x < 0 else 'R'}", "box", loc=(x, 6, 4.5), scale=(3, 3, 9), rgba=STONE)
        g("gate_lintel", "box", loc=(0, 6, 7.5), scale=(5, 2.4, 1.6), rgba=STONE)
        g("gate_door_L", "box", loc=(-1.6, 6.6, 3), scale=(2.4, 0.3, 6), rgba=DARK, rot=(0, 0, math.radians(35)))
        g("gate_door_R", "box", loc=(1.6, 6.6, 3), scale=(2.4, 0.3, 6), rgba=DARK, rot=(0, 0, math.radians(-35)))
        for x in (-18, 18):
            g(f"city_wall_{'L' if x < 0 else 'R'}", "box", loc=(x, 6, 3), scale=(25, 2, 6), rgba=STONE)
        g("road", "plane", loc=(0, 20, 0.02), scale=(5, 60, 1), rgba=(0.55, 0.5, 0.42, 1))
        focus = Vector((0, 6, 3))
    elif form in ("hall", "room", "court"):
        w, d, h = {"hall": (18, 14, 6), "room": (7, 6, 3.4), "court": (30, 24, 10)}[form]
        g("floor", "plane", loc=(0, d / 2 - 2, 0.02), scale=(w, d, 1), rgba=STONE)
        g("wall_back", "box", loc=(0, d - 2, h / 2), scale=(w, 0.4, h), rgba=STONE)
        g("wall_L", "box", loc=(-w / 2, d / 2 - 2, h / 2), scale=(0.4, d, h), rgba=STONE)
        g("wall_R", "box", loc=(w / 2, d / 2 - 2, h / 2), scale=(0.4, d, h), rgba=STONE)
        if form != "room":
            for i, x in enumerate((-w / 3, w / 3)):
                for j, y in enumerate((2, d - 5)):
                    g(f"column_{i}{j}", "cyl", loc=(x, y, h / 2), scale=(0.8, 0.8, h), rgba=STONE)
        focus = Vector((0, d - 3, h * 0.4))
    elif form == "temple":
        g("plinth", "box", loc=(0, 10, 0.4), scale=(16, 12, 0.8), rgba=STONE)
        g("sanctum", "box", loc=(0, 13, 3.4), scale=(8, 6, 6), rgba=STONE)
        g("door", "box", loc=(0, 9.9, 2), scale=(2, 0.3, 3.2), rgba=DARK)
        for x in (-5, -2.5, 2.5, 5):
            g(f"pillar_{x}", "cyl", loc=(x, 6, 2.4), scale=(0.6, 0.6, 4), rgba=STONE)
        g("forecourt", "plane", loc=(0, -2, 0.02), scale=(30, 18, 1), rgba=(0.6, 0.56, 0.5, 1))
        focus = Vector((0, 9.9, 2))
    elif form == "cave":
        g("cave_back", "box", loc=(0, 9, 3), scale=(14, 1, 6), rgba=DARK)
        g("cave_L", "box", loc=(-6, 3, 3), scale=(1.5, 14, 6), rgba=DARK)
        g("cave_R", "box", loc=(6, 3, 3), scale=(1.5, 14, 6), rgba=DARK)
        g("cave_roof", "box", loc=(0, 3, 6.3), scale=(14, 14, 0.8), rgba=DARK)
        g("sleeping_ledge", "box", loc=(0, 6, 0.3), scale=(3, 1.4, 0.6), rgba=STONE)
        focus = Vector((0, 6, 1))
    elif form == "shore":
        g("water", "plane", loc=(0, 70, 0.05), scale=(240, 120, 1), rgba=WATER)
        g("tideline", "plane", loc=(0, 9, 0.03), scale=(120, 3, 1), rgba=(0.75, 0.7, 0.58, 1))
        focus = Vector((0, 30, 1))
    elif form == "wall":
        g("rampart", "box", loc=(0, 3, 3), scale=(60, 3, 6), rgba=STONE)
        g("parapet", "box", loc=(0, 4.3, 6.5), scale=(60, 0.4, 1), rgba=STONE)
        g("plain_below", "plane", loc=(0, 60, 0.02), scale=(200, 100, 1), rgba=(0.5, 0.45, 0.32, 1))
        focus = Vector((0, 40, 1))
    elif form == "street":
        for i in range(5):
            g(f"house_L{i}", "box", loc=(-6, i * 7, 2.5), scale=(5, 6, 5), rgba=STONE)
            g(f"house_R{i}", "box", loc=(6, i * 7, 2.5), scale=(5, 6, 5), rgba=STONE)
        focus = Vector((0, 18, 1.5))
    elif form == "camp":
        for i, (x, y) in enumerate(((-6, 6), (5, 8), (-2, 14), (9, 15), (-11, 12))):
            g(f"tent_{i}", "cone", loc=(x, y, 1.6), scale=(4, 4, 3.2), rgba=(0.7, 0.64, 0.5, 1))
        focus = Vector((0, 9, 1.5))
    elif form == "mountain":
        g("peak", "cone", loc=(0, 40, 14), scale=(60, 60, 28), rgba=EARTH)
        focus = Vector((0, 30, 10))
    elif form == "forest":
        for i in range(14):
            x, y = ((i * 37) % 23) - 11, 4 + ((i * 53) % 19)
            g(f"tree_{i}", "cyl", loc=(x, y, 4), scale=(0.7, 0.7, 8), rgba=(0.28, 0.22, 0.15, 1))
        focus = Vector((0, 10, 2))
    elif form == "fire":
        g("fire", "cone", loc=(0, 2, 0.4), scale=(0.9, 0.9, 0.8), rgba=(1, 0.5, 0.1, 1))
        focus = Vector((0, 2, 0.6))
    else:                                   # road, plain
        g("road", "plane", loc=(0, 30, 0.02), scale=(5, 160, 1), rgba=(0.55, 0.5, 0.42, 1))
        focus = Vector((0, 25, 1))
    lbl = st.empty(f"SET_{sub}", (0, 0, 0), "SET")
    lbl.empty_display_type = "PLAIN_AXES"
    return focus


# ------------------------------------------------------------ stand-in people
def build_cast(st, sc, ents):
    """Principals on the action line, facing each other when there are two;
    crowds upstage; anyone who is in the scene but never in frame goes behind
    the camera side, where an eyeline can still find them."""
    chars = ents.get("characters", {})
    where = {}
    people = [c for c in sc["cast"] if chars.get(c, {}).get("kind") != "crowd"]
    crowds = [c for c in sc["cast"] if chars.get(c, {}).get("kind") == "crowd"]
    n = len(people)
    for i, cid in enumerate(people):
        x = (i - (n - 1) / 2) * 2.4
        face = 0.0 if n < 2 else (math.pi / 2 if x < 0 else -math.pi / 2)
        if n > 2 and abs(x) < 0.1:
            face = 0.0
        kind = chars.get(cid, {}).get("kind", "role")
        rgba = colour_of(cid)
        root = st.empty(f"CH_{cid}", (x, 0, 0), "CAST")
        root.rotation_euler = (0, 0, face)
        root["character"] = cid
        if kind == "creature":
            b = st.mesh(f"CH_{cid}_body", "box", "CAST", loc=(0, 0, 0.9), scale=(1.2, 2.4, 1.6), rgba=rgba)
            b.parent = root
            height = 1.8
        else:
            b = st.mesh(f"CH_{cid}_body", "cyl", "CAST", loc=(0, 0, 0.72), scale=(0.46, 0.3, 1.44), rgba=rgba)
            h = st.mesh(f"CH_{cid}_head", "ball", "CAST", loc=(0, 0, 1.58), scale=(0.24, 0.26, 0.28), rgba=rgba)
            nose = st.mesh(f"CH_{cid}_nose", "cone", "CAST", loc=(0, -0.16, 1.58), scale=(0.07, 0.07, 0.12),
                           rgba=(0.1, 0.1, 0.1, 1), rot=(math.radians(90), 0, 0))
            for part in (b, h, nose):
                part.parent = root
            height = FIGURE
        withheld = sc.get("krishna") if cid == "krishna" and sc.get("krishna") != "face" else ""
        if withheld:
            root["withheld"] = withheld      # the film does not show his face yet
            root.rotation_euler = (0, 0, math.pi)          # back to the cameras
        where[cid] = dict(pos=Vector((x, 0, 0)), h=height, withheld=withheld, root=root,
                          faces=(0.0 if n >= 2 and abs(x) > 0.1 else None))
    for j, cid in enumerate(crowds):
        rgba = colour_of(cid)
        root = st.empty(f"CH_{cid}", (0, 9 + j * 7, 0), "CAST")
        root["character"] = cid
        for k in range(15):
            x, y = (k % 5 - 2) * 1.5, (k // 5) * 1.5
            m = st.mesh(f"CH_{cid}_{k:02d}", "cyl", "CAST", loc=(x, y, 0.8), scale=(0.42, 0.3, 1.6), rgba=rgba)
            m.parent = root
        where[cid] = dict(pos=Vector((0, 9 + j * 7, 0)), h=FIGURE, withheld="", crowd=True)
    for j, cid in enumerate(sc.get("off", [])):
        root = st.empty(f"CH_{cid}_OFFFRAME", (-3 + j * 2, -30, 0), "CAST")
        root["character"], root["off_frame"] = cid, True
        where[cid] = dict(pos=Vector((-3 + j * 2, -30, 0)), h=FIGURE, withheld="offscreen", off=True)
    # a prop travels with whoever carries the story's weight in the scene: the
    # withheld man if he is here (so it vanishes with him), else the first principal
    holder = next((c for c in people if where[c]["withheld"]), people[0] if people else None)
    for j, pid in enumerate(sc.get("props", [])):
        p = st.mesh(f"PR_{pid}", "box", "PROPS", loc=(0.4 + j * 0.3, -0.25, 1.0),
                    scale=(0.22, 0.22, 0.22), rgba=(0.95, 0.8, 0.2, 1))
        p["prop"] = pid
        if holder:
            p.parent = where[holder]["root"]
    return where


# ---------------------------------------------------------------------- camera
AIM = dict(CLOSE=1.58, CU=1.58, MCU=1.45, ECU=1.6, MS=1.2, MEDIUM=1.2, OVER=1.5, OTS=1.5,
           INSERT=0.95, DETAIL=0.95, MACRO=0.95)


def place_camera(st, sh, where, focus, frame, fps, f0, f1):
    """A camera for one shot, on the -Y side of the action line so screen
    direction holds from shot to shot."""
    cam_d = sh["camera"]
    data = bpy.data.cameras.new("CAM_" + safe(sh["id"]))
    data.lens, data.sensor_width, data.sensor_fit = cam_d["lens_mm"], SENSOR_W, "HORIZONTAL"
    data.clip_end = 2000
    cam = bpy.data.objects.new("CAM_" + safe(sh["id"]), data)
    st.add(cam, "CAMERAS")
    cam["shot_id"], cam["shot_type"] = sh["id"], sh["type"]

    sensor_h = SENSOR_W * frame[1] / frame[0]
    frame_h = FIGURE / max(cam_d.get("fill", 0.8), 0.01)       # metres of world the frame is tall
    dist = frame_h * cam_d["lens_mm"] / sensor_h
    kind = sh["kind"]
    seen = [c for c in sh["cast"] if c in where]
    subj = where[seen[0]] if seen else None
    other = where[seen[1]] if len(seen) > 1 else None

    if subj is None:
        ground = any(w in sh["text"].lower() for w in ("footprint", "dust", "ground", "floor", "sand"))
        target = Vector((0.6, 1.5, 0.0)) if ground else focus.copy()
        if not ground and kind not in ("INSERT", "DETAIL", "MACRO"):
            dist = max(dist, 14.0)
        pos = target + Vector((0, -dist, 0))
        pos.z = max(cam_d["height_m"], 0.3) if not ground else 0.9
    elif kind == "POV":
        pos = subj["pos"] + Vector((0, 0, 1.6))
        target = (other["pos"] + Vector((0, 0, 1.2))) if other else focus.copy()
        if other is None:
            target = focus.copy()
        pos = pos + (target - pos).normalized() * 0.45       # in front of the eyes, not inside the head
    elif kind in ("OVER", "OTS") and other is not None:
        away = (subj["pos"] - other["pos"]).normalized()
        pos = subj["pos"] + away * 1.1 + Vector((0, -0.55, 1.68))
        target = other["pos"] + Vector((0, 0, 1.5))
    else:
        aim_h = AIM.get(kind, 1.0)
        if subj.get("withheld") in ("hands", "shadow") and kind in ("CLOSE", "CU", "MCU", "ECU", "INSERT", "DETAIL"):
            aim_h = 0.95                                   # his hands, never his face
        if subj.get("crowd"):
            aim_h = 1.2
        target = subj["pos"] + Vector((0, 0, aim_h))
        side = 0.35 if (sh["n"] % 2) else -0.35             # a little variety, same side of the line
        partner = subj.get("faces")
        if partner is not None and kind in AIM:
            side = 0.95 if partner > subj["pos"].x else -0.95  # three-quarter front: toward whoever they face
        direction = Vector((side, -1, 0)).normalized()
        pos = subj["pos"] + direction * dist
        pos.z = cam_d["height_m"]
        if cam_d["angle"] == "top":
            pos = subj["pos"] + Vector((0, -2, cam_d["height_m"]))
        elif cam_d["angle"] == "low":
            pos.z = 0.5
    pos.y = min(pos.y, -0.3) if kind not in ("POV", "OVER", "OTS") else pos.y

    tgt = st.empty("TGT_" + safe(sh["id"]), target)
    cam.location = pos
    con = cam.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = tgt, "TRACK_NEGATIVE_Z", "UP_Y"

    move = cam_d.get("move", "static")
    if move != "static" and f1 > f0:
        start = pos.copy()
        if move == "push":
            start = pos + (pos - target) * 0.18
        elif move == "track":
            start = pos + Vector((-1.6, 0, 0)); pos = pos + Vector((1.6, 0, 0))
        elif move == "crane":
            start = pos + Vector((0, 0, -2.0))
        elif move == "drift":
            start = pos + Vector((-3, 0, 0))
        cam.location = start
        cam.keyframe_insert("location", frame=f0)
        cam.location = pos
        cam.keyframe_insert("location", frame=f1)
    cam["depth_far"] = max((target - cam.location).length * 3.0, 6.0)
    return cam


def hide_withheld(where, cams):
    """While the film withholds him, his stand-in exists only in the shots that
    name him — a wide of the empty street must be empty."""
    for cid, w in where.items():
        if not w.get("withheld") or w.get("off") or "root" not in w:
            continue
        parts = [w["root"]] + list(w["root"].children)
        for sh, cam, f0, f1 in cams:
            hidden = cid not in sh["cast"]
            for ob in parts:
                ob.hide_render = ob.hide_viewport = hidden
                ob.keyframe_insert("hide_render", frame=f0)
                ob.keyframe_insert("hide_viewport", frame=f0)
        for ob in parts:
            if ob.animation_data and ob.animation_data.action:
                for fc in _fcurves(ob.animation_data.action):
                    for kp in fc.keyframe_points:
                        kp.interpolation = "CONSTANT"


def _fcurves(action):
    if hasattr(action, "fcurves") and len(getattr(action, "fcurves", [])):
        return list(action.fcurves)
    out = []
    for layer in getattr(action, "layers", []):          # layered actions, Blender 4.4 and later
        for strip in layer.strips:
            for bag in getattr(strip, "channelbags", []):
                out.extend(bag.fcurves)
    return out


# ------------------------------------------------------------------- lighting
LIGHT = dict(
    day=dict(sun=4.0, col=(1.0, 0.96, 0.88), elev=55, world=(0.5, 0.62, 0.8), amb=1.0),
    dawn=dict(sun=2.2, col=(1.0, 0.72, 0.5), elev=10, world=(0.55, 0.45, 0.45), amb=0.6),
    dusk=dict(sun=2.0, col=(1.0, 0.6, 0.4), elev=8, world=(0.4, 0.3, 0.4), amb=0.5),
    night=dict(sun=0.35, col=(0.6, 0.7, 1.0), elev=40, world=(0.02, 0.03, 0.06), amb=0.25),
)


def build_light(st, tod, ext):
    L = LIGHT.get(tod, LIGHT["day"])
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy, sun.color = L["sun"] * (1.0 if ext else 0.5), L["col"]
    so = bpy.data.objects.new("LIGHT_key", sun)
    so.rotation_euler = (math.radians(90 - L["elev"]), 0, math.radians(-35))
    st.add(so, "LIGHTS")
    world = bpy.data.worlds.new("W_" + safe(st.code))
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg is not None:
        bg.inputs[0].default_value = (*L["world"], 1.0)
        bg.inputs[1].default_value = L["amb"]
    st.scene.world = world
    if tod == "night" or not ext:
        lamp = bpy.data.lights.new("torch", "POINT")
        lamp.energy, lamp.color = 900.0, (1.0, 0.62, 0.3)
        lo = bpy.data.objects.new("LIGHT_torch", lamp)
        lo.location = (2.2, 1.0, 2.6)
        st.add(lo, "LIGHTS")


# -------------------------------------------------------------- pass materials
def pass_material(kind, far):
    """Override materials for the two control passes a diffusion model wants:
    depth as a grey ramp, and a flat colour per object."""
    m = bpy.data.materials.new("PASS_" + kind)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(em.outputs[0], out.inputs[0])
    if kind == "depth":
        cd = nt.nodes.new("ShaderNodeCameraData")
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["From Min"].default_value = 0.3
        mr.inputs["From Max"].default_value = far
        mr.inputs["To Min"].default_value = 1.0          # near is white
        mr.inputs["To Max"].default_value = 0.0
        nt.links.new(cd.outputs["View Z Depth"], mr.inputs["Value"])
        nt.links.new(mr.outputs[0], em.inputs["Color"])
    else:
        oi = nt.nodes.new("ShaderNodeObjectInfo")
        nt.links.new(oi.outputs["Color"], em.inputs["Color"])
    return m


# ------------------------------------------------------------------- the build
def purge(code):
    """Throw away what an earlier run made for this scene."""
    old = bpy.data.scenes.get(safe(code))
    if old is not None:
        for ob in list(old.collection.all_objects):
            if ob.get(TAG) == code:
                bpy.data.objects.remove(ob, do_unlink=True)
        for c in list(old.collection.children):
            bpy.data.collections.remove(c)
        if len(bpy.data.scenes) > 1:
            bpy.data.scenes.remove(old)
        else:
            old.name = "_discard_" + safe(code)
    bpy.ops.outliner.orphans_purge(do_recursive=True) if hasattr(bpy.ops.outliner, "orphans_purge") and not bpy.app.background else None


def build_scene(sc, spec):
    code, fps, frame = sc["code"], spec["fps"], spec["frame"]
    purge(code)
    scene = bpy.data.scenes.new(safe(code))
    scene[TAG] = json.dumps(dict(spec["provenance"], scene=code, generator=GENERATOR))
    scene.render.fps = fps
    scene.render.resolution_x, scene.render.resolution_y = frame
    st = Stage(scene, code)
    ents = spec["entities"]
    info = ents["sets"].get(sc["set"], dict(form="plain", ext=True))
    focus = build_set(st, info.get("form", "plain"), info.get("ext", True), sc.get("sub", ""))
    where = build_cast(st, sc, ents)
    tod = sc["shots"][0]["continuity"]["time_of_day"] if sc["shots"] else "day"
    build_light(st, tod, info.get("ext", True))
    cams, f = [], 1
    for sh in sc["shots"]:
        n = max(int(round(sh["camera"]["duration_s"] * fps)), 1)
        f0, f1 = f, f + n - 1
        cam = place_camera(st, sh, where, focus, frame, fps, f0, f1)
        mk = scene.timeline_markers.new(sh["id"], frame=f0)
        mk.camera = cam
        cams.append((sh, cam, f0, f1))
        f = f1 + 1
    scene.frame_start, scene.frame_end = 1, max(f - 1, 1)
    hide_withheld(where, cams)
    if cams:
        scene.camera = cams[0][1]
    return scene, cams


def render_passes(scene, cams, out_dir, version, size, engine_pref):
    """One block frame, one depth pass and one ID matte per shot."""
    r = scene.render
    r.resolution_percentage = 100
    full = (r.resolution_x, r.resolution_y)
    r.resolution_x, r.resolution_y = size
    r.image_settings.file_format = "PNG"
    r.film_transparent = False
    engines = [engine_pref] if engine_pref else ["BLENDER_WORKBENCH", "CYCLES"]
    depth_m, id_m = pass_material("depth", 60.0), pass_material("id", 0)
    vl = scene.view_layers[0]
    results, used = {}, None
    os.makedirs(os.path.join(out_dir, "renders"), exist_ok=True)
    if bpy.context.window is not None:
        bpy.context.window.scene = scene      # a scene only evaluates fully when it is the one on screen
    for sh, cam, f0, f1 in cams:
        scene.frame_set((f0 + f1) // 2)       # the marker at this frame binds this shot's camera
        scene.camera = cam
        vl.update()
        files = {}
        for node in depth_m.node_tree.nodes:
            if node.type == "MAP_RANGE":
                node.inputs["From Max"].default_value = cam.get("depth_far", 60.0)
        for name, mat in (("block", None), ("depth", depth_m), ("id", id_m)):
            vl.material_override = mat
            rel = os.path.join("renders", f"{sh['id']}_{name}_v{version:03d}.png")
            r.filepath = os.path.join(out_dir, rel)
            done = False
            for eng in ([used] if used else engines):
                if mat is not None and eng == "BLENDER_WORKBENCH":
                    eng = "CYCLES"                       # the passes need shader nodes
                try:
                    r.engine = eng
                    if eng == "CYCLES":
                        scene.cycles.samples = 12 if mat is None else 1
                        scene.cycles.use_denoising = False
                        if mat is not None:
                            scene.view_settings.view_transform = "Raw" if "Raw" in _views() else "Standard"
                        else:
                            scene.view_settings.view_transform = "Standard"
                    bpy.ops.render.render(write_still=True, scene=scene.name)
                    if os.path.exists(r.filepath):
                        done = True
                        if mat is None:
                            used = eng
                        break
                except Exception as e:                     # an engine that cannot run headless
                    print(f"  {eng} could not render {sh['id']} {name}: {e}")
            if done:
                files[name] = rel.replace(os.sep, "/")
        vl.material_override = None
        results[sh["id"]] = files
    r.resolution_x, r.resolution_y = full
    scene.view_settings.view_transform = "Standard"
    return results, used


def _views():
    try:
        return [i.identifier for i in bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items]
    except Exception:
        return ["Standard"]


def contact_sheet(spec, reports, out_dir):
    by = {r["shot_id"]: r for r in reports}
    rows = []
    for sc in spec["scenes"]:
        rows.append(f"<h2>{sc['code']} · {sc['title']} <small>{sc['set']}/{sc['sub']} · {sc['duration_s']:.0f}s</small></h2><div class=g>")
        for sh in sc["shots"]:
            rp = by.get(sh["id"], {}).get("files", {})
            cam = sh["camera"]
            rows.append(
                f"<figure><img src='{rp.get('block', '')}'><div class=p><img src='{rp.get('depth', '')}'><img src='{rp.get('id', '')}'></div>"
                f"<figcaption><b>{sh['id']}</b> · {sh['type']} · {cam['lens_mm']:g}mm · {cam['duration_s']:.1f}s"
                f"{' (derived)' if cam['duration_src'] == 'derived' else ''}<br>"
                f"{', '.join(sh['cast']) or 'no one in frame'}<br><span>{sh['text']}</span></figcaption></figure>")
        rows.append("</div>")
    html = ("<!doctype html><meta charset=utf-8><title>Blocking</title><style>body{background:#16171a;color:#ddd;"
            "font:13px/1.45 system-ui;margin:24px}h2{font-size:16px}small{color:#888;font-weight:400}"
            ".g{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px}figure{margin:0;"
            "background:#202227;border-radius:6px;overflow:hidden}figure>img{width:100%;display:block}"
            ".p{display:flex}.p img{width:50%}figcaption{padding:8px 10px}span{color:#999}</style>"
            f"<p>{spec['scope']['title']} — board {spec['provenance']['board_version']} — generated, not authored.</p>"
            + "".join(rows))
    with open(os.path.join(out_dir, "contact.html"), "w", encoding="utf8") as fh:
        fh.write(html)


def run(spec_path, out_dir=None, render=True, size=(840, 360), engine=None, save=True):
    with open(spec_path, encoding="utf8") as fh:
        spec = json.load(fh)
    if not str(spec.get("spec", "")).startswith("shotspec/"):
        raise ValueError("not a shotspec")
    out_dir = os.path.abspath(out_dir or os.path.dirname(spec_path))
    os.makedirs(out_dir, exist_ok=True)
    report_path = os.path.join(out_dir, "report.json")
    earlier = {}
    if os.path.exists(report_path):
        with open(report_path, encoding="utf8") as fh:
            for rpt in json.load(fh).get("reports", []):
                if rpt.get("app") == "blender":
                    earlier[rpt["shot_id"]] = max(earlier.get(rpt["shot_id"], 0), rpt.get("version", 0))
    version = max(earlier.values(), default=0) + 1
    blend = f"{safe(spec['scope'].get('id') or 'blocking')}_blocking.blend"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    reports, engine_used = [], None
    for sc in spec["scenes"]:
        scene, cams = build_scene(sc, spec)
        files = {}
        if render:
            files, engine_used = render_passes(scene, cams, out_dir, version, size, engine)
        for sh, cam, f0, f1 in cams:
            got = dict(files.get(sh["id"], {}))
            got["scene_file"] = blend
            reports.append(dict(
                shot_id=sh["id"], app="blender",
                status="rendered" if got.get("block") else ("built" if not render else "failed"),
                version=version, files=got, at=now,
                note=f"frames {f0}-{f1}, camera {cam.name}",
                generator_version=GENERATOR, board_version=spec["provenance"]["board_version"],
                shot_rev=sh.get("rev", "")))
        print(f"{sc['code']}: {len(cams)} shots, frames 1-{scene.frame_end}")
    for s in list(bpy.data.scenes):                    # the scene Blender starts with, if it is empty
        if s.name.startswith("_discard_") or (s.get(TAG) is None and not s.collection.all_objects and len(bpy.data.scenes) > 1):
            bpy.data.scenes.remove(s)
    if save:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, blend))
    with open(report_path, "w", encoding="utf8") as fh:
        json.dump(dict(report="shotspec-report/1", reports=reports), fh, indent=1)
    if render:
        contact_sheet(spec, reports, out_dir)
    print(f"blocking v{version}: {len(reports)} shots → {out_dir}" + (f" (rendered with {engine_used})" if engine_used else ""))
    return reports


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    if not argv:
        raise SystemExit(__doc__)
    opts = dict(out_dir=None, render=True, engine=None)
    spec_file, i = argv[0], 1
    while i < len(argv):
        if argv[i] == "--out":
            if i + 1 < len(argv) and not argv[i + 1].startswith("--"):
                opts["out_dir"] = argv[i + 1]; i += 1
            # bare --out: keep the default folder (next to the shotspec)
        elif argv[i] == "--no-render":
            opts["render"] = False
        elif argv[i] == "--engine":
            opts["engine"] = argv[i + 1]; i += 1
        i += 1
    run(spec_file, **opts)
