<script lang="ts">
  import type { SelectProps } from 'flowbite-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import Select from '../../controls/components/LocalizedSelect.svelte';
  const message = useRendererMessages();
  const props: SelectProps<string> = $props();
</script>

<Select {...props} clearLabel={message('mixed.clearType')} />
