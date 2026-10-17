<script lang="ts">
  import { onMount } from 'svelte';
  import { useRendererMessages } from '../rendererMessages.svelte';
  let {
    label,
    width,
    minWidth = 48,
    maxWidth = 2000,
    onresize,
    onresizestart,
  }: {
    label: string;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    onresize: (width: number) => void;
    onresizestart?: (table: HTMLTableElement) => void;
  } = $props();
  const message = useRendererMessages();
  let element: HTMLDivElement;
  let measured = $state(140);
  let drag: { pointer: number; x: number; width: number; direction: number } | undefined;
  const clamp = (value: number) =>
    Math.min(Math.max(minWidth, maxWidth), Math.max(minWidth, value));
  const current = $derived(clamp(width ?? measured));
  const direction = () => (getComputedStyle(element).direction === 'rtl' ? -1 : 1);
  function start() {
    const table = element.closest('table');
    const actual = element.closest('th')?.getBoundingClientRect().width || current;
    if (table) onresizestart?.(table);
    return actual;
  }
  onMount(() => {
    measured = element.closest('th')?.getBoundingClientRect().width ?? 140;
  });
  function end(event: PointerEvent) {
    if (drag?.pointer !== event.pointerId) return;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    drag = undefined;
  }
</script>

<!-- A focusable separator is the ARIA window-splitter pattern; Svelte classifies separators as static. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  bind:this={element}
  class="column-resize"
  role="separator"
  tabindex="0"
  aria-orientation="vertical"
  aria-label={message('collection.resizeColumn', { field: label })}
  aria-valuemin={minWidth}
  aria-valuemax={Math.max(minWidth, maxWidth)}
  aria-valuenow={Math.round(current)}
  onpointerdown={(event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    element.focus();
    drag = { pointer: event.pointerId, x: event.clientX, width: start(), direction: direction() };
    element.setPointerCapture(event.pointerId);
  }}
  onpointermove={(event) => {
    if (drag?.pointer === event.pointerId)
      onresize(clamp(drag.width + (event.clientX - drag.x) * drag.direction));
  }}
  onpointerup={end}
  onpointercancel={end}
  onlostpointercapture={() => {
    drag = undefined;
  }}
  onkeydown={(event) => {
    if (!['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const actual = start();
    let next: number;
    if (event.key === 'Home') next = minWidth;
    else if (event.key === 'End') next = maxWidth;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      next = actual + (event.key === 'ArrowRight' ? 10 : -10) * direction();
    else return;
    event.preventDefault();
    event.stopPropagation();
    onresize(clamp(next));
  }}
></div>

<style>
  .column-resize {
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0;
    width: 12px;
    cursor: col-resize;
    touch-action: none;
  }
  .column-resize::after {
    content: '';
    position: absolute;
    inset-block: 20%;
    inset-inline-end: 4px;
    border-inline-end: 1px solid currentColor;
    opacity: 0.45;
  }
  .column-resize:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -2px;
  }
</style>
