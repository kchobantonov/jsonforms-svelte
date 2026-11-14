/** Annotate host copies without changing canonical assets or titles used by registry testers. */
export function localizeSpecDocument<T>(
  value: T,
  namespace: string,
  english: Record<string, unknown> = {},
): T {
  const catalogKeys = Object.keys(english);
  function visit(item: unknown, path: string[]): unknown {
    if (Array.isArray(item)) return item.map((child, index) => visit(child, [...path, `${index}`]));
    if (!item || typeof item !== 'object') return item;
    const node = Object.fromEntries(
      Object.entries(item).map(([key, child]) => [key, visit(child, [...path, key])]),
    );
    if (!Object.hasOwn(node, 'i18n')) {
      const field =
        ['label', 'text', 'alt', 'title', 'description'].find(
          (key) => typeof node[key] === 'string' && node[key] !== '',
        ) ?? (node.type === 'Label' ? 'text' : undefined);
      if (field) {
        const pathKey = namespace
          ? `${path.join('.')}.${Object.hasOwn(node, 'const') || field === 'title' ? 'label' : field}`
          : undefined;
        const matchingKey =
          pathKey && (catalogKeys.length === 0 || Object.hasOwn(english, pathKey))
            ? pathKey
            : (catalogKeys.find(
                (key) =>
                  key.endsWith(`.${field === 'title' ? 'label' : field}`) &&
                  english[key] === node[field],
              ) ??
              catalogKeys.find(
                (key) =>
                  key.endsWith(`.${field === 'title' ? 'label' : field}`) &&
                  typeof english[key] === 'string' &&
                  english[key].toLowerCase() === (node[field] as string).toLowerCase(),
              ));
        if (matchingKey)
          node.i18n = Object.hasOwn(node, 'const')
            ? matchingKey
            : matchingKey.replace(/\.(?:label|text|alt|description)$/, '');
      }
    }
    return node;
  }
  return visit(value, [namespace]) as T;
}
