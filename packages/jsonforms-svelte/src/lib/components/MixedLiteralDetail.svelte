<script lang="ts">
  import { getContext, setContext, untrack } from 'svelte';
  import type { RendererProps } from '../jsonFormsCompositions.svelte';
  import { decodeMixedSegment } from '../mixedLiteral';
  import LiteralControl from './LiteralControl.svelte';
  import type { ControlElement, JsonSchema } from '@jsonforms/core';
  let {
    navigationKey,
    nodePath,
    ...props
  }: Omit<RendererProps, 'path'> & {
    navigationKey: symbol;
    nodePath: string;
  } = $props();
  const segments = $derived(nodePath.split('.').map(decodeMixedSegment));
  const schema = $derived(
    segments.reduceRight<JsonSchema>(
      (child, key) =>
        ({
          type: 'object',
          properties: { [key]: child },
        }) as JsonSchema,
      props.schema,
    ),
  );
  const scope = $derived(
    '#' +
      segments
        .map((key) => '/properties/' + key.replaceAll('~', '~0').replaceAll('/', '~1'))
        .join(''),
  );
  const navigation = getContext<{
    rootControl: unknown;
    selectedPath: string;
    selectPath: (path: string) => void;
  }>(untrack(() => navigationKey));
  // Keep the parent's single tree while translating the selected value's root.
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

<LiteralControl
  {...props}
  {schema}
  uischema={{ ...props.uischema, type: 'Control', scope } as ControlElement}
  path=""
  existingOnly
/>
