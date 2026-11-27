<script lang="ts" generics="Wrapper extends Record<string, unknown>">
  import type { Component, Snippet } from 'svelte';
  import type { ControlProps } from '../core/jsonFormsCompositions.svelte';
  import type { useSuggestedTextInput } from './textInput.svelte';
  import TextSuggestions from './TextSuggestions.svelte';
  const {
    field,
    multiline,
    rendererProps,
    wrapperProps,
    ControlWrapper,
    MultiStringControlRenderer,
    InputClearButton,
    children,
  }: {
    field: ReturnType<typeof useSuggestedTextInput>;
    multiline: boolean;
    rendererProps: ControlProps;
    wrapperProps: Wrapper;
    ControlWrapper: Component<Wrapper & { children: Snippet }>;
    MultiStringControlRenderer: Component<ControlProps>;
    InputClearButton: Component<ReturnType<typeof useSuggestedTextInput>['text']['clearButton']>;
    children: Snippet;
  } = $props();
</script>

{#if multiline}
  <MultiStringControlRenderer {...rendererProps} />
{:else}
  <ControlWrapper {...wrapperProps}>
    <div class="group relative w-full">
      {@render children()}
      {#if field.showClear}<InputClearButton {...field.text.clearButton} />{/if}
      <TextSuggestions id={field.datalistId} suggestions={field.suggestions} />
    </div>
  </ControlWrapper>
{/if}
