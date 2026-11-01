import { expect, it } from 'vite-plus/test';
import { mergeRendererOptions, resolveRestrict } from './options';

it('replaces local arrays and editor bags while retaining per-field object defaults', () => {
  const global = {
    suggestion: ['Sofia', 'Varna'],
    choices: [{ value: 'one' }],
    monaco: { rows: 20, options: { wordWrap: 'off' } },
    agGridOptions: { pagination: true, defaultColDef: { filter: true } },
    confirmation: { delete: 'always', typeChange: 'never' },
    shadcn: { Input: { class: 'global', placeholder: 'Global' } },
  };
  const local = {
    suggestion: ['Plovdiv'],
    choices: [],
    monaco: { options: { wordWrap: 'on' } },
    agGridOptions: {},
    confirmation: { delete: 'never' },
    shadcn: { Input: { class: 'local' } },
  };
  const before = JSON.stringify([global, local]);
  expect(mergeRendererOptions(global, local)).toMatchObject({
    suggestion: ['Plovdiv'],
    choices: [],
    monaco: { options: { wordWrap: 'on' } },
    agGridOptions: {},
    confirmation: { delete: 'never', typeChange: 'never' },
    shadcn: { Input: { class: 'local', placeholder: 'Global' } },
  });
  expect(JSON.stringify([global, local])).toBe(before);
});

it('preserves explicit false, zero, and empty text in local options', () => {
  expect(
    mergeRendererOptions(
      { clearable: true, minItemWidth: 240, placeholder: 'Global' },
      { clearable: false, minItemWidth: 0, placeholder: '' },
    ),
  ).toMatchObject({ clearable: false, minItemWidth: 0, placeholder: '' });
});

it('preserves each Svelte vendor bag and unrelated extension namespaces', () => {
  const global = {
    shadcn: { Input: { disabled: true, placeholder: 'Global' } },
    skeleton: { Combobox: { disabled: true, class: 'global' } },
    flowbite: { Toggle: { disabled: true, size: 'lg' } },
    otherRenderer: { Setting: { value: 1 } },
  };
  expect(
    mergeRendererOptions(global, {
      shadcn: { Input: { disabled: false } },
      skeleton: { Combobox: { class: '' } },
      flowbite: { Toggle: { size: 'sm' } },
    }),
  ).toEqual({
    shadcn: { Input: { disabled: false, placeholder: 'Global' } },
    skeleton: { Combobox: { disabled: true, class: '' } },
    flowbite: { Toggle: { disabled: true, size: 'sm' } },
    otherRenderer: { Setting: { value: 1 } },
  });
});
it.each([
  [undefined, undefined, true],
  [{}, {}, true],
  [{}, { restrict: false }, false],
  [{}, { jsonformsExtended: { restrict: false } }, true],
  [{}, { restrict: false, jsonformsExtended: { restrict: true } }, false],
  [{ restrict: false }, { restrict: true }, false],
  [{ restrict: true }, { restrict: false }, true],
  [{ restrict: 0 }, { restrict: 'false' }, true],
])('resolves local %j and authored global %j restriction', (options, config, expected) => {
  expect(resolveRestrict(options, config)).toBe(expected);
});
