"""THE ISLAND CUT ring journey, stops five and six (Thulaib, 1 Nov 2026 pm: "scroll the 5th time, then the ring breaks once,
and then scroll the 6th time, the whole ring breaks apart, but it has gone down"). Thirty-two frames of the hero's ring coming
apart FROM THE POSE THE OPENING ENDS ON, so the opening's last frame and this film's first are the same picture and the page
can swap one for the other without a seam: the pose is scripts/render-ring.py's pose(59) (tilt -30, 0, theta 210), the stone
is its padparadscha of frame 59, the engraving its 'Entirely yours' at its size and direction, and the camera is its camera
at its pixels per ring unit (ortho 3.9 over 1600 px), on a film 1600 wide and RES_Y tall (2048) shifted so the whole ring
sits low and the lifted stone stays inside. Frames 0 to 15: the stone alone rises out of the setting (the ring "breaks
once"). Frames 16 to 31: the setting lifts off the band and the stone rises a little further ("the whole ring breaks apart").
Transparent film, no plate, no shadow, nothing under the parts. Settings by environment: RES (1600), RES_Y (2048), SHIFT_Y
(.1), SAMPLES (64), OUT (renders/journey), GPU=1. Frames rendered by an earlier run are kept unless FORCE=1.
  GPU=1 /opt/homebrew/bin/blender -b --python scripts/render-journey.py            # all thirty-two into renders/journey/
  GPU=1 /opt/homebrew/bin/blender -b --python scripts/render-journey.py -- 0       # one frame (0 is the seam proof)
Then scripts/journey-frames.sh checks frame 0 against the opening's ring-059.png and cuts the WebP sets."""
import bpy, math, os, sys, time, colorsys
from mathutils import Vector
E = os.environ
RES = int(E.get('RES', '1600')); RES_Y = int(E.get('RES_Y', '2048')); SHIFT_Y = float(E.get('SHIFT_Y', '.1')); SAMPLES = int(E.get('SAMPLES', '64'))
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.expanduser(E.get('OUT', os.path.join(os.path.dirname(ROOT), 'renders', 'journey'))); os.makedirs(OUT, exist_ok=True)
FONT = E.get('FONT', os.path.join(ROOT, 'fonts', 'cormorant-italic.ttf'))
# The opening's end state, copied from scripts/render-ring.py (its defaults of 1 Nov 2026 pm). Change them there and here together.
TILT0 = (8.0, -24.0); TILT_END = -30.0; TILT_Y_END = 0.0; THETA_END = 210.0; EASE = 1.7; CH2 = 20; CH3 = 41; HERO_FRAMES = 60
TEXT = 'Entirely yours'; TEXT_SIZE = .22; TEXT_DIR = 1; TEXT_UP = -1
FRAMES = 32; BREAK = 16                             # 0..15 the stone rises alone, 16..31 the setting lifts off the band
STONE_A = 0.9; STONE_B = 1.4; BASKET_B = 0.55       # lifts along the ring's own axis, in ring units (the band's outer radius is 1.235)

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
scene.render.resolution_x = RES; scene.render.resolution_y = RES_Y; scene.render.resolution_percentage = 100
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
sapphire = material('Ceylon sapphire', (.42, .56, .96), 0, .0, 1.0)
_p = sapphire.node_tree.nodes.get('Principled BSDF'); _p.inputs['Coat Weight'].default_value = .6; _p.inputs['Specular IOR Level'].default_value = .7
_ab = sapphire.node_tree.nodes.new('ShaderNodeVolumeAbsorption'); _ab.inputs['Color'].default_value = (.10, .22, .78, 1); _ab.inputs['Density'].default_value = 1.6
sapphire.node_tree.links.new(_ab.outputs['Volume'], sapphire.node_tree.nodes.get('Material Output').inputs['Volume'])

