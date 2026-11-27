<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsEnumControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import EnumSelect from './EnumSelect.svelte';

  const props: ControlProps = $props();
  const control = useJsonFormsEnumControl(props);
</script>

<EnumSelect {control} />
