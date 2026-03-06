import { useJsonForms, withReactiveProps } from '@chobantonov/jsonforms-svelte';
import {
  Resolve,
  arrayDefaultTranslations,
  combinatorDefaultTranslations,
  composePaths,
  computeLabel,
  defaultJsonFormsI18nState,
  getArrayTranslations,
  getCombinatorTranslations,
  getCombinedErrorMessage,
  getControlPath,
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
import type { ErrorObject } from 'ajv';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import { getContext, setContext } from 'svelte';
import { useStyles } from '../styles';
import { getIsDynamicProperty, NestedInfoContextSymbol } from './inject';

export function useControlAppliedOptions<
  T extends { config: any; uischema: UISchemaElement },
  I extends { control: T },
>(input: I) {
  const options = $derived<Record<string, any>>(
    merge({}, cloneDeep(input.control.config), cloneDeep(input.control.uischema.options)),
  );

  return {
    get value() {
      return options;
    },
  };
}

const useLayoutAppliedOptions = <
  T extends { config: any; uischema: UISchemaElement },
  I extends {
    layout: T;
  },
>(
  input: I,
) => {
  const options = $derived<Record<string, any>>(
    merge({}, cloneDeep(input.layout.config), cloneDeep(input.layout.uischema.options)),
  );

  return {
    get value() {
      return options;
    },
  };
};

const useComputedLabel = <
  T extends { label: string; required: boolean },
  I extends { control: T },
>(
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

const overrideControl = <
  T extends { control: object },
  O extends object,
  K extends keyof T['control'] = never,
>(
  input: T,
  overrides: O,
  remove?: readonly K[],
): Omit<T, 'control'> & { control: Omit<T['control'], K | keyof O> & O } => {
  const control = withReactiveProps<T['control'], O, K>(input.control, overrides, remove);

  return withReactiveProps(
    input,
    {
      get control() {
        return control as Omit<T['control'], K | keyof O> & O;
      },
    },
    ['control'],
  );
};

/**
 * Adds styles, appliedOptions and skeletonProps
 */
export const useSkeletonLabel = <
  T extends {
    uischema: UISchemaElement;
    config: any;
  },
  I extends {
    label: T;
  },
>(
  input: I,
) => {
  const styles = useStyles(input.label.uischema);
  const appliedOptions = $derived<Record<string, any>>(
    merge({}, cloneDeep(input.label.config), cloneDeep(input.label.uischema.options)),
  );
  const skeletonProps = (path: string): Record<string, any> => {
    const props = get(appliedOptions?.skeleton, path);

    return props && isPlainObject(props) ? props : {};
  };

  return withReactiveProps(input, {
    get appliedOptions() {
      return appliedOptions;
    },
    skeletonProps,
    get styles() {
      return styles.value;
    },
  });
};

/**
 * Adds styles, isFocused, appliedOptions and onChange
 */
export const useSkeletonControl = <
  T extends {
    schema: JsonSchema;
    uischema: ControlElement;
    path: string;
    config: any;
    label: string;
    description: string;
    required: boolean;
    errors: string;
    id: string;
    visible: boolean;
    enabled: boolean;
  },
  I extends {
    control: T;
  } & (DispatchPropsOfControl | DispatchPropsOfMultiEnumControl),
>(
  input: I,
  adaptValue: (target: any) => any = (v) => v,
  debounceWait?: number,
) => {
  let touched = $state(false);

  const changeEmitter =
    typeof debounceWait === 'number' && (input as DispatchPropsOfControl).handleChange
      ? debounce((input as DispatchPropsOfControl).handleChange, debounceWait)
      : (input as DispatchPropsOfControl).handleChange;

  const onChange = (value: any) => {
    if (changeEmitter) {
      changeEmitter(input.control.path, adaptValue(value));
    }
  };

  const appliedOptions = useControlAppliedOptions(input);
  let isFocused = $state(false);

  const handleFocus = () => {
    isFocused = true;
  };

  const handleBlur = () => {
    touched = true;
    isFocused = false;
  };

  const jsonforms = useJsonForms();
  const filteredErrors = $derived.by(() => {
    // Always show errors if touched, no errors exist, or filtering is not enabled
    if (touched || !input.control.errors || !appliedOptions.value.enableFilterErrorsBeforeTouch) {
      return input.control.errors;
    }

    const filterKeywords = appliedOptions.value.filterErrorKeywordsBeforeTouch;

    // Filtering is enabled - check if specific keywords are configured
    if (Array.isArray(filterKeywords) && filterKeywords.length > 0) {
      // Granular filtering: only hide specific error keywords
      const errorsAtControl =
        jsonforms.core?.errors?.filter((error) => input.control.path === getControlPath(error)) ??
        [];

      // Filter out errors that match the filterKeywords, keep the rest
      const errorsToShow = errorsAtControl.filter(
        (error) => !error.keyword || !filterKeywords.includes(error.keyword),
      );
      // If no errors were filtered out (all errors remain), return original errors string
      if (errorsToShow.length === errorsAtControl.length) {
        return input.control.errors;
      }

      const t = getTranslator()({ jsonforms });
      const te = getErrorTranslator()({ jsonforms });

      return getCombinedErrorMessage(
        errorsToShow,
        te,
        t,
        input.control.schema,
        input.control.uischema,
        input.control.path,
      );
    }

    // default, all errors are filtered
    return '';
  });

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

  const skeletonProps = (path: string): Record<string, any> => {
    const props = get(appliedOptions.value.skeleton, path);

    return props && isPlainObject(props) ? props : {};
  };

  const overriddenInput = overrideControl(input, {
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

  const clearable = $derived((appliedOptions.value.clearable ?? true) && input.control.enabled);

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
    skeletonProps,
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
  const translations = getCombinatorTranslations(
    jsonforms?.i18n?.translate ?? defaultJsonFormsI18nState.translate,
    combinatorDefaultTranslations,
    input.control.i18nKeyPrefix,
    input.control.label,
  );

  return overrideControl(input, {
    get translations() {
      return translations;
    },
  });
};

/**
 * Adds styles and appliedOptions
 */
export const useSkeletonLayout = <
  T extends { config: any; uischema: UISchemaElement },
  I extends { layout: T },
>(
  input: I,
) => {
  const appliedOptions = useLayoutAppliedOptions(input);

  const skeletonProps = (path: string): Record<string, any> => {
    const props = get(appliedOptions.value.skeleton, path);

    return props && isPlainObject(props) ? props : {};
  };

  return withReactiveProps(input, {
    get styles() {
      return useStyles(input.layout.uischema).value;
    },
    get appliedOptions() {
      return appliedOptions.value;
    },
    skeletonProps,
  });
};

/**
 * Adds styles, appliedOptions and childUiSchema
 */
export const useSkeletonArrayControl = <
  T extends {
    label: string;
    required: boolean;
    config: any;
    uischema: UISchemaElement;
    schema: JsonSchema;
    data: any;
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

  const skeletonProps = (path: string): Record<string, any> => {
    const props = get(appliedOptions.value.skeleton, path);

    return props && isPlainObject(props) ? props : {};
  };

  const childLabelForIndex = (index: number | null) => {
    if (index === null) {
      return '';
    }
    const childLabelProp =
      input.control.uischema.options?.childLabelProp ?? getFirstPrimitiveProp(input.control.schema);
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(input.control.data, composePaths(`${index}`, childLabelProp));
    if (labelValue === undefined || labelValue === null || Number.isNaN(labelValue)) {
      return '';
    }
    return `${labelValue}`;
  };
  const filteredChildErrors = $derived.by(() => {
    if (
      !input.control.childErrors ||
      input.control.childErrors.length === 0 ||
      !appliedOptions.value.enableFilterErrorsBeforeTouch
    ) {
      return input.control.childErrors;
    }

    // supress childErrors unless touch filtering is disabled
    // otherwise all child errors will show, irrespective of their control touch state

    const filterKeywords = appliedOptions.value.filterErrorKeywordsBeforeTouch;

    // Filtering is enabled - check if specific keywords are configured
    if (Array.isArray(filterKeywords) && filterKeywords.length > 0) {
      // Granular filtering: only hide specific error keywords
      const errorsToShow = input.control.childErrors.filter(
        (error) => !error.keyword || !filterKeywords.includes(error.keyword),
      );

      return errorsToShow;
    }

    // default, all child errors are filtered
    return [];
  });

  const jsonforms = useJsonForms();
  const translations = getArrayTranslations(
    jsonforms?.i18n?.translate ?? defaultJsonFormsI18nState.translate,
    arrayDefaultTranslations,
    input.control.i18nKeyPrefix,
    input.control.label,
  );

  const overriddenInput = overrideControl(input, {
    get childErrors() {
      return filteredChildErrors;
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
    skeletonProps,
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

export const determineClearValue = (defaultValue: any) => {
  const useDefaultValue = getIsDynamicProperty(false);

  // undefined will clear the property from the object
  return useDefaultValue ? defaultValue : undefined;
};
