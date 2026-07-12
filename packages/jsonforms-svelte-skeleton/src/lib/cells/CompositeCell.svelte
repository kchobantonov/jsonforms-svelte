<script lang="ts">
  import {
    DispatchRenderer,
    type ControlProps,
    useJsonFormsCell,
  } from '@chobantonov/jsonforms-svelte';
  import { Paths, Resolve, type ControlElement } from '@jsonforms/core';
  import { BracesIcon, ListIcon, PencilIcon, XIcon } from '@lucide/svelte';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  let dialog: HTMLDialogElement;
  const options = $derived(
    props.uischema.options as { display?: ControlElement; detail?: ControlElement } | undefined,
  );
  const displayValue = $derived.by(() =>
    options?.display?.scope
      ? Resolve.data(binding.cell.data, Paths.fromScoped(options.display))
      : undefined,
  );
  const summary = $derived.by(() =>
    displayValue != null
      ? String(displayValue)
      : Array.isArray(binding.cell.data)
        ? `${binding.cell.data.length} ${binding.cell.data.length === 1 ? 'item' : 'items'}`
        : binding.cell.data && typeof binding.cell.data === 'object'
          ? (binding.cell.schema.title ?? 'View details')
          : 'Not set',
  );
  const detail = $derived(options?.detail ?? { type: 'Control', scope: '#', label: false });
</script>

<CellContent errors={binding.cell.errors}
  ><button
    type="button"
    class="btn btn-sm preset-tonal flex h-8 w-full justify-between"
    onclick={() => dialog.showModal()}
    disabled={!binding.cell.enabled}
    ><span class="flex min-w-0 items-center gap-2"
      >{#if Array.isArray(binding.cell.data)}<ListIcon class="size-4" />{:else}<BracesIcon
          class="size-4"
        />{/if}<span class="truncate">{summary}</span></span
    ><PencilIcon class="size-3.5" /></button
  ></CellContent
>
<dialog
  bind:this={dialog}
  class="card preset-filled-surface-50-950 fixed m-auto max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto p-0 backdrop:bg-black/60"
>
  <header class="flex items-center justify-between p-4">
    <h2 class="h5">{binding.cell.schema.title ?? 'Edit details'}</h2>
    <button
      class="btn-icon btn-icon-sm preset-tonal"
      onclick={() => dialog.close()}
      aria-label="Close"><XIcon /></button
    >
  </header>
  <div class="p-4">
    <DispatchRenderer
      schema={binding.cell.schema}
      uischema={detail}
      path={binding.cell.path}
      enabled={binding.cell.enabled}
      renderers={binding.cell.renderers}
      cells={binding.cell.cells}
    />
  </div>
  <footer class="flex justify-end p-4">
    <button class="btn btn-sm preset-tonal" onclick={() => dialog.close()}>Done</button>
  </footer>
</dialog>
