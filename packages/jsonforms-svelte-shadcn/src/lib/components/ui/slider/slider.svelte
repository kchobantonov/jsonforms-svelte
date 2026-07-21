<script lang="ts">
  import { Slider as SliderPrimitive } from 'bits-ui';
  import { cn, type WithoutChildrenOrChild } from '$lib/components/ui/utils.js';

  type Props = WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
    showValue?: boolean;
  };

  let {
    ref = $bindable(null),
    value = $bindable(),
    orientation = 'horizontal',
    showValue = false,
    class: className,
    ...restProps
  }: Props = $props();

  let hoveredThumb = $state<number | null>(null);
  let focusedThumb = $state<number | null>(null);
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
  bind:ref
  bind:value={value as never}
  data-slot="slider"
  {orientation}
  class={cn(
    'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
    className,
  )}
  {...restProps}
>
  {#snippet children({ thumbItems })}
    <span
      data-slot="slider-track"
      data-orientation={orientation}
      class={cn(
        'bg-muted bg-muted relative grow overflow-hidden rounded-full data-horizontal:h-1 data-horizontal:w-full data-horizontal:w-full data-vertical:h-full data-vertical:h-full data-vertical:w-1',
      )}
    >
      <SliderPrimitive.Range
        data-slot="slider-range"
        class={cn('bg-primary absolute select-none data-horizontal:h-full data-vertical:w-full')}
      />
    </span>
    {#each thumbItems as thumb (thumb.index)}
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        index={thumb.index}
        class="border-ring ring-ring/50 relative block size-3 shrink-0 rounded-full border bg-white transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
        onpointerenter={() => (hoveredThumb = thumb.index)}
        onpointerleave={() => (hoveredThumb = null)}
        onfocus={() => (focusedThumb = thumb.index)}
        onblur={() => (focusedThumb = null)}
      />
      {#if showValue}
        <SliderPrimitive.ThumbLabel
          data-slot="slider-value-tooltip"
          index={thumb.index}
          aria-hidden="true"
          class={cn(
            'bg-popover text-popover-foreground border-border pointer-events-none z-50 mb-2 min-w-6 rounded-md border px-2 py-1 text-center text-xs font-medium shadow-md transition-opacity after:absolute after:top-full after:left-1/2 after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:border-e after:border-b after:border-inherit after:bg-inherit data-active:visible data-active:opacity-100',
            hoveredThumb === thumb.index || focusedThumb === thumb.index
              ? 'visible opacity-100'
              : 'invisible opacity-0',
          )}
        >
          {thumb.value}
        </SliderPrimitive.ThumbLabel>
      {/if}
    {/each}
  {/snippet}
</SliderPrimitive.Root>
