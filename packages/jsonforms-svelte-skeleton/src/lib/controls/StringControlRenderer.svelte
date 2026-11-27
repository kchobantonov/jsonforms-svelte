<script lang="ts">
  import type { ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TextControl from './TextControl.svelte';
  const props: ControlProps = $props();
</script>

<TextControl {...props} schemaSuggestions={false} />
