import { expect, it } from 'vitest';
import vectors from '../../../../tests/fixtures/spec-conformance/behavior.json';
import { renderTemplate, resolveTextParams } from '../../src/lib/presentation/celTemplate';
import {
  buildNamespaceScope,
  buildTextScope,
  splitTemplate,
} from '../../src/lib/presentation/interpolate';
import { escapeMarkdown } from '../../src/lib/presentation/markdownEscape';
import {
  markdownPlainText,
  parseMarkdown,
  type MarkdownNode,
} from '../../src/lib/presentation/markdown';

const vector = (id: string) => {
  const found = vectors.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing canonical behavior vector: ${id}`);
  return found;
};
it('expression-own-constructor', () => {
  const { input, expected } = vector('expression-own-constructor');
  const namespace = buildNamespaceScope({ data: input.data, locale: 'en', dynamicAllowed: true });
  const result = resolveTextParams({ value: `{${input.expression}}` }, namespace, 'en');
  expect(result.failures).toEqual([]);
  expect(result.params.value).toBe(expected.value);
});
it('markdown-substitution', () => {
  const { input, expected } = vector('markdown-substitution');
  const result = renderTemplate(
    splitTemplate(input.text!),
    buildTextScope(input.params!, 'en'),
    escapeMarkdown,
    'en',
  );
  expect(result.failures).toEqual([]);
  expect(markdownPlainText(result.text)).toBe(expected.text);
  const hasEmphasis = (nodes: MarkdownNode[]): boolean =>
    nodes.some(
      (node) =>
        node.type === 'element' &&
        (['strong', 'em'].includes(node.tag) || hasEmphasis(node.children)),
    );
  expect(hasEmphasis(parseMarkdown(result.text).nodes)).toBe(expected.substitutionCreatesMarkup);
});
