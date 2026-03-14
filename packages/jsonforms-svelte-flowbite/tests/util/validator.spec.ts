import { describe, expect, it } from 'vitest';
import { createAjv } from '../../src/lib/util/validator';

describe('util/validator', () => {
  it('accepts password format for strings', () => {
    const ajv = createAjv();

    const valid = ajv.validate({ type: 'string', format: 'password' }, 'my-secret');
    expect(valid).toBe(true);
  });

  it('still enforces schema type checks', () => {
    const ajv = createAjv();

    const valid = ajv.validate({ type: 'string', format: 'password' }, 123);
    expect(valid).toBe(false);
  });
});
