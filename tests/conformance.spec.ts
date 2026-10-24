import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vite-plus/test';
import provenance from './fixtures/spec-conformance/provenance.json';

it.each(Object.entries(provenance.files))(
  'retains the pinned canonical asset %s',
  async (file, hash) => {
    const bytes = await readFile(new URL('./fixtures/spec-conformance/' + file, import.meta.url));
    expect(
      createHash('sha256')
        .update(JSON.stringify(JSON.parse(bytes.toString())))
        .digest('hex'),
    ).toBe(hash);
  },
);
it('retains every behavior vector exactly once', async () => {
  const bytes = await readFile(
    new URL('./fixtures/spec-conformance/behavior.json', import.meta.url),
  );
  const vectors = JSON.parse(bytes.toString()) as { id: string }[];
  expect(vectors).toHaveLength(21);
  expect(new Set(vectors.map((vector) => vector.id)).size).toBe(vectors.length);
});
