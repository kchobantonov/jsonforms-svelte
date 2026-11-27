<script lang="ts">
  import TooltipClearButton from './TooltipClearButton.svelte';
  import { TooltipContent, useTooltipTrigger } from '@chobantonov/jsonforms-svelte-skeleton';
  import {
    type ControlProps,
    CellPresentationContextSymbol,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ComponentProps, getContext, onMount } from 'svelte';
  import FileOperationFeedback from './FileOperationFeedback.svelte';
  import {
    useNativeFilePicker,
    FileAttachments,
    FileFieldFrame,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    type VendorProps,
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    getPortalRootNodeGetter,
    getPortalTargetResolver,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Dialog, Portal, Progress, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { FileIcon, XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const compact = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props));
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  const pickerTooltip = useTooltipTrigger();
  let removeFocused = $state<number | null>(null);
  let removeHovered = $state<number | null>(null);
  let removeDismissed = $state<number | null>(null);
  const dismissRemoveTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') removeDismissed = removeFocused;
  };
  onMount(() => () => {
    window.removeEventListener('keydown', dismissRemoveTooltip, true);
  });

  const { editor, field } = useNativeFilePicker(
    props,
    binding,
    clearValue,
    compact,
    () => binding.skeletonProps('input')['aria-describedby'],
  );
  const { removeAttachment, fileMessage, abort, clearFile } = editor;

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        'input w-full pe-10 file:btn file:btn-sm file:preset-tonal file:me-3',
      ),
    };
  });

  const effectiveErrors = $derived(binding.control.errors);
  const dialogProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Dialog') as VendorProps<
      Pick<ComponentProps<typeof Dialog>, 'onOpenChange'>
    >;

    return {
      closeOnEscape: false,
      closeOnInteractOutside: false,
      ...skeletonProps,
      getRootNode,
      open: editor.progressOpen,
      onOpenChange: (details: { open: boolean }) => {
        if (!details.open && editor.progressOpen) {
          abort();
        }
        editor.progressOpen = details.open;
        skeletonProps.onOpenChange?.(details);
      },
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper} errors={effectiveErrors}>
  <FileFieldFrame
    {field}
    {compact}
    {FileOperationFeedback}
    nativeInputProps={inputProps}
    invalid={!!effectiveErrors}
    class={`border-surface-400-600 bg-surface-50-950 rounded-base group data-[invalid]:border-error-500 flex w-full min-w-0 items-center gap-1 border px-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-current ${compact ? '' : 'py-1'}`}
  >
    <Tooltip
      open={pickerTooltip.open}
      openDelay={0}
      {getRootNode}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger>
        {#snippet element(triggerProps)}
          <button
            {...triggerProps}
            {...field.button}
            class="hover:preset-tonal rounded-base inline-flex size-7 shrink-0 items-center justify-center"
            {...pickerTooltip.events}
            onfocus={() => {
              binding.handleFocus();
              pickerTooltip.events.onfocus();
            }}
            onblur={() => {
              binding.handleBlur();
              pickerTooltip.events.onblur();
            }}
            onclick={editor.openPicker}><FileIcon class="size-4" aria-hidden="true" /></button
          >
        {/snippet}
      </Tooltip.Trigger>
      <TooltipContent target={resolvePortalTarget() ?? undefined}
        >{editor.pickerLabel}</TooltipContent
      >
    </Tooltip>
    <FileAttachments {editor} {compact} emptyClass="text-surface-600-400 min-w-0 flex-1 truncate">
      {#snippet attachment(name, index, filename)}
        <span class="badge preset-tonal flex max-w-full min-w-0 items-center gap-1">
          {@render filename()}
          {#if binding.clearable}<Tooltip
              open={(removeFocused === index || removeHovered === index) &&
                removeDismissed !== index}
              openDelay={0}
              {getRootNode}
              positioning={{ placement: 'top', strategy: 'fixed' }}
            >
              <Tooltip.Trigger>
                {#snippet element(triggerProps)}
                  <button
                    {...triggerProps}
                    type="button"
                    class="btn-icon preset-tonal size-6 shrink-0"
                    disabled={!editor.canRemove}
                    aria-label={`${fileMessage('file.remove')}: ${name}`}
                    onclick={() => removeAttachment(index)}
                    onfocus={() => {
                      removeFocused = index;
                      removeDismissed = null;
                      window.addEventListener('keydown', dismissRemoveTooltip, true);
                    }}
                    onblur={() => {
                      removeFocused = null;
                      window.removeEventListener('keydown', dismissRemoveTooltip, true);
                    }}
                    onpointerenter={() => {
                      removeHovered = index;
                      removeDismissed = null;
                    }}
                    onpointerleave={() => (removeHovered = null)}><XIcon class="size-4" /></button
                  >
                {/snippet}
              </Tooltip.Trigger>
              <TooltipContent target={resolvePortalTarget() ?? undefined}
                >{`${fileMessage('file.remove')}: ${name}`}</TooltipContent
              >
            </Tooltip>{/if}
        </span>
      {/snippet}
    </FileAttachments>
    {#if binding.clearable && editor.hasAttachments}<TooltipClearButton
        class="hover:preset-tonal rounded-base inline-flex size-7 shrink-0 items-center justify-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
        disabled={!editor.canClear}
        label={editor.clearLabel}
        onclick={() => clearFile()}
      />{/if}
  </FileFieldFrame>
</ControlWrapper>

<Dialog {...dialogProps}>
  <Portal target={getPortalTarget()}>
    <Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0" />
    <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm p-6">
        <Dialog.Title class="mb-4 text-base font-semibold">{editor.progress.label}</Dialog.Title>

        <div class="space-y-3">
          <Progress
            value={editor.progress.indeterminate ? null : editor.progress.value}
            translations={{
              value: () => editor.progress.text,
            }}
          >
            <Progress.Label class="sr-only">{editor.progress.label}</Progress.Label>
            <Progress.Track
              class="bg-surface-200-800 h-2 w-full overflow-hidden rounded"
              aria-label={editor.progress.label}
              aria-valuetext={editor.progress.text}
            >
              <Progress.Range
                class={editor.progress.indeterminate
                  ? 'bg-primary-500 h-full w-full animate-pulse motion-reduce:animate-none'
                  : 'bg-primary-500 h-full transition-all'}
              />
            </Progress.Track>
          </Progress>
          {#if !editor.progress.indeterminate}<p class="text-sm font-medium">
              {editor.progress.text}
            </p>{/if}
        </div>

        <div class="mt-4 flex justify-end">
          <button type="button" class="btn preset-outlined" onclick={abort}
            >{fileMessage('file.cancel')}</button
          >
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
