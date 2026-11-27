<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsEnumControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import EnumRadioGroup from './EnumRadioGroup.svelte';

  const props: ControlProps = $props();
  const control = useJsonFormsEnumControl(props);
</script>

<EnumRadioGroup {control} />
