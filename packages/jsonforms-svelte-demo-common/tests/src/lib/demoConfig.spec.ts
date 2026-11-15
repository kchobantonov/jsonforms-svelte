import { expect, it, vi } from 'vite-plus/test';
import { createAjv } from '@chobantonov/jsonforms-svelte-extended';
import {
  getDemoArrayCollapsed,
  mergeDemoConfig,
  setDemoArrayCollapsed,
} from '../../../src/lib/demoConfig';
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
it('applies explicit session overrides and preserves unrelated namespaced example values', () => {
  const source = {
    jsonformsExtended: {
      collapsed: true,
      array: { pagination: 3, collapsed: true, pageSizes: [3, 5] },
    },
    filterErrorKeywordsBeforeTouch: ['required'],
    showUnfocusedDescription: true,
  };
  expect(
    mergeDemoConfig(source, {
      jsonformsExtended: { collapsed: false, array: { collapsed: false, pageSizes: [10] } },
      filterErrorKeywordsBeforeTouch: [],
      showUnfocusedDescription: false,
    }),
  ).toMatchObject({
    jsonformsExtended: {
      collapsed: false,
      array: { pagination: 3, collapsed: false, pageSizes: [10] },
    },
    filterErrorKeywordsBeforeTouch: [],
    showUnfocusedDescription: false,
  });
  expect(source.jsonformsExtended.collapsed).toBe(true);
  expect(source.jsonformsExtended.array.pageSizes).toEqual([3, 5]);
});
it('does not carry an earlier example configuration into a replacement', () => {
  expect(mergeDemoConfig({ showUnfocusedDescription: true }).showUnfocusedDescription).toBe(true);
  expect(mergeDemoConfig({}).showUnfocusedDescription).toBe(false);
  expect(mergeDemoConfig({}, { restrict: false }).restrict).toBe(false);
});

it('edits the portable array collapse default without dropping other example namespaces', () => {
  const example = {
    jsonformsExtended: {
      collapsed: true,
      array: { pagination: 3 },
      radio: { vertical: true },
    },
  };
  const effective = mergeDemoConfig(example);
  expect(getDemoArrayCollapsed(effective)).toBe(true);
  const overrides = setDemoArrayCollapsed({}, false);
  expect(overrides.jsonformsExtended).toEqual({ array: { collapsed: false } });
  expect(getDemoArrayCollapsed(mergeDemoConfig(example, overrides))).toBe(false);
  expect(example.jsonformsExtended.array).toEqual({ pagination: 3 });
});

it('does not freeze namespaced defaults from a previous example in a session choice', () => {
  const first = {
    jsonformsExtended: { group: { collapsed: true }, array: { pagination: 3 } },
  };
  const second = {
    jsonformsExtended: { group: { collapsed: false }, array: { pagination: 7 } },
  };
  const override = setDemoArrayCollapsed({}, true);
  expect(mergeDemoConfig(first, override).jsonformsExtended).toEqual({
    group: { collapsed: true },
    array: { pagination: 3, collapsed: true },
  });
  expect(mergeDemoConfig(second, override).jsonformsExtended).toEqual({
    group: { collapsed: false },
    array: { pagination: 7, collapsed: true },
  });
});

it('uses the same effective config for cached validator permissions as for the form', () => {
  const example = {
    jsonformsExtended: { security: { allowScriptEvaluation: true } },
  };
  let session: Record<string, unknown> = {};
  const ajv = createAjv(undefined, () => mergeDemoConfig(example, session));
  const validate = ajv.compile({
    type: 'object',
    properties: { greeting: { type: 'string' } },
    dynamicDefaults: {
      greeting: { func: 'dynamic', args: { func: '() => "Hello"' } },
    },
  });
  const granted: { greeting?: string } = {};
  expect(validate(granted)).toBe(true);
  expect(granted.greeting).toBe('Hello');

  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    session = { jsonformsExtended: { security: { allowScriptEvaluation: false } } };
    const denied: { greeting?: string } = {};
    expect(validate(denied)).toBe(true);
    expect(denied.greeting).toBeUndefined();
    session = {};
    const restored: { greeting?: string } = {};
    expect(validate(restored)).toBe(true);
    expect(restored.greeting).toBe('Hello');
  } finally {
    warning.mockRestore();
  }
});
