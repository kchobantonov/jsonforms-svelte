<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsOneOfEnumControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import EnumRadioGroup from './EnumRadioGroup.svelte';

  const props: ControlProps = $props();
  const control = useJsonFormsOneOfEnumControl(props);
</script>

<EnumRadioGroup {control} />
