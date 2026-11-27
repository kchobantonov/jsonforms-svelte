<script
  lang="ts"
  generics="Props extends Record<string, unknown>, Binding extends Pick<ReturnType<typeof useJsonFormsOneOfControl>, 'control'>"
>
  import type { Component, Snippet } from 'svelte';
  import type { useJsonFormsOneOfControl } from '../core/jsonFormsCompositions.svelte';
  import type { useOneOfSelection } from './oneOfSelection.svelte';
  import CombinatorBranch from './CombinatorBranch.svelte';
  import ScalarCompositionControl from './ScalarCompositionControl.svelte';
  import CombinatorProperties from './CombinatorProperties.svelte';

  const {
    binding,
    selection,
    selector,
    AdditionalProperties,
    ControlWrapper,
    wrapperProps,
    dialog,
  }: {
    binding: Binding;
    selection: ReturnType<typeof useOneOfSelection>;
    selector: Snippet;
    AdditionalProperties: Component<{ input: Binding; disallowedPropertyNames: string[] }>;
    ControlWrapper: Component<Props & { errors: string; children: Snippet }>;
    wrapperProps: Props;
    dialog: Snippet;
  } = $props();
  const {
    scalarControl,
    controlPathSegments,
    selectedIndex,
    oneOfRenderInfos,
    showOneOfAdditionalProperties,
    showAdditionalProperties,
    oneOfReservedPropertyNames,
  } = $derived(selection);
</script>

{#if binding.control.visible}
  {#if scalarControl}
    <ScalarCompositionControl {...scalarControl} />
  {:else}
    <div>
      <CombinatorProperties
        schema={binding.control.schema}
        combinatorKeyword="oneOf"
        path={binding.control.path}
        rootSchema={binding.control.rootSchema}
      />

      <ControlWrapper {...wrapperProps} errors={selection.selectorErrors}>
        {#if oneOfRenderInfos.length === 1}
          <span>{selection.selectItems[0]?.name}</span>
        {:else}
          {@render selector()}
        {/if}
      </ControlWrapper>
      {#if selectedIndex !== undefined && selectedIndex !== null}
        <CombinatorBranch
          validationOptions={binding.control.uischema.options}
          schema={oneOfRenderInfos[selectedIndex].schema}
          uischema={oneOfRenderInfos[selectedIndex].uischema}
          path={binding.control.path}
          pathSegments={controlPathSegments}
          renderers={binding.control.renderers}
          cells={binding.control.cells}
          enabled={binding.control.enabled}
        />
        {#if showOneOfAdditionalProperties && !showAdditionalProperties}
          <AdditionalProperties
            input={binding}
            disallowedPropertyNames={oneOfReservedPropertyNames}
          />
        {/if}
      {/if}

      {#if showAdditionalProperties}
        <AdditionalProperties
          input={binding}
          disallowedPropertyNames={oneOfReservedPropertyNames}
        />
      {/if}
      {@render dialog()}
    </div>
  {/if}
{/if}
