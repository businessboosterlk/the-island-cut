"""THE ISLAND CUT customisation section ("Every part. Your choice."): sixty frames of ONE sapphire ring coming apart into its
three parts, rendered offline in Blender 5.2 (Cycles) on a transparent film with no plate, no shadow and no box, so the
parts float on the paper (Thulaib, 1 Nov 2026 pm: "it should be a pure PNG"). Built 1 Nov 2026 pm as ChatGPT's build brief
describes: the first 20 per cent of the scroll holds the whole ring (frames 0 to 11), the next 45 per cent the stone lifts
gently out of the setting and the setting lifts off the band, all along the ring's own axis (frames 12 to 38, eased), the
final 35 per cent holds the separated parts (frames 39 to 59). Scrolling back plays the same frames in reverse, so the ring
reassembles. The model is the hero's ring untouched (Business Booster's copy of the ring that came back from ChatGPT:
comfort band, four claw basket with its gallery, oval faceted royal blue sapphire, the engraving inside the band), copied
from the parent session's render_ring_v4.py and the site's render-ring.py; nothing about the ring or the stone colour
changes. The pose is the hero's poster pose, so the visitor meets the same ring. Settings by environment: RES (pixels,
1600), SAMPLES (64), OUT (folder), GPU=1 for the Metal GPU. Frames whose pose repeats (the held ends) are rendered once
and copied, pixel for pixel the same picture.
  GPU=1 /opt/homebrew/bin/blender -b --python scripts/render-customise.py            # all sixty into renders/customise/
  GPU=1 /opt/homebrew/bin/blender -b --python scripts/render-customise.py -- 39      # one frame
Then scripts/customise-frames.sh crops the sixty to the union of their ink and makes the WebP sets the page loads."""
import bpy, math, os, sys, shutil, time
from mathutils import Vector
E = os.environ
RES = int(E.get('RES', '1600')); SAMPLES = int(E.get('SAMPLES', '64'))
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.expanduser(E.get('OUT', os.path.join(os.path.dirname(ROOT), 'renders', 'customise'))); os.makedirs(OUT, exist_ok=True)
FONT = E.get('FONT', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts', 'cormorant-italic.ttf'))   # the hero's engraving face, kept in the site at scripts/fonts (the site ships woff2 only, which Blender cannot read); Blender's own face stands in if the file has gone
TEXT = E.get('TEXT', 'Entirely yours')
FRAMES = 60; HOLD_A = 12; HOLD_B = 39          # 0..11 whole (20%), 12..38 separating (45%), 39..59 apart (35%)
LIFT_STONE = 1.40; LIFT_BASKET = 0.55            # along the ring's own axis, in ring units (the band's outer radius is 1.235)
TILT = (8.0, -24.0, 0.0)                         # the hero's poster pose (frame 0 of the opening)

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES; scene.cycles.use_adaptive_sampling = True; scene.cycles.adaptive_threshold = 0.03; scene.cycles.use_denoising = True
if E.get('GPU'):
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for d in prefs.devices: d.use = True
        scene.cycles.device = 'GPU'; print('DEVICE GPU METAL', [d.name for d in prefs.devices])
    except Exception as e: print('DEVICE CPU', e)
scene.render.resolution_x = scene.render.resolution_y = RES; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'; scene.render.film_transparent = True
scene.view_settings.view_transform = 'AgX'; scene.world.color = (.28, .28, .28)
scene.cycles.max_bounces = 12; scene.cycles.transmission_bounces = 10; scene.cycles.glossy_bounces = 6
scene.cycles.caustics_reflective = True; scene.cycles.caustics_refractive = True

def material(name, colour, metal=0, rough=.15, transmission=0):
    m = bpy.data.materials.new(name); m.use_nodes = True; p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*colour, 1); p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough; p.inputs['Transmission Weight'].default_value = transmission
    p.inputs['IOR'].default_value = 1.77 if transmission else 1.5
    return m
