<script lang="ts">
  import { getContext, onDestroy, untrack } from 'svelte';
  import FileOperationFeedback from './FileOperationFeedback.svelte';
  import {
    createFileReadSession,
    useFileSizeErrors,
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
  } from '@chobantonov/jsonforms-svelte';
  import {
    type VendorProps,
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    getPortalRootNodeGetter,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Dialog, Portal, Progress } from '@skeletonlabs/skeleton-svelte';
  import { XIcon } from '@lucide/svelte';
  import { getI18nKey, type JsonSchema } from '@jsonforms/core';
  import { twMerge } from 'tailwind-merge';
  import type { JsonSchemaWithContent } from './fileSchema';

  const props: ControlProps = $props();
  const compact = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props));
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
  const editable = $derived(binding.control.enabled && !binding.control.readonly);
  const canRemove = $derived(
    editable &&
      binding.clearable &&
      (!restrict || values.length > (binding.control.schema.minItems ?? 0)),
  );
  const canClear = $derived(
    editable &&
      binding.clearable &&
      (!multiple || !restrict || !(binding.control.schema.minItems! > 0)),
  );

  const getRootNode = getPortalRootNodeGetter();

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
      disabled: !editable,
      required: binding.control.required,
    };
  });

  const effectiveErrors = $derived(binding.control.errors);
  const controlWrapper = $derived({
    ...binding.controlWrapper,
    errors: effectiveErrors,
  });
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
      : fileMessage('file.attached'));
  const removeAttachment = (index: number) => {
    if (!canRemove || index < 0 || index >= values.length) return;
    cancelRead();
    currentFileValidationError = null;
    arrayAttachments = values
      .map((value, position) => ({ value, name: attachmentName(value, position) }))
      .filter((_, position) => position !== index);
    binding.onChange(values.filter((_, position) => position !== index));
  };
  const standby = $derived(fileMessage('file.upload.inProgress'));

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

  const toNonNegativeNumber = (param: unknown): number | undefined => {
    if (param === undefined || param === null) {
      return undefined;
    }

    const parsed = Number(param);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  const getFileSize = (
    variant: 'min' | 'max',
  ): { value: number | undefined; exclusive: boolean } => {
    let value: number | undefined;
    let exclusive = false;
    const options = binding.appliedOptions;
    const schema = fileSchema;

    if (variant === 'min') {
      value = toNonNegativeNumber(schema.formatMinimum);
      if (value === undefined && schema.formatExclusiveMinimum !== undefined) {
        value = toNonNegativeNumber(schema.formatExclusiveMinimum);
        exclusive = true;
      }

      if (value === undefined) {
        if (
          typeof options.formatMinimum === 'number' ||
          typeof options.formatMinimum === 'string'
        ) {
          value = toNonNegativeNumber(options.formatMinimum);
        } else if (
          typeof options.formatExclusiveMinimum === 'number' ||
          typeof options.formatExclusiveMinimum === 'string'
        ) {
          value = toNonNegativeNumber(options.formatExclusiveMinimum);
          exclusive = true;
        }
      }
    } else {
      value = toNonNegativeNumber(schema.formatMaximum);
      if (value === undefined && schema.formatExclusiveMaximum !== undefined) {
        value = toNonNegativeNumber(schema.formatExclusiveMaximum);
        exclusive = true;
      }

      if (value === undefined) {
        if (
          typeof options.formatMaximum === 'number' ||
          typeof options.formatMaximum === 'string'
        ) {
          value = toNonNegativeNumber(options.formatMaximum);
        } else if (
          typeof options.formatExclusiveMaximum === 'number' ||
          typeof options.formatExclusiveMaximum === 'string'
        ) {
          value = toNonNegativeNumber(options.formatExclusiveMaximum);
          exclusive = true;
        }
      }
    }

    return { value, exclusive };
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
    const min = getFileSize('min');
    const max = getFileSize('max');
    const schema = fileSchema;

    if (max.value !== undefined) {
      const valid = max.exclusive ? file.size < max.value : file.size <= max.value;
      if (!valid) {
        const key = getI18nKey(
          schema as JsonSchema,
          props.uischema,
          binding.control.path,
          max.exclusive ? 'error.formatExclusiveMaximum' : 'error.formatMaximum',
        );
        const limitText = formatBytes(max.value);
        return translate(
          key,
          fileMessage(max.exclusive ? 'error.fileExclusiveMaximum' : 'error.fileMaximum', {
            limitText,
          }),
          {
            limitText,
            limit: `${max.value}`,
          },
        );
      }
    }

    if (min.value !== undefined) {
      const valid = min.exclusive ? file.size > min.value : file.size >= min.value;
      if (!valid) {
        const key = getI18nKey(
          schema as JsonSchema,
          props.uischema,
          binding.control.path,
          min.exclusive ? 'error.formatExclusiveMinimum' : 'error.formatMinimum',
        );
        const limitText = formatBytes(min.value);
        return translate(
          key,
          fileMessage(min.exclusive ? 'error.fileExclusiveMinimum' : 'error.fileMinimum', {
            limitText,
          }),
          {
            limitText,
            limit: `${min.value}`,
          },
        );
      }
    }

    return null;
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
    validate: (size) => validateSize({ size }),
  });

  const ownerSchema = () =>
    JSON.stringify([
      binding.control.schema,
      fileSchema,
      getFileSize('min'),
      getFileSize('max'),
      accept,
      restrict,
    ]);

  const handleFiles = async (files: File[]) => {
    if (!editable) return;
    cancelRead();
    if (!files.length) {
      currentFileValidationError = null;
      if (canClear) binding.onChange(multiple ? [] : clearValue);
      return;
    }

    currentFileValidationError = null;
    const validationError = files.map(validateSize).find((error) => error !== null) ?? null;
    if (restrict && validationError !== null) {
      showFeedback(validationError, 'warning');

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
        editable &&
        Object.is(owner.data, binding.control.data) &&
        owner.path === binding.control.path &&
        owner.schema === ownerSchema()
      ) {
        if (multiple) {
          const next = [...values];
          const names = values.map((value, index) => ({
            value,
            name: attachmentName(value, index),
          }));
          converted.forEach((value, index) => {
            if (binding.control.schema.uniqueItems && next.includes(value)) return;
            next.push(value);
            names.push({ value, name: files[index].name });
          });
          const max = binding.control.schema.maxItems;
          if (restrict && typeof max === 'number' && next.length > max) {
            showFeedback(fileMessage('error.fileCount'), 'warning');
            resetInputSelection();
            return;
          }
          sizeErrors.remember(converted, files);
          arrayAttachments = names;
          binding.onChange(next);
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
      showFeedback(fileMessage('error.fileConversion'), 'error');
      console.error('File conversion error:', error);
    } finally {
      if (!request || request.isCurrent()) {
        pendingOwner = undefined;
        resetProgressState();
      }
    }
  };

  const handleFileChange = (event: Event) => {
    if (!editable) return;
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
    if (!editable) {
      resetInputSelection();
    }
  });
  $effect(() => {
    const current = {
      data: binding.control.data,
      path: binding.control.path,
      schema: ownerSchema(),
      enabled: editable,
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
  <div data-file-control class="flex w-full min-w-0 items-center gap-1" class:flex-wrap={!compact}>
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
    <!-- Focus is an explicit authored renderer option. -->
    <!-- svelte-ignore a11y_autofocus -->
    <button
      id={`${binding.control.id}-input`}
      type="button"
      class={compact ? 'btn-icon preset-tonal size-7 shrink-0' : 'btn btn-sm preset-tonal shrink-0'}
      disabled={!editable}
      autofocus={binding.appliedOptions.focus}
      aria-label={pickerName}
      title={pickerLabel}
      data-invalid={!!effectiveErrors || undefined}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      onclick={() => fileInput?.click()}
      >{#if compact}<span aria-hidden="true">+</span>{:else}{pickerLabel}{/if}</button
    >
    {#if multiple && values.length}
      <ul
        class={compact
          ? 'flex max-h-8 min-w-0 flex-1 gap-1 overflow-auto'
          : 'order-last flex max-h-48 w-full flex-wrap gap-2 overflow-auto'}
        aria-label={fileMessage('file.attachments')}
      >
        {#each values as value, index (index)}
          <li class="flex max-w-full min-w-0 shrink-0">
            <span class="badge preset-tonal flex max-w-full min-w-0 items-center gap-1">
              <span class="min-w-0 truncate" title={attachmentName(value, index)}
                >{attachmentName(value, index)}</span
              >
              {#if binding.clearable}<button
                  type="button"
                  class="btn-icon preset-tonal size-6 shrink-0"
                  disabled={!canRemove}
                  aria-label={`${fileMessage('file.remove')}: ${attachmentName(value, index)}`}
                  onclick={() => removeAttachment(index)}><XIcon class="size-4" /></button
                >{/if}
            </span>
          </li>
        {/each}
      </ul>
    {:else if !multiple && storedFileName}
      <span class="min-w-0 flex-1 truncate text-xs" title={storedFileName}>{storedFileName}</span>
    {/if}
    {#if binding.clearable && hasAttachments}<button
        type="button"
        class="btn-icon preset-tonal size-7 shrink-0"
        disabled={!canClear}
        aria-label={fileMessage('file.clear')}
        onclick={() => clearFile()}><XIcon class="size-4" /></button
      >{/if}
    {#if compact && currentFileValidationError}
      <FileOperationFeedback
        message={currentFileValidationError}
        severity={feedbackSeverity}
        compact
      />
    {/if}
  </div>
  {#if !compact && currentFileValidationError}
    <FileOperationFeedback
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
