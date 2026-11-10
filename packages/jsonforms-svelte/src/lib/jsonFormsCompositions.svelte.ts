import {
  errorTargetSegments,
  summaryErrorsAt,
  withoutContainsCandidateErrors,
} from './errorSummary';
import { dataPathSegments } from './dataPath';
import {
  DynamicUiContextSymbol,
  createDynamicUiResolver,
  type DynamicUiContext,
} from './dynamicUi';
import { scopeDataSegments } from './schemaScope';
import {
  createRuleReferenceReporter,
  ruleValidationElement,
  ruleValidationState,
} from './ruleValidation';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';
import { CollectionIdentityContextSymbol, CollectionIdentityStore } from './collectionIdentity';
import { addEnumValue, removeEnumValue, stringSuggestions } from './enumChoices';
import {
  createId,
  getAjv,
  getCombinedErrorMessage,
  getControlPath,
  getErrorTranslator,
  getTranslator,
  enumToEnumOptionMapper,
  getI18nKeyPrefix,
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
  type OwnPropsOfControl,
  type OwnPropsOfMasterListItem,
  type Scopable,
  type StatePropsOfJsonFormsRenderer,
  type Translator,
  type UISchemaElement,
} from '@jsonforms/core';
import { ScalarErrorsSymbol, scalarErrorMessage, type ScalarErrorsContext } from './scalarErrors';
import { getContext, onDestroy, onMount, untrack } from 'svelte';
import {
  AuthoredConfigContextSymbol,
  type AuthoredConfigContext,
  DispatchContextSymbol,
  JsonFormsContextSymbol,
} from './types';

