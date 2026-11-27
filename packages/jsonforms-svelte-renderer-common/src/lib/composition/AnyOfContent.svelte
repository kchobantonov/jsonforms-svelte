<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { CombinatorSubSchemaRenderInfo } from '@jsonforms/core';
  import type {
    ControlProps,
    useJsonFormsAnyOfControl,
  } from '../core/jsonFormsCompositions.svelte';
  import { dataPathSegments } from '../core/dataPath';
  import { scopeDataSegments } from '../core/schemaScope';
  import { useAnyOfSelection } from './anyOfSelection.svelte';
  import CombinatorBranch from './CombinatorBranch.svelte';
  import ScalarCompositionControl from './ScalarCompositionControl.svelte';
  import CombinatorProperties from './CombinatorProperties.svelte';

  const {
    props,
    binding,
    attach,
    tabs,
    additionalProperties,
  }: {
    props: ControlProps;
    binding: ReturnType<typeof useJsonFormsAnyOfControl> & {
      appliedOptions: Record<string, unknown>;
    };
    attach?: Attachment<HTMLDivElement>;
    tabs: Snippet<
      [ReturnType<typeof useAnyOfSelection>, Snippet<[CombinatorSubSchemaRenderInfo, boolean]>]
    >;
    additionalProperties: Snippet<[string[]]>;
  } = $props();
  const controlPathSegments = $derived([
    ...(props.pathSegments ?? dataPathSegments(props.path)),
    ...scopeDataSegments(props.uischema.scope),
  ]);

  const selection = useAnyOfSelection({
    get control() {
      return binding.control;
    },
    get appliedOptions() {
      return binding.appliedOptions;
    },
  });
  const {
    scalarControl,
    anyOfRenderInfos,
    showAdditionalProperties,
    showAnyOfAdditionalProperties,
    anyOfReservedPropertyNames,
    reservedPropertyNames,
  } = $derived(selection);
</script>

{#snippet branch(info: CombinatorSubSchemaRenderInfo, active: boolean)}
  <CombinatorBranch
    validationOptions={binding.control.uischema.options}
    {active}
    schema={info.schema}
    uischema={info.uischema}
    path={binding.control.path}
    pathSegments={controlPathSegments}
    enabled={binding.control.enabled}
    renderers={binding.control.renderers}
    cells={binding.control.cells}
  />
  {#if showAnyOfAdditionalProperties && !showAdditionalProperties}
    {@render additionalProperties(anyOfReservedPropertyNames)}
  {/if}
{/snippet}

{#if binding.control.visible}
  {#if scalarControl}
    <ScalarCompositionControl {...scalarControl} />
  {:else}
    <div {@attach attach}>
      <CombinatorProperties
        schema={binding.control.schema}
        combinatorKeyword="anyOf"
        path={binding.control.path}
        rootSchema={binding.control.rootSchema}
      />

      {#if anyOfRenderInfos.length === 1}
        <div>{anyOfRenderInfos[0].label}</div>
        {@render branch(anyOfRenderInfos[0], true)}
      {:else}
        {@render tabs(selection, branch)}
      {/if}
      {#if showAdditionalProperties}
        {@render additionalProperties(reservedPropertyNames)}
      {/if}
    </div>
  {/if}
{/if}
