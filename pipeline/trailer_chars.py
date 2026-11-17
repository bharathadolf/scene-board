# -*- coding: utf-8 -*-
"""Character assets from MPFB (the MakeHuman plugin installed in Blender).

    blender --background --factory-startup --python trailer_chars.py -- --root <TRAILER> [--only id,id]

For each character in SPEC this makes an MPFB human with its own build, cuts
garments, hair and eyes out of MakeHuman's helper geometry (no asset packs are
installed, so nothing is borrowed), gives everything plain materials, and
publishes   assets/char/<id>/publish/<id>_blocking_v001.blend   holding one
collection, char_<id>, which is what a shot file links.  A review still goes to
assets/char/<id>/review/.

v002 adds MPFB's default rig only to pose the arms down from MakeHuman's A-pose,
then bakes that pose into the meshes and drops the rig. They are still unrigged,
facing -Y. Rigging is the next state (rig_v1) and is what animation waits for.
"""
import json
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

VER = "v002"          # v002: arms posed down with the MPFB rig
STATE = "blocking"
GOLD, BRONZE, WHITE, BLACK = (.83, .62, .2), (.5, .36, .2), (.86, .84, .78), (.03, .025, .02)
SKIN = dict(fair=(.72, .5, .36), wheat=(.6, .4, .27), brown=(.45, .29, .19), dark=(.3, .19, .13),
            shyama=(.1, .14, .25), ash=(.5, .52, .56), gold=(.78, .6, .34), blue=(.2, .3, .5), red=(.5, .2, .16))


def H(g=1, age=.5, wt=.5, mu=.5, ht=.5, skin="wheat", lower="dhoti", lc=WHITE, upper=None, uc=WHITE,
      hair="short", hc=BLACK, crown=None, scale=1.0):
    return dict(g=g, age=age, wt=wt, mu=mu, ht=ht, skin=skin, lower=lower, lc=lc, upper=upper, uc=uc,
                hair=hair, hc=hc, crown=crown, scale=scale)


