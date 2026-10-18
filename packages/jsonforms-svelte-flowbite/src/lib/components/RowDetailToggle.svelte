<script lang="ts">
  import { ToolbarButton, Tooltip } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  let {
    label,
    open,
    disabled,
    onclick,
    class: className = '',
  }: {
    label: string;
    open: boolean;
    disabled: boolean;
    onclick: () => void;
    class?: string;
  } = $props();
  const toggle = () => {
    if (!disabled) onclick();
  };
</script>

<ToolbarButton
  type="button"
  size="xs"
  color="default"
  {disabled}
  onclick={toggle}
  aria-label={label}
  aria-expanded={open}
  class={className}
>
  {#if open}<EyeOutline class="h-5 w-5" />{:else}<EyeSlashOutline class="h-5 w-5" />{/if}
</ToolbarButton>
<Tooltip>{label}</Tooltip>