gold = material('Polished warm yellow gold', (.83, .57, .22), 1, .19)
engraved = material('Engraving, dark in the groove', (.30, .20, .07), 1, .55)
sapphire = material('Royal blue sapphire', (.42, .56, .96), 0, .0, 1.0)   # the hero's blue, unchanged
_p = sapphire.node_tree.nodes.get('Principled BSDF'); _p.inputs['Coat Weight'].default_value = .6; _p.inputs['Specular IOR Level'].default_value = .7
_ab = sapphire.node_tree.nodes.new('ShaderNodeVolumeAbsorption'); _ab.inputs['Color'].default_value = (.10, .22, .78, 1); _ab.inputs['Density'].default_value = 1.6
sapphire.node_tree.links.new(_ab.outputs['Volume'], sapphire.node_tree.nodes.get('Material Output').inputs['Volume'])

# One ring, three parts. Each part hangs under its own empty, and the empties sit under the whole ring, so a lift is a move
# along the ring's own axis whatever the pose, and the parts can never drift apart sideways.
root = bpy.data.objects.new('Whole ring', None); scene.collection.objects.link(root); root.rotation_euler = tuple(math.radians(a) for a in TILT)
def part(name):
    o = bpy.data.objects.new(name, None); scene.collection.objects.link(o); o.parent = root; return o
band_part = part('The band'); basket_part = part('The setting'); stone_part = part('The stone')
def finish(o, mat, parent, smooth_=True):
    o.data.materials.append(mat); o.parent = parent
    if smooth_:
        for p in o.data.polygons: p.use_smooth = True
    return o

# Ring plane XZ, hole axis Y. Slightly flat shank cross section, not a wire torus. Inner radius 1.025, band width .29.
verts = []; faces = []; N = 128; M = 16
for i in range(N):
    a = 2 * math.pi * i / N
    for j in range(M):
        b = 2 * math.pi * j / M; r = 1.13 + .105 * math.cos(b)
        verts.append((r * math.cos(a), .145 * math.sin(b), r * math.sin(a)))
for i in range(N):
    for j in range(M): faces.append((i * M + j, ((i + 1) % N) * M + j, ((i + 1) % N) * M + (j + 1) % M, i * M + (j + 1) % M))
mesh = bpy.data.meshes.new('Comfort band'); mesh.from_pydata(verts, [], faces); mesh.update()
o = bpy.data.objects.new('Solid gold band', mesh); scene.collection.objects.link(o); finish(o, gold, band_part)

# The engraving inside the band, as the hero carries it (the same model, so the parts fit).
R_IN = 1.025
try: font = bpy.data.fonts.load(FONT)
except Exception as e: print('FONT FALLBACK', e); font = None
bpy.ops.object.text_add(); t = bpy.context.object; t.data.body = TEXT; t.data.size = .17; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'; t.data.extrude = .006
if font: t.data.font = font
bpy.ops.object.convert(target='MESH'); t.name = 'Engraving'
for v in t.data.vertices:
    x, y, z = v.co
    a = -math.pi / 2 - x / R_IN
    r = R_IN + .003 - (z + .006) / .012 * .016
    v.co = (r * math.cos(a), y, r * math.sin(a))
t.data.update(); t.data.materials.clear(); finish(t, engraved, band_part, False)

# Oval faceted centre stone, with table, crown, girdle and pavilion.
verts = []; faces = []; n = 24
levels = [(.46, 1.76), (.70, 1.68), (.88, 1.57), (1, 1.42), (1, 1.39), (.74, 1.24), (.40, 1.08), (.035, .99)]
for li, (r, z) in enumerate(levels):
    for i in range(n):
        a = 2 * math.pi * i / n; verts.append((.62 * r * math.cos(a), .46 * r * math.sin(a), z))
faces.append(tuple(range(n - 1, -1, -1)))
for k in range(len(levels) - 1):
    for i in range(n):
        j = (i + 1) % n
        if k in (0, 2, 4, 6): faces += [(k * n + i, k * n + j, (k + 1) * n + j), (k * n + i, (k + 1) * n + j, (k + 1) * n + i)]
        else: faces.append((k * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i))
