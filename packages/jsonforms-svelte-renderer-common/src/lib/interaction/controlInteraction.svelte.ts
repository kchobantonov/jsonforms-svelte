import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import {
  getTranslator,
  getErrorTranslator,
  isDescriptionHidden,
  type ControlElement,
  type JsonSchema,
  type DispatchPropsOfControl,
} from '@jsonforms/core';
import debounce from 'lodash/debounce';
import { onDestroy } from 'svelte';
import { dataPathSegments } from '../core/dataPath';
import { scopeDataSegments } from '../core/schemaScope';
import { filterErrorsBeforeTouch } from '../validation/preTouchErrors';
import { registerDetailDialogChange } from './detailDialog.svelte';
import { useInitialFocusRequest } from './initialFocusDiagnostic.svelte';

interface InteractiveControl {
  schema: JsonSchema;
  uischema: ControlElement;
  data?: unknown;
  path: string;
  pathSegments?: readonly string[];
  enabled: boolean;
  visible: boolean;
  readonly?: boolean;
  description: string;
  errors: string;
}

export function useControlInteraction<V>(
  input: { control: InteractiveControl } & Partial<DispatchPropsOfControl>,
  appliedOptions: { value: Record<string, unknown> },
  adaptValue: (value: V) => unknown,
  debounceWait?: number,
  focusable?: () => boolean,
) {
  let touched = $state(false);

  const handleChange = input.handleChange;
  let scheduledData: unknown;
  let scheduledSchema: JsonSchema | undefined;
  let scheduledPath: string | undefined;
  const canCommit = () => {
    const { enabled, readonly, visible, path, schema, data } = input.control;
    return (
      enabled &&
      !readonly &&
      visible &&
      scheduledPath === path &&
      scheduledSchema === schema &&
      Object.is(scheduledData, data)
    );
  };
  const commit: DispatchPropsOfControl['handleChange'] = (path, value) => {
    if (canCommit()) handleChange?.(path, value);
  };
  const changeEmitter = handleChange
    ? typeof debounceWait === 'number'
      ? debounce(commit, debounceWait)
      : commit
    : undefined;

  const pendingChange = changeEmitter as { flush?: () => unknown; cancel?: () => void } | undefined;
  if (pendingChange) registerDetailDialogChange(pendingChange);
  // A removed control must not write its old value into a replacement root.
  onDestroy(() => pendingChange?.cancel?.());
  $effect(() => {
    // Revoking permission or replacing the target invalidates a queued edit,
    // even if permission is restored before the debounce timer fires.
    if (!canCommit()) pendingChange?.cancel?.();
  });

  const onChange = (value: V) => {
    if (input.control.readonly || !input.control.enabled || !input.control.visible) return;
    if (changeEmitter) {
      scheduledData = input.control.data;
      scheduledSchema = input.control.schema;
      scheduledPath = input.control.path;
      changeEmitter(scheduledPath, adaptValue(value));
    }
  };

  // `focus` is a mount request, not a reactive command on later option changes.
  const initialFocus = appliedOptions.value.focus === true;
  useInitialFocusRequest(
    () => initialFocus && input.control.visible && input.control.enabled && (focusable?.() ?? true),
    () => input.control.path,
  );
  let isFocused = $state(false);

  const handleFocus = () => {
    isFocused = true;
  };

  const handleBlur = () => {
    // Commit before tab navigation can unmount the editor and its form host.
    pendingChange?.flush?.();
    touched = true;
    isFocused = false;
  };

  const jsonforms = useJsonForms();
  const filteredErrors = $derived(
    filterErrorsBeforeTouch({
      touched,
      errors: input.control.errors,
      options: appliedOptions.value,
      core: jsonforms.core,
      path: input.control.path,
      pathSegments: input.control.pathSegments
        ? [...input.control.pathSegments, ...scopeDataSegments(input.control.uischema.scope)]
        : dataPathSegments(input.control.path),
      schema: input.control.schema,
      uischema: input.control.uischema,
      translate: getTranslator()({ jsonforms }),
      translateError: getErrorTranslator()({ jsonforms }),
    }),
  );

  const persistentHint = (): boolean => {
    return !isDescriptionHidden(
      input.control.visible,
      input.control.description,
      isFocused,
      !!appliedOptions.value.showUnfocusedDescription,
    );
  };

  return {
    onChange,
    handleBlur,
    handleFocus,
    focusEvents(trigger: { onfocus?: unknown; onblur?: unknown } = {}) {
      return {
        onfocus(event: FocusEvent) {
          if (typeof trigger.onfocus === 'function') trigger.onfocus(event);
          handleFocus();
        },
        onblur(event: FocusEvent) {
          if (typeof trigger.onblur === 'function') trigger.onblur(event);
          handleBlur();
        },
      };
    },
    persistentHint,
    initialFocus,
    get touched() {
      return touched;
    },
    get isFocused() {
      return isFocused;
    },
    get errors() {
      return filteredErrors;
    },
  };
}
