<script lang="ts">
  import type { useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import type { TreeNodeControl } from './treeBuilder.svelte';
  import type { useMixedEditor } from './mixedEditor.svelte';
  import MixedLiteralDetail from './MixedLiteralDetail.svelte';
  const {
    control,
    detailControl,
    editor,
    navigationKey,
  }: {
    control: ReturnType<typeof useJsonFormsControl>['control'];
    detailControl: TreeNodeControl;
    editor: ReturnType<typeof useMixedEditor>;
    navigationKey: symbol;
  } = $props();
  const { schema, uischema, structuredUISchema } = $derived(editor);
</script>

{#if detailControl.path === control.path && schema && uischema}
  <DispatchRenderer
    {schema}
    uischema={structuredUISchema!}
    path={control.path}
    renderers={control.renderers}
    cells={control.cells}
    enabled={control.enabled && detailControl.enabled}
  />
{:else if detailControl.path.includes('\0')}
  <MixedLiteralDetail
    {navigationKey}
    nodePath={detailControl.path}
    schema={detailControl.schema}
    uischema={{
      ...detailControl.uischema,
      type: 'Control',
      scope: '#',
      options: { ...detailControl.uischema.options, clearable: false },
    }}
    renderers={control.renderers}
    cells={control.cells}
    enabled={control.enabled && !control.readonly && detailControl.enabled}
  />
{:else}
  <DispatchRenderer
    schema={detailControl.schema}
    uischema={detailControl.uischema}
    path={detailControl.path}
    renderers={control.renderers}
    cells={control.cells}
    enabled={detailControl.enabled}
  />
{/if}
