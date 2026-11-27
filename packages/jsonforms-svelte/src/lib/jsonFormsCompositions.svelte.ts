import {
  createId,
  defaultMapStateToEnumCellProps,
  getErrorAt,
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
  mapDispatchToMultiEnumProps,
  type Categorization,
  type ControlElement,
  type CoreActions,
  type Dispatch,
  type JsonFormsCellRendererRegistryEntry,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsState,
  type JsonFormsSubStates,
  type JsonSchema,
  type LabelElement,
  type Layout,
  type OwnPropsOfControl,
  type OwnPropsOfMasterListItem,
  type Scopable,
  type StatePropsOfJsonFormsRenderer,
  type Translator,
  type UISchemaElement,
} from '@jsonforms/core';
import { getContext } from 'svelte';
import { DispatchContextSymbol, JsonFormsContextSymbol } from './types';

export interface RendererProps<U = UISchemaElement> {
  schema: JsonSchema;
  uischema: U;
  path: string;
  enabled?: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  config?: Record<string, unknown>;
}

export interface ControlProps extends RendererProps {
  uischema: ControlElement;
}

export interface LayoutProps extends RendererProps {
  uischema: Layout;
}

export type Required<T> = T extends object ? { [P in keyof T]-?: NonNullable<T[P]> } : T;

