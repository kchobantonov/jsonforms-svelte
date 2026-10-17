/** Annotate host copies without changing canonical assets or titles used by registry testers. */
export function localizeSpecDocument<T>(value: T, namespace: string): T {
  function visit(item: unknown, path: string[]): unknown {
    if (Array.isArray(item)) return item.map((child, index) => visit(child, [...path, `${index}`]));
    if (!item || typeof item !== 'object') return item;
    const node = Object.fromEntries(
      Object.entries(item).map(([key, child]) => [key, visit(child, [...path, key])]),
    );
    if (
      !Object.hasOwn(node, 'i18n') &&
      (typeof node.title === 'string' ||
        typeof node.description === 'string' ||
        node.type === 'Label' ||
        (node.type === 'ImageView' && typeof node.alt === 'string' && node.alt !== '') ||
        typeof node.label === 'string')
    )
      node.i18n = Object.hasOwn(node, 'const') ? `${path.join('.')}.label` : path.join('.');
    return node;
  }
  return visit(value, [namespace]) as T;
}
