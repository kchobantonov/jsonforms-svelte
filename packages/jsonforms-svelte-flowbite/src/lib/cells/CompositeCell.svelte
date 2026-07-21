<script lang="ts">
  import {
    DispatchRenderer,
    type ControlProps,
    useJsonFormsCell,
  } from '@chobantonov/jsonforms-svelte';
  import { Paths, Resolve, type ControlElement } from '@jsonforms/core';
  import { CloseOutline, CodeOutline, ListOutline, PenOutline } from 'flowbite-svelte-icons';
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
    class="group flex h-8 w-full items-center justify-between gap-2 rounded-lg px-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
    onclick={() => dialog.showModal()}
    disabled={!binding.cell.enabled}
    aria-label={`Edit ${binding.cell.schema.title ?? 'details'}`}
    ><span class="flex min-w-0 items-center gap-2"
      >{#if Array.isArray(binding.cell.data)}<ListOutline
          class="h-4 w-4 text-gray-500"
        />{:else}<CodeOutline class="h-4 w-4 text-gray-500" />{/if}<span class="truncate"
        >{summary}</span
      ></span
    ><PenOutline
      class="invisible h-3.5 w-3.5 shrink-0 text-gray-500 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
    /></button
  ></CellContent
>
<dialog
  bind:this={dialog}
  class="fixed m-auto max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-lg bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/60 dark:bg-gray-800 dark:text-white"
>
  <header class="flex items-center justify-between border-b p-4 dark:border-gray-700">
    <h2 class="text-lg font-semibold">{binding.cell.schema.title ?? 'Edit details'}</h2>
    <button
      class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      onclick={() => dialog.close()}
      aria-label="Close"><CloseOutline class="h-5 w-5" /></button
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
  <footer class="flex justify-end border-t p-4 dark:border-gray-700">
    <button
      class="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800"
      onclick={() => dialog.close()}>Done</button
    >
  </footer>
</dialog>
