"""Surface-bound recessed inscription; no separate or protruding geometry."""
band = bpy.data.objects['Solid gold band']
uv = band.data.uv_layers.new(name='Engraving coordinates')
inner = band.data.attributes.new(name='Inner wall', type='FLOAT', domain='POINT')
for i, vertex in enumerate(band.data.vertices):
    b = 2 * math.pi * (i % M) / M
    inner.data[i].value = 1.0 if math.cos(b) < -.5 else 0.0
for polygon in band.data.polygons:
    indices = [band.data.loops[l].vertex_index for l in polygon.loop_indices]
    seam = any(i // M == N-1 for i in indices) and any(i // M == 0 for i in indices)
    for loop in polygon.loop_indices:
        i = band.data.loops[loop].vertex_index
        u = (i // M) / N
        if seam and u == 0: u = 1
        uv.data[loop].uv = (u, (band.data.vertices[i].co.y + .145) / .29)
mat = gold.copy(); mat.name = 'Gold with flush recessed inscription'
band.data.materials.clear(); band.data.materials.append(mat)
nodes = mat.node_tree.nodes; links = mat.node_tree.links
principled = nodes.get('Principled BSDF')
tex = nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts', 'engraving-mask.png'), check_existing=True)
tex.image.colorspace_settings.name = 'Non-Color'
tex.interpolation = 'Linear'; tex.extension = 'EXTEND'
coords = nodes.new('ShaderNodeUVMap'); coords.uv_map = uv.name
links.new(coords.outputs['UV'], tex.inputs['Vector'])
inside = nodes.new('ShaderNodeAttribute'); inside.attribute_name = 'Inner wall'
mask = nodes.new('ShaderNodeMath'); mask.operation = 'MULTIPLY'
links.new(tex.outputs['Color'], mask.inputs[0]); links.new(inside.outputs['Fac'], mask.inputs[1])
bump = nodes.new('ShaderNodeBump'); bump.invert = True
bump.inputs['Strength'].default_value = .45; bump.inputs['Distance'].default_value = .002
links.new(mask.outputs[0], bump.inputs['Height']); links.new(bump.outputs['Normal'], principled.inputs['Normal'])
tone = nodes.new('ShaderNodeMixRGB'); tone.blend_type = 'MIX'
tone.inputs[1].default_value = (.83,.57,.22,1)
tone.inputs[2].default_value = (.34,.22,.075,1)
links.new(mask.outputs[0], tone.inputs[0]); links.new(tone.outputs[0], principled.inputs['Base Color'])
rough = nodes.new('ShaderNodeMapRange'); rough.inputs['To Min'].default_value=.19; rough.inputs['To Max'].default_value=.4
links.new(mask.outputs[0], rough.inputs['Value']); links.new(rough.outputs['Result'], principled.inputs['Roughness'])
print('SURFACE ENGRAVING: inner wall only, unchanged band silhouette')
