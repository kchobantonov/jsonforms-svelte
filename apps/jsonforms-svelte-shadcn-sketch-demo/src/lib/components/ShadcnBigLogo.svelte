<script lang="ts">
  import ShadcnLogo from './ShadcnLogo.svelte';

  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let { width = 96, height = 96, class: className = '' }: Props = $props();
</script>

<ShadcnLogo {width} {height} class={className} />
