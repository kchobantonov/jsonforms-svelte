import { COLOR_MASKS, COLOR_MASK_TOKENS } from '@chobantonov/jsonforms-svelte-extended';
import { Mask } from 'maska';
import { describe, expect, it } from 'vitest';

describe('color mask', () => {
  const mask = new Mask({
    mask: COLOR_MASKS,
    tokens: COLOR_MASK_TOKENS,
    tokensReplace: true,
  });

  it('allows three, six, and eight digit hex colors', () => {
    expect(mask.masked('#abc')).toBe('#abc');
    expect(mask.masked('#A1b2C3')).toBe('#A1b2C3');
    expect(mask.masked('#A1b2C3d4')).toBe('#A1b2C3d4');
  });

  it('removes non-hex characters, inserts the hash, and caps at eight digits', () => {
    expect(mask.masked('abz12Gf!345678')).toBe('#ab12f345');
  });
});