def smooth(u): u = min(1, max(0, u)); return u * u * (3 - 2 * u)
def stone_colour(i):
    """render-ring.py's colour at hero frame i: padparadscha from frame 40 on."""
    u = smooth((i - CH2) / (CH3 - 1 - CH2))
    def hsv(h0, h1, s, v): return colorsys.hsv_to_rgb(((h0 + (h1 - h0) * u) % 360) / 360, s, v)
    return hsv(224, 370, .58, .97), hsv(229, 375, .86, .80)
def hero_pose(i):
    """render-ring.py's pose at hero frame i."""
    t = i / (HERO_FRAMES - 1); eased = 1 - (1 - t) ** EASE
    theta = math.radians(THETA_END) * eased
    u = smooth((i - CH3) / (HERO_FRAMES - 1 - CH3)); tilt_x = TILT0[0] + (TILT_END - TILT0[0]) * u; tilt_y = TILT0[1] + (TILT_Y_END - TILT0[1]) * u
    return (math.radians(tilt_x), math.radians(tilt_y), theta)
base, body = stone_colour(HERO_FRAMES - 1)
_p.inputs['Base Color'].default_value = (*base, 1); _ab.inputs['Color'].default_value = (*body, 1)

# One ring, three parts, each under its own empty under the whole ring, so a lift is a move along the ring's own axis.
root = bpy.data.objects.new('Whole ring', None); scene.collection.objects.link(root); root.rotation_euler = hero_pose(HERO_FRAMES - 1)
def part(name):
    o = bpy.data.objects.new(name, None); scene.collection.objects.link(o); o.parent = root; return o
band_part = part('The band'); basket_part = part('The setting'); stone_part = part('The stone')
def finish(o, mat, parent, smooth_=True):
    o.data.materials.append(mat); o.parent = parent
    if smooth_:
        for p in o.data.polygons: p.use_smooth = True
    return o

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

R_IN = 1.025
try: font = bpy.data.fonts.load(FONT)
except Exception as e: print('FONT FALLBACK', e); font = None
bpy.ops.object.text_add(); t = bpy.context.object; t.data.body = TEXT; t.data.size = TEXT_SIZE; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'; t.data.extrude = .006
if font: t.data.font = font
bpy.ops.object.convert(target='MESH'); t.name = 'Engraving'
for v in t.data.vertices:
    x, y, z = v.co
    a = -math.pi / 2 - TEXT_DIR * x / R_IN
    r = R_IN + .003 - (z + .006) / .012 * .016
    v.co = (r * math.cos(a), TEXT_UP * y, r * math.sin(a))
t.data.update(); t.data.materials.clear(); finish(t, engraved, band_part, False)

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
# The opening's camera exactly, on a taller film: ortho_scale covers the larger side, so it grows with the height to keep
# 1600 px = 3.9 ring units across, and the view is shifted so the ring sits low and the rising stone stays on the film.
bpy.ops.object.camera_add(location=(3.5, -6, 3.4))
cam = bpy.context.object; cam.rotation_euler = (Vector((0, 0, .25)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.type = 'ORTHO'
cam.data.ortho_scale = 3.9 * max(RES, RES_Y) / RES; cam.data.shift_y = SHIFT_Y; scene.camera = cam

def lifts(i):
    """(stone, basket) in ring units at frame i: the stone alone to STONE_A over the first half, then the basket to BASKET_B
    and the stone on to STONE_B over the second, each eased."""
    if i < BREAK: u = smooth(i / (BREAK - 1)); return STONE_A * u, 0.0
    v = smooth((i - BREAK + 1) / (FRAMES - BREAK)); return STONE_A + (STONE_B - STONE_A) * v, BASKET_B * v
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
frames = [int(a) for a in args] if args else range(FRAMES)
for i in frames:
    s, b = lifts(i); path = os.path.join(OUT, f'apart-{i:03d}.png')
    if os.path.exists(path) and os.path.getsize(path) > 0 and not E.get('FORCE'): print('KEPT', i); continue
    stone_part.location = (0, 0, s); basket_part.location = (0, 0, b)
    t0 = time.time(); scene.render.filepath = path; bpy.ops.render.render(write_still=True)
    print('RENDERED', i, 'stone', round(s, 3), 'basket', round(b, 3), f'{time.time() - t0:.1f}s')
