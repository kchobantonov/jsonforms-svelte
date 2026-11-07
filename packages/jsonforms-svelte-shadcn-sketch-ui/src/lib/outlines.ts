import rough from 'roughjs';
import type { Action } from 'svelte/action';

const outlinedSlots = [
  'button', 'input', 'input-group', 'textarea', 'select-trigger', 'native-select',
  'card', 'dialog-content', 'popover-content', 'alert', 'checkbox',
  'radio-group-item', 'switch', 'tabs-list', 'table-container', 'calendar',
];
const tokenRemoveSelector = '.jsonforms-array-tags button[aria-label]';
const selector = [...outlinedSlots.map((slot) => `[data-slot="${slot}"]`), '.jsonforms-shadcn-monaco', tokenRemoveSelector].join(',');
const generator = rough.generator();
const svgNamespace = 'http://www.w3.org/2000/svg';

type OutlineRecord = {
  parent: HTMLElement;
  observer: ResizeObserver;
  svg: SVGSVGElement;
};

function seedFor(element: Element): number {
  const label = [element.getAttribute('data-slot'), element.id, element.getAttribute('name')].join(':');
  let hash = 2166136261;
  for (const character of label) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) || 1;
}

function modeFor(element: HTMLElement): string | undefined {
  const scope = element.getRootNode();
  return element.closest<HTMLElement>('[data-mode]')?.dataset.mode ??
    (scope instanceof ShadowRoot ? scope.host.getAttribute('data-mode') ?? undefined : document.documentElement.dataset.mode);
}

