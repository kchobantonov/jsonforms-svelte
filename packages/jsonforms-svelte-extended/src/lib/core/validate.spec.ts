import { expect, it } from 'vite-plus/test';
import { createAjv } from './validate';

it('uses Draft 2020-12 tuple semantics only for an explicit host dialect', () => {
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      coordinates: {
        type: 'array',
        prefixItems: [{ type: 'number' }, { type: 'number' }],
        items: false,
      },
    },
  };
  expect(() => createAjv().compile(schema)).toThrow();
  const validate = createAjv(undefined, undefined, [], 'draft-2020-12').compile(schema);
  expect(validate({ coordinates: [1, 2, 3] })).toBe(false);
  expect(validate.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ keyword: 'items', instancePath: '/coordinates' }),
    ]),
  );
  expect(validate({ coordinates: [1, 2] })).toBe(true);
});
