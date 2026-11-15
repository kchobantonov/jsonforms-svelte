<script lang="ts">
  import { useUIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';
  import { getContext, onDestroy, onMount, untrack } from 'svelte';
  import FileOperationFeedback from './FileOperationFeedback.svelte';
  import {
    createFileReadSession,
    useFileSizeErrors,
    resolveFileSizeBounds,
    violatedFileSizeBound,
    resolveFileAccept,
    fileItemSchema,
    fileNameFromValue,
    translateFileMessage,
    type FileMessageKey,
    type FileReadRequest,
  } from '@chobantonov/jsonforms-svelte-extended';
  import type { ComponentProps } from 'svelte';
  import {
    type ControlProps,
    CellPresentationContextSymbol,
    useJsonForms,
    useAuthoredConfig,
    resolveRestrict,
    useJsonFormsControl,
    useRendererMessages,
    dataPathSegments,
    scopeDataSegments,
  } from '@chobantonov/jsonforms-svelte';
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
  import { getI18nKey, type JsonSchema } from '@jsonforms/core';
  import { twMerge } from 'tailwind-merge';
  import type { JsonSchemaWithContent } from './fileSchema';

  const reportDiagnostic = useUIDiagnosticReporter();
  const props: ControlProps = $props();
  const compact = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props));
  const message = useRendererMessages();
  const jsonforms = useJsonForms();
  const authoredConfig = useAuthoredConfig();
  const itemSchema = $derived(
    fileItemSchema(binding.control.schema, jsonforms.core?.schema ?? binding.control.schema),
  );
  const multiple = $derived(itemSchema !== undefined);
  const fileSchema = $derived((itemSchema ?? binding.control.schema) as JsonSchemaWithContent);
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));
  const values: unknown[] = $derived(
    Array.isArray(binding.control.data) ? binding.control.data : [],
  );
  let arrayAttachments = $state<{ value: unknown; name: string }[]>([]);
  const editable = $derived(
    binding.control.enabled && binding.control.visible && !binding.control.readonly,
  );
  const canAdd = $derived(editable && (!multiple || binding.appliedOptions.disableAdd !== true));
  const canRemove = $derived(
    editable &&
      binding.clearable &&
      (!multiple || binding.appliedOptions.disableRemove !== true) &&
      (!restrict || values.length > (binding.control.schema.minItems ?? 0)),
  );
  const canClear = $derived(
    editable &&
      binding.clearable &&
      (!multiple || binding.appliedOptions.disableRemove !== true) &&
      (!multiple || !restrict || !(binding.control.schema.minItems! > 0)),
  );

  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let clearFocused = $state(false);
  let clearHovered = $state(false);
  let clearDismissed = $state(false);
  let pickerFocused = $state(false);
  let pickerHovered = $state(false);
  let pickerDismissed = $state(false);
  let removeFocused = $state<number | null>(null);
  let removeHovered = $state<number | null>(null);
  let removeDismissed = $state<number | null>(null);
  const clearTooltipOpen = $derived((clearFocused || clearHovered) && !clearDismissed);
  const pickerTooltipOpen = $derived((pickerFocused || pickerHovered) && !pickerDismissed);
  const dismissClearTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') clearDismissed = true;
  };
  const dismissPickerTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') pickerDismissed = true;
  };
  const dismissRemoveTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') removeDismissed = removeFocused;
  };
  onMount(() => () => {
    window.removeEventListener('keydown', dismissClearTooltip, true);
    window.removeEventListener('keydown', dismissPickerTooltip, true);
    window.removeEventListener('keydown', dismissRemoveTooltip, true);
  });

  let lastAttachment = $state<{ value: string; name: string } | undefined>();

  let currentFileValidationError = $state<string | null>(null);
  let feedbackSeverity = $state<'warning' | 'error'>('warning');
  let feedbackOwner: unknown;
  const showFeedback = (message: string, severity: 'warning' | 'error') => {
    feedbackOwner = binding.control.data;
    feedbackSeverity = severity;
    currentFileValidationError = message;
  };
  let progressOpen = $state(false);
  let progressIndeterminate = $state(true);
  let progressValue = $state(0);
  const fileReads = createFileReadSession();
  // Request ownership is imperative state; it does not drive rendering.
  let pendingOwner: { data: unknown; path: string; schema: string } | undefined;
  onDestroy(() => fileReads.cancel());
  let fileInput = $state<HTMLInputElement | undefined>(undefined);

  const inputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input`,
      type: 'file',
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        'input w-full pe-10 file:btn file:btn-sm file:preset-tonal file:me-3',
      ),
      disabled: !canAdd,
      required: binding.control.required,
    };
  });

  const effectiveErrors = $derived(binding.control.errors);
  const controlWrapper = $derived({
    ...binding.controlWrapper,
    errors: effectiveErrors,
  });
  const feedbackId = $derived(`${binding.control.id}-file-feedback`);
  const describedBy = $derived(
    [
      binding.skeletonProps('input')['aria-describedby'],
      !compact &&
      !binding.appliedOptions.hideControlWrapper &&
      (effectiveErrors ||
        (binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)))
        ? `${binding.control.id}-help`
        : undefined,
      currentFileValidationError ? feedbackId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  );
  const fileMessage = (key: FileMessageKey, params?: Record<string, string>) =>
    translateFileMessage(jsonforms.i18n?.locale, jsonforms.i18n?.translate, key, params);
  const hasAttachments = $derived(
    multiple
      ? values.length > 0
      : binding.control.data !== undefined &&
          binding.control.data !== null &&
          binding.control.data !== '',
  );
  const pickerLabel = $derived(
    fileMessage(multiple ? 'file.selectMultiple' : hasAttachments ? 'file.replace' : 'file.select'),
  );
  const pickerName = $derived(
    binding.control.label ? `${binding.control.label}: ${pickerLabel}` : pickerLabel,
  );
  const storedFileName = $derived(
    typeof binding.control.data === 'string' && binding.control.data.length > 0
      ? (fileNameFromValue(binding.control.data) ??
          (lastAttachment?.value === binding.control.data
            ? lastAttachment.name
            : fileMessage('file.attached')))
      : undefined,
  );
  const attachmentName = (value: unknown, index: number): string =>
    fileNameFromValue(value) ??
    (arrayAttachments[index]?.value === value
      ? arrayAttachments[index].name
      : fileMessage('file.numbered', { index: String(index + 1) }));
  const removeAttachment = (index: number) => {
    if (!canRemove || index < 0 || index >= values.length) return;
    cancelRead();
    currentFileValidationError = null;
    arrayAttachments = values
      .map((value, position) => ({ value, name: attachmentName(value, position) }))
      .filter((_, position) => position !== index);
    binding.onChange(values.filter((_, position) => position !== index));
  };
  const standby = $derived(fileMessage('file.reading'));

  const dialogProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Dialog') as VendorProps<
      Pick<ComponentProps<typeof Dialog>, 'onOpenChange'>
    >;

    return {
      closeOnEscape: false,
      closeOnInteractOutside: false,
      ...skeletonProps,
      getRootNode,
      open: progressOpen,
      onOpenChange: (details: { open: boolean }) => {
        if (!details.open && progressOpen) {
          abort();
        }
        progressOpen = details.open;
        skeletonProps.onOpenChange?.(details);
      },
    };
  });

  const accept = $derived(
    resolveFileAccept(binding.appliedOptions.accept, fileSchema.contentMediaType),
  );

  const translate = (key: string, defaultMessage: string, context?: Record<string, string>) => {
    return jsonforms.i18n?.translate?.(key, defaultMessage, context) ?? defaultMessage;
  };

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const index = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`;
  };

  const resetProgressState = () => {
    progressOpen = false;
    progressIndeterminate = true;
    progressValue = 0;
  };

  const resetInputSelection = () => {
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const cancelRead = () => {
    fileReads.cancel();
    pendingOwner = undefined;
    resetInputSelection();

    resetProgressState();
  };

  // User cancellation follows the explicit Clear contract. Internal invalidation
  // (replacement, host updates and unmount) only cancels the pending operation.
  const abort = () => {
    cancelRead();
    currentFileValidationError = null;
    if (canClear) binding.onChange(multiple ? [] : clearValue);
  };

  const validateSize = (file: { size: number }): string | null => {
    const failed = violatedFileSizeBound(
      file.size,
      resolveFileSizeBounds(fileSchema, binding.appliedOptions),
    );
    if (!failed) return null;
    const messageKeys = {
      formatMaximum: 'error.fileMaximum',
      formatExclusiveMaximum: 'error.fileExclusiveMaximum',
      formatMinimum: 'error.fileMinimum',
      formatExclusiveMinimum: 'error.fileExclusiveMinimum',
    } as const;
    const key = getI18nKey(
      fileSchema as JsonSchema,
      props.uischema,
      binding.control.path,
      `error.${failed.keyword}`,
    );
    const limitText = formatBytes(failed.limit);
    return translate(key, fileMessage(messageKeys[failed.keyword], { limitText }), {
      limitText,
      limit: `${failed.limit}`,
    });
  };

  const sizeErrors = useFileSizeErrors({
    get pending() {
      return progressOpen;
    },
    get data() {
      return binding.control.data;
    },
    get path() {
      return binding.control.path;
    },
    get pathSegments() {
      return props.pathSegments
        ? [...props.pathSegments, ...scopeDataSegments(props.uischema.scope)]
        : dataPathSegments(binding.control.path);
    },
    validate: (size) => validateSize({ size }),
  });

  const ownerSchema = () =>
    JSON.stringify([
      binding.control.schema,
      fileSchema,
      resolveFileSizeBounds(fileSchema, binding.appliedOptions),
      accept,
      restrict,
    ]);

  const handleFiles = async (files: File[]) => {
    if (!canAdd) return;
    cancelRead();
    if (!files.length) {
      currentFileValidationError = null;
      if (canClear) binding.onChange(multiple ? [] : clearValue);
      return;
    }

    currentFileValidationError = null;
    const rejected = files
      .map((file) => ({ file, reason: validateSize(file) }))
      .find(({ reason }) => reason !== null);
    if (restrict && rejected?.reason) {
      showFeedback(
        rejected.file.name
          ? fileMessage('file.rejected', { name: rejected.file.name, reason: rejected.reason })
          : rejected.reason,
        'warning',
      );

      resetInputSelection();
      return;
    }

    const maxItems = binding.control.schema.maxItems;
    if (
      multiple &&
      restrict &&
      !binding.control.schema.uniqueItems &&
      typeof maxItems === 'number' &&
      values.length + files.length > maxItems
    ) {
      showFeedback(fileMessage('file.maxItems', { limit: String(maxItems) }), 'warning');
      resetInputSelection();
      return;
    }

    progressOpen = true;
    progressIndeterminate = true;
    progressValue = 0;
    const schema = fileSchema;

    const owner = { data: binding.control.data, path: binding.control.path, schema: ownerSchema() };
    pendingOwner = owner;
    let request: FileReadRequest<string[]> | undefined;
    try {
      const schemaFormat = typeof schema.format === 'string' ? schema.format : undefined;
      request = fileReads.readBatch(files, schemaFormat, (event) => {
        if (event.lengthComputable) {
          progressIndeterminate = false;
          progressValue = event.total > 0 ? (event.loaded / event.total) * 100 : 0;
        }
      });
      const converted = await request.result;
      if (
        request.isCurrent() &&
        canAdd &&
        Object.is(owner.data, binding.control.data) &&
        owner.path === binding.control.path &&
        owner.schema === ownerSchema()
      ) {
        if (multiple) {
          const next = [...values];
          const addedValues: string[] = [];
          const addedFiles: File[] = [];
          const names = values.map((value, index) => ({
            value,
            name: attachmentName(value, index),
          }));
          converted.forEach((value, index) => {
            if (binding.control.schema.uniqueItems && next.includes(value)) return;
            next.push(value);
            addedValues.push(value);
            addedFiles.push(files[index]);
            names.push({ value, name: files[index].name });
          });
          const max = binding.control.schema.maxItems;
          if (restrict && typeof max === 'number' && next.length > max) {
            showFeedback(fileMessage('file.maxItems', { limit: String(max) }), 'warning');
            resetInputSelection();
            return;
          }
          if (addedValues.length) {
            sizeErrors.remember(addedValues, addedFiles);
            arrayAttachments = names;
            binding.onChange(next);
          }
        } else {
          sizeErrors.remember(converted, files);
          lastAttachment = { value: converted[0], name: files[0].name };
          binding.onChange(converted[0]);
        }
        resetInputSelection();
      }
    } catch (error) {
      if (request && !request.isCurrent()) return;
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      resetInputSelection();
      showFeedback(fileMessage('file.readFailed'), 'error');
      reportDiagnostic('file.readFailed', {
        severity: 'error',
        message: 'File conversion failed; the selected files were not committed.',
        path: binding.control.path,
      });
    } finally {
      if (!request || request.isCurrent()) {
        pendingOwner = undefined;
        resetProgressState();
      }
    }
  };

  const handleFileChange = (event: Event) => {
    if (!canAdd) return;
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!files.length) {
      abort();
      return;
    }

    void handleFiles(multiple ? files : files.slice(0, 1));
  };

  const clearFile = () => {
    if (!canClear) return;
    fileReads.cancel();
    pendingOwner = undefined;
    resetInputSelection();

    currentFileValidationError = null;
    resetProgressState();
    if (canClear) binding.onChange(multiple ? [] : clearValue);
  };

  $effect(() => {
    const data = binding.control.data;
    untrack(() => {
      if (currentFileValidationError && !Object.is(feedbackOwner, data))
        currentFileValidationError = null;
    });
  });

  $effect(() => {
    if (!binding.control.data) {
      resetInputSelection();
    }
  });

  $effect(() => {
    if (!canAdd) {
      resetInputSelection();
    }
  });
  $effect(() => {
    const current = {
      data: binding.control.data,
      path: binding.control.path,
      schema: ownerSchema(),
      enabled: canAdd,
    };
    untrack(() => {
      if (
        pendingOwner &&
        (!current.enabled ||
          !Object.is(pendingOwner.data, current.data) ||
          pendingOwner.path !== current.path ||
          pendingOwner.schema !== current.schema)
      )
        cancelRead();
    });
  });
