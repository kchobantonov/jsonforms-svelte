<script lang="ts">
  // fallow-ignore-file unrendered-component -- consumed through the published core package
  import type { Snippet } from 'svelte';
  import { useTranslator } from '../jsonFormsCompositions.svelte';
  import { inputAdornments, supportsInputAdornments } from '../inputAdornments';

  let {
    id,
    schema,
    options,
    children,
  }: {
    id: string;
    schema?: { type?: unknown; enum?: unknown; format?: unknown; contentEncoding?: unknown };
    options: Record<string, unknown>;
    children: Snippet;
  } = $props();
  const translator = useTranslator();
  const eligible = $derived(supportsInputAdornments(schema, options));
  const start = $derived(eligible ? inputAdornments(options.startAdornment) : []);
  const end = $derived(eligible ? inputAdornments(options.endAdornment) : []);
  const translated = (key: string | undefined, role: string, fallback: string) =>
    key ? (translator.value(`${key}.${role}`, fallback) ?? fallback) : fallback;
  const glyph = (name: string) =>
    ({ information: 'ⓘ', account: '◉', schedule: '◷', lock: '🔒' })[name as 'information'] ?? '';
  let controlElement = $state<HTMLDivElement>();
  let startElement = $state<HTMLDivElement>();
  let endElement = $state<HTMLDivElement>();

  $effect(() => {
    const control = controlElement;
    if (!control || (!start.length && !end.length)) return;
    const selectors = [
      '.ant-input-affix-wrapper',
      '.ant-picker',
      '.ant-input-number',
      '.ant-select-selector',
      'input',
      'textarea',
      'select',
      'button[aria-haspopup]',
      'button[id]',
    ];
    const field =
      Array.from(control.querySelectorAll<HTMLElement>('[id]')).find(
        (element) => element.id === `${id}-input`,
      ) ?? selectors.map((selector) => control.querySelector<HTMLElement>(selector)).find(Boolean);
    if (!field) return;
    const frame = control.parentElement;
    if (!frame) return;
    const originalStart = field.style.paddingInlineStart;
    const originalEnd = field.style.paddingInlineEnd;
    const originalAppearance = field.style.appearance;
    const originalStartTop = startElement?.style.insetBlockStart;
    const originalEndTop = endElement?.style.insetBlockStart;
    const computed = getComputedStyle(field);
    const baseStart = Number.parseFloat(computed.paddingInlineStart) || 0;
    const baseEnd = Number.parseFloat(computed.paddingInlineEnd) || 0;
    const shifted: Array<{
      element: HTMLElement;
      property: 'insetInlineStart' | 'insetInlineEnd';
      original: string;
      base: number;
    }> = [];
    const findPositioned = () => {
      for (const element of control.querySelectorAll<HTMLElement>('*')) {
        if (
          !(element instanceof HTMLElement) ||
          element === field ||
          getComputedStyle(element).position !== 'absolute'
        )
          continue;
        // Move the outer positioning element. Flowbite puts its clear button
        // in a positioned slot and can add that slot after the value changes.
        if (shifted.some(({ element: parent }) => parent === element || parent.contains(element)))
          continue;
        const side =
          element.className.includes('start-') || element.style.insetInlineStart
            ? 'insetInlineStart'
            : element.className.includes('end-') ||
                element.style.insetInlineEnd ||
                element.matches('[data-part="trigger"]')
              ? 'insetInlineEnd'
              : undefined;
        if (!side) continue;
        shifted.push({
          element,
          property: side,
          original: element.style[side],
          base: Number.parseFloat(getComputedStyle(element)[side]) || 0,
        });
      }
    };
    const apply = () => {
      findPositioned();
      const startSpace = startElement?.offsetWidth ?? 0;
      const endSpace = endElement?.offsetWidth ?? 0;
      frame.style.setProperty(
        '--jf-start-adornment-space',
        startSpace ? `${startSpace + 8}px` : '0px',
      );
      frame.style.setProperty('--jf-end-adornment-space', endSpace ? `${endSpace + 8}px` : '0px');
      if (field instanceof HTMLSelectElement && endSpace) {
        frame.setAttribute('data-adorned-native-select', '');
        field.style.appearance = 'none';
      }
      const fieldBounds = field.getBoundingClientRect();
      const frameBounds = frame.getBoundingClientRect();
      const fieldCenter = fieldBounds.top - frameBounds.top + fieldBounds.height / 2;
      if (startElement) startElement.style.insetBlockStart = `${fieldCenter}px`;
      if (endElement) endElement.style.insetBlockStart = `${fieldCenter}px`;
      field.style.paddingInlineStart = `${baseStart + (startSpace ? startSpace + 8 : 0)}px`;
      field.style.paddingInlineEnd = `${baseEnd + (endSpace ? endSpace + 8 : 0)}px`;
      for (const { element, property, base } of shifted) {
        const space = property === 'insetInlineStart' ? startSpace : endSpace;
        if (space) element.style[property] = `${base + space + 8}px`;
      }
    };
    apply();
    const observer = new ResizeObserver(apply);
    const contentObserver = new MutationObserver(apply);
    contentObserver.observe(control, { childList: true, subtree: true });
    observer.observe(control);
    observer.observe(field);
    if (startElement) observer.observe(startElement);
    if (endElement) observer.observe(endElement);
    return () => {
      observer.disconnect();
      contentObserver.disconnect();
      frame.style.removeProperty('--jf-start-adornment-space');
      frame.style.removeProperty('--jf-end-adornment-space');
      frame.removeAttribute('data-adorned-native-select');
      field.style.paddingInlineStart = originalStart;
      field.style.paddingInlineEnd = originalEnd;
      field.style.appearance = originalAppearance;
      if (startElement) startElement.style.insetBlockStart = originalStartTop ?? '';
      if (endElement) endElement.style.insetBlockStart = originalEndTop ?? '';
      for (const { element, property, original } of shifted) element.style[property] = original;
    };
  });
