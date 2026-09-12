const identities = new WeakMap<object, string>();
let nextId = 0;
export function elementId(node: object): string {
  let id = identities.get(node);
  if (!id) {
    id = `element-${++nextId}`;
    identities.set(node, id);
  }
  return id;
}
export function transferIdentities(source: unknown, target: unknown): void {
  if (
    !source ||
    !target ||
    typeof source !== "object" ||
    typeof target !== "object"
  )
    return;
  const id = identities.get(source);
  if (id) identities.set(target, id);
  for (const key of Object.keys(target))
    transferIdentities(
      (source as Record<string, unknown>)[key],
      (target as Record<string, unknown>)[key],
    );
}
