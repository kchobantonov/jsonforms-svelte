<script lang="ts">
  import { mergeProps } from 'bits-ui';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { EyeIcon, EyeOffIcon } from '$lib/components/icons';
  import { getPortalTargetResolver } from '../../util';
  let {
    label,
    revealed,
    disabled,
    onclick,
    class: className = '',
  }: {
    label: string;
    revealed: boolean;
    disabled: boolean;
    onclick: () => void;
    class?: string;
  } = $props();
  const toggle = () => {
    if (!disabled) onclick();
  };
  const resolvePortalTarget = getPortalTargetResolver();
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
          aria-pressed={revealed}
          class={className}
        >
          {#if revealed}<EyeIcon class="h-5 w-5" />{:else}<EyeOffIcon class="h-5 w-5" />{/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger><Tooltip.Content portalProps={{ to: resolvePortalTarget() ?? undefined }}
      >{label}</Tooltip.Content
    >
  </Tooltip.Root></Tooltip.Provider
>
