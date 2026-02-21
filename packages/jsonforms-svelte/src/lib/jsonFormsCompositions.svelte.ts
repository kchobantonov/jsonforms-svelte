import {
  createId,
  defaultMapStateToEnumCellProps,
  isControl,
  mapDispatchToArrayControlProps,
  mapDispatchToControlProps,
  mapStateToAllOfProps,
  mapStateToAnyOfProps,
  mapStateToArrayControlProps,
  mapStateToArrayLayoutProps,
  mapStateToCellProps,
  mapStateToControlProps,
  mapStateToControlWithDetailProps,
  mapStateToDispatchCellProps,
  mapStateToEnumControlProps,
  mapStateToJsonFormsRendererProps,
  mapStateToLabelProps,
  mapStateToLayoutProps,
  mapStateToMasterListItemProps,
  mapStateToMultiEnumControlProps,
  mapStateToOneOfEnumCellProps,
  mapStateToOneOfEnumControlProps,
  mapStateToOneOfProps,
  removeId,
  update,
  type Categorization,
  type ControlElement,
  type CoreActions,
  type Dispatch,
  type DispatchPropsOfMultiEnumControl,
  type JsonFormsCellRendererRegistryEntry,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsState,
  type JsonFormsSubStates,
  type JsonSchema,
  type LabelElement,
  type Layout,
  type OwnPropsOfMasterListItem,
  type Scopable,
  type StatePropsOfJsonFormsRenderer,
  type Translator,
  type UISchemaElement,
} from '@jsonforms/core';
import { getContext, onDestroy, onMount } from 'svelte';
import { DispatchContextSymbol, JsonFormsContextSymbol } from './types';

export interface RendererProps<U = UISchemaElement> {
  schema: JsonSchema;
  uischema: U;
  path: string;
  enabled?: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  config?: any;
}

export interface ControlProps extends RendererProps {
  uischema: ControlElement;
}

export interface LayoutProps extends RendererProps {
  uischema: Layout;
}

export type Required<T> = T extends object ? { [P in keyof T]-?: NonNullable<T[P]> } : T;

const mapDispatchToSafeMultiEnumProps = (
  dispatch: Dispatch<CoreActions>,
): DispatchPropsOfMultiEnumControl => ({
  addItem: (path: string, value: any) => {
    dispatch(
      update(path, (data) => {
        if (data === undefined || data === null) {
          return [value];
        }

        if (Array.isArray(data)) {
          data.push(value);
          return data;
        }
        return [data, value];
      }),
    );
  },
  removeItem: (path: string, toDelete: any) => {
    dispatch(
      update(path, (data) => {
        if (data === undefined || data === null) {
          return data;
        }

        if (Array.isArray(data)) {
          const indexInData = data.indexOf(toDelete);
          data.splice(indexInData, 1);
          return data;
        }

        return data === toDelete ? [] : [data];
      }),
    );
  },
});

/**
 * Core hook for creating control bindings in Svelte.
 * Returns a derived state that combines props with mapped state.
 */
export function useControl<
  R,
  D extends object,
  P extends { schema: JsonSchema; uischema: UISchemaElement & Scopable },
>(props: P, stateMap: (state: JsonFormsState, props: P) => R): { control: Required<P & R> };
export function useControl<
  R,
  D extends object,
  P extends { schema: JsonSchema; uischema: UISchemaElement & Scopable },
>(
  props: P,
  stateMap: (state: JsonFormsState, props: P) => R,
  dispatchMap: (dispatch: Dispatch<CoreActions>) => D,
): { control: Required<P & R> } & D;
export function useControl<
  R,
  D extends object,
  P extends { schema: JsonSchema; uischema: UISchemaElement & Scopable },
