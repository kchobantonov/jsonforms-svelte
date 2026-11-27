export function templateSlotOwnership(container: () => HTMLElement | null) {
  const roots = new WeakSet<Element>();
  return {
    register(element: Element) {
      roots.add(element);
      return () => {
        roots.delete(element);
      };
    },
    owns(element: Element) {
      const boundary = container();
      for (
        let current: Element | null = element;
        current && current !== boundary;
        current = current.parentElement
      ) {
        if (roots.has(current)) return false;
      }
      return true;
    },
  };
}
