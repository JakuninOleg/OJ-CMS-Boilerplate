import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { generateSlug } from '../src/lib/slug.mjs';
import { validateMediaBytes, validatePhoto, validateUploadFile } from '../src/hooks/media';
import { referencesMedia } from '../src/lib/media-references';
import { editors, administrators } from '../src/access';
test('Readable Russian slugs', () => assert.equal(generateSlug('Новая публикация 2026'), 'novaya-publikatsiya-2026'));
test('Relationship detection does not match arbitrary text', () => {
  assert.equal(referencesMedia({ title: '12' }, 12), false);
  assert.equal(referencesMedia({ cover: 12 }, 12), true);
  assert.equal(referencesMedia({ type: 'upload', relationTo: 'media', value: 12 }, 12), true);
});
test('Editor cannot act as administrator', () => {
  const req = { user: { role: 'editor' } } as never;
  assert.equal(editors({ req }), true);
  assert.equal(administrators({ req }), false);
});
test('Spoofed and malformed images are rejected', async () => {
  assert.ok(validateMediaBytes('x.png', 'image/png', Buffer.from('<svg></svg>')));
  assert.ok(await validatePhoto(Buffer.from('broken')));
  const image = await sharp({ create: { width: 30, height: 20, channels: 3, background: '#fff' } }).png().toBuffer();
  assert.equal(await validatePhoto(image), null);
  await assert.rejects(() => validateUploadFile({ name: 'x.png', mimetype: 'image/png', size: 11 * 1024 * 1024, data: image }));
});