>(
  props: P,
  stateMap: (state: JsonFormsState, props: P) => R,
  dispatchMap?: (dispatch: Dispatch<CoreActions>) => D,
) {
  const jsonforms = useJsonForms();
  const dispatch = useDispatch();

  let id = $state<string | undefined>(undefined);

  // Initialize ID on mount if scope exists
  onMount(() => {
    if (props.uischema.scope) {
      id = createId(props.uischema.scope);
    }
  });

  // Watch for schema changes and update ID
  $effect(() => {
    const schema = props.schema;
    if (schema && isControl(props.uischema)) {
      if (id) {
        removeId(id);
      }
      if (props.uischema.scope) {
        id = createId(props.uischema.scope);
      }
    }
  });

  // Cleanup on destroy
  onDestroy(() => {
    if (id) {
      removeId(id);
      id = undefined;
    }
  });

  // Derived control state
  const control = $derived({
    ...props,
    ...stateMap({ jsonforms: jsonforms }, props),
    id: id,
  });

  const dispatchMethods = dispatchMap?.(dispatch);

  return withReactiveProps(
    {
      get control() {
        return control;
      },
    },
    dispatchMethods,
  );
}

/**
 * Provides generic bindings for 'Control' elements.
 * Should be used when no specialized bindings are appropriate.
 */
