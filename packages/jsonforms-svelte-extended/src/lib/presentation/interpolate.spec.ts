import { expect, it } from 'vite-plus/test';
import { buildNamespaceScope, buildTextScope, splitTemplate } from './interpolate';
import { renderTemplate, resolveTextParams } from './celTemplate';
import { nearestArrayItem } from './itemContext';

it.each(['alert("x")', 'require("fs")', 'data.toString()', 'data.x = 1', 'while (true)'])(
  'refuses host code: %s',
  (source) => {
    const resolved = resolveTextParams(
      { value: `{${source}}` },
      buildNamespaceScope({ data: { x: 1 }, dynamicAllowed: true }),
    );
    expect(resolved.failures).toHaveLength(1);
    expect(
      renderTemplate(splitTemplate('{value}'), buildTextScope(resolved.params, 'en')).text,
    ).toBe('');
  },
);
it.each(['constructor', '__proto__', 'hasOwnProperty'])('does not read inherited %s', (key) => {
  const resolved = resolveTextParams(
    { value: `{data.${key}}` },
    buildNamespaceScope({ data: {}, dynamicAllowed: true }),
  );
  expect(renderTemplate(splitTemplate('{value}'), buildTextScope(resolved.params, 'en')).text).toBe(
    '',
  );
});
it('does not call functions supplied as data', () => {
  let calls = 0;
  const resolved = resolveTextParams(
    { value: '{context.run()}' },
    buildNamespaceScope({ context: { run: () => calls++ }, dynamicAllowed: true }),
  );
  expect(resolved.failures).toHaveLength(1);
  expect(calls).toBe(0);
});
it('preserves quote-aware braces and literal escaping', () => {
  expect(splitTemplate("{{literal}} {data['}']} tail")).toEqual([
    { kind: 'literal', text: '{literal} ' },
    { kind: 'expression', source: "data['}']" },
    { kind: 'literal', text: ' tail' },
  ]);
});
it('finds the nearest nested array item using literal path segments', () => {
  const child = { name: 'Ana' };
  const data = { 'literal.key': [{ nested: [child] }] };
  expect(nearestArrayItem(data, ['literal.key', '0', 'nested', '0', 'name'])).toBe(child);
  expect(nearestArrayItem(data, '__proto__.x')).toBeUndefined();
  expect(nearestArrayItem(data, '')).toBeUndefined();
});

it('keeps brackets literal in JSON Forms paths and distinguishes nested array navigation', () => {
  const literal = { name: 'Literal' };
  const nested = { name: 'Nested' };
  const data = { 'rows[0]': [literal], rows: [[nested]] };
  expect(nearestArrayItem(data, 'rows[0].0.name')).toBe(literal);
  expect(nearestArrayItem(data, 'rows.0.0.name')).toBe(nested);
});
