import { expect, it } from 'vite-plus/test';
import { linkRel } from '../../../../src/lib/presentation/link';
it('preserves authored rel tokens and enforces new-window isolation', () => {
  expect(linkRel('_blank', 'external')).toBe('external noopener noreferrer');
  expect(linkRel('_blank', 'NOOPENER noreferrer')).toBe('NOOPENER noreferrer');
  expect(linkRel('_blank', 'external OpEnEr')).toBe('external noopener noreferrer');
  expect(linkRel('_BLANK', 'external OpEnEr')).toBe('external noopener noreferrer');
  expect(linkRel('_self', 'opener')).toBe('opener');
  expect(linkRel('_self', 'external')).toBe('external');
  expect(linkRel(undefined, undefined)).toBeUndefined();
});
