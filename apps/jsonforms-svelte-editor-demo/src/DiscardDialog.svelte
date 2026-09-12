<script lang="ts">
  import * as Dialog from "@jsonforms-svelte-shadcn-ui/dialog/index.js";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  let { target }: { target: string } = $props();
  let open = $state(false),
    message = $state("");
  let resolve: ((accepted: boolean) => void) | undefined;
  let trigger: HTMLElement | null = null;
  export function confirm(description: string): Promise<boolean> {
    if (resolve) return Promise.resolve(false);
    trigger = document.activeElement as HTMLElement | null;
    message = description;
    open = true;
    return new Promise<boolean>((done) => {
      resolve = done;
    });
  }
  function finish(accepted: boolean) {
    open = false;
    const done = resolve;
    resolve = undefined;
    done?.(accepted);
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(value) => {
    if (!value) finish(false);
  }}
>
  <Dialog.Content
    portalProps={{ to: target }}
    onCloseAutoFocus={(event) => {
      event.preventDefault();
      trigger?.focus();
    }}
  >
    <Dialog.Header>
      <Dialog.Title>Discard unsaved changes?</Dialog.Title>
      <Dialog.Description>{message}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => finish(false)}>Cancel</Button>
      <Button variant="destructive" onclick={() => finish(true)}
        >Discard changes</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
