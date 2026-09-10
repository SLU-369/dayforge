import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRTextureBasisu } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, meshopt, join, flatten } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

// Input must be the material-sanitized Blender export, never the original model.
const [input, output, encoder] = process.argv.slice(2);
if (!input || !output || !encoder) throw new Error('Usage: node optimize-castle.mjs sanitized.glb output.glb path/to/toktx');
const scratch = resolve('work/scene-textures');
await mkdir(scratch, { recursive: true });
await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder});
const document = await io.read(input);
await document.transform(dedup(), weld(), simplify({simplifier: MeshoptSimplifier, ratio: .6, error: .0005}), flatten(), join(), prune());
const normalMaps = new Set(document.getRoot().listMaterials().map(m => m.getNormalTexture()));
let index = 0;
for (const texture of document.getRoot().listTextures()) {
  const png = resolve(scratch, `${index}.${texture.getMimeType() === 'image/png' ? 'png' : 'jpg'}`);
  const ktx = resolve(scratch, `${index++}.ktx2`);
  await writeFile(png, texture.getImage());
  const linear = normalMaps.has(texture);
  execFileSync(resolve(encoder), ['--t2', '--encode', 'uastc', '--zcmp', '18', '--genmipmap', '--threads', '2', '--assign_oetf', linear ? 'linear' : 'srgb', ktx, png], { stdio: 'inherit' });
  texture.setImage(await readFile(ktx)).setMimeType('image/ktx2');
}
document.createExtension(KHRTextureBasisu).setRequired(true);
await document.transform(meshopt({encoder: MeshoptEncoder, level: 'high'}));
await io.write(output, document);
console.log('Triangles:', document.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((n, p) => n + p.getIndices().getCount() / 3, 0), 0));
