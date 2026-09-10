import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
out = ROOT / 'hogwarts-prepared'
out.mkdir(exist_ok=True)
original_count = 0
graph = bpy.context.evaluated_depsgraph_get()
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        mesh = obj.evaluated_get(graph).to_mesh()
        mesh.calc_loop_triangles()
        original_count += len(mesh.loop_triangles)
        obj.evaluated_get(graph).to_mesh_clear()

# Replace every image-based source material, not merely its external paths.
# No original Textures.com pixels are exported, including packed images.
categories = {}
for mat in bpy.data.materials:
    nodes = list(mat.node_tree.nodes) if mat.node_tree else []
    sources = [n.image.name for n in nodes if n.type == 'TEX_IMAGE' and n.image]
    if sources:
        categories[mat.name] = 'rocky_terrain' if any('Rock_' in n for n in sources) else 'medieval_blocks_03'

for mat in bpy.data.materials:
    if mat.name not in categories:
        continue
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Roughness'].default_value = .85
    mat.node_tree.links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    for kind in ('Diffuse', 'nor_gl'):
        image = bpy.data.images.load(str(ROOT / 'scene-materials' / f'{categories[mat.name]}-{kind}.jpg'), check_existing=True)
        tex = nodes.new('ShaderNodeTexImage')
        tex.image = image
        if kind == 'Diffuse':
            mat.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
        else:
            image.colorspace_settings.name = 'Non-Color'
            normal = nodes.new('ShaderNodeNormalMap')
            normal.inputs['Strength'].default_value = .55
            mat.node_tree.links.new(tex.outputs['Color'], normal.inputs['Color'])
            mat.node_tree.links.new(normal.outputs['Normal'], shader.inputs['Normal'])

for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    # Dense subdivision of the foundation rock is unnecessary at background scale.
    for modifier in list(obj.modifiers):
        if modifier.type == 'SUBSURF':
            modifier.levels = min(modifier.levels, 1)
            modifier.render_levels = min(modifier.render_levels, 1)
    obj.select_set(True)

for image in list(bpy.data.images):
    if not image.filepath.startswith(str(ROOT / 'scene-materials')):
        bpy.data.images.remove(image)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bounds = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
minimum = Vector([min(v[i] for v in bounds) for i in range(3)])
maximum = Vector([max(v[i] for v in bounds) for i in range(3)])
print('BOUNDS', list(minimum), list(maximum))
bpy.ops.export_scene.gltf(filepath=str(out / 'castle.glb'), export_format='GLB',
                          use_selection=True, export_apply=True, export_animations=False,
                          export_cameras=False, export_lights=False,
                          export_image_format='JPEG', export_jpeg_quality=85)
summary = {'source_evaluated_triangles': original_count, 'base_triangles': 255692,
           'objects': len(meshes), 'replacement_materials': categories,
           'bounds': {'min': list(minimum), 'max': list(maximum)},
           'output_bytes': (out / 'castle.glb').stat().st_size}
(out / 'preparation.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
print(json.dumps(summary))
