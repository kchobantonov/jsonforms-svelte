import commonGridStyles from './ag-grid.css?inline';

type StyleRoot = ShadowRoot | HTMLHeadElement;

export function createGridStyleInstaller(id: string, css: string) {
  const styleOwners = new WeakMap<StyleRoot, { style: HTMLStyleElement; users: number }>();

  return function acquireRuntimeStyles(root: StyleRoot): () => void {
    const owned = styleOwners.get(root);
    if (owned) {
      owned.users += 1;
      return () => releaseRuntimeStyles(root, owned);
    }
    if (root.querySelector(`#${id}`)) return () => {};
    const style = document.createElement('style');
    style.id = id;
    style.textContent = commonGridStyles + css;
    root.prepend(style);
    const created = { style, users: 1 };
    styleOwners.set(root, created);
    return () => releaseRuntimeStyles(root, created);
  };

  function releaseRuntimeStyles(
    root: StyleRoot,
    owner: { style: HTMLStyleElement; users: number },
  ) {
    owner.users -= 1;
    if (owner.users) return;
    owner.style.remove();
    styleOwners.delete(root);
  }
}
