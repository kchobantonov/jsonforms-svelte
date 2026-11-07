<script lang="ts">
  import { asset } from '$app/paths';

  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let { width = 40, height = 40, class: className = '' }: Props = $props();
</script>

<img src={asset('/favicon.svg')} alt="" {width} {height} class={className} aria-hidden="true" />
