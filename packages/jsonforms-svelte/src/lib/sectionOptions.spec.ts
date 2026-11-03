import { expect, it } from 'vite-plus/test';
import { resolveSectionBoolean } from './sectionOptions';

it('uses local and namespaced section booleans', () => {
  const config = { jsonformsExtended: { collapsible: false } };
  expect(resolveSectionBoolean({ collapsible: true }, config, 'collapsible')).toBe(true);
  expect(resolveSectionBoolean(undefined, config, 'collapsible')).toBe(false);
  expect(resolveSectionBoolean(undefined, {}, 'collapsible', true)).toBe(true);
});

it('retains section-specific invalid-value handling', () => {
  const config = { jsonformsExtended: { showDataIndicator: true, collapsible: true } };
  expect(resolveSectionBoolean({ showDataIndicator: 0 }, config, 'showDataIndicator')).toBe(false);
  expect(resolveSectionBoolean({ collapsible: 'invalid' }, config, 'collapsible')).toBe(false);
  expect(
    resolveSectionBoolean({ collapsible: 'invalid' }, config, 'collapsible', false, 'boolean'),
  ).toBe(true);
});
