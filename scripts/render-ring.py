"""THE ISLAND CUT sample ring, v4 (1 Nov 2026 pm, Thulaib's three asks). Defaults are the chosen pose, proven on a sweep of
six end poses at 300 px and two checks at 800 px (the engraving reads the right way round with TEXT_UP -1): the stone CHANGES COLOUR through the second
chapter (blue to padparadscha through violet and pink, the Ceylon family), an ENGRAVING sits inside the band and is seen
through the hole at the end, and the turn EASES to a stop at a pose where the hole faces the camera. Blender renders only;
no 3D code is shipped to browsers. Settings by environment: RES (pixels), SAMPLES, OUT (folder), TILT_END (degrees of
X tilt at the end), THETA_END (degrees), EASE (exponent), TEXT, TEXT_DIR (+1/-1 reading direction), TEXT_UP (+1/-1)."""
import bpy, math, os, sys, colorsys
from mathutils import Vector
E = os.environ
RES = int(E.get('RES', '1600')); SAMPLES = int(E.get('SAMPLES', '64'))
OUT = os.path.expanduser(E.get('OUT', '~/bb-websites/the-island-cut/renders/ring-v4')); os.makedirs(OUT, exist_ok=True)
TILT0 = (8.0, -24.0); TILT_END = float(E.get('TILT_END', '-30')); TILT_Y_END = float(E.get('TILT_Y_END', '0')); THETA_END = float(E.get('THETA_END', '210')); EASE = float(E.get('EASE', '1.7'))
TEXT = E.get('TEXT', 'Entirely yours'); TEXT_SIZE = float(E.get('TEXT_SIZE', '.22')); TEXT_DIR = float(E.get('TEXT_DIR', '1')); TEXT_UP = float(E.get('TEXT_UP', '-1'))
FONT = E.get('FONT', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts', 'cormorant-italic.ttf'))   # the site's own Cormorant Garamond italic
FRAMES = 60; CH2 = 20; CH3 = 41   # chapter boundaries as the page sets them (p .34 and .69 of 59)

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
sapphire = material('Ceylon sapphire', (.42, .56, .96), 0, .0, 1.0)
_p = sapphire.node_tree.nodes.get('Principled BSDF'); _p.inputs['Coat Weight'].default_value = .6; _p.inputs['Specular IOR Level'].default_value = .7
_ab = sapphire.node_tree.nodes.new('ShaderNodeVolumeAbsorption'); _ab.inputs['Color'].default_value = (.10, .22, .78, 1); _ab.inputs['Density'].default_value = 1.6
sapphire.node_tree.links.new(_ab.outputs['Volume'], sapphire.node_tree.nodes.get('Material Output').inputs['Volume'])

def smooth(u): u = min(1, max(0, u)); return u * u * (3 - 2 * u)
def stone_colour(i):
    """Blue through the first chapter; through the second the hue travels blue, violet, pink, peach (the Ceylon family) and
    lands on padparadscha, held through the third. Two colours: the surface base and the body absorption."""
    u = smooth((i - CH2) / (CH3 - 1 - CH2))
    def hsv(h0, h1, s, v): return colorsys.hsv_to_rgb(((h0 + (h1 - h0) * u) % 360) / 360, s, v)
    base = hsv(224, 370, .58, .97); body = hsv(229, 375, .86, .80)
    return base, body
root = bpy.data.objects.new('Whole ring', None); scene.collection.objects.link(root)
def finish(o, mat, smooth_=True):
    o.data.materials.append(mat); o.parent = root
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
o = bpy.data.objects.new('Solid gold band', mesh); scene.collection.objects.link(o); finish(o, gold)

# The engraving: the site's own Cormorant italic, set flat, turned to a mesh, then wrapped onto the inner wall at the
# bottom of the band (opposite the stone), standing a hair proud so the light catches it, in a darker gold.
R_IN = 1.025
try:
    font = bpy.data.fonts.load(FONT)
except Exception as e:
    print('FONT FALLBACK', e); font = None
bpy.ops.object.text_add(); t = bpy.context.object; t.data.body = TEXT; t.data.size = TEXT_SIZE; t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'; t.data.extrude = .006
if font: t.data.font = font
bpy.ops.object.convert(target='MESH'); t.name = 'Engraving'
for v in t.data.vertices:
    x, y, z = v.co
    a = -math.pi / 2 - TEXT_DIR * x / R_IN            # along the circumference, centred at the bottom
    r = R_IN + .003 - (z + .006) / .012 * .016          # from a hair inside the wall to .013 proud of it
    v.co = (r * math.cos(a), TEXT_UP * y, r * math.sin(a))
t.data.update(); t.data.materials.clear(); finish(t, engraved, False)

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
o = bpy.data.objects.new('Sapphire', mesh); scene.collection.objects.link(o); finish(o, sapphire, False)
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT'); o.select_set(False)

def rod(name, a, b, r):
    v = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=r, depth=v.length, location=(Vector(a) + Vector(b)) / 2)
    o = bpy.context.object; o.name = name; o.rotation_euler = v.to_track_quat('Z', 'Y').to_euler(); finish(o, gold)
    bevel = o.modifiers.new('Soft metal edge', 'BEVEL'); bevel.width = .025; bevel.segments = 3