export interface RendererProps<U = UISchemaElement> {
  schema: JsonSchema;
  uischema: U;
  path: string;
  /** Exact members for rule evaluation when a dispatch path contains literal dots. */
  pathSegments?: readonly string[];
  enabled?: boolean;
  /** Preserve required presentation when a property is dispatched as an isolated root. */
  required?: boolean;
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

const mapDispatchToSafeMultiEnumProps = (
  dispatch: Dispatch<CoreActions>,
): DispatchPropsOfMultiEnumControl => ({
  addItem: (path: string, value: unknown) => {
    dispatch(update(path, (data) => addEnumValue(data, value)));
  },
  removeItem: (path: string, value: unknown) => {
    dispatch(update(path, (data) => removeEnumValue(data, value)));
  },
});

/**
 * Core hook for creating control bindings in Svelte.
 * Returns a derived state that combines props with mapped state.
 */
export function useControl<
  R extends object,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Preserve public generic argument positions.
  D extends object,
  P extends { schema: JsonSchema; uischema: UISchemaElement & Scopable },
>(props: P, stateMap: (state: JsonFormsState, props: P) => R): { control: Required<P & R> };
export function useControl<
  R extends object,
  D extends object,
  P extends { schema: JsonSchema; uischema: UISchemaElement & Scopable },
>(
  props: P,
  stateMap: (state: JsonFormsState, props: P) => R,
  dispatchMap: (dispatch: Dispatch<CoreActions>) => D,
): { control: Required<P & R> } & D;
export function useControl<
  R extends object,
  D extends object,
  P extends { schema: JsonSchema; uischema: UISchemaElement & Scopable },
>(
  props: P,
  stateMap: (state: JsonFormsState, props: P) => R,
  dispatchMap?: (dispatch: Dispatch<CoreActions>) => D,
) {
  const jsonforms = useJsonForms();
  const dispatch = useDispatch();
  const reportRuleReference = createRuleReferenceReporter(
    useUIDiagnosticReporter(),
    () => (props as { path?: string }).path ?? '',
    () => props.uischema,
  );
  const rulePathSegments = () => {
    const own = props as { path?: string; pathSegments?: readonly string[] };
    return own.pathSegments ?? dataPathSegments(own.path ?? '');
  };

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

  const scalarErrors = getContext<ScalarErrorsContext | undefined>(ScalarErrorsSymbol);
  const mappedState = $derived.by(() => {
    const config = jsonforms.config as Record<string, unknown> | undefined;
    const canonicalConfig =
      config && Object.hasOwn(config, 'readOnly')
        ? Object.fromEntries(Object.entries(config).filter(([key]) => key !== 'readOnly'))
        : config;
    let state = {
      jsonforms: canonicalConfig === config ? jsonforms : { ...jsonforms, config: canonicalConfig },
    } as JsonFormsState;
    const options = (props.uischema as UISchemaElement & { options?: Record<string, unknown> })
      .options;
    const canonicalElement =
      options && Object.hasOwn(options, 'readOnly')
        ? {
            ...props.uischema,
            options: Object.fromEntries(
              Object.entries(options).filter(([key]) => key !== 'readOnly'),
            ),
          }
        : props.uischema;
    const mappedProps = {
      ...props,
      uischema: ruleValidationElement(
        canonicalElement as P['uischema'],
        getAjv(state),
        rulePathSegments(),
        reportRuleReference,
      ),
    };
    let mapped = stateMap(ruleValidationState(state), mappedProps);
    let control = mapped as { path?: string; schema?: JsonSchema; errors?: string };
    // JSON Forms flattens both /a.b and /a/b to the data path "a.b". If an
    // error from the other path collides, remap with only pointer-owned errors.
    // Core still applies its validation-mode, pre-touch and translation policy.
    if (control.path && control.schema && 'errors' in mapped) {
      const segments =
        control.path === (props as { path?: string }).path
          ? rulePathSegments()
          : [...rulePathSegments(), ...scopeDataSegments(props.uischema.scope ?? '#')];
      const core = state.jsonforms.core;
      const candidates = [...(core?.errors ?? []), ...(core?.additionalErrors ?? [])].filter(
        (error) => getControlPath(error) === control.path,
      );
      const foreign = (error: (typeof candidates)[number]) => {
        const target = errorTargetSegments(error);
        return (
          getControlPath(error) === control.path &&
          (target.length !== segments.length || target.some((part, i) => part !== segments[i]))
        );
      };
      if (core && candidates.some(foreign)) {
        state = {
          jsonforms: {
            ...state.jsonforms,
            core: {
              ...core,
              errors: core.errors?.filter((error) => !foreign(error)),
              additionalErrors: core.additionalErrors?.filter((error) => !foreign(error)),
            },
          },
        };
        mapped = stateMap(ruleValidationState(state), mappedProps);
        control = mapped as typeof control;
      }
    }
    if ('required' in props && typeof props.required === 'boolean' && 'required' in mapped) {
      mapped.required = props.required;
    }
    if (
      control.path &&
      control.schema &&
      'errors' in mapped &&
      state.jsonforms.core?.validationMode !== 'NoValidation' &&
      state.jsonforms.core?.validationMode !== 'ValidateAndHide' &&
      state.jsonforms.core?.errors?.some((error) => error.keyword === 'contains')
    ) {
      const core = state.jsonforms.core;
      const schemaErrors = core?.errors ?? [];
      const visibleErrors = withoutContainsCandidateErrors(schemaErrors);
      if (
        visibleErrors.length !== schemaErrors.length &&
        schemaErrors.some((error) => getControlPath(error) === control.path)
      ) {
        const atPath = visibleErrors.filter((error) => getControlPath(error) === control.path);
        const hostErrors = (core?.additionalErrors ?? []).filter(
          (error) => getControlPath(error) === control.path,
        );
        return {
          ...mapped,
          errors: getCombinedErrorMessage(
            [...atPath, ...hostErrors],
            getErrorTranslator()(state),
            getTranslator()(state),
            control.schema,
            props.uischema,
            control.path,
          ),
        };
      }
    }
    if (
      ((scalarErrors && control.path === scalarErrors.path) ||
        (control.schema &&
          stringSuggestions(control.schema, state.jsonforms.core?.schema) !== undefined)) &&
      control.schema &&
      'errors' in mapped
    ) {
      return {
        ...mapped,
        errors: scalarErrorMessage(
          state,
          control.schema,
          props.uischema,
          control.path!,
          control.path === (props as { path?: string }).path
            ? rulePathSegments()
            : [...rulePathSegments(), ...scopeDataSegments(props.uischema.scope ?? '#')],
        ),
      };
    }
    return mapped;
  });
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
  // Read-only rules must also protect custom controls and array/enum dispatch actions.
  const guardedMethods =
    dispatchMethods &&
    (Object.fromEntries(
      Object.entries(dispatchMethods).map(([name, method]) => [
        name,
        typeof method !== 'function'
          ? method
          : (...args: unknown[]) => {
              if ((mappedState as { readonly?: boolean }).readonly) return () => {};
              const action = method(...args);
              return typeof action !== 'function'
                ? action
                : (...actionArgs: unknown[]) => {
                    if (!(mappedState as { readonly?: boolean }).readonly)
                      return action(...actionArgs);
                  };
            },
      ]),
    ) as typeof dispatchMethods);

  return withReactiveProps(result, guardedMethods);
}

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

/**
 * Provides generic bindings for 'Control' elements.
 * Should be used when no specialized bindings are appropriate.
 */
export const useJsonFormsControl = (props: ControlProps) => {
  return useControl(
    props,
    (state, ownProps) => {
      const mapping = mapStateToControlProps(state, ownProps);
      // Core resolves an empty schema at # as missing and substitutes the root.
      // An explicit unrestricted value must keep its own schema and type choices.
      if (
        ownProps.uischema.scope === '#' &&
        ownProps.schema &&
        Object.keys(ownProps.schema).length === 0
      ) {
        mapping.schema = ownProps.schema;
      }
      return mapping;
    },
    mapDispatchToControlProps,
  );
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
  return useControl(
    props,
    (state: JsonFormsState, ownProps: OwnPropsOfControl) => {
      const mapping = mapStateToEnumControlProps(state, ownProps);
      // JSON Forms 3.9 alpha uses a truthiness check for standalone const values.
      // Preserve null, false, zero and the empty string as real finite choices.
      if (
        !Array.isArray(mapping.options) &&
        Object.prototype.hasOwnProperty.call(mapping.schema, 'const')
      ) {
        mapping.options = [
          enumToEnumOptionMapper(
            mapping.schema.const,
            state.jsonforms.i18n?.translate,
            getI18nKeyPrefix(mapping.schema, mapping.uischema, mapping.path),
          ),
        ];
      }
      return mapping;
    },
    mapDispatchToControlProps,
  );
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
  const identities =
    getContext<CollectionIdentityStore | undefined>(CollectionIdentityContextSymbol) ??
    new CollectionIdentityStore();
  return useControl(
    props,
    (state: JsonFormsState, ownProps: OwnPropsOfControl) => {
      const mapping = mapStateToArrayControlProps(state, ownProps);
      // A root-type replacement can invalidate the item schema before Svelte
      // disposes old cell bindings. An absent items schema is unrestricted;
      // keep those final reactive reads safe without retaining stale data.
      mapping.schema ??= {};
      // Structured summaries include root-array descendants and preserve literal pointer members.
      mapping.childErrors = summaryErrorsAt(
        state.jsonforms.core,
        props.pathSegments
          ? [...props.pathSegments, ...scopeDataSegments(props.uischema.scope)]
          : dataPathSegments(mapping.path),
      );
      return { ...mapping, rowKeys: identities.keys(mapping.data) };
    },
    mapDispatchToArrayControlProps,
  );
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
/** Array-choice controls which update complete arrays, including positional token removal. */
export const useJsonFormsArrayChoicesControl = (props: ControlProps) =>
  useControl(props, mapStateToMultiEnumControlProps, mapDispatchToControlProps);

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
  const result = useControl(props, (state, ownProps) => {
    const mapping = mapStateToArrayLayoutProps(state, ownProps);
    // Missing items means unrestricted values, not the enclosing form schema.
    // Keep child dispatch from falling back to the root schema/UI schema.
    mapping.schema ??= {};
    return mapping;
  });

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

  // Keep forwarded properties independent. A single derived mapping joins every
  // ancestor property into every descendant dependency, which grows rapidly in
  // nested arrays and combinators (including native component teardown).
  const rawProps = {
    get schema() {
      return props.schema ?? jsonforms.core?.schema;
    },
    get rootSchema() {
      return jsonforms.core?.schema;
    },
    get uischema() {
      return props.uischema ?? jsonforms.core?.uischema;
    },
    get renderers() {
      return props.renderers ?? jsonforms.renderers;
    },
    get cells() {
      return props.cells ?? jsonforms.cells;
    },
    get path() {
      return props.path;
    },
    get enabled() {
      return props.enabled;
    },
    get config() {
      return jsonforms.config;
    },
    get required() {
      return props.required;
    },
  } as Required<StatePropsOfJsonFormsRenderer> & { required?: boolean };

  let renderer = $state.raw<{
    schema: Required<StatePropsOfJsonFormsRenderer>['schema'];
    uischema: Required<StatePropsOfJsonFormsRenderer>['uischema'];
    renderers: Required<StatePropsOfJsonFormsRenderer>['renderers'];
    rootSchema: Required<StatePropsOfJsonFormsRenderer>['rootSchema'];
    config: Required<StatePropsOfJsonFormsRenderer>['config'];
  }>(
    untrack(() => ({
      schema: rawProps.schema,
      uischema: rawProps.uischema,
      renderers: rawProps.renderers,
      rootSchema: rawProps.rootSchema,
      config: rawProps.config,
    })),
  );

  $effect(() => {
    const nextSchema = rawProps.schema;
    let nextUiSchema = rawProps.uischema;
    const nextRenderers = rawProps.renderers;
    const nextRootSchema = rawProps.rootSchema;
    const nextConfig = rawProps.config;
    const current = untrack(() => renderer);

    if (
      current.uischema !== nextUiSchema &&
      current.uischema &&
      nextUiSchema &&
      JSON.stringify(current.uischema) === JSON.stringify(nextUiSchema)
    ) {
      nextUiSchema = current.uischema;
    }

    if (
      current.schema !== nextSchema ||
      current.uischema !== nextUiSchema ||
      current.renderers !== nextRenderers ||
      current.rootSchema !== nextRootSchema ||
      current.config !== nextConfig
    ) {
      renderer = {
        schema: nextSchema,
        uischema: nextUiSchema,
        renderers: nextRenderers,
        rootSchema: nextRootSchema,
        config: nextConfig,
      };
    }
  });

  // A dispatch boundary holds an immutable prop snapshot. This also bounds
  // Svelte's teardown dependency walk across deeply nested native components.
  const nextRendererProps = $derived.by(() => {
    const { rootSchema: _rootSchema, ...forwarded } = rawProps;
    return forwarded;
  });
  let rendererProps = $state.raw(untrack(() => nextRendererProps));
  $effect(() => {
    const next = nextRendererProps;
    const current = untrack(() => rendererProps);
    if (
      Object.keys(next).some(
        (key) => next[key as keyof typeof next] !== current[key as keyof typeof current],
      )
    ) {
      rendererProps = next;
    }
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
  const reportRuleReference = createRuleReferenceReporter(
    useUIDiagnosticReporter(),
    () => props.path,
    () => result.layout.uischema,
  );

  const jsonforms = useJsonForms();
  const dynamicContext = getContext<DynamicUiContext | undefined>(DynamicUiContextSymbol);
  const categoryResolvers = new Map<number, ReturnType<typeof createDynamicUiResolver>>();
  const resolveCategory = (index: number) => {
    if (!categoryResolvers.has(index))
      categoryResolvers.set(index, createDynamicUiResolver(dynamicContext?.cache));
    return categoryResolvers.get(index)!;
  };
  const categories = $derived.by(() => {
    const authoredCategories = (result.layout.uischema as Categorization).elements;
    for (const index of categoryResolvers.keys())
      if (index >= authoredCategories.length) categoryResolvers.delete(index);
    return authoredCategories.map((category, index) => {
      const effective =
        dynamicContext?.value && Object.hasOwn(category, '$dynamic')
          ? resolveCategory(index)(category, {
              get data() {
                return jsonforms.core?.data;
              },
              path: props.path,
              get external() {
                return dynamicContext.value?.external;
              },
              get item() {
                return dynamicContext.item;
              },
              get errors() {
                return jsonforms.core?.errors;
              },
              trustedFunctions: dynamicContext.value.trustedFunctions,
              get config() {
                return jsonforms.config as Record<string, unknown> | undefined;
              },
              get locale() {
                return jsonforms.i18n?.locale;
              },
            }).element
          : category;
      return {
        ...props,
        ...mapStateToLayoutProps(ruleValidationState({ jsonforms }), {
          ...props,
          uischema: ruleValidationElement(
            effective,
            getAjv({ jsonforms }),
            props.pathSegments ?? dataPathSegments(props.path),
            reportRuleReference,
          ),
        }),
        uischema: effective,
      };
    });
  });

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

/** Read authored options separately from defaults inserted by core reducers. */
export function useAuthoredConfig(): AuthoredConfigContext {
  const authored = getContext<AuthoredConfigContext | undefined>(AuthoredConfigContextSymbol);
  if (authored) return authored;
  // Custom context providers supply their own config and own its defaults.
  const form = useJsonForms();
  return {
    get value() {
      return form.config as Record<string, unknown> | undefined;
    },
  };
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
