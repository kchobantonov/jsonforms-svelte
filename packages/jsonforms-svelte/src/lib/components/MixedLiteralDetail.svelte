<script lang="ts">
  import { getContext, setContext, untrack } from 'svelte';
  import type { JsonFormsProps } from './JsonForms.svelte';
  import JsonForms from './JsonForms.svelte';
  import { literalPropertySchema } from '../literalPropertySchema';
  import type { JsonSchema } from '@jsonforms/core';
  let {
    navigationKey,
    nodePath,
    rootSchema,
    ...props
  }: JsonFormsProps & {
    navigationKey: symbol;
    nodePath: string;
    rootSchema: JsonSchema;
  } = $props();
  const navigation = getContext<{
    rootControl: unknown;
    selectedPath: string;
    selectPath: (path: string) => void;
  }>(untrack(() => navigationKey));
  // Keep the parent's single tree while translating this isolated form's root.
  setContext(
    untrack(() => navigationKey),
    {
      get rootControl() {
        return navigation.rootControl;
      },
      get selectedPath() {
        return navigation.selectedPath === nodePath ? '' : navigation.selectedPath;
      },
      selectPath(path: string) {
        navigation.selectPath(path ? nodePath + '.' + path : nodePath);
      },
    },
  );
</script>

<JsonForms
  {...props}
  schema={typeof props.schema === 'boolean'
    ? props.schema
    : literalPropertySchema(props.schema ?? {}, rootSchema)}
/>
