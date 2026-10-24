import { expect, it } from 'vite-plus/test';
import { resolveRestrict } from './options';
it.each([
  [undefined, undefined, true],
  [{}, {}, true],
  [{}, { restrict: false }, false],
  [{ restrict: false }, { restrict: true }, false],
  [{ restrict: true }, { restrict: false }, true],
  [{ restrict: 0 }, { restrict: 'false' }, true],
])('resolves local %j and authored global %j restriction', (options, config, expected) => {
  expect(resolveRestrict(options, config)).toBe(expected);
});
