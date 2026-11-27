/** Add translation keys to each category's introductory labels without changing the spec fixture. */
export function withIntroLabels<
  T extends { elements: { elements: { elements: { type: string }[] }[] }[] },
>(ui: T, prefix: string) {
  return {
    ...ui,
    elements: ui.elements.map((group) => ({
      ...group,
      elements: group.elements.map((category, index) => ({
        ...category,
        elements: category.elements.map((child) =>
          child.type === 'Label' ? { ...child, i18n: `${prefix}${index}` } : child,
        ),
      })),
    })),
  };
}