for a in [math.pi / 4, 3 * math.pi / 4, 5 * math.pi / 4, 7 * math.pi / 4]:
    x = .62 * math.cos(a); y = .46 * math.sin(a)
    rod('Basket claw', (x * .6, y * .6, 1.02), (x * 1.04, y * 1.04, 1.61), .042)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=.052, location=(x * 1.01, y * 1.01, 1.60)); finish(bpy.context.object, gold)
bpy.ops.mesh.primitive_torus_add(major_segments=64, minor_segments=12, location=(0, 0, 1.30), major_radius=.46, minor_radius=.035)
o = bpy.context.object; o.scale.x = 1.35; finish(o, gold)

def light(name, location, power, size, target=(0, 0, .3), shape='DISK', size_y=None):
    bpy.ops.object.light_add(type='AREA', location=location); o = bpy.context.object; o.name = name; o.data.energy = power; o.data.shape = shape; o.data.size = size
    if size_y: o.data.size_y = size_y
    o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
light('Large softbox left', (-3, -4, 6), 450, 4)
light('Long reflection right', (4, 0, 3), 600, 2, shape='RECTANGLE', size_y=5)
light('Top facet highlight', (-1, 3, 5), 500, 2)
light('Front fill', (0, -5, 1), 80, 3)
# No shadow plate (Thulaib, 1 Nov 2026 pm): the ring floats on the paper as ChatGPT's did.
bpy.ops.object.camera_add(location=(3.5, -6, 3.4))
cam = bpy.context.object; cam.rotation_euler = (Vector((0, 0, .25)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.type = 'ORTHO'; cam.data.ortho_scale = 3.9; scene.camera = cam

def pose(i):
    """The turn eases to a stop: fast at the top of the page, slower as the hole comes round to face the camera. The X tilt
    opens from TILT0 to TILT_END through the third chapter so the inside of the band and its engraving are seen."""
    t = i / (FRAMES - 1); eased = 1 - (1 - t) ** EASE
    theta = math.radians(THETA_END) * eased
    u = smooth((i - CH3) / (FRAMES - 1 - CH3)); tilt_x = TILT0[0] + (TILT_END - TILT0[0]) * u; tilt_y = TILT0[1] + (TILT_Y_END - TILT0[1]) * u
    return (math.radians(tilt_x), math.radians(tilt_y), theta)
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
frames = [int(a) for a in args] if args else range(FRAMES)
for i in frames:
    base, body = stone_colour(i)
    _p.inputs['Base Color'].default_value = (*base, 1); _ab.inputs['Color'].default_value = (*body, 1)
    root.rotation_euler = pose(i)
    scene.render.filepath = os.path.join(OUT, f'ring-{i:03d}.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', i, 'theta', round(math.degrees(pose(i)[2]), 1), 'tilt', round(math.degrees(pose(i)[0]), 1), 'base', [round(c, 2) for c in base])
