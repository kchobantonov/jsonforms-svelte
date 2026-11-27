<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    getPortalRootNodeGetter,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    useDurationControl,
    DurationFields,
    DurationHints,
  } from '@chobantonov/jsonforms-svelte-extended';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props), (value) => value || clearValue);
  const getRootNode = getPortalRootNodeGetter();

  const duration = useDurationControl(props, binding, clearValue);
  const { editor } = duration;
  const { showActions, cancelLabel, okLabel } = $derived(duration);
  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');
    return {
      ...skeletonProps,
      ...duration.inputAttributes(skeletonProps['aria-describedby']),
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        'input w-full ps-10',
        binding.clearable ? 'pe-10' : 'pe-4',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover
    {...binding.skeletonProps('Popover')}
    {getRootNode}
    open={editor.open}
    onOpenChange={(details) => (editor.open = details.open)}
    positioning={{ placement: 'bottom-start' }}
  >
    <div class="group relative w-full">
      <input {...inputProps} />

      <Popover.Trigger
        class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex size-8 items-center justify-center"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
        {...duration.triggerAttributes(inputProps['aria-describedby'])}
      >
        <Clock3Icon class="size-4" />
      </Popover.Trigger>

      {#if duration.showClear}
        <button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-8 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
          {...duration.clearButton}
        >
          <XIcon class="size-4" />
        </button>
      {/if}
    </div>

    <Portal target={getPortalTarget()}>
      <Popover.Positioner>
        <Popover.Content
          class="card preset-filled-surface-50-950 border-surface-200-800 max-h-[min(20rem,var(--available-height,20rem),calc(100dvh-2rem))] w-[22rem] max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain border p-4 shadow-xl"
        >
          <DurationFields {duration} id={binding.control.id}>
            {#snippet modeButton(mode, label, attributes)}<button
                type="button"
                class={`btn btn-sm ${editor.mode === mode ? 'preset-filled-primary-500' : 'preset-outlined'}`}
                {...attributes}>{label}</button
              >{/snippet}
            {#snippet field(unit, id)}<input
                {id}
                {...duration.fieldAttributes(unit)}
                class="input w-full min-w-0"
              />{/snippet}
            {#snippet removeButton(attributes)}<button
                type="button"
                class="hover:preset-tonal rounded-base inline-flex size-8 shrink-0 items-center justify-center"
                {...attributes}><XIcon class="size-4" aria-hidden="true" /></button
              >{/snippet}
            {#snippet addUnit(attributes, options)}
              <select class="select w-full" {...attributes}>{@render options()}</select>
            {/snippet}
          </DurationFields>

          {#if showActions}
            <div class="border-surface-200-800 mt-4 flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                class="btn btn-sm preset-outlined"
                onclick={duration.cancelClick}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                class="btn btn-sm preset-filled-primary-500"
                disabled={editor.invalidFields || duration.disabled}
                onclick={duration.confirmClick}
              >
                {okLabel}
              </button>
            </div>
          {/if}
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
  <DurationHints {duration} id={binding.control.id} />
</ControlWrapper>
