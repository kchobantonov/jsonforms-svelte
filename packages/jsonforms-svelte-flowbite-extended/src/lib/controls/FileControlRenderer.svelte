<script lang="ts">
  import {
    type ControlProps,
    CellPresentationContextSymbol,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { getContext, untrack } from 'svelte';
  import FileOperationFeedback from './FileOperationFeedback.svelte';
  import {
    useFileControl,
    useFilePickerField,
    FileAttachments,
    FileFieldFrame,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    Badge,
    Button,
    CloseButton,
    Fileupload,
    Heading,
    Modal,
    P,
    Progressbar,
    Tooltip,
  } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { FileOutline as FileIcon } from 'flowbite-svelte-icons';
  import {
    ControlWrapper,
    determineClearValue,
    useFlowbiteControl,
  } from '@chobantonov/jsonforms-svelte-flowbite';

  const props: ControlProps = $props();
  const compact = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props));
  let selectedFiles = $state<FileList | undefined>(undefined);
  const editor = useFileControl(props, binding, clearValue, () => (selectedFiles = undefined));
  const { accept, multiple, canAdd, canRemove, canClear, pickerLabel, hasAttachments } =
    $derived(editor);
  const { removeAttachment, fileMessage, abort, clearFile } = editor;

  const fileUploadProps = $derived(binding.flowbiteProps('Fileupload'));
  const inputClass = $derived.by(() => {
    return twMerge(
      binding.styles.control.input,
      fileUploadProps.class,
      binding.clearable ? 'pe-10' : '',
    );
  });
  const effectiveErrors = $derived(binding.control.errors);
  const field = useFilePickerField(
    editor,
    binding,
    compact,
    () => fileUploadProps['aria-describedby'],
  );
  const modalProps = $derived(binding.flowbiteProps('Modal'));

  $effect(() => {
    if (!canAdd && selectedFiles) {
      editor.resetInputSelection();
    }
  });
  $effect(() => {
    if (!editor.progressOpen && editor.pending) untrack(abort);
  });
</script>

<ControlWrapper {...binding.controlWrapper} errors={effectiveErrors}>
  <FileFieldFrame
    {field}
    {compact}
    {FileOperationFeedback}
    invalid={!!effectiveErrors}
    class="group flex w-full min-w-0 items-center gap-1 rounded-lg border border-gray-300 bg-gray-50 px-1.5 py-1 text-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 data-[invalid]:border-red-500 dark:border-gray-600 dark:bg-gray-700"
  >
    <div hidden>
      <Fileupload
        {...fileUploadProps}
        bind:files={selectedFiles}
        bind:elementRef={editor.fileInput}
        id={`${binding.control.id}-file-input`}
        class={inputClass}
        disabled={!canAdd}
        required={binding.control.required}
        {accept}
        {multiple}
        clearable={false}
        onchange={(event) =>
          editor.selectFiles(event, (files) => {
            selectedFiles = files;
          })}
        oncancel={abort}
        aria-invalid={!!effectiveErrors}
      />
    </div>
    <Button
      {...field.button}
      color="alternative"
      size="sm"
      class="size-7 shrink-0 border-0 bg-transparent p-0 shadow-none"
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      onclick={editor.openPicker}><FileIcon size="sm" aria-hidden="true" /></Button
    ><Tooltip>{pickerLabel}</Tooltip>
    <FileAttachments
      {editor}
      {compact}
      emptyClass="min-w-0 flex-1 truncate text-gray-500 dark:text-gray-400"
    >
      {#snippet attachment(name, index, filename)}
        <Badge color="gray" class="flex max-w-full min-w-0 items-center gap-1">
          {@render filename()}
          {#if binding.clearable}<CloseButton
              class="size-6 shrink-0 p-1"
              color="none"
              ariaLabel={`${fileMessage('file.remove')}: ${name}`}
              name={fileMessage('file.remove')}
              disabled={!canRemove}
              onclick={(event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
                removeAttachment(index);
              }}
            /><Tooltip>{`${fileMessage('file.remove')}: ${name}`}</Tooltip>{/if}
        </Badge>
      {/snippet}
    </FileAttachments>
    {#if binding.clearable && hasAttachments}<CloseButton
        class="size-7 shrink-0 p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
        ariaLabel={editor.clearLabel}
        name={editor.clearLabel}
        color="none"
        disabled={!canClear}
        onclick={(event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          clearFile();
        }}
      /><Tooltip>{editor.clearLabel}</Tooltip>{/if}
  </FileFieldFrame>
</ControlWrapper>

<Modal
  {...modalProps}
  bind:open={editor.progressOpen}
  size="sm"
  autoclose={false}
  dismissable={false}
>
  {#snippet header()}
    <Heading tag="h3" class="text-base font-semibold">{editor.progress.label}</Heading>
  {/snippet}

  <div class="space-y-3">
    <Progressbar
      progress={editor.progress.indeterminate ? 100 : editor.progress.value}
      class={editor.progress.indeterminate ? 'animate-pulse motion-reduce:animate-none' : ''}
      role="progressbar"
      aria-label={editor.progress.label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={editor.progress.indeterminate ? undefined : editor.progress.value}
      aria-valuetext={editor.progress.text}
    />
    {#if !editor.progress.indeterminate}<P class="text-sm font-medium">{editor.progress.text}</P
      >{/if}
  </div>

  {#snippet footer()}
    <Button color="alternative" onclick={abort}>{fileMessage('file.cancel')}</Button>
  {/snippet}
</Modal>
