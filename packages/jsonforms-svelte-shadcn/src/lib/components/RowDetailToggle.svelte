<script lang="ts">
  import TooltipContent from './TooltipContent.svelte';
  import { mergeProps } from 'bits-ui';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { EyeIcon, EyeOffIcon } from './icons';
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

<Tooltip.Provider
  ><Tooltip.Root
    ><Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...mergeProps(props, { onclick: toggle })}
          type="button"
          variant="ghost"
          size="icon"
          {disabled}
          aria-label={label}
          aria-expanded={open}
          class={className}
        >
          {#if open}<EyeIcon class="h-5 w-5" />{:else}<EyeOffIcon class="h-5 w-5" />{/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger><TooltipContent>{label}</TooltipContent>
  </Tooltip.Root></Tooltip.Provider
>
