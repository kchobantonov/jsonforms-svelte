import { expect, it } from 'vite-plus/test';
import {
  buildNamespaceScope,
  buildTextScope,
  splitTemplate,
} from '../../../../src/lib/presentation/interpolate';
import { renderTemplate, resolveTextParams } from '../../../../src/lib/presentation/celTemplate';
import { escapeMarkdownSubstitution } from '../../../../src/lib/presentation/markdownEscape';
import { parseMarkdown } from '../../../../src/lib/presentation/markdown';
import { nearestArrayItem } from '../../../../src/lib/presentation/itemContext';

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
it('percent-encodes substitutions in authored Markdown link targets', () => {
  const rendered = renderTemplate(
    splitTemplate('[Open {name}](https://example.com/items/{slug}?lang={localeCode})'),
    buildTextScope(
      { name: '[unsafe](javascript:alert(1))', slug: 'a/b?x=(1)&y=2', localeCode: 'bg BG' },
      'en',
    ),
    escapeMarkdownSubstitution,
  ).text;
  expect(rendered).toContain('https://example.com/items/a%2Fb%3Fx%3D%281%29%26y%3D2?lang=bg%20BG');
  const link = parseMarkdown(rendered)
    .nodes.flatMap((node) => (node.type === 'element' ? [node, ...(node.children ?? [])] : []))
    .find((node) => node.type === 'element' && node.tag === 'a');
  expect(link).toMatchObject({
    type: 'element',
    tag: 'a',
    attributes: { href: 'https://example.com/items/a%2Fb%3Fx%3D%281%29%26y%3D2?lang=bg%20BG' },
  });
  expect(rendered).toContain('\\[unsafe\\]');
});

it('keeps unmatched parentheses in URL values inside the authored link', () => {
  const rendered = renderTemplate(
    splitTemplate('[Open](https://example.com/items/{slug})'),
    buildTextScope({ slug: 'a)b(c' }, 'en'),
    escapeMarkdownSubstitution,
  ).text;
  const links = parseMarkdown(rendered)
    .nodes.flatMap((node) => (node.type === 'element' ? [node, ...(node.children ?? [])] : []))
    .filter((node) => node.type === 'element' && node.tag === 'a');
  expect(links).toHaveLength(1);
  expect(links[0]).toMatchObject({
    attributes: { href: 'https://example.com/items/a%29b%28c' },
  });
});
it('keeps substitutions in code spans and link titles as text', () => {
  const rendered = renderTemplate(
    splitTemplate('`[x]({code})` [Open](https://example.com/{slug} "{title}")'),
    buildTextScope({ code: 'a b', slug: 'a/b', title: 'a b' }, 'en'),
    escapeMarkdownSubstitution,
  ).text;
  expect(rendered).toContain('`[x](a b)`');
  expect(rendered).toContain('https://example.com/a%2Fb "a b"');
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