SPEC = {
    "rukmini": H(0, .46, .42, .4, .5, "wheat", "sari", (.7, .1, .14), "blouse", (.6, .08, .12), "long"),
    "krishna": H(1, .47, .45, .6, .62, "shyama", "dhoti", (.86, .68, .1), None, hair="long", crown=GOLD),
    "balarama": H(1, .5, .6, .8, .7, "fair", "dhoti", (.12, .2, .5), None, hair="long"),
    "rukmi": H(1, .48, .5, .7, .6, "wheat", "dhoti", (.4, .1, .1), "armour", BRONZE, "long", crown=GOLD),
    "bhishmaka": H(1, .8, .6, .4, .5, "wheat", "dhoti", (.5, .4, .12), "cloth", (.6, .5, .2), "long", (.6, .6, .6), GOLD),
    "jarasandha": H(1, .62, .7, .85, .75, "brown", "dhoti", (.25, .05, .05), "armour", (.3, .3, .32), "long", crown=GOLD),
    "shishupala": H(1, .5, .55, .6, .55, "wheat", "dhoti", (.5, .3, .05), "cloth", (.6, .4, .1), "short", crown=GOLD),
    "kalayavana": H(1, .55, .6, .8, .7, "fair", "short", (.2, .2, .22), "armour", (.25, .25, .27), "long", (.15, .1, .06)),
    "brahmin": H(1, .7, .4, .3, .45, "wheat", "dhoti", WHITE, None, hair="bun", hc=(.5, .5, .5)),
    "priest": H(1, .75, .5, .3, .45, "brown", "dhoti", (.8, .5, .15), None, hair="none"),
    "water_carrier": H(1, .65, .35, .5, .45, "dark", "short", (.55, .5, .4), None, hair="short", hc=(.3, .3, .3)),
    "ferryman": H(1, .6, .4, .6, .5, "dark", "short", (.4, .4, .35), None, hair="short"),
    "daruka": H(1, .5, .5, .65, .55, "brown", "dhoti", (.5, .2, .1), "cloth", (.55, .25, .1), "short"),
    "maid": H(0, .45, .5, .35, .45, "brown", "sari", (.2, .4, .35), "blouse", (.15, .3, .28), "bun"),
    "lakshmi": H(0, .46, .42, .35, .55, "gold", "sari", (.75, .15, .2), "blouse", (.8, .6, .15), "long", crown=GOLD),
    "fisher_child": H(0, .2, .4, .3, .5, "dark", "sari", (.5, .45, .3), "blouse", (.45, .4, .28), "bun"),
    "c_devas": H(1, .48, .45, .6, .6, "gold", "dhoti", (.85, .8, .6), None, hair="long", crown=GOLD),
    "c_asuras": H(1, .52, .65, .85, .7, "red", "dhoti", (.15, .1, .1), "armour", (.2, .15, .15), "long"),
    "c_kings": H(1, .55, .55, .6, .55, "wheat", "dhoti", (.3, .12, .3), "cloth", (.5, .2, .4), "short", crown=GOLD),
    "c_court": H(1, .6, .5, .4, .5, "wheat", "dhoti", (.75, .7, .55), "cloth", (.6, .5, .35), "short"),
    "c_guards": H(1, .5, .5, .7, .55, "brown", "short", (.5, .15, .1), "armour", BRONZE, "helmet", BRONZE),
    "c_magadha_army": H(1, .5, .5, .7, .55, "brown", "short", (.25, .08, .08), "armour", (.3, .3, .32), "helmet", (.3, .3, .32)),
    "c_yavana_army": H(1, .5, .55, .7, .6, "fair", "short", (.2, .2, .25), "armour", (.22, .22, .25), "helmet", (.22, .22, .25)),
    "c_procession": H(0, .46, .5, .35, .45, "wheat", "sari", (.8, .55, .1), "blouse", (.7, .2, .2), "bun"),
    "c_women_mathura": H(0, .5, .5, .35, .45, "brown", "sari", (.3, .35, .6), "blouse", (.25, .3, .5), "long"),
    "c_sailors": H(0, .5, .5, .5, .5, "dark", "sari", (.6, .55, .4), "blouse", (.5, .45, .3), "bun"),
}


def mat(name, rgb, rough=.6, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (rgb[0], rgb[1], rgb[2], 1)
    m.use_nodes = True
    b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if b is not None:
        b.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = metal
    return m


def cut(src, col, name, keep, material, push=0.0):
    """A new object holding the faces of `src` that `keep(face)` accepts."""
    bm = bmesh.new()
    bm.from_mesh(src)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f)], context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    if push:
        bm.normal_update()
        for v in bm.verts:
            v.co += v.normal * push
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if not len(me.polygons):
        return None
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    ob.color = material.diffuse_color
    col.objects.link(ob)
    return ob


def pose_arms(rig):
    """Swing each upper arm down to hang a little off the body, about the shoulder."""
    bpy.context.view_layer.update()
    for side in ("L", "R"):
        pb = rig.pose.bones.get("upperarm01." + side)
        if pb is None:
            continue
        head = pb.head.copy()
        v = (pb.tail - pb.head).normalized()
        sx = 1.0 if head.x > 0 else -1.0
        q = v.rotation_difference(Vector((sx * .17, .03, -1)).normalized())
        pb.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ pb.matrix
        bpy.context.view_layer.update()
        lo = rig.pose.bones.get("lowerarm01." + side)
        if lo is not None:                                   # a small bend at the elbow, forward
            h2 = lo.head.copy()
            q2 = (lo.tail - lo.head).normalized().rotation_difference(Vector((sx * .1, -.22, -1)).normalized())
            lo.matrix = Matrix.Translation(h2) @ q2.to_matrix().to_4x4() @ Matrix.Translation(-h2) @ lo.matrix
            bpy.context.view_layer.update()


