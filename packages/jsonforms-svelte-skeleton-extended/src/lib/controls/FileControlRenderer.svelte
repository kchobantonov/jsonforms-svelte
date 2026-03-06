<script lang="ts">
  import {
    type ControlProps,
    useJsonForms,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import {
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { XIcon } from '@lucide/svelte';
  import { getI18nKey, type JsonSchema } from '@jsonforms/core';
  import { twMerge } from 'tailwind-merge';
  import type { JsonSchemaWithContent } from './fileSchema';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props));
  const jsonforms = useJsonForms();
  const portalTarget = getPortalTarget();
  const getRootNode = () => portalTarget?.getRootNode?.() ?? document;

  let selectedFileName = $state('');
  let currentFileValidationError = $state<string | null>(null);
  let progressOpen = $state(false);
  let progressIndeterminate = $state(true);
  let progressValue = $state(0);
  let currentFileReader = $state<FileReader | null>(null);
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
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      required: binding.control.required,
    };
  });

  const effectiveErrors = $derived(currentFileValidationError ?? binding.control.errors);
  const controlWrapper = $derived({
    ...binding.controlWrapper,
    errors: effectiveErrors,
  });
  const standby = $derived(
    jsonforms.i18n?.translate?.('file.upload.inProgress', 'Attaching file...') ??
      'Attaching file...',
  );

  const dialogProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Dialog');

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

  const accept = $derived.by(() => {
    const schema = binding.control.schema as JsonSchemaWithContent;
    if (typeof schema.contentMediaType === 'string' && schema.contentMediaType.trim()) {
      return schema.contentMediaType;
    }

    const fromOptions = binding.appliedOptions.accept;
    return typeof fromOptions === 'string' && fromOptions.trim() ? fromOptions : undefined;
  });

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
    const schema = binding.control.schema as JsonSchemaWithContent;

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
    currentFileReader = null;
  };

  const resetInputSelection = () => {
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const abort = () => {
    currentFileReader?.abort();
    resetInputSelection();
    selectedFileName = '';
    resetProgressState();
  };

  const toConvertedString = (
    file: File,
    reader: FileReader,
    schemaFormat: string | undefined,
  ): Promise<string> =>
    new Promise((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = String(reader.result ?? '');

        if (schemaFormat === 'uri') {
          resolve(dataUrl);
          return;
        }

        if (schemaFormat === 'binary') {
          const insertIndex = dataUrl.indexOf(';base64,');
          if (insertIndex > -1) {
            resolve(
              dataUrl.substring(0, insertIndex) +
                `;filename=${encodeURIComponent(file.name)}` +
                dataUrl.substring(insertIndex),
            );
            return;
          }

          resolve(dataUrl);
          return;
        }

        resolve(dataUrl.substring(dataUrl.indexOf(',') + 1));
      };

      reader.onabort = () => {
        reject(new DOMException('Aborted', 'AbortError'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          progressIndeterminate = false;
          progressValue = (event.loaded / event.total) * 100;
        }
      };

      reader.readAsDataURL(file);
    });

  const validateSize = (file: File): string | null => {
    const min = getFileSize('min');
    const max = getFileSize('max');
    const schema = binding.control.schema as JsonSchemaWithContent;

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
        return translate(key, `size should be less than ${limitText}`, {
          limitText,
          limit: `${max.value}`,
        });
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
        return translate(key, `size should be greater than ${limitText}`, {
          limitText,
          limit: `${min.value}`,
        });
      }
    }

    return null;
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      selectedFileName = '';
      currentFileValidationError = null;
      binding.onChange(clearValue);
      return;
    }

    currentFileValidationError = null;
    const validationError = validateSize(file);
    if (validationError !== null) {
      currentFileValidationError = validationError;
      selectedFileName = '';
      resetInputSelection();
      return;
    }

    progressOpen = true;
    progressIndeterminate = true;
    progressValue = 0;
    const schema = binding.control.schema as JsonSchemaWithContent;

    try {
      selectedFileName = file.name;
      const reader = new FileReader();
      currentFileReader = reader;
      const schemaFormat = typeof schema.format === 'string' ? schema.format : undefined;
      const converted = await toConvertedString(file, reader, schemaFormat);
      binding.onChange(converted);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      selectedFileName = '';
      resetInputSelection();
      currentFileValidationError = translate('error.fileConversion', 'Failed to process file');
      console.error('File conversion error:', error);
    } finally {
      resetProgressState();
    }
  };

  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? undefined;

    // Opening the picker and canceling should not clear the existing form value.
    if (!file) {
      return;
    }

    void handleFile(file);
  };

  const clearFile = () => {
    currentFileReader?.abort();
    resetInputSelection();
    selectedFileName = '';
    currentFileValidationError = null;
    resetProgressState();
    binding.onChange(clearValue);
  };

  const showClear = $derived(binding.clearable && (!!binding.control.data || !!selectedFileName));

  $effect(() => {
    if (!binding.control.data) {
      selectedFileName = '';
      resetInputSelection();
    }
  });

  $effect(() => {
    if (!binding.control.enabled) {
      resetInputSelection();
      selectedFileName = '';
    }
  });
</script>

<ControlWrapper {...controlWrapper}>
  <div class="group relative w-full">
    <input
      {...inputProps}
      bind:this={fileInput}
      {accept}
      aria-invalid={!!effectiveErrors}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      onchange={handleFileChange}
    />

    {#if showClear}
      <button
        type="button"
        class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-8 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
        style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={clearFile}
        disabled={!binding.control.enabled}
        aria-label="Clear value"
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>

  {#if selectedFileName}
    <p class="text-surface-600-400 mt-1 truncate text-xs">{selectedFileName}</p>
  {/if}
</ControlWrapper>

<Dialog {...dialogProps}>
  <Portal target={getPortalTarget()}>
    <Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0" />
    <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm p-6">
        <Dialog.Title class="mb-4 text-base font-semibold">{standby}</Dialog.Title>

        <div class="space-y-3">
          {#if progressIndeterminate}
            <div class="bg-surface-200-800 h-2 w-full animate-pulse rounded"></div>
          {:else}
            <div class="bg-surface-200-800 h-2 w-full rounded">
              <div
                class="bg-primary-500 h-2 rounded transition-all duration-150"
                style={`width: ${Math.max(0, Math.min(100, progressValue))}%`}
              ></div>
            </div>
            <p class="text-sm font-medium">{Math.ceil(progressValue)}%</p>
          {/if}
        </div>

        <div class="mt-4 flex justify-end">
          <button type="button" class="btn preset-outlined" onclick={abort}>Cancel</button>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
