<script lang="ts">
  import Icon, { type IconProps } from './Icon.svelte';
  let props: Omit<IconProps, 'name'> = $props();
</script>

<Icon name="clock" {...props} />
