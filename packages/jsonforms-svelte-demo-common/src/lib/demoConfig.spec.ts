import { expect, it } from 'vitest';
import { mergeDemoConfig } from './demoConfig';
it('preserves authored settings over defaults, including false and empty keyword lists', () => {
  const source = {
    restrict: false,
    showUnfocusedDescription: true,
    enableFilterErrorsBeforeTouch: true,
    filterErrorKeywordsBeforeTouch: [],
  };
  const effective = mergeDemoConfig(source);
  expect(effective).toMatchObject(source);
  expect(effective.hideAvatar).toBe(false);
});
it('applies only explicit session overrides and replaces arrays and compound bags', () => {
  const source = {
    jsonformsExtended: { collapsed: true },
    filterErrorKeywordsBeforeTouch: ['required'],
    showUnfocusedDescription: true,
  };
  expect(
    mergeDemoConfig(source, {
      jsonformsExtended: { collapsed: false },
      filterErrorKeywordsBeforeTouch: [],
      showUnfocusedDescription: false,
    }),
  ).toMatchObject({
    jsonformsExtended: { collapsed: false },
    filterErrorKeywordsBeforeTouch: [],
    showUnfocusedDescription: false,
  });
  expect(source.jsonformsExtended.collapsed).toBe(true);
});
it('does not carry an earlier example configuration into a replacement', () => {
  expect(mergeDemoConfig({ showUnfocusedDescription: true }).showUnfocusedDescription).toBe(true);
  expect(mergeDemoConfig({}).showUnfocusedDescription).toBe(false);
  expect(mergeDemoConfig({}, { restrict: false }).restrict).toBe(false);
});
