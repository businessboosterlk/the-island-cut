"""Registered bridge shots: one camera/scene, no crossfade between duplicate rings."""
import bpy, os, sys, math
from mathutils import Vector, Euler
HERE=os.path.dirname(os.path.abspath(__file__))
source=open(os.path.join(HERE,'render-bookends.py')).read().split('args=sys.argv')[0]
exec(compile(source,os.path.join(HERE,'render-bookends.py'),'exec'))
OUT=os.path.join(os.path.dirname(HERE),'renders','bridges');os.makedirs(OUT,exist_ok=True)
scene.cycles.samples=24
box_parts=[o for o in scene.objects if o.type=='MESH' and o not in ring_objects]
box_root=bpy.data.objects.new('Box travel',None);scene.collection.objects.link(box_root)
for o in box_parts:
    if o.parent is None: o.parent=box_root
hinge.parent=box_root
originals={o.name:o.location.copy() for o in ring_objects}
start_cam=Vector((0,-7,4.7));end_cam=Vector((3.5,-6,3.4))
box_target=Vector((0,0,1.35));hero_target=Vector((0,0,.25))
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
modes=[args[0]] if args else ['depart','arrive']
indices=[int(args[1])] if len(args)>1 else range(36)
for mode in modes:
 for i in indices:
    t=i/35;u=smooth(t);hero=u if mode=='depart' else 1-u
    cam.location=start_cam.lerp(end_cam,hero)
    target=box_target.lerp(hero_target,hero)
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=5.8+(3.9*1247/1600-5.8)*hero
    # Match the approved square crop's centre to sub-pixel accuracy at the hero seam.
    cam.data.shift_x=(-.5/1247)*hero;cam.data.shift_y=(-1.5/1247)*hero
    root.rotation_euler=tuple(v*hero for v in pose(0))
    scale=.42+.58*hero;root.scale=(scale,scale,scale)
    root.location=(0,0,(.2 if mode=='depart' else .85)*(1-hero))
    hinge.rotation_euler.x=-math.radians(105)
    box_root.rotation_euler.z=math.atan2(cam.location.x,-cam.location.y)
    box_root.location.z=-6*smooth(min(1,hero*1.6))
    for o in ring_objects:
      o.location=originals[o.name].copy();o.hide_render=False
      if mode=='depart' and o!=stone:
        assembly=smooth((t-.28)/.58)
        o.hide_render=t<.28
        o.location.z-=4*(1-assembly)
    scene.render.filepath=os.path.join(OUT,f'{mode}-{i:03d}.png');bpy.ops.render.render(write_still=True)
