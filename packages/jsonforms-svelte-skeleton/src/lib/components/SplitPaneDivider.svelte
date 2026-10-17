<script lang="ts">
  import { rendererMessage } from '@chobantonov/jsonforms-svelte';
  import { twMerge } from 'tailwind-merge';
  import type { SplitPaneDirection } from './splitPaneContext';

  interface Props {
    direction: SplitPaneDirection;
    index: number;
    isDragging: boolean;
    currentSize: number;
    minimum?: number;
    maximum?: number;
    resizable?: boolean;
    resizeLabel?: string;
    onPointerDown: (event: PointerEvent, index: number) => void;
    onKeyDown: (event: KeyboardEvent, index: number) => void;
    class?: string;
  }

  let {
    direction,
    index,
    isDragging,
    currentSize,
    minimum = 0,
    maximum = 100,
    resizable = true,
    resizeLabel = rendererMessage(undefined, 'splitLayout.resize'),
    onPointerDown,
    onKeyDown,
    class: className,
  }: Props = $props();

  const isHorizontal = $derived(direction === 'horizontal');
  const roundedSize = $derived(Math.round(currentSize));
  const handleStyle = $derived(
    isHorizontal
      ? 'inset-block-start: 0; inset-inline-start: -0.25rem;'
      : 'inset-inline-start: 0; inset-block-start: -0.25rem;',
  );
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  role="separator"
  tabindex={resizable ? 0 : undefined}
  aria-disabled={!resizable || undefined}
  aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
  aria-label={resizeLabel}
  aria-valuenow={roundedSize}
  aria-valuemin={minimum}
  aria-valuemax={maximum}
  aria-valuetext={`${roundedSize}%`}
  class={twMerge(
    'relative z-10 shrink-0 touch-none transition-colors duration-150',
    isHorizontal
      ? 'bg-surface-300-700 hover:bg-primary-500 focus:bg-primary-500 w-px cursor-col-resize'
      : 'bg-surface-300-700 hover:bg-primary-500 focus:bg-primary-500 h-px cursor-row-resize',
    isDragging ? 'bg-primary-500' : '',
    !resizable ? 'pointer-events-none cursor-default' : '',
    className,
  )}
  onpointerdown={(event: PointerEvent) => onPointerDown(event, index)}
  onkeydown={(event: KeyboardEvent) => onKeyDown(event, index)}
>
  <div
    class={twMerge('absolute bg-transparent', isHorizontal ? 'h-full w-3' : 'h-3 w-full')}
    style={handleStyle}
  ></div>
</div>