</script>

<ControlWrapper {...controlWrapper}>
  <div
    data-file-control
    data-invalid={!!effectiveErrors || undefined}
    class="border-surface-400-600 bg-surface-50-950 rounded-base group data-[invalid]:border-error-500 flex w-full min-w-0 items-center gap-1 border px-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-current"
    class:py-1={!compact}
  >
    <div hidden>
      <input
        {...inputProps}
        id={`${binding.control.id}-file-input`}
        bind:this={fileInput}
        {accept}
        {multiple}
        aria-invalid={!!effectiveErrors}
        onchange={handleFileChange}
        oncancel={abort}
      />
    </div>
    <Tooltip
      open={pickerTooltipOpen}
      openDelay={0}
      {getRootNode}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger>
        {#snippet element(triggerProps)}
          <!-- Focus is an explicit authored renderer option. -->
          <!-- svelte-ignore a11y_autofocus -->
          <button
            {...triggerProps}
            id={`${binding.control.id}-input`}
            type="button"
            class="hover:preset-tonal rounded-base inline-flex size-7 shrink-0 items-center justify-center"
            disabled={!canAdd}
            autofocus={binding.initialFocus}
            aria-label={binding.control.required
              ? `${pickerName}, ${message('control.required')}`
              : pickerName}
            aria-describedby={describedBy}
            title={pickerLabel}
            data-invalid={!!effectiveErrors || undefined}
            onfocus={() => {
              binding.handleFocus();
              pickerFocused = true;
              pickerDismissed = false;
              window.addEventListener('keydown', dismissPickerTooltip, true);
            }}
            onblur={() => {
              binding.handleBlur();
              pickerFocused = false;
              window.removeEventListener('keydown', dismissPickerTooltip, true);
            }}
            onpointerenter={() => {
              pickerHovered = true;
              pickerDismissed = false;
            }}
            onpointerleave={() => (pickerHovered = false)}
            onclick={() => fileInput?.click()}
            ><FileIcon class="size-4" aria-hidden="true" /></button
          >
        {/snippet}
      </Tooltip.Trigger>
      <Portal target={resolvePortalTarget() ?? undefined}>
        <Tooltip.Context>
          {#snippet children(tooltip)}
            <div {...tooltip().getPositionerProps()}>
              <Tooltip.Content class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
                >{pickerLabel}</Tooltip.Content
              >
            </div>
          {/snippet}
        </Tooltip.Context>
      </Portal>
    </Tooltip>
    {#if multiple && values.length}
      <ul
        class={compact
          ? 'flex max-h-8 min-w-0 flex-1 gap-1 overflow-auto'
          : 'flex max-h-32 min-w-0 flex-1 flex-wrap gap-1 overflow-auto'}
        aria-label={fileMessage('file.attachments')}
      >
        {#each values as value, index (index)}
          <li class="flex max-w-full min-w-0 shrink-0">
            <span class="badge preset-tonal flex max-w-full min-w-0 items-center gap-1">
              <!-- Long filenames need keyboard focus when Remove is unavailable. -->
              <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
              <span
                class="min-w-0 truncate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
                title={attachmentName(value, index)}
                tabindex="0">{attachmentName(value, index)}</span
              >
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
                        disabled={!canRemove}
                        aria-label={`${fileMessage('file.remove')}: ${attachmentName(value, index)}`}
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
                        onpointerleave={() => (removeHovered = null)}
                        ><XIcon class="size-4" /></button
                      >
                    {/snippet}
                  </Tooltip.Trigger>
                  <Portal target={resolvePortalTarget() ?? undefined}>
                    <Tooltip.Context>
                      {#snippet children(tooltip)}
                        <div {...tooltip().getPositionerProps()}>
                          <Tooltip.Content
                            class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
                            >{`${fileMessage('file.remove')}: ${attachmentName(value, index)}`}</Tooltip.Content
                          >
                        </div>
                      {/snippet}
                    </Tooltip.Context>
                  </Portal>
                </Tooltip>{/if}
            </span>
          </li>
        {/each}
      </ul>
    {:else if !multiple && storedFileName}
      <!-- The stored filename remains focusable when Clear is unavailable. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <span
        class="min-w-0 flex-1 truncate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
        title={storedFileName}
        tabindex="0">{storedFileName}</span
      >
    {:else}
      <span class="text-surface-600-400 min-w-0 flex-1 truncate" aria-hidden="true"
        >{pickerLabel}</span
      >
    {/if}
    {#if binding.clearable && hasAttachments}<Tooltip
        open={clearTooltipOpen}
        openDelay={0}
        {getRootNode}
        positioning={{ placement: 'top', strategy: 'fixed' }}
      >
        <Tooltip.Trigger>
          {#snippet element(triggerProps)}
            <button
              {...triggerProps}
              type="button"
              class="hover:preset-tonal rounded-base inline-flex size-7 shrink-0 items-center justify-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
              disabled={!canClear}
              aria-label={fileMessage(multiple ? 'file.clearAll' : 'file.clear')}
              onclick={() => clearFile()}
              onfocus={() => {
                clearFocused = true;
                clearDismissed = false;
                window.addEventListener('keydown', dismissClearTooltip, true);
              }}
              onblur={() => {
                clearFocused = false;
                window.removeEventListener('keydown', dismissClearTooltip, true);
              }}
              onpointerenter={() => {
                clearHovered = true;
                clearDismissed = false;
              }}
              onpointerleave={() => (clearHovered = false)}><XIcon class="size-4" /></button
            >
          {/snippet}
        </Tooltip.Trigger>
        <Portal target={resolvePortalTarget() ?? undefined}>
          <Tooltip.Context>
            {#snippet children(tooltip)}
              <div {...tooltip().getPositionerProps()}>
                <Tooltip.Content
                  class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
                  >{fileMessage(multiple ? 'file.clearAll' : 'file.clear')}</Tooltip.Content
                >
              </div>
            {/snippet}
          </Tooltip.Context>
        </Portal>
      </Tooltip>{/if}
    {#if compact && currentFileValidationError}
      <FileOperationFeedback
        id={feedbackId}
        message={currentFileValidationError}
        severity={feedbackSeverity}
        compact
      />
    {/if}
  </div>
  {#if !compact && currentFileValidationError}
    <FileOperationFeedback
      id={feedbackId}
      message={currentFileValidationError}
      severity={feedbackSeverity}
      compact={false}
    />
  {/if}
</ControlWrapper>

<Dialog {...dialogProps}>
  <Portal target={getPortalTarget()}>
    <Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0" />
    <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm p-6">
        <Dialog.Title class="mb-4 text-base font-semibold">{standby}</Dialog.Title>

        <div class="space-y-3">
          <Progress
            value={progressIndeterminate ? null : Math.max(0, Math.min(100, progressValue))}
            translations={{
              value: () => (progressIndeterminate ? standby : `${Math.ceil(progressValue)}%`),
            }}
          >
            <Progress.Label class="sr-only">{standby}</Progress.Label>
            <Progress.Track
              class="bg-surface-200-800 h-2 w-full overflow-hidden rounded"
              aria-label={standby}
              aria-valuetext={progressIndeterminate ? standby : `${Math.ceil(progressValue)}%`}
            >
              <Progress.Range
                class={progressIndeterminate
                  ? 'bg-primary-500 h-full w-full animate-pulse motion-reduce:animate-none'
                  : 'bg-primary-500 h-full transition-all'}
              />
            </Progress.Track>
          </Progress>
          {#if !progressIndeterminate}<p class="text-sm font-medium">
              {Math.ceil(progressValue)}%
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
