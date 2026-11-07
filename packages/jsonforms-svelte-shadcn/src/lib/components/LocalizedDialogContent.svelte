<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { XIcon } from '$lib/components/icons';

  let {
    children,
    closeLabel,
    ...contentProps
  }: ComponentProps<typeof Dialog.Content> & {
    children: Snippet;
    closeLabel: string;
  } = $props();
</script>

<Dialog.Content {...contentProps} showCloseButton={false}>
  {@render children()}
  <Dialog.Close>
    {#snippet child({ props })}
      <Button variant="ghost" class="absolute top-2 right-2" size="icon-sm" {...props}>
        <XIcon />
        <span class="sr-only">{closeLabel}</span>
      </Button>
    {/snippet}
  </Dialog.Close>
</Dialog.Content>
