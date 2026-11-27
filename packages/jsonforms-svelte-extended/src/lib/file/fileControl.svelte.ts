import {
  useUIDiagnosticReporter,
  useRendererMessages,
  type ControlProps,
  useAuthoredConfig,
  resolveRestrict,
  controlDataSegments,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { getI18nKey, type JsonSchema } from '@jsonforms/core';
import { onDestroy, untrack } from 'svelte';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { createFileReadSession, type FileReadRequest } from './fileReadSession';
import { useFileSizeErrors } from './fileSizeErrors.svelte';
import { resolveFileSizeBounds, violatedFileSizeBound } from './fileSizeBounds';
import { resolveFileAccept, fileItemSchema, fileNameFromValue } from './fileOptions';
import { translateFileMessage, type FileMessageKey } from './fileMessages';

interface FileBinding {
  control: {
    schema: JsonSchema;
    data: unknown;
    enabled: boolean;
    visible: boolean;
    readonly?: boolean;
    path: string;
    label?: string;
  };
  appliedOptions: Record<string, unknown>;
  clearable: boolean;
  onChange(value: unknown): void;
}

export function useFileControl(
  props: ControlProps,
  binding: FileBinding,
  clearValue: unknown,
  onResetInput?: () => void,
) {
  let fileInput = $state<HTMLInputElement>();
  function resetInputSelection() {
    if (fileInput) fileInput.value = '';
    onResetInput?.();
  }
  const reportDiagnostic = useUIDiagnosticReporter();
  const jsonforms = useJsonForms();
  const authoredConfig = useAuthoredConfig();
  const itemSchema = $derived(
    fileItemSchema(binding.control.schema, jsonforms.core?.schema ?? binding.control.schema),
  );
  const multiple = $derived(itemSchema !== undefined);
  const fileSchema = $derived(
    (itemSchema ?? binding.control.schema) as JsonSchema & { contentMediaType?: string },
  );
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
      return controlDataSegments(props, binding.control.path);
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
  return {
    get fileInput() {
      return fileInput;
    },
    set fileInput(input: HTMLInputElement | undefined) {
      fileInput = input;
    },
    resetInputSelection,
    openPicker() {
      fileInput?.click();
    },
    get accept() {
      return accept;
    },
    get multiple() {
      return multiple;
    },
    get canAdd() {
      return canAdd;
    },
    get canRemove() {
      return canRemove;
    },
    get canClear() {
      return canClear;
    },
    get values() {
      return values;
    },
    get currentFileValidationError() {
      return currentFileValidationError;
    },
    get feedbackSeverity() {
      return feedbackSeverity;
    },
    get pickerLabel() {
      return pickerLabel;
    },
    get pickerName() {
      return pickerName;
    },
    get hasAttachments() {
      return hasAttachments;
    },
    get storedFileName() {
      return storedFileName;
    },
    get clearLabel() {
      return fileMessage(multiple ? 'file.clearAll' : 'file.clear');
    },
    get progress() {
      return {
        label: standby,
        value: Math.max(0, Math.min(100, progressValue)),
        text: progressIndeterminate ? standby : `${Math.ceil(progressValue)}%`,
        indeterminate: progressIndeterminate,
      };
    },
    get standby() {
      return standby;
    },
    get progressIndeterminate() {
      return progressIndeterminate;
    },
    get progressValue() {
      return progressValue;
    },
    get progressOpen() {
      return progressOpen;
    },
    set progressOpen(open: boolean) {
      progressOpen = open;
    },
    get pending() {
      return fileReads.pending;
    },
    attachmentName,
    removeAttachment,
    fileMessage,
    abort,
    handleFiles,
    selectFiles(event: Event, onSelect?: (files: FileList | undefined) => void) {
      if (!canAdd) return;
      const selected = (event.target as HTMLInputElement).files;
      const files = Array.from(selected ?? []);
      onSelect?.(selected ?? undefined);
      if (!files.length) abort();
      else void handleFiles(multiple ? files : files.slice(0, 1));
    },
    clearFile,
  };
}

export function fileDescriptionIds(
  binding: {
    control: { id: string; errors?: string; description?: string };
    appliedOptions: Record<string, unknown>;
    isFocused: boolean;
    controlWrapper: { persistentHint?: boolean };
  },
  compact: boolean,
  authored: unknown,
  feedbackId: string | undefined,
) {
  const showHelp =
    !compact &&
    !binding.appliedOptions.hideControlWrapper &&
    (binding.control.errors ||
      (binding.control.description &&
        (binding.isFocused || binding.controlWrapper.persistentHint)));
  return (
    [authored, showHelp ? `${binding.control.id}-help` : undefined, feedbackId]
      .filter(Boolean)
      .join(' ') || undefined
  );
}

export function useFilePickerField(
  editor: ReturnType<typeof useFileControl>,
  binding: Parameters<typeof fileDescriptionIds>[0] & {
    control: { required?: boolean };
    initialFocus: boolean;
  },
  compact: boolean,
  authoredDescription: () => unknown,
) {
  const message = useRendererMessages();
  // Flowbite resets its bound FileList alongside the native input.
  $effect(() => {
    if (!editor.canAdd && editor.fileInput?.value) editor.resetInputSelection();
  });
  const feedbackId = $derived(`${binding.control.id}-file-feedback`);
  const button = $derived({
    id: `${binding.control.id}-input`,
    type: 'button' as const,
    disabled: !editor.canAdd,
    autofocus: binding.initialFocus,
    'aria-label': binding.control.required
      ? `${editor.pickerName}, ${message('control.required')}`
      : editor.pickerName,
    'aria-describedby': fileDescriptionIds(
      binding,
      compact,
      authoredDescription(),
      editor.currentFileValidationError ? feedbackId : undefined,
    ),
    title: editor.pickerLabel,
    'data-invalid': !!binding.control.errors || undefined,
  });
  return {
    editor,
    get nativeInput() {
      return {
        id: `${binding.control.id}-file-input`,
        type: 'file',
        accept: editor.accept,
        multiple: editor.multiple,
        disabled: !editor.canAdd,
        required: binding.control.required,
        onchange: (event: Event) => editor.selectFiles(event),
        oncancel: editor.abort,
      };
    },
    get feedback() {
      const message = editor.currentFileValidationError;
      return message ? { id: feedbackId, message, severity: editor.feedbackSeverity } : undefined;
    },
    get feedbackId() {
      return feedbackId;
    },
    get button() {
      return button;
    },
  };
}

export function useNativeFilePicker(
  props: ControlProps,
  binding: FileBinding & Parameters<typeof useFilePickerField>[1],
  clearValue: unknown,
  compact: boolean,
  authoredDescription: () => unknown,
) {
  const editor = useFileControl(props, binding, clearValue);
  const field = useFilePickerField(editor, binding, compact, authoredDescription);
  return { editor, field };
}
