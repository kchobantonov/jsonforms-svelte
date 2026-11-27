<script lang="ts">
  import { JsonTypeIcon } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ComponentProps } from 'svelte';
  const props: Omit<ComponentProps<typeof JsonTypeIcon>, 'activeColor'> = $props();
</script>

<JsonTypeIcon {...props} />
