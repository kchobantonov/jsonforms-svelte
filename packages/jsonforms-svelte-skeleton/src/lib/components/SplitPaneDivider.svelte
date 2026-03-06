<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import type { SplitPaneDirection } from './splitPaneContext';

  interface Props {
    direction: SplitPaneDirection;
    index: number;
    isDragging: boolean;
    currentSize: number;
    onPointerDown: (event: PointerEvent, index: number) => void;
    onKeyDown: (event: KeyboardEvent, index: number) => void;
    class?: string;
  }

  let {
    direction,
    index,
    isDragging,
    currentSize,
    onPointerDown,
    onKeyDown,
    class: className,
  }: Props = $props();

  const isHorizontal = $derived(direction === 'horizontal');
  const roundedSize = $derived(Math.round(currentSize));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  role="separator"
  tabindex="0"
  aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
  aria-label={`Resize ${isHorizontal ? 'horizontal' : 'vertical'} panes`}
  aria-valuenow={roundedSize}
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext={`${roundedSize} percent`}
  class={twMerge(
    'relative shrink-0 transition-colors duration-150',
    isHorizontal
      ? 'w-px cursor-col-resize bg-surface-300-700 hover:bg-primary-500 focus:bg-primary-500'
      : 'h-px cursor-row-resize bg-surface-300-700 hover:bg-primary-500 focus:bg-primary-500',
    isDragging ? 'bg-primary-500' : '',
    className,
  )}
  onpointerdown={(event: PointerEvent) => onPointerDown(event, index)}
  onkeydown={(event: KeyboardEvent) => onKeyDown(event, index)}
>
  <div
    class={twMerge(
      'absolute bg-transparent',
      isHorizontal ? 'top-0 -left-1 h-full w-3' : 'left-0 -top-1 h-3 w-full',
    )}
  ></div>
</div>
