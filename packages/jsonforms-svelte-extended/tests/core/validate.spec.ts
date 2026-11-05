import { describe, expect, it } from 'vite-plus/test';
import { createAjv } from '../../src/lib/core/validate.ts';
import cronSchema from '@chobantonov/jsonforms-extended-spec/examples/cron-control/schema.json';
import cronData from '@chobantonov/jsonforms-extended-spec/examples/cron-control/data.json';

describe('createAjv', () => {
  it('enforces extended keywords and a discriminated oneOf branch', () => {
    const required = createAjv().compile({
      type: 'object',
      properties: { code: { type: 'string' } },
      allRequired: true,
    });
    expect(required({ code: 'A' })).toBe(true);
    expect(required({})).toBe(false);
    expect(required.errors?.[0]).toMatchObject({ keyword: 'required', instancePath: '' });

    const discriminated = createAjv().compile({
      type: 'object',
      discriminator: { propertyName: 'kind' },
      required: ['kind'],
      oneOf: [
        {
          properties: { kind: { const: 'email' }, email: { type: 'string' } },
          required: ['kind', 'email'],
        },
        {
          properties: { kind: { const: 'phone' }, phone: { type: 'string' } },
          required: ['kind', 'phone'],
        },
      ],
    });
    expect(discriminated({ kind: 'phone', phone: '555-0100' })).toBe(true);
    expect(discriminated({ kind: 'phone', email: 'a@example.com' })).toBe(false);
    expect(discriminated.errors?.[0]).toMatchObject({ keyword: 'required', instancePath: '' });
  });

  it('enforces $data format bounds and draft dependencies without changing the original paths', () => {
    const validate = createAjv().compile({
      type: 'object',
      properties: {
        range: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date', formatMinimum: { $data: '1/from' } },
          },
          dependencies: { from: ['to'] },
        },
      },
    });

    expect(validate({ range: { from: '2026-10-01', to: '2026-10-05' } })).toBe(true);
    expect(validate({ range: { to: '2026-10-01' } })).toBe(true);
    expect(validate({ range: { from: '2026-10-05', to: '2026-10-01' } })).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'formatMinimum', instancePath: '/range/to' }),
      ]),
    );
    expect(validate({ range: { from: '2026-10-05' } })).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'dependencies', instancePath: '/range' }),
      ]),
    );
  });

  it('validates the custom color format', () => {
    const validate = createAjv().compile({ type: 'string', format: 'color' });

    expect(validate('#abc')).toBe(true);
    expect(validate('#A1b2C3')).toBe(true);
    expect(validate('#A1b2C3d4')).toBe(true);
    expect(validate('rgba(0, 255, 0, 0.5)')).toBe(true);
    expect(validate('hsb(120, 100%, 100%)')).toBe(true);
    expect(validate('rgb(256, 0, 0)')).toBe(false);
    expect(validate('#abcd')).toBe(false);
    expect(validate('red')).toBe(false);
  });

  it('rejects only the imported five- and seven-field cron dialect values', () => {
    const validate = createAjv().compile(cronSchema);

    expect(validate(cronData)).toBe(false);
    expect(validate.errors).toEqual([
      expect.objectContaining({ keyword: 'format', instancePath: '/rejected/unixFiveField' }),
      expect.objectContaining({ keyword: 'format', instancePath: '/rejected/quartzSevenField' }),
    ]);
  });

  it('supports ajv-errors and translates errorMessage keys', () => {
    const ajv = createAjv({
      locale: 'en',
      translate: (key: string, defaultMessage: string | undefined) => {
        if (key === 'error.errorMessage.age.required') {
          return 'Age is required';
        }

        return defaultMessage ?? key;
      },
    });

    const validate = ajv.compile({
      type: 'object',
      required: ['age'],
      errorMessage: {
        required: {
          age: 'age.required',
        },
      },
      properties: {
        age: {
          type: 'integer',
        },
      },
    });

    expect(validate({})).toBe(false);
    expect(validate.errors?.some((error) => error.message === 'Age is required')).toBe(true);
  });
});
