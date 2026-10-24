import { describe, expect, it } from 'vite-plus/test';
import type { JsonSchema } from '@jsonforms/core';
import { resolveImageView, type ImageViewElement } from './imageView';

const schema: JsonSchema = {
  type: 'object',
  properties: { photo: { type: 'string' }, count: { type: 'number' } },
};
const image: ImageViewElement = { type: 'ImageView', scope: '#/properties/photo', alt: '' };
const args = { schema, rootSchema: schema, data: { photo: '/photo.png' } };

describe('image source resolution', () => {
  it('gives defined sources precedence, including an intentional blank', () => {
    expect(resolveImageView({ ...image, src: '/direct.png' }, args).src).toBe('/direct.png');
    expect(resolveImageView({ ...image, src: '' }, args).src).toBeUndefined();
  });
  it('never falls through from an invalid direct source', () => {
    const result = resolveImageView({ ...image, src: 42 }, args);
    expect(result.src).toBeUndefined();
    expect(result.diagnostics.map((d) => d.code)).toEqual(['image.nonStringSource']);
  });
  it('resolves sources relative to the current array item', () => {
    expect(
      resolveImageView(image, {
        ...args,
        path: 'items.1',
        data: { items: [{ photo: '/a.png' }, { photo: '/b.png' }] },
      }).src,
    ).toBe('/b.png');
  });
  it.each(['a.b', '', 'a/b~c', 'a~b~c', '#', 'code[0]', '__proto__', 'constructor'])(
    'reads the literal image property %j within the current item',
    (key) => {
      const itemSchema: JsonSchema = { type: 'object', properties: { [key]: { type: 'string' } } };
      const scope = '#/properties/' + key.replaceAll('~', '~0').replaceAll('/', '~1');
      const data = { rows: [{ [key]: '/first.png' }, { [key]: '/second.png' }] };
      const result = resolveImageView(
        { type: 'ImageView', scope, alt: '' },
        {
          schema: itemSchema,
          rootSchema: itemSchema,
          data,
          path: 'rows.1',
        },
      );
      expect(result.src).toBe('/second.png');
      expect(result.diagnostics).toEqual([]);
      expect(data.rows[0][key]).toBe('/first.png');
    },
  );
  it('does not read inherited image values', () => {
    const result = resolveImageView(image, {
      ...args,
      data: Object.create({ photo: '/inherited.png' }),
    });
    expect(result.src).toBeUndefined();
    expect(result.diagnostics).toEqual([]);
  });
  it('checks the scoped schema and stored value separately', () => {
    expect(
      resolveImageView({ ...image, scope: '#/properties/count' }, args).diagnostics[0].code,
    ).toBe('image.scopeNotString');
    expect(resolveImageView(image, { ...args, data: { photo: 42 } }).diagnostics[0].code).toBe(
      'image.nonStringSource',
    );
    for (const photo of [null, undefined, ''])
      expect(resolveImageView(image, { ...args, data: { photo } }).diagnostics).toEqual([]);
  });
  it.each([true, false])('respects boolean scoped image schema %s', (allowed) => {
    const booleanSchema = {
      type: 'object',
      properties: { photo: allowed },
    } as unknown as JsonSchema;
    const result = resolveImageView(image, {
      schema: booleanSchema,
      rootSchema: booleanSchema,
      data: { photo: '/photo.png' },
    });
    expect(result.src).toBe(allowed ? '/photo.png' : undefined);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      allowed ? [] : ['image.scopeNotString'],
    );
  });
  it('enforces the same host policy on direct and scoped images', () => {
    for (const element of [image, { ...image, src: '/photo.png' }]) {
      const result = resolveImageView(element, {
        ...args,
        config: { jsonformsExtended: { security: { urlPolicy: { allowRelative: false } } } },
      });
      expect(result.src).toBeUndefined();
      expect(result.diagnostics[0].code).toBe('image.urlRefused');
    }
  });
  it('retains legacy options while preferring top-level fields', () => {
    expect(
      resolveImageView({ type: 'ImageView', options: { src: '/legacy.png', alt: 'Legacy' } }, {})
        .src,
    ).toBe('/legacy.png');
    expect(
      resolveImageView(
        { ...image, src: '/new.png', options: { src: '/legacy.png', alt: 'Legacy' } },
        args,
      ),
    ).toMatchObject({ src: '/new.png', alt: '' });
  });
  it('reports missing authoring fields without declaring them business errors', () => {
    expect(resolveImageView({ type: 'ImageView' }, {}).diagnostics.map((d) => d.code)).toEqual([
      'image.missingAlt',
      'image.noSource',
    ]);
  });
});

it.each([false, true, { type: 'number' }, { type: 'string' }])(
  'checks the actual empty-key schema %j',
  (propertySchema) => {
    const root = { type: 'object', properties: { '': propertySchema } } as unknown as JsonSchema;
    const allowed =
      propertySchema === true ||
      (typeof propertySchema === 'object' && propertySchema.type === 'string');
    const result = resolveImageView(
      { type: 'ImageView', scope: '#/properties/', alt: '' },
      { schema: root, data: { '': '/image.png' } },
    );
    expect(result.src).toBe(allowed ? '/image.png' : undefined);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      allowed ? [] : ['image.scopeNotString'],
    );
  },
);

it.each(['oneOf', 'anyOf', 'allOf', 'then', 'else'])(
  'resolves literal image properties through %s fallback and references',
  (keyword) => {
    for (const key of ['', 'a~b~c', '#']) {
      for (const allowed of [true, false]) {
        const branch = { $ref: '#/definitions/image' };
        const schema = {
          definitions: { image: { type: 'object', properties: { [key]: allowed } } },
          [keyword]: ['then', 'else'].includes(keyword)
            ? branch
            : [{ properties: { other: {} } }, branch],
        } as unknown as JsonSchema;
        const scope = '#/properties/' + key.replaceAll('~', '~0').replaceAll('/', '~1');
        const result = resolveImageView(
          { type: 'ImageView', scope, alt: '' },
          {
            schema,
            data: { [key]: '/image.png' },
          },
        );
        expect(result.src).toBe(allowed ? '/image.png' : undefined);
        expect(result.diagnostics.map((item) => item.code)).toEqual(
          allowed ? [] : ['image.scopeNotString'],
        );
      }
    }
  },
);
