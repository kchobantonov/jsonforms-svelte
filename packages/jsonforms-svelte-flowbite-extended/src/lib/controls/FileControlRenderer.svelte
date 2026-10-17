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
  import {
    type ControlProps,
    CellPresentationContextSymbol,
    useJsonForms,
    useAuthoredConfig,
    resolveRestrict,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import {
    Badge,
    Button,
    CloseButton,
    Fileupload,
    Heading,
    Modal,
    P,
    Progressbar,
  } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { getI18nKey, type JsonSchema } from '@jsonforms/core';
  import {
    ControlWrapper,
    determineClearValue,
    useFlowbiteControl,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import type { JsonSchemaWithContent } from './fileSchema';

  const props: ControlProps = $props();
  const compact = getContext<boolean>(CellPresentationContextSymbol) ?? false;

  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props));
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
  const canRemove = $derived(
    binding.control.enabled &&
      binding.clearable &&
      (!restrict || values.length > (binding.control.schema.minItems ?? 0)),
  );
  const canClear = $derived(
    binding.control.enabled &&
      binding.clearable &&
      (!multiple || !restrict || !(binding.control.schema.minItems! > 0)),
  );

  let selectedFiles = $state<FileList | undefined>(undefined);
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

  const fileUploadProps = $derived(binding.flowbiteProps('Fileupload'));
  const inputClass = $derived.by(() => {
    return twMerge(
      binding.styles.control.input,
      fileUploadProps.class,
      binding.clearable ? 'pe-10' : '',
    );
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
  const modalProps = $derived(binding.flowbiteProps('Modal'));

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

    selectedFiles = undefined;
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
    if (!binding.control.enabled) return;
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
        binding.control.enabled &&
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
    if (!binding.control.enabled) return;
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    selectedFiles = input.files ?? undefined;

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
    if (!binding.control.enabled && selectedFiles) {
      resetInputSelection();
    }
  });
  $effect(() => {
    const current = {
      data: binding.control.data,
      path: binding.control.path,
      schema: ownerSchema(),
      enabled: binding.control.enabled,
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
  $effect(() => {
    if (!progressOpen && fileReads.pending) untrack(abort);
  });
</script>

<ControlWrapper {...controlWrapper}>
  <div data-file-control class="flex w-full min-w-0 items-center gap-1" class:flex-wrap={!compact}>
    <div hidden>
      <Fileupload
        {...fileUploadProps}
        bind:files={selectedFiles}
        bind:elementRef={fileInput}
        id={`${binding.control.id}-file-input`}
        class={inputClass}
        disabled={!binding.control.enabled}
        required={binding.control.required}
        {accept}
        {multiple}
        clearable={false}
        onchange={handleFileChange}
        oncancel={abort}
        aria-invalid={!!effectiveErrors}
      />
    </div>
    <Button
      id={`${binding.control.id}-input`}
      type="button"
      color="alternative"
      size="sm"
      class={compact ? 'size-7 shrink-0 p-0' : 'shrink-0'}
      disabled={!binding.control.enabled}
      autofocus={binding.appliedOptions.focus}
      aria-label={pickerName}
      title={pickerLabel}
      data-invalid={!!effectiveErrors || undefined}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      onclick={() => fileInput?.click()}
      >{#if compact}<span aria-hidden="true">+</span>{:else}{pickerLabel}{/if}</Button
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
            <Badge color="gray" class="flex max-w-full min-w-0 items-center gap-1">
              <span class="min-w-0 truncate" title={attachmentName(value, index)}
                >{attachmentName(value, index)}</span
              >
              {#if binding.clearable}<CloseButton
                  class="size-6 shrink-0 p-1"
                  color="none"
                  ariaLabel={`${fileMessage('file.remove')}: ${attachmentName(value, index)}`}
                  name={fileMessage('file.remove')}
                  disabled={!canRemove}
                  onclick={(event: MouseEvent) => {
                    event.preventDefault();
                    event.stopPropagation();
                    removeAttachment(index);
                  }}
                />{/if}
            </Badge>
          </li>
        {/each}
      </ul>
    {:else if !multiple && storedFileName}
      <span class="min-w-0 flex-1 truncate text-xs" title={storedFileName}>{storedFileName}</span>
    {/if}
    {#if binding.clearable && hasAttachments}<CloseButton
        class="size-7 shrink-0 p-1"
        ariaLabel={fileMessage('file.clear')}
        name={fileMessage('file.clear')}
        color="none"
        disabled={!canClear}
        onclick={(event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          clearFile();
        }}
      />{/if}
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

<Modal {...modalProps} bind:open={progressOpen} size="sm" autoclose={false} dismissable={false}>
  {#snippet header()}
    <Heading tag="h3" class="text-base font-semibold">{standby}</Heading>
  {/snippet}

  <div class="space-y-3">
    <Progressbar
      progress={progressIndeterminate ? 100 : Math.max(0, Math.min(100, progressValue))}
      class={progressIndeterminate ? 'animate-pulse motion-reduce:animate-none' : ''}
      role="progressbar"
      aria-label={standby}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressIndeterminate ? undefined : Math.max(0, Math.min(100, progressValue))}
      aria-valuetext={progressIndeterminate ? standby : `${Math.ceil(progressValue)}%`}
    />
    {#if !progressIndeterminate}<P class="text-sm font-medium">{Math.ceil(progressValue)}%</P>{/if}
  </div>

  {#snippet footer()}
    <Button color="alternative" onclick={abort}>{fileMessage('file.cancel')}</Button>
  {/snippet}
</Modal>
