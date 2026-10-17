import MarkdownIt from 'markdown-it';
import { isAllowedUrl, type UrlPolicy } from '@chobantonov/jsonforms-svelte';

export type MarkdownProfile = 'basic' | 'extended';
export type MarkdownTag =
  | 'p'
  | 'br'
  | 'strong'
  | 'em'
  | 's'
  | 'code'
  | 'pre'
  | 'a'
  | 'span'
  | 'ul'
  | 'ol'
  | 'li'
  | 'blockquote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'table'
  | 'thead'
  | 'tbody'
  | 'tr'
  | 'th'
  | 'td';
export type MarkdownNode =
  | { type: 'text'; text: string }
  | {
      type: 'element';
      tag: MarkdownTag;
      attributes: Record<string, string | number>;
      children: MarkdownNode[];
    };
const tags = new Set<string>([
  'p',
  'br',
  'strong',
  'em',
  's',
  'code',
  'pre',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);
const parsers = new Map<MarkdownProfile, MarkdownIt>();

export function markdownParser(profile: MarkdownProfile = 'basic'): MarkdownIt {
  const cached = parsers.get(profile);
  if (cached) return cached;
  const parser = new MarkdownIt({ html: false, linkify: false, breaks: false, typographer: false });
  parser.disable([
    'image',
    'html_inline',
    'html_block',
    'hr',
    ...(profile === 'basic' ? ['heading', 'lheading', 'blockquote', 'table', 'fence', 'code'] : []),
  ]);
  // The host policy is authoritative, including explicit additional schemes.
  parser.validateLink = () => true;
  parsers.set(profile, parser);
  return parser;
}

interface Frame {
  tag: MarkdownTag | null;
  attributes: Record<string, string | number>;
  children: MarkdownNode[];
}
const textNode = (text: string): MarkdownNode => ({ type: 'text', text });
const element = (
  tag: MarkdownTag,
  children: MarkdownNode[] = [],
  attributes: Record<string, string | number> = {},
): MarkdownNode => ({ type: 'element', tag, attributes, children });

/** Parse into an allowlisted tree; never generate or inject an HTML string. */
export function parseMarkdown(
  source: string,
  profile: MarkdownProfile = 'basic',
  policy?: UrlPolicy,
) {
  const refusedUrls: string[] = [];
  function walk(tokens: ReturnType<MarkdownIt['parse']>): MarkdownNode[] {
    const root: MarkdownNode[] = [];
    const stack: Frame[] = [];
    const push = (node: MarkdownNode) => (stack.at(-1)?.children ?? root).push(node);
    const close = () => {
      const frame = stack.pop();
      if (!frame) return;
      if (frame.tag === null) frame.children.forEach(push);
      else push(element(frame.tag, frame.children, frame.attributes));
    };
    for (const token of tokens) {
      if (token.type === 'inline') {
        walk(token.children ?? []).forEach(push);
        continue;
      }
      if (token.nesting === 1) {
        let tag: MarkdownTag | null = token.hidden
          ? null
          : tags.has(token.tag)
            ? (token.tag as MarkdownTag)
            : 'span';
        const attributes: Record<string, string | number> = {};
        if (token.type === 'link_open') {
          const href = token.attrGet('href') ?? '';
          if (href && isAllowedUrl(href, policy)) {
            tag = 'a';
            Object.assign(attributes, { href, target: '_blank', rel: 'noopener noreferrer' });
          } else {
            tag = 'span';
            if (href) {
              refusedUrls.push(href);
              attributes['data-markdown-url-refused'] = '';
            }
          }
        }
        stack.push({ tag, attributes, children: [] });
      } else if (token.nesting === -1) close();
      else if (token.type === 'text') push(textNode(token.content));
      else if (token.type === 'softbreak') push(textNode(' '));
      else if (token.type === 'hardbreak') push(element('br'));
      else if (token.type === 'code_inline') push(element('code', [textNode(token.content)]));
      else if (token.type === 'fence' || token.type === 'code_block')
        push(element('pre', [element('code', [textNode(token.content)])]));
    }
    while (stack.length) close();
    return root;
  }
  return { nodes: walk(markdownParser(profile).parse(source, {})), refusedUrls };
}

export function markdownPlainText(source: string, profile: MarkdownProfile = 'basic'): string {
  const collect = (nodes: MarkdownNode[]): string =>
    nodes
      .map((node) =>
        node.type === 'text'
          ? node.text
          : collect(node.children) +
            (['p', 'li', 'br', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(
              node.tag,
            )
              ? ' '
              : ''),
      )
      .join('');
  return collect(parseMarkdown(source, profile).nodes).replace(/\s+/g, ' ').trim();
}
