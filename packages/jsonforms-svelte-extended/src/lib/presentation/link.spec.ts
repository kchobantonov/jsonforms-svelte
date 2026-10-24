import { expect, it } from 'vite-plus/test';
import { linkRel } from './link';
it('preserves authored rel tokens and enforces new-window isolation', () => {
  expect(linkRel('_blank', 'external')).toBe('external noopener noreferrer');
  expect(linkRel('_blank', 'NOOPENER noreferrer')).toBe('NOOPENER noreferrer');
  expect(linkRel('_self', 'external')).toBe('external');
  expect(linkRel(undefined, undefined)).toBeUndefined();
});
