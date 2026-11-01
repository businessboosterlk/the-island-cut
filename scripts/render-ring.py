"""THE ISLAND CUT hero ring: sixty frames of one sapphire ring, rendered offline in Blender (Cycles). No 3D code is shipped
to browsers; the page draws the frames on a canvas by scroll progress. Business Booster's copy (1 Nov 2026) of the model that
came back from ChatGPT, with the stone re-made as a true sapphire, more facets and no shadow plate, so the ring floats on the paper as ChatGPT's did.
  /opt/homebrew/bin/blender -b --python scripts/render-ring.py            # all sixty into renders/ring-v3/
  /opt/homebrew/bin/blender -b --python scripts/render-ring.py -- 12      # one frame
Then scripts/hero-frames.sh turns the PNGs into the WebP sets the page loads."""
import bpy, math, os, sys
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(ROOT), 'renders', 'ring-v3')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.03
scene.cycles.use_denoising = True
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'AgX'
scene.world.color = (.28,.28,.28)
scene.cycles.max_bounces = 12
scene.cycles.transmission_bounces = 10
scene.cycles.glossy_bounces = 6
scene.cycles.caustics_reflective = True
scene.cycles.caustics_refractive = True

def material(name, colour, metal=0, rough=.15, transmission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*colour,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    p.inputs['Transmission Weight'].default_value=transmission
    p.inputs['IOR'].default_value=1.77 if transmission else 1.5
    return m
gold=material('Polished warm yellow gold',(.83,.57,.22),1,.19)
sapphire=material('Royal blue sapphire',(.42,.56,.96),0,.0,1.0)
_p=sapphire.node_tree.nodes.get('Principled BSDF'); _p.inputs['Coat Weight'].default_value=.6; _p.inputs['Specular IOR Level'].default_value=.7
_ab=sapphire.node_tree.nodes.new('ShaderNodeVolumeAbsorption'); _ab.inputs['Color'].default_value=(.10,.22,.78,1); _ab.inputs['Density'].default_value=1.6
sapphire.node_tree.links.new(_ab.outputs['Volume'], sapphire.node_tree.nodes.get('Material Output').inputs['Volume'])
root=bpy.data.objects.new('Whole ring',None); scene.collection.objects.link(root)

def finish(o, mat, smooth=True):
    o.data.materials.append(mat); o.parent=root
    if smooth:
        for p in o.data.polygons:p.use_smooth=True
    return o

# Ring plane XZ. Slightly flat shank cross section, not a wire torus.
verts=[]; faces=[]; N=128; M=16
for i in range(N):
    a=2*math.pi*i/N
    for j in range(M):
        b=2*math.pi*j/M
        r=1.13+.105*math.cos(b)
        verts.append((r*math.cos(a),.145*math.sin(b),r*math.sin(a)))
for i in range(N):
    for j in range(M):faces.append((i*M+j,((i+1)%N)*M+j,((i+1)%N)*M+(j+1)%M,i*M+(j+1)%M))
mesh=bpy.data.meshes.new('Comfort band');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Solid gold band',mesh);scene.collection.objects.link(o);finish(o,gold)

# Oval faceted centre stone, with table, crown, girdle and pavilion.
verts=[]; faces=[]; n=24
levels=[(.46,1.76),(.70,1.68),(.88,1.57),(1,1.42),(1,1.39),(.74,1.24),(.40,1.08),(.035,.99)]
for li,(r,z) in enumerate(levels):
    for i in range(n):
        a=2*math.pi*i/n
        verts.append((.62*r*math.cos(a),.46*r*math.sin(a),z))
faces.append(tuple(range(n-1,-1,-1)))
for k in range(len(levels)-1):
    for i in range(n):
        j=(i+1)%n
        if k in (0,2,4,6):
            faces += [(k*n+i,k*n+j,(k+1)*n+j),(k*n+i,(k+1)*n+j,(k+1)*n+i)]
        else:faces.append((k*n+i,k*n+j,(k+1)*n+j,(k+1)*n+i))
faces.append(tuple(range((len(levels)-1)*n,len(levels)*n)))
mesh=bpy.data.meshes.new('Oval facet geometry');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Blue sapphire',mesh);scene.collection.objects.link(o);finish(o,sapphire,False)
# Correct outward normals.
bpy.context.view_layer.objects.active=o;o.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)

def rod(name, a,b,r):
    v=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=v.length,location=(Vector(a)+Vector(b))/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();finish(o,gold)
    bevel=o.modifiers.new('Soft metal edge','BEVEL');bevel.width=.025;bevel.segments=3
for a in [math.pi/4,3*math.pi/4,5*math.pi/4,7*math.pi/4]:
    x=.62*math.cos(a);y=.46*math.sin(a)
    rod('Basket claw',(x*.6,y*.6,1.02),(x*1.04,y*1.04,1.61),.042)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.052,location=(x*1.01,y*1.01,1.60));finish(bpy.context.object,gold)
bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=12,location=(0,0,1.30),major_radius=.46,minor_radius=.035)
o=bpy.context.object;o.scale.x=1.35;finish(o,gold)

def light(name,location,power,size,target=(0,0,.3),shape='DISK',size_y=None):
    bpy.ops.object.light_add(type='AREA',location=location);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape=shape;o.data.size=size
    if size_y:o.data.size_y=size_y
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox left',(-3,-4,6),450,4)
light('Long reflection right',(4,0,3),600,2,shape='RECTANGLE',size_y=5)
light('Top facet highlight',(-1,3,5),500,2)
light('Front fill',(0,-5,1),80,3)
# No shadow plate (Thulaib, 1 Nov 2026 pm): the ring floats on the paper exactly as ChatGPT's did; the shadow had made a box.
bpy.ops.object.camera_add(location=(3.5,-6,3.4))
cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.25))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.9;scene.camera=cam
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
frames=[int(args[0])] if args else range(60)
for i in frames:
    root.rotation_euler=(math.radians(8),math.radians(-24),2*math.pi*i/60)
    scene.render.filepath=os.path.join(OUT,f'ring-{i:03d}.png')
    bpy.ops.render.render(write_still=True)