const defineReactiveSourceProps = <T extends object, K extends keyof T = never>(
  target: object,
  getSource: () => T,
  remove?: readonly K[],
) => {
  const removedKeys = remove ? new Set<PropertyKey>(remove as readonly PropertyKey[]) : undefined;
  const source = getSource();

  for (const key of Reflect.ownKeys(source) as (keyof T)[]) {
    if (removedKeys?.has(key as PropertyKey)) {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(source, key);

    Object.defineProperty(target, key, {
      enumerable: descriptor?.enumerable ?? true,
      configurable: true,
      get() {
        return getSource()[key];
      },
    });
  }
};

export type ScopedControlProps = { schema: JsonSchema; uischema: UISchemaElement & Scopable };
export type ControlStateMapper<P, R> = (state: JsonFormsState, props: P) => R;
export type ControlDispatchMapper<D> = (dispatch: Dispatch<CoreActions>) => D;

export type ControlMappingArgs<P extends ScopedControlProps, R> = [
  props: P,
  stateMap: ControlStateMapper<P, R>,
];
export type DispatchedControlMappingArgs<P extends ScopedControlProps, R, D> = [
  ...ControlMappingArgs<P, R>,
  dispatchMap: ControlDispatchMapper<D>,
];
export type MappedControl<P, R> = { control: Required<P & R> };

/**
 * Core hook for creating control bindings in Svelte.
 * Returns a derived state that combines props with mapped state.
 */
export function defineControlBinding(
  implementation: <R extends object, D extends object, P extends ScopedControlProps>(
    props: P,
    stateMap: ControlStateMapper<P, R>,
    dispatchMap: ControlDispatchMapper<D> | undefined,
    jsonforms: JsonFormsSubStates,
    dispatch: Dispatch<CoreActions>,
  ) => { control: object },
) {
  function bind<R extends object, P extends ScopedControlProps>(
    ...args: ControlMappingArgs<P, R>
  ): MappedControl<P, R>;
  // Retain the three-argument generic signature used by the renderer-common bindings.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- The dispatch generic retains its public position for state-only bindings.
  function bind<R extends object, _D extends object, P extends ScopedControlProps>(
    ...args: ControlMappingArgs<P, R>
  ): MappedControl<P, R>;
  function bind<R extends object, D extends object, P extends ScopedControlProps>(
    ...args: DispatchedControlMappingArgs<P, R, D>
  ): MappedControl<P, R> & D;
  function bind<R extends object, D extends object, P extends ScopedControlProps>(
    props: P,
    stateMap: ControlStateMapper<P, R>,
    dispatchMap?: ControlDispatchMapper<D>,
  ) {
    return implementation(props, stateMap, dispatchMap, useJsonForms(), useDispatch());
  }
  return bind;
}

export const useControl = defineControlBinding(
  (props, stateMap, dispatchMap, jsonforms, dispatch) => {
    let id = $state<string | undefined>(undefined);

    $effect(() => {
      const scope = isControl(props.uischema) && props.uischema.scope;
      if (!scope) {
        id = undefined;
        return;
      }
      const controlId = createId(scope);
      id = controlId;
      return () => removeId(controlId);
    });

    const mappedState = $derived(stateMap({ jsonforms: jsonforms }, props));
    const control = withReactiveProps(
      props,
      withReactivePropsFrom(() => mappedState, {
        get id() {
          return id;
        },
      }),
    );

    const result = {
      get control() {
        return control;
      },
    };

    const dispatchMethods = dispatchMap?.(dispatch);

    return withReactiveProps(result, dispatchMethods);
  },
);

export function useOverrideControl<
  T extends { control: object },
  O extends object,
  K extends keyof T['control'] = never,
>(
  input: T,
  overrides: O,
  remove?: readonly K[],
): Omit<T, 'control'> & { control: Omit<T['control'], K | keyof O> & O } {
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
}

/** Bind the standard JSON Forms projections to the active control implementation. */
export function createMappedBindings<
  C extends ControlProps,
  L extends LayoutProps,
  LabelProps extends RendererProps<LabelElement>,
>(bind: typeof useControl) {
  return {
    /**
     * Provides bindings for 'Control' elements which can provide a 'detail',
     * for example array and object renderers.
     */
    useJsonFormsControlWithDetail(props: C) {
      return bind(props, mapStateToControlWithDetailProps, mapDispatchToControlProps);
    },
    /**
     * Provides bindings for 'Control' elements which resolve to manually constructed
     * 'oneOf' enums. These are used to enhance enums with label support.
     */
    useJsonFormsOneOfEnumControl(props: C) {
      return bind(props, mapStateToOneOfEnumControlProps, mapDispatchToControlProps);
    },
    /**
     * Provides bindings for 'Control' elements which resolve to 'allOf' schema elements.
     */
    useJsonFormsAllOfControl(props: C) {
      return bind(props, mapStateToAllOfProps, mapDispatchToControlProps);
    },
    /**
     * Provides bindings for 'Control' elements which resolve to 'anyOf' schema elements.
     */
    useJsonFormsAnyOfControl(props: C) {
      return bind(props, mapStateToAnyOfProps, mapDispatchToControlProps);
    },
    /**
     * Provides bindings for 'Control' elements which resolve to 'oneOf' schema elements.
     */
    useJsonFormsOneOfControl(props: C) {
      return bind(props, mapStateToOneOfProps, mapDispatchToControlProps);
    },
    /**
     * Provides bindings for 'Layout' elements, e.g. VerticalLayout, HorizontalLayout, Group.
     */
    useJsonFormsLayout(props: L) {
      const result = bind(props, mapStateToLayoutProps);

      return withNamedControl(result, 'layout');
    },
    /**
     * Provides bindings for list elements of a master-list-detail control setup.
     */
    useJsonFormsMasterListItem(props: OwnPropsOfMasterListItem) {
      const result = bind<
        Omit<OwnPropsOfMasterListItem, 'handleSelect' | 'removeItem'>,
        OwnPropsOfMasterListItem
      >(props, mapStateToMasterListItemProps);

      return withNamedControl(result, 'item');
    },
    /**
     * Provides bindings for 'Label' elements.
     */
    useJsonFormsLabel(props: LabelProps) {
      const result = bind(props, mapStateToLabelProps);

      return withNamedControl(result, 'label');
    },
    /**
     * Provides bindings for cell elements. Cells are meant to show simple inputs,
     * for example without error validation, within a larger structure like tables.
     */
    useJsonFormsCell(props: C) {
      const result = bind(props, mapStateToCellProps, mapDispatchToControlProps);

      return withNamedControl(result, 'cell');
    },
    /**
     * Provides bindings for enum cell elements.
     */
    useJsonFormsEnumCell(props: C) {
      const result = bind(props, defaultMapStateToEnumCellProps, mapDispatchToControlProps);

      return withNamedControl(result, 'cell');
    },
    /**
     * Provides bindings for 'oneOf' enum cell elements.
     */
    useJsonFormsOneOfEnumCell(props: C) {
      const result = bind(props, mapStateToOneOfEnumCellProps, mapDispatchToControlProps);

      return withNamedControl(result, 'cell');
    },
    /**
     * Provides bindings for a cell dispatcher.
     */
    useJsonFormsDispatchCell(props: C) {
      const result = bind(props, mapStateToDispatchCellProps, mapDispatchToControlProps);

      return withNamedControl(result, 'cell');
    },
  };
}

const bindings = createMappedBindings<ControlProps, LayoutProps, RendererProps<LabelElement>>(
  useControl,
);

/**
 * Provides bindings for 'Control' elements which can provide a 'detail',
 * for example array and object renderers.
 */
export const useJsonFormsControlWithDetail = bindings.useJsonFormsControlWithDetail;

/**
 * Provides bindings for 'Control' elements which resolve to manually constructed
 * 'oneOf' enums. These are used to enhance enums with label support.
 */
export const useJsonFormsOneOfEnumControl = bindings.useJsonFormsOneOfEnumControl;

/**
 * Provides bindings for 'Control' elements which resolve to 'allOf' schema elements.
 */
export const useJsonFormsAllOfControl = bindings.useJsonFormsAllOfControl;

/**
 * Provides bindings for 'Control' elements which resolve to 'anyOf' schema elements.
 */
export const useJsonFormsAnyOfControl = bindings.useJsonFormsAnyOfControl;

/**
 * Provides bindings for 'Control' elements which resolve to 'oneOf' schema elements.
 */
export const useJsonFormsOneOfControl = bindings.useJsonFormsOneOfControl;

/**
 * Provides bindings for 'Layout' elements, e.g. VerticalLayout, HorizontalLayout, Group.
 */
export const useJsonFormsLayout = bindings.useJsonFormsLayout;

/**
 * Provides bindings for list elements of a master-list-detail control setup.
 */
export const useJsonFormsMasterListItem = bindings.useJsonFormsMasterListItem;

/**
 * Provides bindings for 'Label' elements.
 */
export const useJsonFormsLabel = bindings.useJsonFormsLabel;

/**
 * Provides bindings for cell elements. Cells are meant to show simple inputs,
 * for example without error validation, within a larger structure like tables.
 */
export const useJsonFormsCell = bindings.useJsonFormsCell;

/**
 * Provides bindings for enum cell elements.
 */
export const useJsonFormsEnumCell = bindings.useJsonFormsEnumCell;

/**
 * Provides bindings for 'oneOf' enum cell elements.
 */
export const useJsonFormsOneOfEnumCell = bindings.useJsonFormsOneOfEnumCell;

/**
 * Provides bindings for a cell dispatcher.
 */
export const useJsonFormsDispatchCell = bindings.useJsonFormsDispatchCell;

/**
 * Provides generic bindings for 'Control' elements.
 * Should be used when no specialized bindings are appropriate.
 */
export const useJsonFormsControl = (props: ControlProps) => {
  return useControl(props, mapStateToControlProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'enum' schema elements.
 */
export const useJsonFormsEnumControl = (props: ControlProps) => {
  return useControl(props, mapStateToEnumControlProps, mapDispatchToControlProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'array' schema elements.
 */
export const useJsonFormsArrayControl = (props: ControlProps) => {
  return useControl(
    props,
    (state: JsonFormsState, ownProps: OwnPropsOfControl) => {
      const mapping = mapStateToArrayControlProps(state, ownProps);
      // also include not only child errors but also the control errors
      const controlErrors = getErrorAt(mapping.path, mapping.schema)(state);
      mapping.childErrors = [...controlErrors, ...(mapping.childErrors ?? [])];
      return mapping;
    },
    mapDispatchToArrayControlProps,
  );
};

/**
 * Provides bindings for 'Control' elements which resolve to multiple choice enums.
 */
export const useJsonFormsMultiEnumControl = (props: ControlProps) => {
  return useControl(props, mapStateToMultiEnumControlProps, mapDispatchToMultiEnumProps);
};

/**
 * Provides bindings for 'Control' elements which resolve to 'array' elements which
 * shall be rendered as a layout instead of a control.
 */
export const useJsonFormsArrayLayout = (props: ControlProps) => {
  const result = useControl(props, mapStateToArrayLayoutProps);

  return withNamedControl(result, 'layout');
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

  const renderer = $derived.by(() => {
    return {
      schema: rawProps.schema,
      uischema: rawProps.uischema,
      renderers: rawProps.renderers,
      rootSchema: rawProps.rootSchema,
      config: rawProps.config,
    };
  });
  const rendererProps = $derived.by(() => {
    return withReactiveProps(rawProps, undefined, ['rootSchema']);
  });

  return {
    get renderer() {
      return renderer;
    },
    get rendererProps() {
      return rendererProps;
    },
  };
};

/**
 * Provides bindings for 'Categorization' elements.
 */
export const useJsonFormsCategorization = (props: LayoutProps) => {
  const result = useJsonFormsLayout(props);

  const jsonforms = useJsonForms();
  const categories = $derived(
    (result.layout.uischema as Categorization).elements.map((category) => {
      const categoryProps = { ...props, uischema: category };
      return { ...categoryProps, ...mapStateToLayoutProps({ jsonforms }, categoryProps) };
    }),
  );

  return withReactiveProps(result, {
    get categories() {
      return categories;
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

/** Expose a control under its renderer-specific name while retaining live getters. */
export function withNamedControl<
  T extends { control: unknown },
  K extends 'layout' | 'item' | 'cell' | 'label',
>(source: T, name: K) {
  const alias = {
    get [name]() {
      return source.control;
    },
  } as { readonly [P in K]: T['control'] };
  return withReactiveProps(source, alias, ['control']);
}

export function withReactiveProps<T extends object, O extends object, K extends keyof T = never>(
  source: T,
  overrides?: O,
  remove?: readonly K[],
): Omit<T, K> & O {
  return withReactivePropsFrom(() => source, overrides, remove);
}

export function withReactivePropsFrom<
  T extends object,
  O extends object,
  K extends keyof T = never,
>(getSource: () => T, overrides?: O, remove?: readonly K[]): Omit<T, K> & O {
  const result = Object.create(Object.getPrototypeOf(getSource()));
  defineReactiveSourceProps(result, getSource, remove);

  // Define overrides (getters preserved)
  if (overrides) {
    Object.defineProperties(result, Object.getOwnPropertyDescriptors(overrides));
  }

  return result;
}
