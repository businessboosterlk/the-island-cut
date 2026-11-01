"""Front-facing bookends, sharing the approved ring geometry. Offline generated samples.
Run Blender --python scripts/render-bookends.py. Optional arguments: opening/return, frame.
The ring descends in real 3D, so cushion and front-wall occlusion are rendered, not CSS faked.
"""
import bpy, math, os, sys
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
# Reuse the approved master scene, without its render loop.
source = open(os.path.join(HERE, 'render-ring.py')).read().split('args = sys.argv')[0]
exec(compile(source, os.path.join(HERE, 'render-ring.py'), 'exec'))
OUT = os.path.join(os.path.dirname(HERE), 'renders', 'bookends')
os.makedirs(OUT, exist_ok=True)
scene.render.resolution_x = scene.render.resolution_y = 720
scene.cycles.samples = 16
root.rotation_euler = (0, 0, 0)
root.scale = (.42, .42, .42)
ring_objects = list(root.children)
stone = bpy.data.objects['Sapphire']
shell = material('Charcoal suede', (.052,.046,.038), rough=.68)
lining = material('Warm ivory velvet', (.44,.39,.29), rough=.95)
dark = material('Cushion recess', (.012,.011,.009), rough=1)
def cube(name, loc, scale, mat, parent=None, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    m=o.modifiers.new('Soft tailored edge','BEVEL'); m.width=bevel; m.segments=4
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    if parent: o.parent=parent
    return o
cube('Box base',(0,0,.12),(3.2,2.7,.24),shell)
for x in [-1.5,1.5]: cube('Side wall',(x,0,.45),(.2,2.7,.7),shell)
for y in [-1.25,1.25]: cube('Front back wall',(0,y,.45),(3,.2,.7),shell)
cube('Cushion',(0,0,.52),(2.85,2.35,.40),lining,bevel=.16)
cube('Single ring recess',(0,0,.725),(1.05,.11,.02),dark,bevel=.025)
hinge=bpy.data.objects.new('Lid hinge',None);scene.collection.objects.link(hinge);hinge.location=(0,1.25,.81)
cube('Lid',(0,-1.25,.53),(3.2,2.7,.16),shell,hinge)
cube('Inner lid',(0,-1.25,.42),(2.85,2.35,.10),lining,hinge,bevel=.1)
for x in [-1.5,1.5]: cube('Lid side',(x,-1.25,.23),(.2,2.7,.5),shell,hinge)
for y in [-2.5,0]: cube('Lid rim',(0,y,.23),(3,.2,.5),shell,hinge)
cube('Clasp',(0,-1.37,.79),(.3,.025,.1),gold,bevel=.02)
cam.location=(0,-7,4.7)
cam.rotation_euler=(Vector((0,0,1.35))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=5.8
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
modes=[args[0]] if args else ['opening','return']
indices=[int(args[1])] if len(args)>1 else range(24)
for mode in modes:
    for i in indices:
        for obj in ring_objects: obj.hide_render = mode=='opening' and obj != stone
        if mode=='opening':
            hinge.rotation_euler.x=-math.radians(105)*smooth(min(1,i/15))
            root.location=(0,0,.20 + 2.8*smooth(max(0,(i-16)/7)))
        else:
            hinge.rotation_euler.x=-math.radians(105)
            root.location=(0,0,3.4 - 2.55*smooth(i/23))
        scene.render.filepath=os.path.join(OUT,f'{mode}-{i:03d}.png')
        bpy.ops.render.render(write_still=True)
