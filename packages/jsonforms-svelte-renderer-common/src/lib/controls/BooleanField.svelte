<script lang="ts" generics="Props extends Record<string, unknown>">
  import type { Component, Snippet } from 'svelte';
  import type { useBooleanControl } from './booleanState.svelte';
  const {
    control,
    center = false,
    wrapperProps,
    ControlWrapper,
    BooleanClearButton,
    children,
  }: {
    control: ReturnType<typeof useBooleanControl>;
    center?: boolean;
    wrapperProps: Props;
    ControlWrapper: Component<Props & { layout: 'horizontal'; children: Snippet }>;
    BooleanClearButton: Component<{ onclick: () => void }>;
    children: Snippet;
  } = $props();
</script>

<div
  class="group/boolean inline-flex max-w-full gap-1"
  class:items-center={center}
  class:items-start={!center}
>
  <ControlWrapper {...wrapperProps} layout="horizontal">
    {@render children()}
    {#if control.state.hint !== undefined}
      <span id={control.stateId} class="sr-only" data-boolean-state>{control.state.hint}</span>
    {/if}
  </ControlWrapper>
  {#if control.canClear}<BooleanClearButton onclick={control.clear} />{/if}
</div>