faces.append(tuple(range((len(levels) - 1) * n, len(levels) * n)))
mesh = bpy.data.meshes.new('Oval facet geometry'); mesh.from_pydata(verts, [], faces); mesh.update()
o = bpy.data.objects.new('Sapphire', mesh); scene.collection.objects.link(o); finish(o, sapphire, stone_part, False)
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT'); o.select_set(False)

# The basket: four claws with beads and the gallery rail. A recognisable basket on its own once lifted off the band.
def rod(name, a, b, r):
    v = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=r, depth=v.length, location=(Vector(a) + Vector(b)) / 2)
    o = bpy.context.object; o.name = name; o.rotation_euler = v.to_track_quat('Z', 'Y').to_euler(); finish(o, gold, basket_part)
    bevel = o.modifiers.new('Soft metal edge', 'BEVEL'); bevel.width = .025; bevel.segments = 3
for a in [math.pi / 4, 3 * math.pi / 4, 5 * math.pi / 4, 7 * math.pi / 4]:
    x = .62 * math.cos(a); y = .46 * math.sin(a)
    rod('Basket claw', (x * .6, y * .6, 1.02), (x * 1.04, y * 1.04, 1.61), .042)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=.052, location=(x * 1.01, y * 1.01, 1.60)); finish(bpy.context.object, gold, basket_part)
bpy.ops.mesh.primitive_torus_add(major_segments=64, minor_segments=12, location=(0, 0, 1.30), major_radius=.46, minor_radius=.035)
o = bpy.context.object; o.scale.x = 1.35; finish(o, gold, basket_part)

def light(name, location, power, size, target=(0, 0, .3), shape='DISK', size_y=None):
    bpy.ops.object.light_add(type='AREA', location=location); o = bpy.context.object; o.name = name; o.data.energy = power; o.data.shape = shape; o.data.size = size
    if size_y: o.data.size_y = size_y
    o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
light('Large softbox left', (-3, -4, 6), 450, 4)
light('Long reflection right', (4, 0, 3), 600, 2, shape='RECTANGLE', size_y=5)
light('Top facet highlight', (-1, 3, 5), 500, 2)
light('Front fill', (0, -5, 1), 80, 3)
# No shadow plate, no ground, no box: the parts float on the paper (Thulaib, 1 Nov 2026 pm).
# The hero's camera direction, raised and widened so the lifted stone and the band both sit inside the film.
bpy.ops.object.camera_add(location=(3.5, -6, 3.4 + 0.9))
cam = bpy.context.object; cam.rotation_euler = (Vector((0, 0, .25 + 0.9)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.type = 'ORTHO'; cam.data.ortho_scale = 5.2; scene.camera = cam

def smooth(u): u = min(1, max(0, u)); return u * u * (3 - 2 * u)
def lift(i):
    """0 through the first hold, eased 0 to 1 across the separating frames, 1 through the last hold."""
    if i < HOLD_A: return 0.0
    if i >= HOLD_B: return 1.0
    return smooth((i - HOLD_A + 1) / (HOLD_B - HOLD_A + 1))
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
frames = [int(a) for a in args] if args else range(FRAMES)
done = {}
for i in frames:
    u = lift(i); path = os.path.join(OUT, f'apart-{i:03d}.png'); key = round(u, 4)
    if key not in done and os.path.exists(path) and os.path.getsize(path) > 0 and not E.get('FORCE'):
        done[key] = path; print('KEPT', i, 'lift', key); continue   # rendered by an earlier run; FORCE=1 renders again
    if key in done:
        shutil.copyfile(done[key], path); print('COPIED', i, 'from', os.path.basename(done[key]), 'lift', key); continue
    stone_part.location = (0, 0, LIFT_STONE * u); basket_part.location = (0, 0, LIFT_BASKET * u)
    t0 = time.time(); scene.render.filepath = path; bpy.ops.render.render(write_still=True); done[key] = path
    print('RENDERED', i, 'lift', key, 'stone', round(LIFT_STONE * u, 3), 'basket', round(LIFT_BASKET * u, 3), f'{time.time() - t0:.1f}s')
