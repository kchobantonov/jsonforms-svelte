<script lang="ts">
  import {
    DispatchRenderer,
    type ControlProps,
    useJsonFormsCell,
  } from '@chobantonov/jsonforms-svelte';
  import { Paths, Resolve, type ControlElement } from '@jsonforms/core';
  import { BracesIcon, ListIcon, PencilIcon } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { getPortalTarget } from '../util';
  import CellContent from './CellContent.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  const options = $derived(
    props.uischema.options as { display?: ControlElement; detail?: ControlElement } | undefined,
  );
  const displayValue = $derived.by(() =>
    options?.display?.scope
      ? Resolve.data(binding.cell.data, Paths.fromScoped(options.display))
      : undefined,
  );
  const summary = $derived.by(() => {
    if (displayValue !== undefined && displayValue !== null) return String(displayValue);
    if (Array.isArray(binding.cell.data))
      return `${binding.cell.data.length} ${binding.cell.data.length === 1 ? 'item' : 'items'}`;
    if (binding.cell.data && typeof binding.cell.data === 'object')
      return binding.cell.schema.title ?? 'View details';
    return 'Not set';
  });
  const detail = $derived(options?.detail ?? { type: 'Control', scope: '#', label: false });
</script>

<CellContent errors={binding.cell.errors}
  ><Dialog.Root>
    <Dialog.Trigger
      >{#snippet child({ props: triggerProps })}<Button
          {...triggerProps}
          variant="ghost"
          size="sm"
          class="group h-8 w-full justify-between gap-2 px-2 font-normal"
          disabled={!binding.cell.enabled}
          aria-label={`Edit ${binding.cell.schema.title ?? 'details'}`}
          ><span class="flex min-w-0 items-center gap-2"
            >{#if Array.isArray(binding.cell.data)}<ListIcon
                class="text-muted-foreground size-4"
              />{:else}<BracesIcon class="text-muted-foreground size-4" />{/if}<span
              class="truncate">{summary}</span
            ></span
          ><PencilIcon
            class="text-muted-foreground size-3.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
          /></Button
        >{/snippet}</Dialog.Trigger
    >
    <Dialog.Content
      portalProps={{ to: getPortalTarget() }}
      class="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
    >
      <Dialog.Header
        ><Dialog.Title>{binding.cell.schema.title ?? 'Edit details'}</Dialog.Title></Dialog.Header
      >
      <div class="py-2">
        <DispatchRenderer
          schema={binding.cell.schema}
          uischema={detail}
          path={binding.cell.path}
          enabled={binding.cell.enabled}
          renderers={binding.cell.renderers}
          cells={binding.cell.cells}
        />
      </div>
      <Dialog.Footer
        ><Dialog.Close><Button variant="outline">Done</Button></Dialog.Close></Dialog.Footer
      >
    </Dialog.Content>
  </Dialog.Root></CellContent
>
