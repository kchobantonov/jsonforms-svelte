import { describe, expect, it } from 'vitest';
import { defaultUrlPolicy } from '@chobantonov/jsonforms-svelte';
import { markdownPlainText, parseMarkdown, type MarkdownNode } from './markdown';

const flatten = (nodes: MarkdownNode[]): MarkdownNode[] =>
  nodes.flatMap((node) => (node.type === 'text' ? [node] : [node, ...flatten(node.children)]));
const elements = (source: string, profile: 'basic' | 'extended' = 'basic') =>
  flatten(parseMarkdown(source, profile).nodes).filter((node) => node.type === 'element');

describe('Markdown profiles and URL policy', () => {
  it('supports basic emphasis, lists, code and hard breaks', () => {
    const tags = elements(
      '**bold** *italic* ~~strike~~ `code`  \nnext\n\n- one\n- two\n\n1. first',
    ).map((node) => node.tag);
    for (const tag of ['p', 'strong', 'em', 's', 'code', 'br', 'ul', 'ol', 'li'])
      expect(tags).toContain(tag);
  });
  it('excludes grammar in basic rather than consuming heading markers', () => {
    expect(markdownPlainText('# Literal heading')).toBe('# Literal heading');
    expect(elements('# Heading', 'extended').map((node) => node.tag)).toContain('h1');
    expect(elements('> Quote', 'extended').map((node) => node.tag)).toContain('blockquote');
    expect(elements('```js\nconst x = 1\n```', 'extended').map((node) => node.tag)).toContain(
      'pre',
    );
    expect(
      elements('| A | B |\n| - | - |\n| a | b |', 'extended').map((node) => node.tag),
    ).toContain('table');
  });
  it('keeps raw HTML as text and never emits images or executable attributes', () => {
    const source = '<img src=x onerror=alert(1)>\n\n![Image](https://example.com/image.png)';
    for (const profile of ['basic', 'extended'] as const) {
      const nodes = flatten(parseMarkdown(source, profile).nodes);
      expect(nodes.some((node) => node.type === 'text' && node.text.includes('<img'))).toBe(true);
      for (const node of nodes)
        if (node.type === 'element') {
          expect(['script', 'img', 'iframe']).not.toContain(node.tag);
          expect(Object.keys(node.attributes).some((key) => key.startsWith('on'))).toBe(false);
        }
    }
  });
  it('retains link text while refusing unsafe destinations', () => {
    const result = parseMarkdown('[Go](javascript:alert%281%29)');
    expect(result.refusedUrls).toHaveLength(1);
    expect(flatten(result.nodes).some((node) => node.type === 'element' && node.tag === 'a')).toBe(
      false,
    );
    expect(markdownPlainText('[Go](javascript:alert%281%29)')).toBe('Go');
  });
  it('honors host-added schemes without a second parser allowlist', () => {
    const result = parseMarkdown('[File](file:///example)', 'basic', {
      ...defaultUrlPolicy,
      allowedSchemes: ['file'],
    });
    const link = flatten(result.nodes).find((node) => node.type === 'element' && node.tag === 'a');
    expect(link).toMatchObject({
      attributes: { href: 'file:///example', target: '_blank', rel: 'noopener noreferrer' },
    });
    expect(result.refusedUrls).toEqual([]);
  });
  it('applies a restrictive policy to relative links and drops author attributes', () => {
    expect(
      parseMarkdown('[Help](/help)', 'basic', { ...defaultUrlPolicy, allowRelative: false })
        .refusedUrls,
    ).toEqual(['/help']);
    const link = elements('[Help](https://example.com "Title")').find((node) => node.tag === 'a');
    expect(link?.attributes).not.toHaveProperty('title');
  });
  it('keeps tight list paragraphs transparent and extracts displayed text', () => {
    const root = parseMarkdown('- **First**\n- Second').nodes[0];
    expect(root).toMatchObject({ type: 'element', tag: 'ul' });
    expect(elements('- First\n- Second').map((node) => node.tag)).not.toContain('p');
    expect(markdownPlainText('- **First**\n- Second')).toBe('First Second');
  });
});
