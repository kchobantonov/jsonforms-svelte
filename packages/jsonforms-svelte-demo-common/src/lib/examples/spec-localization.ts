/** Visit cloned fixture objects after their children so canonical examples stay immutable. */
export function mapSpecDocument<T>(
  value: T,
  annotate: (node: Record<string, unknown>, path: string[]) => void,
  root: string[] = [],
): T {
  function visit(item: unknown, path: string[]): unknown {
    if (Array.isArray(item)) return item.map((child, index) => visit(child, [...path, `${index}`]));
    if (!item || typeof item !== 'object') return item;
    const node = Object.fromEntries(
      Object.entries(item).map(([key, child]) => [key, visit(child, [...path, key])]),
    );
    annotate(node, path);
    return node;
  }
  return visit(value, root) as T;
}

/** Annotate host copies without changing canonical assets or titles used by registry testers. */
export function localizeSpecDocument<T>(
  value: T,
  namespace: string,
  english: Record<string, unknown> = {},
): T {
  const catalogKeys = Object.keys(english);
  function matchingCatalogKey(field: string, text: unknown) {
    const suffix = `.${field === 'title' ? 'label' : field}`;
    const keys = catalogKeys.filter((key) => key.endsWith(suffix));
    return (
      keys.find((key) => english[key] === text) ?? keys.find((key) => sameText(english[key], text))
    );
  }
  function annotationKey(node: Record<string, unknown>, path: string[], field: string) {
    const label = Object.hasOwn(node, 'const') || field === 'title';
    const pathKey = namespace ? `${path.join('.')}.${label ? 'label' : field}` : undefined;
    if (pathKey && acceptsPathKey(pathKey)) return pathKey;
    return matchingCatalogKey(field, node[field]);
  }
  function acceptsPathKey(key: string) {
    return catalogKeys.length === 0 || Object.hasOwn(english, key);
  }
  return mapSpecDocument(
    value,
    (node, path) => {
      if (Object.hasOwn(node, 'i18n')) return;
      const field = annotationField(node);
      if (!field) return;
      const key = annotationKey(node, path, field);
      if (!key) return;
      node.i18n = Object.hasOwn(node, 'const')
        ? key
        : key.replace(/\.(?:label|text|alt|description)$/, '');
    },
    [namespace],
  );
}

function annotationField(node: Record<string, unknown>) {
  const field = ['label', 'text', 'alt', 'title', 'description'].find(
    (key) => typeof node[key] === 'string' && node[key] !== '',
  );
  if (field) return field;
  return node.type === 'Label' ? 'text' : undefined;
}
function sameText(left: unknown, right: unknown) {
  return typeof left === 'string' && left.toLowerCase() === (right as string).toLowerCase();
}
