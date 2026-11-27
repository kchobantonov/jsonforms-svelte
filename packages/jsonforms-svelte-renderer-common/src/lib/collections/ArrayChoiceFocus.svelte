<script lang="ts" generics="Wrapper extends Record<string, unknown>">
  import { untrack, type Component, type Snippet } from 'svelte';
  import type { useArrayChoices } from './arrayChoices.svelte';

  const {
    model,
    binding,
    ControlWrapper,
    children,
  }: {
    model: ReturnType<typeof useArrayChoices>;
    ControlWrapper: Component<Wrapper & { errors: string; children: Snippet }>;
    binding: {
      controlWrapper: Wrapper;
      initialFocus: boolean;
      handleFocus: (event: FocusEvent) => void;
      handleBlur: (event: FocusEvent) => void;
    };
    children: Snippet;
  } = $props();
  let root: HTMLDivElement;
  untrack(() => model).initialFocus(
    () => root,
    () => binding.initialFocus,
  );
</script>

<ControlWrapper {...binding.controlWrapper} errors={model.errors}>
  <div bind:this={root} onfocusin={binding.handleFocus} onfocusout={binding.handleBlur}>
    {@render children()}
  </div>
</ControlWrapper>
