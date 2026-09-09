import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('castle is self-contained, compressed and attributed', () => {
  const bytes = readFileSync(new URL('../public/scenes/castle/castle.glb', import.meta.url));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.ok(bytes.length < 8 * 1024 * 1024);
  const doc = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)).trim());
  assert.ok(doc.extensionsRequired.includes('EXT_meshopt_compression'));
  assert.ok(doc.extensionsRequired.includes('KHR_texture_basisu'));
  assert.ok(doc.images.length > 0);
  for (const image of doc.images) { assert.equal(image.mimeType, 'image/ktx2'); assert.equal(image.uri, undefined); }
  for (const buffer of doc.buffers) assert.equal(buffer.uri, undefined);
  assert.doesNotMatch(JSON.stringify(doc), /TexturesCom|\.blend|file:\/\//i);
  const credit = readFileSync(new URL('../public/scenes/castle/ATTRIBUTION.md', import.meta.url), 'utf8');
  assert.ok(credit.includes(createHash('sha256').update(bytes).digest('hex').toUpperCase()));
  assert.match(credit, /Ju Designer/);
});
