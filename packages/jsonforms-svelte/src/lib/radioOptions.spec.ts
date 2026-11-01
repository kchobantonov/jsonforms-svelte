import { expect, it } from 'vite-plus/test';
import { resolveRadioVertical } from './radioOptions';

it('uses local radio orientation before the scoped default and ignores removed flat keys', () => {
  expect(resolveRadioVertical(undefined, undefined)).toBe(false);
  expect(resolveRadioVertical(undefined, { vertical: true })).toBe(false);
  expect(
    resolveRadioVertical(undefined, { jsonformsExtended: { radio: { vertical: true } } }),
  ).toBe(true);
  expect(
    resolveRadioVertical(
      { vertical: false },
      { vertical: true, jsonformsExtended: { radio: { vertical: true } } },
    ),
  ).toBe(false);
  expect(
    resolveRadioVertical({ vertical: true }, { jsonformsExtended: { radio: { vertical: false } } }),
  ).toBe(true);
});