</script>

{#snippet items(items: ReturnType<typeof inputAdornments>, side: 'start' | 'end')}
  {#each items as item, index (`${side}-${index}`)}
    {@const label =
      item.kind === 'text'
        ? translated(item.i18n, 'text', item.text)
        : item.decorative
          ? ''
          : translated(item.i18n, 'label', item.label)}
    {@const tooltip =
      'tooltip' in item && item.tooltip ? translated(item.i18n, 'tooltip', item.tooltip) : ''}
    {@const tooltipId = `${id}-adornment-${side}-${index}-tooltip`}
    {#if tooltip}
      <button
        type="button"
        class="jf-adornment"
        data-adornment={side}
        data-kind={item.kind}
        aria-label={item.kind === 'icon' ? label : undefined}
        aria-describedby={tooltipId}
      >
        {#if item.kind === 'text'}{label}{:else if glyph(item.icon)}<span aria-hidden="true"
            >{glyph(item.icon)}</span
          >{:else}{label}{/if}
        <span class="jf-adornment-tooltip" id={tooltipId} role="tooltip">{tooltip}</span>
      </button>
    {:else}
      <span
        class="jf-adornment"
        data-adornment={side}
        data-kind={item.kind}
        role={item.kind === 'icon' && !item.decorative ? 'img' : undefined}
        aria-label={item.kind === 'icon' && !item.decorative ? label : undefined}
        aria-hidden={item.kind === 'icon' && item.decorative ? 'true' : undefined}
      >
        {#if item.kind === 'text'}{label}{:else if glyph(item.icon)}<span aria-hidden="true"
            >{glyph(item.icon)}</span
          >{:else if !item.decorative}{label}{/if}
      </span>
    {/if}
  {/each}
{/snippet}

{#if start.length || end.length}
  <div class="jf-adorned-input" data-input-adornments>
    {#if start.length}<div class="jf-adornment-group start" bind:this={startElement}>
        {@render items(start, 'start')}
      </div>{/if}
    <div class="jf-adorned-input-control" bind:this={controlElement}>{@render children()}</div>
    {#if end.length}<div class="jf-adornment-group end" bind:this={endElement}>
        {@render items(end, 'end')}
      </div>{/if}
  </div>
{:else}
  {@render children()}
{/if}

<style>
  .jf-adorned-input {
    position: relative;
    width: 100%;
    min-width: 0;
  }
  .jf-adorned-input-control {
    min-width: 0;
  }
  :global(.jf-adorned-input[data-adorned-native-select] .jf-adorned-input-control::after) {
    content: '';
    position: absolute;
    pointer-events: none;
    inset-inline-end: calc(var(--jf-end-adornment-space) + 0.65rem);
    inset-block-start: 50%;
    width: 0.45rem;
    height: 0.45rem;
    border-inline-end: 2px solid currentColor;
    border-block-end: 2px solid currentColor;
    transform: translateY(-70%) rotate(45deg);
  }
  .jf-adornment-group {
    position: absolute;
    z-index: 1;
    inset-block-start: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }
  .jf-adornment-group.start {
    inset-inline-start: 0.5rem;
  }
  .jf-adornment-group.end {
    inset-inline-end: 0.5rem;
  }
  .jf-adornment {
    position: relative;
    flex: none;
    white-space: nowrap;
    color: var(--color-muted-foreground, inherit);
    border: 0;
    background: transparent;
    padding: 0;
    font: inherit;
  }
  .jf-adornment-tooltip {
    display: none;
    position: absolute;
    z-index: 100;
    inset-block-start: 100%;
    inset-inline-start: 0;
    width: max-content;
    max-width: min(20rem, 80vw);
    white-space: normal;
    padding: 0.35rem 0.5rem;
    border-radius: 0.25rem;
    color: white;
    background: #222;
  }
  .jf-adornment-group.end .jf-adornment-tooltip {
    inset-inline-start: auto;
    inset-inline-end: 0;
  }
  .jf-adornment:hover .jf-adornment-tooltip,
  .jf-adornment:focus-visible .jf-adornment-tooltip {
    display: block;
  }
</style>
