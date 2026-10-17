<script lang="ts">
  import { useJsonFormsControl, type ControlProps } from '../jsonFormsCompositions.svelte';
  import DispatchRenderer from './DispatchRenderer.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
</script>

<DispatchRenderer
  schema={binding.control.schema}
  path={binding.control.path}
  enabled={binding.control.enabled}
  renderers={binding.control.renderers}
  cells={binding.control.cells}
  uischema={{
    ...binding.control.uischema,
    scope: '#',
    options: {
      ...binding.control.uischema.options,
      recursiveTreeChildren: true,
      table: false,
      format: undefined,
      collapsed: false,
      detail: { type: 'Control', scope: '#', options: { recursiveTreeNodeLink: true } },
    },
  }}
/>
