import type { UISchemaElement } from '@jsonforms/core';
import { splitCssSize, type SplitPaneSizing } from './splitLayout';

/** Resolve CSS dimensions in the real host (fonts, percentages, calc, Shadow DOM). */
export function measureSplitLayout(
  node: HTMLElement,
  elements: UISchemaElement[],
  vertical: boolean,
  gap: unknown = 16,
  minItemWidth?: unknown,
) {
  const group = node.querySelector<HTMLElement>('[data-split-group], [data-pane-group]');
  if (!group) return undefined;
  const axis = vertical ? 'height' : 'width';
  const dimension = vertical ? node.clientHeight : node.clientWidth;
  if (dimension <= 0) return undefined;
  const chrome = Array.from(group.children)
    .filter((child) => child.getAttribute('role') === 'separator')
    .reduce((sum, child) => sum + child.getBoundingClientRect()[axis], 0);

  const probe = node.ownerDocument.createElement('div');
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;contain:strict;width:${node.clientWidth}px;height:${node.clientHeight}px;`;
  const child = node.ownerDocument.createElement('div');
  probe.append(child);
  node.append(probe);
  const length = (value: unknown) => {
    const css = splitCssSize(value);
    if (!css || css === 'auto' || !CSS.supports(axis, css)) return undefined;
    child.style.cssText = `box-sizing:border-box;min-width:0;min-height:0;${axis}:${css};`;
    return child.getBoundingClientRect()[axis];
  };
  try {
    const gapPixels = length(gap) ?? 0;
    group.style.gap = `${gapPixels / 2}px`;
    const totalChrome = chrome + gapPixels * Math.max(0, elements.length - 1);
    const available = Math.max(0, dimension - totalChrome);
    const contents = Array.from(group.querySelectorAll<HTMLElement>('[data-split-pane]')).filter(
      (content) => content.closest('[data-split-layout]') === node,
    );
    const panes: SplitPaneSizing[] = elements.map((element, i) => {
      const options = element.options?.layout ?? {};
      const spacer =
        element.type === 'Spacer' && options.weight === undefined && options.span === undefined
          ? (element as UISchemaElement & { size?: unknown }).size
          : undefined;
      const fixed = length(options[axis] ?? spacer);
      const weight = fixed !== undefined || options.span !== undefined ? undefined : options.weight;
      let basis = 0;
      const content = contents[i];
      if (vertical && content) {
        const previous = content.style.height;
        content.style.height = 'auto';
        basis = content.getBoundingClientRect().height;
        content.style.height = previous;
      }
      const min =
        length(
          options[vertical ? 'minHeight' : 'minWidth'] ?? (!vertical ? minItemWidth : undefined),
        ) ?? 0;
      const max = length(options[vertical ? 'maxHeight' : 'maxWidth']) ?? Infinity;
      return {
        fixed,
        basis,
        min,
        max,
        weight:
          typeof weight === 'number' && Number.isFinite(weight) && weight > 0
            ? weight
            : vertical
              ? 0
              : 1,
      };
    });
    return { panes, available, chrome: totalChrome, gap: gapPixels, group };
  } finally {
    probe.remove();
  }
}
