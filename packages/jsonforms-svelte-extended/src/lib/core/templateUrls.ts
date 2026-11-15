// Adapted from React templateUrls at 150fd688ae09f0f3b28e989649f3daf1d9f6d91d.
import {
  defaultUrlPolicy,
  isAllowedImageUrl,
  isAllowedUrl,
  type UrlPolicy,
  type UIDiagnosticReporter,
} from '@chobantonov/jsonforms-svelte';

const attributes = [
  'href',
  'src',
  'srcset',
  'poster',
  'background',
  'action',
  'formaction',
  'cite',
  'ping',
  'manifest',
  'profile',
  'longdesc',
  'codebase',
  'classid',
  'xlink:href',
];
// <source src> loads audio/video; picture sources use srcset instead.
const imageSources = new Set(['img', 'image', 'input']);
const svgImageHrefElements = new Set(['image', 'feimage']);

/** Follow the URL-token/descriptor boundaries, retaining commas inside data URLs. */
function srcsetUrls(value: string): string[] {
  const urls: string[] = [];
  let position = 0;
  while (position < value.length) {
    while (/[\s,]/.test(value[position] ?? '') && position < value.length) position++;
    const start = position;
    while (position < value.length && !/\s/.test(value[position])) position++;
    const token = value.slice(start, position);
    if (!token) break;
    urls.push(token.replace(/,+$/, ''));
    if (token.endsWith(',')) continue;
    let parentheses = 0;
    while (position < value.length) {
      const char = value[position++];
      if (char === '(') parentheses++;
      if (char === ')') parentheses = Math.max(0, parentheses - 1);
      if (char === ',' && parentheses === 0) break;
    }
  }
  return urls;
}

/** Applies the URL policy after an engine update, excluding delegated renderer DOM.
 * Like the React Ractive profile, this cannot prevent a src request already started
 * by DOM insertion. It is a URL check, not a sandbox for trusted template code. */
export function sanitizeTemplateUrls(
  root: Element,
  policy: UrlPolicy = defaultUrlPolicy,
  owns: (element: Element) => boolean = () => true,
  refused?: Map<Element, Map<string, string>>,
  reportDiagnostic?: UIDiagnosticReporter,
): number {
  let removed = 0;
  if (refused) {
    for (const [element, values] of refused) {
      if (!root.contains(element) || !owns(element)) {
        refused.delete(element);
        continue;
      }
      for (const [name, value] of values) {
        if (element.hasAttribute(name)) {
          values.delete(name);
          continue;
        }
        const tag = element.tagName.toLowerCase();
        const image =
          ['srcset', 'poster', 'background'].includes(name) ||
          (name === 'src' && imageSources.has(tag)) ||
          (svgImageHrefElements.has(tag) && (name === 'href' || name === 'xlink:href'));
        const urls =
          name === 'ping'
            ? value.split(/\s+/).filter(Boolean)
            : name === 'srcset'
              ? srcsetUrls(value)
              : [value];
        if (
          urls.every((url) => (image ? isAllowedImageUrl(url, policy) : isAllowedUrl(url, policy)))
        ) {
          element.setAttribute(name, value);
          values.delete(name);
        }
      }
      if (values.size === 0) refused.delete(element);
    }
  }
  const selector = [
    ...attributes.map((name) => `[${name.replace(':', '\\:')}]`),
    'object[data]',
    'a[target]',
    'area[target]',
  ].join(',');
  const candidates = [
    ...(root.matches(selector) ? [root] : []),
    ...root.querySelectorAll(selector),
  ];
  for (const element of candidates) {
    if (!owns(element)) continue;
    const tag = element.tagName.toLowerCase();
    for (const name of tag === 'object' ? [...attributes, 'data'] : attributes) {
      const value = element.getAttribute(name);
      if (value === null) continue;
      const image =
        ['srcset', 'poster', 'background'].includes(name) ||
        (name === 'src' && imageSources.has(tag)) ||
        (svgImageHrefElements.has(tag) && (name === 'href' || name === 'xlink:href'));
      const urls =
        name === 'ping'
          ? value.split(/\s+/).filter(Boolean)
          : name === 'srcset'
            ? srcsetUrls(value)
            : [value];
      if (urls.every((url) => (image ? isAllowedImageUrl(url, policy) : isAllowedUrl(url, policy))))
        continue;
      element.removeAttribute(name);
      if (refused) {
        const values = refused.get(element) ?? new Map<string, string>();
        values.set(name, value);
        refused.set(element, values);
      }
      removed++;
      // URLs can contain private data or large encoded files; report only the attribute.
      (reportDiagnostic ?? console.warn)('template.urlRefused', {
        severity: 'warning',
        message: `Refused URL attribute ${name} on ${tag}.`,
        details: { tag, attribute: name },
      });
    }
    if (
      (tag === 'a' || tag === 'area') &&
      element.getAttribute('target')?.toLowerCase() === '_blank'
    ) {
      const rel = new Set(
        (element.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean),
      );
      rel.delete('opener');
      rel.add('noopener');
      rel.add('noreferrer');
      element.setAttribute('rel', [...rel].join(' '));
    }
  }
  return removed;
}