function outline(element: HTMLElement, { parent, svg }: OutlineRecord): void {
  const bounds = element.getBoundingClientRect();
  const parentBounds = parent.getBoundingClientRect();
  const width = Math.round(bounds.width);
  const height = Math.round(bounds.height);
  if (width < 8 || height < 8) return;
  const slot = element.dataset.slot;
  const tokenRemove = element.matches(tokenRemoveSelector);
  const mode = modeFor(element);
  const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (['button', 'input', 'input-group', 'textarea', 'select-trigger', 'native-select', 'checkbox'].includes(slot ?? '')) {
    element.style.setProperty('background-color', dark ? '#252a35' : '#faf8f0', 'important');
    element.style.setProperty('color', dark ? '#f3ead3' : '#242936', 'important');
  }
  const ink = dark ? '#f3ead3' : '#242936';
  const round = slot === 'radio-group-item' || slot === 'switch';
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.left = parent === element ? '0px' : `${bounds.left - parentBounds.left - parent.clientLeft + parent.scrollLeft}px`;
  svg.style.top = parent === element ? '0px' : `${bounds.top - parentBounds.top - parent.clientTop + parent.scrollTop}px`;
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  const makePaths = (drawable: ReturnType<typeof generator.rectangle>, strokeWidth: number) =>
    generator.toPaths(drawable).map(({ d }) => {
      const path = document.createElementNS(svgNamespace, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', ink);
      path.setAttribute('stroke-width', String(strokeWidth));
      return path;
    });
  const paths = tokenRemove
    ? [
        ...makePaths(generator.linearPath([
          [width * 0.22, height * 0.2], [width * 0.47, height * 0.55], [width * 0.79, height * 0.81],
        ], { seed: seedFor(element), roughness: 1.7, bowing: 1.5, strokeWidth: 1.15 }), 1.15),
        ...makePaths(generator.linearPath([
          [width * 0.81, height * 0.18], [width * 0.54, height * 0.46], [width * 0.2, height * 0.8],
        ], { seed: seedFor(element) + 1, roughness: 1.7, bowing: 1.5, strokeWidth: 1.15 }), 1.15),
      ]
    : makePaths(round
        ? generator.ellipse(width / 2, height / 2, width - 5, height - 5, {
            seed: seedFor(element), roughness: 1.3, strokeWidth: 1.2,
          })
        : generator.rectangle(slot === 'checkbox' ? 2 : 3, slot === 'checkbox' ? 2 : 3,
            width - (slot === 'checkbox' ? 4 : 6), height - (slot === 'checkbox' ? 4 : 6), {
              seed: seedFor(element), roughness: 1.2, bowing: 1.1, strokeWidth: 1.2,
            }), 1.2);
  if (slot === 'checkbox') {
    const checked = element.getAttribute('aria-checked');
    if (checked === 'true') {
      paths.push(...makePaths(generator.linearPath([
        [width * 0.24, height * 0.51], [width * 0.43, height * 0.7], [width * 0.78, height * 0.28],
      ], { seed: seedFor(element) + 1, roughness: 0.7, strokeWidth: 1.8 }), 1.8));
    } else if (checked === 'mixed') {
      paths.push(...makePaths(generator.line(width * 0.26, height * 0.5, width * 0.74, height * 0.5, {
        seed: seedFor(element) + 1, roughness: 0.7, strokeWidth: 1.8,
      }), 1.8));
    }
  }
  svg.replaceChildren(...paths);
  if (!tokenRemove) element.dataset.sketchOutline = '';
}

/** Draws stable Rough.js SVG overlays around the actual shadcn control boxes. */
export const sketchElements: Action<HTMLElement> = (root) => {
  const tracked = new Map<HTMLElement, OutlineRecord>();
  const positioned = new Map<HTMLElement, string>();
  let frame = 0;
  const redraw = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => tracked.forEach((record, element) => outline(element, record)));
  };
  const scan = () => {
    for (const [element, record] of tracked) {
      if (root.contains(element)) continue;
      record.observer.disconnect();
      record.svg.remove();
      tracked.delete(element);
    }
    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
      if (tracked.has(element)) continue;
      if (element.closest('[data-slot="input-group"]') && element.dataset.slot !== 'input-group') continue;
      // Button overlays live inside the button so hover/focus visibility also hides the drawing.
      const parent = element.dataset.slot === 'button' || element.matches(tokenRemoveSelector)
        ? element : element.parentElement;
      if (!parent) continue;
      if (getComputedStyle(parent).position === 'static') {
        positioned.set(parent, parent.style.position);
        parent.style.position = 'relative';
      }
      const svg = document.createElementNS(svgNamespace, 'svg');
      svg.dataset.sketchOverlay = '';
      svg.setAttribute('class', 'sketch-outline-size');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.style.position = 'absolute';
      svg.style.pointerEvents = 'none';
      svg.style.overflow = 'visible';
      svg.style.zIndex = '1';
      parent.append(svg);
      const observer = new ResizeObserver(() => outline(element, record));
      const record = { parent, observer, svg };
      tracked.set(element, record);
      observer.observe(element);
      outline(element, record);
    }
  };
  const changes = new MutationObserver(scan);
  changes.observe(root, { childList: true, subtree: true });
  const scope = root.getRootNode();
  const themeNode = scope instanceof ShadowRoot ? scope.host : document.documentElement;
  const themeChanges = new MutationObserver(redraw);
  themeChanges.observe(themeNode, { attributes: true, attributeFilter: ['data-mode', 'data-theme'] });
  const selectionChanges = new MutationObserver((changes) => {
    for (const change of changes) {
      const element = change.target as HTMLElement;
      const record = tracked.get(element);
      if (record && element.dataset.slot === 'checkbox') outline(element, record);
    }
  });
  selectionChanges.observe(root, { attributes: true, subtree: true, attributeFilter: ['aria-checked'] });
  scan();
  return {
    destroy() {
      changes.disconnect();
      themeChanges.disconnect();
      selectionChanges.disconnect();
      cancelAnimationFrame(frame);
      tracked.forEach(({ observer, svg }, element) => {
        observer.disconnect();
        svg.remove();
        element.style.removeProperty('background-color');
        element.style.removeProperty('color');
        delete element.dataset.sketchOutline;
      });
      positioned.forEach((position, parent) => { parent.style.position = position; });
      tracked.clear();
      positioned.clear();
    },
  };
};