def build(root, cid, sp, names):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.preferences.addon_enable(module="bl_ext.blender_org.mpfb")       # must be on before its modules import
    from bl_ext.blender_org.mpfb.services.humanservice import HumanService
    from bl_ext.blender_org.mpfb.services.targetservice import TargetService
    macro = TargetService.get_default_macro_info_dict()
    macro.update(gender=sp["g"], age=sp["age"], weight=sp["wt"], muscle=sp["mu"], height=sp["ht"])
    macro["race"] = dict(asian=.3, caucasian=.6, african=.1)
    human = HumanService.create_human(macro_detail_dict=macro)
    groups = {g.index: g.name for g in human.vertex_groups}
    member = {}
    for v in human.data.vertices:
        member[v.index] = {groups[ge.group] for ge in v.groups}
    for m in list(human.modifiers):
        if m.type == "MASK":
            human.modifiers.remove(m)
    dg = bpy.context.evaluated_depsgraph_get()
    rest = bpy.data.meshes.new_from_object(human.evaluated_get(dg))
    rest_co = [v.co.copy() for v in rest.vertices]            # regions are chosen in the rest pose
    rig = HumanService.add_builtin_rig(human, "default")
    for m in list(human.modifiers):
        if m.type == "MASK":
            human.modifiers.remove(m)
    pose_arms(rig)
    dg = bpy.context.evaluated_depsgraph_get()
    base = bpy.data.meshes.new_from_object(human.evaluated_get(dg))   # same vertex order, posed
    top = max(rest_co[v.index].z for v in base.vertices if "body" in member[v.index])
    col = bpy.data.collections.new("char_" + cid)
    bpy.context.scene.collection.children.link(col)

    def grp(g, zlo=-1, zhi=9, xmax=9):
        def keep(f):
            vs = f.verts
            return (all(g in member[v.index] for v in vs)
                    and all(zlo * top <= rest_co[v.index].z <= zhi * top for v in vs)
                    and all(abs(rest_co[v.index].x) <= xmax * top for v in vs))
        return keep

    skin = mat("skin_" + cid, SKIN[sp["skin"]], .45)
    cut(base, col, cid + "_body", grp("body"), skin)
    eye = mat("eye_" + cid, (.05, .035, .03), .15)
    cut(base, col, cid + "_eye_L", grp("helper-l-eye"), eye)
    cut(base, col, cid + "_eye_R", grp("helper-r-eye"), eye)
    lo = dict(dhoti=-1, sari=-1, short=.3)[sp["lower"]]
    cut(base, col, cid + "_lower", grp("helper-skirt", zlo=lo), mat("lower_" + cid, sp["lc"], .8), push=.003)
    if sp["upper"]:
        zlo, metal = dict(blouse=(.7, 0), cloth=(.6, 0), armour=(.58, .8))[sp["upper"]]
        cut(base, col, cid + "_upper", grp("helper-tights", zlo=zlo, zhi=.865, xmax=.125),
            mat("upper_" + cid, sp["uc"], .5 if metal else .8, metal), push=.006 if metal else .003)
    if sp["hair"] != "none":
        # MakeHuman's hair helper is loose strand cards; a cap grown off the scalp reads better at this stage
        metal = .8 if sp["hair"] == "helmet" else 0
        hm = mat("hair_" + cid, sp["hc"], .4 if metal else .55, metal)
        cut(base, col, cid + "_hair", grp("scalp"), hm, push=.022 if metal else .012)
        k = top / 1.66

        def blob(name, loc, scale):
            bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=.5)
            me = bpy.data.meshes.new(name)
            bm.to_mesh(me)
            bm.free()
            for pl in me.polygons:
                pl.use_smooth = True
            me.materials.append(hm)
            ob = bpy.data.objects.new(name, me)
            ob.location, ob.scale = loc, scale
            col.objects.link(ob)
        if sp["hair"] == "bun":
            blob(cid + "_bun", (0, .085 * k, top * .975), (.11 * k, .11 * k, .11 * k))
        if sp["hair"] == "long":
            blob(cid + "_hair_back", (0, .1 * k, top * .87), (.2 * k, .1 * k, .46 * k))
    if sp["crown"]:
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=.096 * top / 1.66, radius2=.045 * top / 1.66, depth=.22 * top / 1.66)
        me = bpy.data.meshes.new(cid + "_crown")
        bm.to_mesh(me)
        bm.free()
        me.materials.append(mat("crown_" + cid, sp["crown"], .3, 1.0))
        ob = bpy.data.objects.new(cid + "_crown", me)
        ob.location = (0, .02, top + .085 * top / 1.66)
        col.objects.link(ob)
    bpy.data.objects.remove(human, do_unlink=True)
    bpy.data.objects.remove(rig, do_unlink=True)
    label = names["characters"].get(cid, {}).get("name", cid)
    col["asset_id"], col["asset_kind"], col["asset_state"], col["asset_name"] = cid, "char", STATE, label
    col["height_m"], col["source"] = round(top, 3), "MPFB 2 (MakeHuman)"
    try:
        col.asset_mark()
    except Exception:
        pass
    d = os.path.join(root, "assets", "char", cid)
    os.makedirs(os.path.join(d, "publish"), exist_ok=True)
    os.makedirs(os.path.join(d, "review"), exist_ok=True)
    p = os.path.join(d, "publish", "%s_%s_%s.blend" % (cid, STATE, VER))
    bpy.ops.wm.save_as_mainfile(filepath=p)
    # review still: three-quarter front
    scene = bpy.context.scene
    cd = bpy.data.cameras.new("review")
    cd.lens = 70
    cam = bpy.data.objects.new("review", cd)
    scene.collection.objects.link(cam)
    cam.location = (1.6, -4.4, top * .62)
    cam.rotation_euler = (Vector((0, 0, top * .52)) - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    r = scene.render
    r.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light, scene.display.shading.color_type = "STUDIO", "MATERIAL"
    r.resolution_x, r.resolution_y, r.film_transparent = 420, 720, False
    if hasattr(r.image_settings, "media_type"):
        r.image_settings.media_type = "IMAGE"
    r.image_settings.file_format = "PNG"
    r.filepath = os.path.join(d, "review", "%s_%s_%s.png" % (cid, STATE, VER))
    bpy.ops.render.render(write_still=True)
    with open(os.path.join(d, "asset.json"), "w", encoding="utf8") as fh:
        json.dump(dict(id=cid, kind="char", name=label, state=STATE, version=VER, collection=col.name,
                       publish="assets/char/%s/publish/%s_%s_%s.blend" % (cid, cid, STATE, VER),
                       source="MPFB 2 (MakeHuman)", height_m=round(top, 3), rigged=False, spec=sp,
                       next_states=["model_approved", "rig_v1", "lookdev_approved", "final"]),
                  fh, ensure_ascii=False, indent=1, default=list)
    return round(top, 3)


def main(argv):
    o = dict(root=None, only=None)
    for i in range(0, len(argv), 2):
        o[argv[i].lstrip("-")] = argv[i + 1]
    root = os.path.abspath(o["root"])
    names = json.load(open(os.path.join(root, "pipeline", "manifest.json"), encoding="utf8"))["names"]
    ids = [x for x in (o["only"].split(",") if o["only"] else SPEC)]
    log = dict(done={}, errors=[], phase="chars")
    lp = os.path.join(root, "pipeline", "logs", "chars_status.json")
    for cid in ids:
        try:
            log["done"][cid] = build(root, cid, SPEC[cid], names)
        except Exception as ex:
            import traceback
            log["errors"].append(dict(id=cid, error=str(ex), trace=traceback.format_exc()[-900:]))
        json.dump(log, open(lp, "w"), indent=1)
    log["phase"] = "finished"
    json.dump(log, open(lp, "w"), indent=1)
    print("trailer_chars: %d done, %d errors" % (len(log["done"]), len(log["errors"])))


if __name__ == "__main__":
    main(sys.argv[sys.argv.index("--") + 1:])
