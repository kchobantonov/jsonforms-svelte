<script lang="ts">
  import {
    type ControlProps,
    CellPresentationContextSymbol,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { getContext } from 'svelte';
  import FileOperationFeedback from './FileOperationFeedback.svelte';
  import {
    useNativeFilePicker,
    FileAttachments,
    FileFieldFrame,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    TooltipContent,
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    useShadcnControl,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Badge } from '@jsonforms-svelte-shadcn-ui/badge';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Progress } from '@jsonforms-svelte-shadcn-ui/progress';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { FileIcon, XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const compact = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const binding = useShadcnControl(useJsonFormsControl(props));
  const { editor, field } = useNativeFilePicker(
    props,
    binding,
    clearValue,
    compact,
    () => binding.shadcnProps('input')['aria-describedby'],
  );
  const { removeAttachment, fileMessage, abort, clearFile } = editor;

  const inputProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      class: twMerge(binding.styles.control.input, shadcnProps.class, 'w-full pe-10 file:me-3'),
    };
  });

  const effectiveErrors = $derived(binding.control.errors);
  const dialogProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('Dialog');

    return {
      ...shadcnProps,
      open: editor.progressOpen,
      onOpenChange: (open: boolean) => {
        if (!open && editor.progressOpen) {
          abort();
        }
        editor.progressOpen = open;
        shadcnProps.onOpenChange?.(open);
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
    class="group border-input bg-background focus-within:border-ring focus-within:ring-ring/50 data-[invalid]:border-destructive flex w-full min-w-0 items-center gap-1 rounded-md border px-1.5 py-1 text-sm shadow-xs focus-within:ring-[3px]"
  >
    <Tooltip.Provider
      ><Tooltip.Root
        ><Tooltip.Trigger>
          {#snippet child({ props: triggerProps })}
            <Button
              {...triggerProps}
              {...field.button}
              variant="ghost"
              size="icon-xs"
              class="size-7 shrink-0"
              {...binding.focusEvents(triggerProps)}
              onclick={(event) => {
                if (typeof triggerProps.onclick === 'function') triggerProps.onclick(event);
                editor.openPicker();
              }}><FileIcon class="size-4" aria-hidden="true" /></Button
            >
          {/snippet}
        </Tooltip.Trigger><TooltipContent>{editor.pickerLabel}</TooltipContent></Tooltip.Root
      ></Tooltip.Provider
    >
    <FileAttachments {editor} {compact} emptyClass="text-muted-foreground min-w-0 flex-1 truncate">
      {#snippet attachment(name, index, filename)}
        <Badge variant="secondary" class="flex max-w-full min-w-0 items-center gap-1">
          {@render filename()}
          {#if binding.clearable}<Tooltip.Provider
              ><Tooltip.Root
                ><Tooltip.Trigger>
                  {#snippet child({ props: triggerProps })}
                    <Button
                      {...triggerProps}
                      variant="ghost"
                      size="icon"
                      class="size-6 shrink-0"
                      disabled={!editor.canRemove}
                      aria-label={`${fileMessage('file.remove')}: ${name}`}
                      onclick={() => removeAttachment(index)}><XIcon class="size-4" /></Button
                    >
                  {/snippet}
                </Tooltip.Trigger><TooltipContent
                  >{`${fileMessage('file.remove')}: ${name}`}</TooltipContent
                ></Tooltip.Root
              ></Tooltip.Provider
            >{/if}
        </Badge>
      {/snippet}
    </FileAttachments>
    {#if binding.clearable && editor.hasAttachments}<Tooltip.Provider
        ><Tooltip.Root
          ><Tooltip.Trigger>
            {#snippet child({ props: triggerProps })}
              <Button
                {...triggerProps}
                type="button"
                variant="ghost"
                size="icon"
                class="size-7 shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
                disabled={!editor.canClear}
                aria-label={editor.clearLabel}
                onclick={() => clearFile()}><XIcon class="size-4" /></Button
              >
            {/snippet}
          </Tooltip.Trigger><TooltipContent>{editor.clearLabel}</TooltipContent></Tooltip.Root
        ></Tooltip.Provider
      >{/if}
  </FileFieldFrame>
</ControlWrapper>

<Dialog.Root {...dialogProps}>
  <Dialog.Content
    portalProps={{ to: getPortalTarget() }}
    class="max-w-sm"
    showCloseButton={false}
    escapeKeydownBehavior="ignore"
    interactOutsideBehavior="ignore"
  >
    <Dialog.Title class="mb-4 text-base font-semibold">{editor.progress.label}</Dialog.Title>

    <div class="space-y-3">
      {#if editor.progress.indeterminate}
        <Progress
          value={null}
          class="animate-pulse motion-reduce:animate-none"
          aria-label={editor.progress.label}
          aria-valuetext={editor.progress.label}
        />
      {:else}
        <Progress
          value={editor.progress.value}
          aria-label={editor.progress.label}
          aria-valuetext={editor.progress.text}
        />
        <p class="text-sm font-medium">{editor.progress.text}</p>
      {/if}
    </div>

    <div class="mt-4 flex justify-end">
      <Button variant="outline" onclick={abort}>{fileMessage('file.cancel')}</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
