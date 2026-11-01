import { expect, it } from 'vite-plus/test';
import { resolveSectionBoolean } from './sectionOptions';

it('prefers local and namespaced section booleans before the deprecated flat fallback', () => {
  const config = { collapsible: true, jsonformsExtended: { collapsible: false } };
  expect(resolveSectionBoolean({ collapsible: true }, config, 'collapsible')).toEqual({
    value: true,
    legacyFlatDefault: false,
  });
  expect(resolveSectionBoolean(undefined, config, 'collapsible')).toEqual({
    value: false,
    legacyFlatDefault: false,
  });
  expect(resolveSectionBoolean(undefined, { collapsible: false }, 'collapsible', true)).toEqual({
    value: false,
    legacyFlatDefault: true,
  });
  expect(resolveSectionBoolean(undefined, {}, 'collapsible', true)).toEqual({
    value: true,
    legacyFlatDefault: false,
  });
});

it('retains section-specific invalid-value behavior when selecting a fallback', () => {
  const config = { showDataIndicator: true, collapsible: true };
  expect(resolveSectionBoolean({ showDataIndicator: 0 }, config, 'showDataIndicator')).toEqual({
    value: false,
    legacyFlatDefault: false,
  });
  expect(resolveSectionBoolean({ collapsible: 'invalid' }, config, 'collapsible')).toEqual({
    value: false,
    legacyFlatDefault: false,
  });
  expect(
    resolveSectionBoolean({ collapsible: 'invalid' }, config, 'collapsible', false, 'boolean'),
  ).toEqual({ value: true, legacyFlatDefault: true });
  expect(
    resolveSectionBoolean(undefined, { showDataIndicator: false }, 'showDataIndicator'),
  ).toEqual({
    value: false,
    legacyFlatDefault: true,
  });
});
