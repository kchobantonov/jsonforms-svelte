<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import EnumSelect from './EnumSelect.svelte';

  const props: ControlProps = $props();
  const control = useJsonFormsOneOfEnumControl(props);
</script>

<EnumSelect {control} />
