import {
  useJsonForms,
  useLayoutSizing,
  useRendererMessages,
  resolveWrap,
  resolveGap,
  resolveMinItemWidth,
  resolveSpacerSize,
} from '@chobantonov/jsonforms-svelte';
import type { Layout } from '@jsonforms/core';
import { untrack } from 'svelte';
import { measureSplitLayout } from './measureSplitLayout';
import { resolveSplitSizing, initialSplitSizes, splitCssSize } from './splitLayout';

export function useSplitLayout(
  layout: () => { uischema: Layout; path: string; direction?: string },
) {
  const form = useJsonForms();
  const message = useRendererMessages();
  const sizing = useLayoutSizing(() => ({
    ...layout(),
    direction: layout().uischema.type === 'VerticalLayout' ? 'column' : 'row',
  }));
  let node = $state<HTMLElement>();
  let resolved = $state<ReturnType<typeof resolveSplitSizing>>();
  let runtime: number[] | undefined;
  let lastKey = '';
  let interacting = false;
  const signature = $derived(
    JSON.stringify([
      layout().uischema.type,
      sizing.items.map((item) => [item.index, item.element.options?.layout]),
    ]),
  );
  const state = $derived.by(() => {
    const current = layout();
    const options = current.uischema.options ?? {};
    const vertical = current.uischema.type === 'VerticalLayout';
    const items = sizing.items;
    const sizes = initialSplitSizes(items.map((item) => item.element));
    const config = form.config as Record<string, unknown> | undefined;
    const resizable =
      typeof options.resizable === 'boolean' ? options.resizable : config?.resizable !== false;
    const diagnostics: string[] = [];
    for (const item of items) {
      const hints = item.element.options?.layout ?? {};
      if (
        hints.weight !== undefined &&
        !(typeof hints.weight === 'number' && Number.isFinite(hints.weight) && hints.weight > 0)
      )
        diagnostics.push(message('layout.invalidWeight'));
      for (const dimension of ['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'])
        if (hints[dimension] !== undefined && splitCssSize(hints[dimension]) === undefined)
          diagnostics.push(message('layout.invalidDimension', { dimension }));
    }
    if (resolveWrap(options, config)) diagnostics.push(message('splitLayout.wrap'));
    if (items.some((item) => item.element.options?.layout?.span !== undefined))
      diagnostics.push(message('splitLayout.span'));
    return {
      items: items.map((item) => {
        const cross = vertical ? 'width' : 'height';
        const options = item.element.options?.layout;
        const dimension = splitCssSize(options?.[cross]);
        const min = splitCssSize(options?.[vertical ? 'minWidth' : 'minHeight']);
        const max = splitCssSize(options?.[vertical ? 'maxWidth' : 'maxHeight']);
        return {
          ...item,
          crossStyle: [
            dimension ? `${cross}:${dimension};--split-cross-size:${dimension}` : '',
            min ? `min-${cross}:${min}` : '',
            max ? `max-${cross}:${max}` : '',
          ]
            .filter(Boolean)
            .join(';'),
        };
      }),
      sizes,
      // Keep controls mounted during sizing and data updates. Re-register only
      // when orientation or effective pane membership changes.
      key: JSON.stringify([vertical, items.map((item) => item.index)]),
      controlledSizes: resolved?.sizes,
      minimumSizes: resolved?.minimumSizes,
      maximumSizes: resolved?.maximumSizes,
      direction: vertical ? ('vertical' as const) : ('horizontal' as const),
      height:
        splitCssSize(options.height) ??
        splitCssSize(config?.height) ??
        (vertical ? '20rem' : undefined),
      minHeight: splitCssSize(options.minHeight) ?? splitCssSize(config?.minHeight),
      resizable,
      resizeLabel: message('splitLayout.resize'),
      diagnostics,
    };
  });
  $effect(() => {
    const host = node;
    const key = signature;
    const vertical = layout().uischema.type === 'VerticalLayout';
    const config = form.config;
    const options = layout().uischema.options;
    const gap = resolveGap(options, config, vertical ? 'column' : 'row');
    const minItemWidth = resolveMinItemWidth(options, config);
    const elements = sizing.items.map((item) =>
      item.element.type === 'Spacer'
        ? { ...item.element, size: resolveSpacerSize(item.element, config) }
        : item.element,
    );
    if (!host) return;
    if (key !== lastKey) {
      runtime = undefined;
      lastKey = key;
    }
    let frame = 0;
    const measure = () => {
      const measured = measureSplitLayout(host, elements, vertical, gap, minItemWidth);
      if (!measured) return;
      const next = resolveSplitSizing(measured.panes, measured.available, runtime);
      const spare = Math.max(0, measured.available - next.extent);
      const justify = options?.justify ?? 'start';
      let offset = justify === 'end' ? spare : justify === 'center' ? spare / 2 : 0;
      let extraGap = 0;
      if (
        elements.length > 1 &&
        ['space-between', 'space-around', 'space-evenly'].includes(justify)
      ) {
        const divisor =
          justify === 'space-between'
            ? elements.length - 1
            : justify === 'space-around'
              ? elements.length
              : elements.length + 1;
        extraGap = spare / divisor;
        offset =
          justify === 'space-around' ? extraGap / 2 : justify === 'space-evenly' ? extraGap : 0;
      } else if (elements.length === 1 && ['space-around', 'space-evenly'].includes(justify))
        offset = spare / 2;
      measured.group.style.gap = `${(measured.gap + extraGap) / 2}px`;
      measured.group.style[vertical ? 'insetBlockStart' : 'insetInlineStart'] = `${offset}px`;
      const align = options?.align ?? 'stretch';
      measured.group.style.alignItems =
        align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align;
      measured.group.style.setProperty('--split-cross-size', align === 'stretch' ? '100%' : 'auto');
      const extent = `${next.extent + measured.chrome + extraGap * Math.max(0, elements.length - 1)}px`;
      measured.group.style[vertical ? 'height' : 'width'] = extent;
      if (JSON.stringify(next) !== JSON.stringify(untrack(() => resolved))) resolved = next;
    };
    // Native panes register during mount; measure once their content exists.
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    for (const content of host.querySelectorAll<HTMLElement>('[data-split-pane]')) {
      if (content.closest('[data-split-layout]') !== host) continue;
      for (const child of content.children) observer.observe(child);
    }
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });
  return {
    measure(element: HTMLElement) {
      node = element;
      let frame = 0;
      const end = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          interacting = false;
        });
      };
      const start = (event: Event) => {
        const target =
          event.target instanceof Element ? event.target.closest('[role="separator"]') : null;
        if (
          !target ||
          target.closest('[data-split-layout]') !== element ||
          target.getAttribute('aria-disabled') === 'true'
        )
          return;
        interacting = true;
        cancelAnimationFrame(frame);
        if (event.type === 'keydown') end();
      };
      for (const type of ['keydown', 'pointerdown', 'mousedown', 'touchstart'])
        element.addEventListener(type, start, true);
      for (const type of [
        'pointerup',
        'mouseup',
        'touchend',
        'touchcancel',
        'pointercancel',
        'blur',
      ])
        window.addEventListener(type, end);
      return {
        destroy() {
          node = undefined;
          interacting = false;
          cancelAnimationFrame(frame);
          for (const type of ['keydown', 'pointerdown', 'mousedown', 'touchstart'])
            element.removeEventListener(type, start, true);
          for (const type of [
            'pointerup',
            'mouseup',
            'touchend',
            'touchcancel',
            'pointercancel',
            'blur',
          ])
            window.removeEventListener(type, end);
        },
      };
    },
    resize(sizes: number[]) {
      if (!interacting) return;
      const expected = untrack(() => resolved?.sizes);
      // Ignore native registration notifications before portable initialization.
      if (
        !expected ||
        expected.length !== sizes.length ||
        sizes.every((value, i) => Math.abs(value - expected[i]) < 1e-5)
      )
        return;
      runtime = [...sizes];
      resolved = { ...untrack(() => resolved)!, sizes: [...sizes] };
    },
    get value() {
      return state;
    },
  };
}