export const useJsonFormsControl = (props: ControlProps) => {
  return useControl(props, mapStateToControlProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which can provide a 'detail',
 * for example array and object renderers.
 */
export const useJsonFormsControlWithDetail = (props: ControlProps) => {
  return useControl(props, mapStateToControlWithDetailProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'enum' schema elements.
 */
export const useJsonFormsEnumControl = (props: ControlProps) => {
  return useControl(props, mapStateToEnumControlProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to manually constructed
 * 'oneOf' enums. These are used to enhance enums with label support.
 */
export const useJsonFormsOneOfEnumControl = (props: ControlProps) => {
  return useControl(props, mapStateToOneOfEnumControlProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'array' schema elements.
 */
export const useJsonFormsArrayControl = (props: ControlProps) => {
  return useControl(props, mapStateToArrayControlProps, mapDispatchToArrayControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'allOf' schema elements.
 */
export const useJsonFormsAllOfControl = (props: ControlProps) => {
  return useControl(props, mapStateToAllOfProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'anyOf' schema elements.
 */
export const useJsonFormsAnyOfControl = (props: ControlProps) => {
  return useControl(props, mapStateToAnyOfProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'oneOf' schema elements.
 */
export const useJsonFormsOneOfControl = (props: ControlProps) => {
  return useControl(props, mapStateToOneOfProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to multiple choice enums.
 */
export const useJsonFormsMultiEnumControl = (props: ControlProps) => {
  return useControl(props, mapStateToMultiEnumControlProps, mapDispatchToSafeMultiEnumProps);
};

/**
 * Provides bindings for 'Layout' elements, e.g. VerticalLayout, HorizontalLayout, Group.
 */
export const useJsonFormsLayout = (props: LayoutProps) => {
  const result = useControl(props, mapStateToLayoutProps);

  return withReactiveProps(
    result,
    {
      get layout() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides bindings for 'Control' elements which resolve to 'array' elements which
 * shall be rendered as a layout instead of a control.
 */
export const useJsonFormsArrayLayout = (props: ControlProps) => {
  const result = useControl(props, mapStateToArrayLayoutProps);

  return withReactiveProps(
    result,
    {
      get layout() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides bindings for list elements of a master-list-detail control setup.
 */
export const useJsonFormsMasterListItem = (props: OwnPropsOfMasterListItem) => {
  const result = useControl<
    Omit<OwnPropsOfMasterListItem, 'handleSelect' | 'removeItem'>,
    object,
    OwnPropsOfMasterListItem
  >(props, mapStateToMasterListItemProps);

  return withReactiveProps(
    result,
    {
      get item() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides specialized bindings which can be used for any renderer.
 * Useful for meta elements like dispatchers.
 */
export const useJsonFormsRenderer = (props: RendererProps) => {
  const jsonforms = useJsonForms();

  const rawProps = $derived(
    mapStateToJsonFormsRendererProps(
      { jsonforms: jsonforms },
      props,
    ) as Required<StatePropsOfJsonFormsRenderer>,
  );

  const rootSchema = $derived(rawProps.rootSchema);
  const renderer = $derived.by(() => {
    return withReactiveProps(rawProps, undefined, ['rootSchema']);
  });

  return {
    get renderer() {
      return renderer;
    },
    get rootSchema() {
      return rootSchema;
    },
  };
};

/**
 * Provides bindings for 'Label' elements.
 */
export const useJsonFormsLabel = (props: RendererProps<LabelElement>) => {
  const result = useControl(props, mapStateToLabelProps);

  return withReactiveProps(
    result,
    {
      get label() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides bindings for cell elements. Cells are meant to show simple inputs,
 * for example without error validation, within a larger structure like tables.
 */
export const useJsonFormsCell = (props: ControlProps) => {
  const result = useControl(props, mapStateToCellProps, mapDispatchToControlProps);

  return withReactiveProps(
    result,
    {
      get cell() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides bindings for enum cell elements.
 */
export const useJsonFormsEnumCell = (props: ControlProps) => {
  const result = useControl(props, defaultMapStateToEnumCellProps, mapDispatchToControlProps);

  return withReactiveProps(
    result,
    {
      get cell() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides bindings for 'oneOf' enum cell elements.
 */
export const useJsonFormsOneOfEnumCell = (props: ControlProps) => {
  const result = useControl(props, mapStateToOneOfEnumCellProps, mapDispatchToControlProps);

  return withReactiveProps(
    result,
    {
      get cell() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides bindings for a cell dispatcher.
 */
export const useJsonFormsDispatchCell = (props: ControlProps) => {
  const result = useControl(props, mapStateToDispatchCellProps, mapDispatchToControlProps);

  return withReactiveProps(
    result,
    {
      get cell() {
        return result.control;
      },
    },
    ['control'],
  );
};

/**
 * Provides bindings for 'Categorization' elements.
 */
export const useJsonFormsCategorization = (props: LayoutProps) => {
  const result = useJsonFormsLayout(props);

  const categories = (result.layout.uischema as Categorization).elements.map((category) => {
    const categoryProps = withReactiveProps(props, {
      get uischema() {
        return category;
      },
    });

    const categoryLayout = useJsonFormsLayout(categoryProps);
    return {
      get value() {
        return categoryLayout.layout;
      },
    };
  });

  return withReactiveProps(result, {
    get categories() {
      return categories.map((category) => category.value);
    },
  });
};

export function useJsonForms(): JsonFormsSubStates;
export function useJsonForms(optional: true): JsonFormsSubStates | undefined;
export function useJsonForms(optional?: true) {
  const jsonforms = getContext<JsonFormsSubStates>(JsonFormsContextSymbol);

  if (!jsonforms && !optional) {
    throw new Error("'jsonforms couldn't be injected. Are you within JSON Forms?");
  }

  return jsonforms;
}

export function useDispatch(): Dispatch<CoreActions>;
export function useDispatch(optional: true): Dispatch<CoreActions> | undefined;
export function useDispatch(optional?: true) {
  const dispatch = getContext<Dispatch<CoreActions>>(DispatchContextSymbol);

  if (!dispatch && !optional) {
    throw new Error("'dispatch couldn't be injected. Are you within JSON Forms?");
  }

  return dispatch;
}

export function useTranslator(): { value: Translator };
export function useTranslator(optional: true): { value: Translator | undefined };
export function useTranslator(optional?: true) {
  const jsonforms = optional ? useJsonForms(true) : useJsonForms();

  if (!optional && (!jsonforms?.i18n || !jsonforms.i18n.translate)) {
    throw new Error("'jsonforms i18n couldn't be injected. Are you within JSON Forms?");
  }

  const translator = $derived(jsonforms?.i18n ? jsonforms.i18n.translate : undefined);
  return {
    get value() {
      return translator;
    },
  };
}

export function withReactiveProps<T extends object, O extends object, K extends keyof T = never>(
  source: T,
  overrides?: O,
  remove?: readonly K[],
): Omit<T, K> & O {
  const result = Object.create(Object.getPrototypeOf(source));

  const descriptors = Object.getOwnPropertyDescriptors(source);

  // Remove specified fields
  if (remove) {
    for (const key of remove) {
      delete descriptors[key as string];
    }
  }

  // Define original reactive descriptors
  Object.defineProperties(result, descriptors);

  // Define overrides (getters preserved)
  if (overrides) {
    Object.defineProperties(result, Object.getOwnPropertyDescriptors(overrides));
  }

  return result;
}
