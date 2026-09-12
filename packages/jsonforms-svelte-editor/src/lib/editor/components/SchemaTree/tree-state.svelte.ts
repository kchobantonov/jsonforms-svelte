import {
  visibleSchemaNodes,
  type SchemaTreeNode,
} from "../../document/schema-tree.js";
/** Expansion/focus are presentation state and never enter the document or its history. */
export function createTreeState(root: () => SchemaTreeNode) {
  let expanded = $state(new Set<string>(["#"]));
  let focused = $state("#");
  const elements = new Map<string, HTMLElement>();
  function focus(pointer: string) {
    focused = pointer;
    queueMicrotask(() => elements.get(pointer)?.focus());
  }
  $effect(() => {
    if (!visibleSchemaNodes(root(), expanded).some(node => node.pointer === focused)) focused = root().pointer;
  });
  function toggle(node: SchemaTreeNode) {
    const next = new Set(expanded);
    if (next.has(node.pointer)) {
      next.delete(node.pointer);
      if (focused.startsWith(`${node.pointer}/`)) focus(node.pointer);
    } else next.add(node.pointer);
    expanded = next;
  }
  return {
    get focused() {
      return focused;
    },
    isExpanded(pointer: string) {
      return expanded.has(pointer);
    },
    toggle,
    register(element: HTMLElement, pointer: string) {
      elements.set(pointer, element);
      return {
        destroy() {
          if (elements.get(pointer) === element) elements.delete(pointer);
        },
      };
    },
    focusedOn(pointer: string) {
      focused = pointer;
    },
    navigate(node: SchemaTreeNode, key: string, parent?: string) {
      const visible = visibleSchemaNodes(root(), expanded),
        index = visible.findIndex((item) => item.pointer === node.pointer);
      if (key === "ArrowDown")
        focus(visible[Math.min(index + 1, visible.length - 1)].pointer);
      else if (key === "ArrowUp")
        focus(visible[Math.max(0, index - 1)].pointer);
      else if (key === "Home") focus(visible[0].pointer);
      else if (key === "End") focus(visible.at(-1)!.pointer);
      else if (key === "ArrowRight" && node.children.length) {
        if (!expanded.has(node.pointer)) toggle(node);
        else focus(node.children[0].pointer);
      } else if (key === "ArrowLeft") {
        if (expanded.has(node.pointer) && node.children.length) toggle(node);
        else if (parent) focus(parent);
      }
    },
  };
}
export type SchemaTreeState = ReturnType<typeof createTreeState>;
