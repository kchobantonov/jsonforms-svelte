import {
  useJsonForms,
  filterErrorsBeforeTouch,
  useAuthoredConfig,
  resolveRestrict,
  useRendererMessages,
  useOverrideControl,
  withReactiveProps,
  registerDetailDialogChange,
} from '@chobantonov/jsonforms-svelte';
import {
  Resolve,
  arrayDefaultTranslations,
  combinatorDefaultTranslations,
  composePaths,
  computeLabel,
  defaultJsonFormsI18nState,
  getArrayTranslations,
  getCombinatorTranslations,
  getErrorTranslator,
  getFirstPrimitiveProp,
  getTranslator,
  isDescriptionHidden,
  type ControlElement,
  type DispatchPropsOfControl,
  type DispatchPropsOfMultiEnumControl,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import type Ajv from 'ajv';
import type { AppliedOptions, VendorProps } from './appliedOptions';
import type { ErrorObject } from 'ajv';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import { getContext, onDestroy, setContext } from 'svelte';
import { useStyles } from '../styles';
import { getIsDynamicProperty, NestedInfoContextSymbol } from './inject';

export function useControlAppliedOptions<
  T extends { config: unknown; uischema: UISchemaElement },
  I extends { control: T },
>(input: I) {
  const authored = useAuthoredConfig();
  const options = $derived<AppliedOptions>(
    merge({}, cloneDeep(input.control.config), cloneDeep(input.control.uischema.options), {
      restrict: resolveRestrict(input.control.uischema.options, authored.value),
    }),
  );

  return {
    get value() {
      return options;
    },
  };
}

const useLayoutAppliedOptions = <
  T extends { config: unknown; uischema: UISchemaElement },
  I extends {
    layout: T;
  },
>(
  input: I,
) => {
  const options = $derived<AppliedOptions>(
    merge({}, cloneDeep(input.layout.config), cloneDeep(input.layout.uischema.options)),
  );

  return {
    get value() {
      return options;
    },
  };
};

const useComputedLabel = <T extends { label: string; required: boolean }, I extends { control: T }>(
  input: I,
  appliedOptions: ReturnType<typeof useControlAppliedOptions>,
) => {
  const label = $derived(
    computeLabel(
      input.control.label,
      input.control.required,
      !!appliedOptions.value.hideRequiredAsterisk,
    ),
  );

  return {
    get value() {
      return label;
    },
  };
};

/**
 * Adds styles, appliedOptions and flowbiteProps
 */
export const useFlowbiteLabel = <
  T extends {
    uischema: UISchemaElement;
    config: unknown;
  },
  I extends {
    label: T;
  },
>(
  input: I,
) => {
  const styles = useStyles(input.label.uischema);
  const appliedOptions = $derived<AppliedOptions>(
    merge({}, cloneDeep(input.label.config), cloneDeep(input.label.uischema.options)),
  );
  const flowbiteProps = (path: string): VendorProps => {
    const props = get(appliedOptions?.flowbite, path);

    return props && isPlainObject(props) ? props : {};
  };

  return withReactiveProps(input, {
    get appliedOptions() {
      return appliedOptions;
    },
    flowbiteProps,
    get styles() {
      return styles.value;
    },
  });
};

/**
 * Adds styles, isFocused, appliedOptions and onChange
 */
export const useFlowbiteControl = <
  T extends {
    schema: JsonSchema;
    data?: unknown;
    uischema: ControlElement;
    path: string;
    config: unknown;
    label: string;
    description: string;
    required: boolean;
    errors: string;
    id: string;
    visible: boolean;
    enabled: boolean;
    readonly?: boolean;
  },
  I extends {
    control: T;
  } & (DispatchPropsOfControl | DispatchPropsOfMultiEnumControl),
  V = unknown,
>(
  input: I,
  adaptValue: (target: V) => unknown = (v) => v,
  debounceWait?: number,
) => {
  let touched = $state(false);

  const handleChange = (input as Partial<DispatchPropsOfControl>).handleChange;
  let scheduledData: unknown;
  let scheduledSchema: JsonSchema | undefined;
  let scheduledPath: string | undefined;
  const canCommit = () => {
    const { enabled, readonly, path, schema, data } = input.control;
    return (
      enabled &&
      !readonly &&
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
    if (input.control.readonly || !input.control.enabled) return;
    if (changeEmitter) {
      scheduledData = input.control.data;
      scheduledSchema = input.control.schema;
      scheduledPath = input.control.path;
      changeEmitter(scheduledPath, adaptValue(value));
    }
  };

  const appliedOptions = useControlAppliedOptions(input);
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

  const computedLabel = useComputedLabel(input, appliedOptions);

  const styles = useStyles(input.control.uischema);

  const flowbiteProps = (path: string): VendorProps => {
    const props = get(appliedOptions.value.flowbite, path);

    return {
      ...(props && isPlainObject(props) ? props : {}),
      ...(path === 'input' || path === 'textarea' ? { readonly: input.control.readonly } : {}),
    };
  };

  const overriddenInput = useOverrideControl(input, {
    get errors() {
      return filteredErrors;
    },
  });

  const controlWrapper = $derived({
    id: overriddenInput.control.id,
    description: overriddenInput.control.description,
    errors: overriddenInput.control.errors,
    label: overriddenInput.control.label,
    visible: overriddenInput.control.visible,
    required: overriddenInput.control.required,
    persistentHint: persistentHint(),
    isFocused: isFocused,
    get styles() {
      return styles.value;
    },
    get appliedOptions() {
      return appliedOptions.value;
    },
  });

  const clearable = $derived(
    (appliedOptions.value.clearable ?? true) && input.control.enabled && !input.control.readonly,
  );

  return withReactiveProps(overriddenInput, {
    get styles() {
      return styles.value;
    },
    get isFocused() {
      return isFocused;
    },
    get appliedOptions() {
      return appliedOptions.value;
    },
    get controlWrapper() {
      return controlWrapper;
    },
    onChange,
    flowbiteProps,
    persistentHint,
    get computedLabel() {
      return computedLabel.value;
    },
    get clearable() {
      return clearable;
    },
    get touched() {
      return touched;
    },
    handleBlur,
    handleFocus,
    get rawErrors() {
      return input.control.errors;
    },
  });
};

export const useCombinatorTranslations = <
  T extends {
    i18nKeyPrefix: string;
    label: string;
  },
  I extends {
    control: T;
  },
>(
  input: I,
) => {
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const translations = $derived(
    getCombinatorTranslations(
      jsonforms?.i18n?.translate ?? defaultJsonFormsI18nState.translate,
      combinatorDefaultTranslations.map((entry) => ({
        ...entry,
        default: () => message(`combinator.${entry.key}`),
      })),
      input.control.i18nKeyPrefix,
      input.control.label,
    ),
  );

  return useOverrideControl(input, {
    get translations() {
      return translations;
    },
  });
};

/**
 * Adds styles and appliedOptions
 */
export const useFlowbiteLayout = <
  T extends { config: unknown; uischema: UISchemaElement },
  I extends { layout: T },
>(
  input: I,
) => {
  const appliedOptions = useLayoutAppliedOptions(input);

  const flowbiteProps = (path: string): VendorProps => {
    const props = get(appliedOptions.value.flowbite, path);

    return props && isPlainObject(props) ? props : {};
  };

  return withReactiveProps(input, {
    get styles() {
      return useStyles(input.layout.uischema).value;
    },
    get appliedOptions() {
      return appliedOptions.value;
    },
    flowbiteProps,
  });
};

/**
 * Adds styles, appliedOptions and childUiSchema
 */
export const useFlowbiteArrayControl = <
  T extends {
    label: string;
    required: boolean;
    config: unknown;
    uischema: UISchemaElement;
    schema: JsonSchema;
    data: unknown;
    childErrors: ErrorObject[];
    i18nKeyPrefix: string;
  },
  I extends {
    control: T;
  },
>(
  input: I,
) => {
  const appliedOptions = useControlAppliedOptions(input);

  const computedLabel = useComputedLabel(input, appliedOptions);

  const flowbiteProps = (path: string): VendorProps => {
    const props = get(appliedOptions.value.flowbite, path);

    return props && isPlainObject(props) ? props : {};
  };

  const childLabelForIndex = (index: number | null) => {
    if (index === null) {
      return '';
    }
    const childLabelProp =
      input.control.uischema.options?.elementLabelProp ??
      input.control.uischema.options?.childLabelProp ??
      getFirstPrimitiveProp(input.control.schema);
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(input.control.data, composePaths(`${index}`, childLabelProp));
    if (labelValue === undefined || labelValue === null || Number.isNaN(labelValue)) {
      return '';
    }
    return `${labelValue}`;
  };
  // Summaries do not share child touch state yet. Preserve eligible errors instead of
  // suppressing matching keywords permanently after a child has been blurred.
  const jsonforms = useJsonForms();
  const arrayMessage = useRendererMessages();
  const translations = $derived(
    getArrayTranslations(
      jsonforms?.i18n?.translate ?? defaultJsonFormsI18nState.translate,
      arrayDefaultTranslations.map((entry) => ({
        ...entry,
        default: (label = '') => {
          const suffix =
            label && (entry.key === 'addTooltip' || entry.key === 'addAriaLabel')
              ? 'WithLabel'
              : '';
          return arrayMessage(`array.${entry.key}${suffix}`, { label });
        },
      })),
      input.control.i18nKeyPrefix,
      input.control.label,
    ),
  );

  const overriddenInput = useOverrideControl(input, {
    get childErrors() {
      return input.control.childErrors;
    },
    get translations() {
      return translations;
    },
  });

  const styles = useStyles(input.control.uischema);

  return withReactiveProps(overriddenInput, {
    get styles() {
      return styles.value;
    },
    get appliedOptions() {
      return appliedOptions.value;
    },
    childLabelForIndex,
    get computedLabel() {
      return computedLabel.value;
    },
    flowbiteProps,
    get rawChildErrors() {
      return input.control.childErrors;
    },
  });
};

/**
 * Extracts Ajv from JSON Forms
 */
export const useAjv = () => {
  const jsonforms = useJsonForms();

  // should always exist
  return jsonforms.core?.ajv as Ajv;
};

export interface NestedInfo {
  level: number;
  parentElement?: 'array' | 'object';
}

export const useNested = (element: false | 'array' | 'object'): NestedInfo => {
  const nestedInfo = getContext<NestedInfo>(NestedInfoContextSymbol) ?? {
    level: 0,
  };
  if (element) {
    setContext(NestedInfoContextSymbol, {
      level: nestedInfo.level + 1,
      parentElement: element,
    });
  }
  return nestedInfo;
};

export const determineClearValue = <T>(defaultValue: T) => {
  const useDefaultValue = getIsDynamicProperty(false);

  // undefined will clear the property from the object
  return useDefaultValue ? defaultValue : undefined;
};
