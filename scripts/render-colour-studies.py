"""Four matching illustrative loose stones, using the site's own master model."""
import os, bpy, math
from mathutils import Vector
HERE=os.path.dirname(os.path.abspath(__file__))
source=open(os.path.join(HERE,'render-ring.py')).read().split('args = sys.argv')[0]
exec(compile(source,os.path.join(HERE,'render-ring.py'),'exec'))
stone=bpy.data.objects['Sapphire']
for obj in root.children:
    obj.hide_render=obj != stone
root.rotation_euler=(0,0,0)
cam.location=(2,-5,5)
cam.rotation_euler=(Vector((0,0,1.45))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=2.25
scene.render.resolution_x=scene.render.resolution_y=1000
scene.cycles.samples=32
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.8,.8,.8,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
_p.inputs['Transmission Weight'].default_value=.45
_p.inputs['Roughness'].default_value=.08
_ab.inputs['Density'].default_value=.3
for obj in scene.objects:
    if obj.type=='LIGHT':
        obj.data.size=min(obj.data.size,1.3)
        obj.data.energy*=.7
colours=[('study-blue',(.32,.48,.95),(.10,.22,.78)),('study-pink',(.95,.46,.65),(.8,.13,.32)),('study-gold',(.98,.8,.3),(.85,.53,.08)),('study-teal',(.23,.8,.7),(.05,.5,.4))]
for name,base,body in colours:
    _p.inputs['Base Color'].default_value=(*base,1)
    _ab.inputs['Color'].default_value=(*body,1)
    scene.render.filepath=os.path.join(OUT,name+'.png')
    bpy.ops.render.render(write_still=True)
