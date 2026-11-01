<script lang="ts">
  import { scopeDataSegments, resolveScopeSchema } from '../schemaScope';
  import {
    CollectionIdentityContextSymbol,
    type CollectionIdentityStore,
  } from '../collectionIdentity';
  import { getContext, setContext, untrack, onDestroy } from 'svelte';
  import {
    isControl,
    getAjv,
    composePaths,
    Resolve,
    UPDATE_DATA,
    getI18nKeyPrefix,
    createDefaultValue,
    createLabelDescriptionFrom,
    mapStateToControlProps,
    setDataAt,
    unsetDataAt,
    update,
    type CoreActions,
    type ControlElement,
    type JsonSchema,
  } from '@jsonforms/core';
  import cloneDeep from 'lodash/cloneDeep';
  import type { ErrorObject } from 'ajv';
  import type { Snippet } from 'svelte';
  import { LiteralLabelAccessorySymbol } from '../labelAccessory';
  import {
    useDispatch,
    useJsonForms,
    withReactiveProps,
    withReactivePropsFrom,
  } from '../jsonFormsCompositions.svelte';
  import { JsonFormsContextSymbol, DispatchContextSymbol } from '../types';
  import { literalPropertySchema } from '../literalPropertySchema';
  import { LiteralDataContextSymbol, type LiteralDataContext } from '../literalDataContext';
  import { resolveTemporalDataBounds } from '../temporalOptions';
  import { mixedValueAt } from '../mixedLiteral';
  import { ruleValidationElement, ruleValidationState } from '../ruleValidation';
  import { OwnedErrorsContextSymbol, type OwnedErrorStore } from '../ownedErrors';
  import DispatchRenderer, { type DispatchRendererProps } from './DispatchRenderer.svelte';
  import DispatchCell from './DispatchCell.svelte';

  // Stable identity permits explicit property renames to relocate existing owners.
  const props: DispatchRendererProps & {
    identity?: string;
    existingOnly?: boolean;
    preservePropertyOnClear?: boolean;
    labelAccessory?: Snippet;
    cellMode?: boolean;
  } = $props();
  // During a renderer transition, outgoing descendants may observe new props
  // before Svelte destroys them. Keep a valid control scope until teardown.
  const initialControl = untrack(() => cloneDeep(props.uischema as ControlElement));
  const control = $derived(isControl(props.uischema) ? { ...props.uischema } : initialControl);
  const parent = useJsonForms();
  const outerData = getContext<LiteralDataContext | undefined>(LiteralDataContextSymbol);
  const identities = getContext<CollectionIdentityStore | undefined>(
    CollectionIdentityContextSymbol,
  );
  const dispatch = useDispatch();
  const resolvedSchema = $derived(
    (resolveScopeSchema(props.schema, control.scope, parent.core!.schema) ?? {}) as JsonSchema,
  );
  const required = $derived.by(() => {
    const tokens = control.scope.split('/');
    const member = tokens.at(-1)?.replaceAll('~1', '/').replaceAll('~0', '~');
    const container = resolveScopeSchema(
      props.schema,
      tokens.slice(0, -2).join('/'),
      parent.core!.schema,
    );
    return typeof container === 'object' && !!container.required?.includes(member ?? '');
  });
  const mappingUi = $derived({
    ...control,
    scope: '#/properties/value',
    label: control.label ?? createLabelDescriptionFrom(control, resolvedSchema).text,
    i18n: getI18nKeyPrefix(
      resolvedSchema,
      control,
      composePaths(props.path, scopeDataSegments(control.scope).join('.')),
    ),
  });
  const mapped = $derived(
    mapStateToControlProps(ruleValidationState({ jsonforms: parent }), {
      ...props,
      schema: {
        type: 'object',
        properties: { value: resolvedSchema },
        ...(required ? { required: ['value'] } : {}),
      } as JsonSchema,
      uischema: ruleValidationElement(mappingUi, getAjv({ jsonforms: parent })),
    }),
  );
  setContext(LiteralLabelAccessorySymbol, () => ({
    label: mappingUi.label,
    snippet: props.labelAccessory,
  }));
  const segments = $derived(scopeDataSegments(control.scope));
  const documentData = () => (outerData ? outerData.rootData() : parent.core?.data);
  const documentSegments = () => [
    ...(outerData?.segments() ?? []),
    ...(props.path ? props.path.split('.') : []),
    ...segments,
  ];
  setContext<LiteralDataContext>(LiteralDataContextSymbol, {
    rootData: documentData,
    segments: documentSegments,
  });
  const parentValue = $derived(Resolve.data(parent.core?.data, props.path));
  const value = $derived(mixedValueAt(parentValue, segments));
  const pointer = $derived(
    '/' +
      [...(props.path ? props.path.split('.') : []), ...segments]
        .map((key) => key.replaceAll('~', '~0').replaceAll('/', '~1'))
        .join('/'),
  );
  // Like the React isolated-property editors, this context is rooted at the
  // selected value. No synthetic data member or second data context is exposed.
  // An isolated scalar has no parent data level for Ajv's relative $data
  // references. Materialize temporal bounds, including composed branches,
  // from the real document before compiling its local validator.
  const schema = $derived.by(() => {
    const source = mapped.schema as JsonSchema & Record<string, unknown>;
    const path = documentSegments();
    const local = resolveTemporalDataBounds(source, path, documentData());
    return literalPropertySchema(local as JsonSchema, parent.core!.schema);
  });
  const uischema: ControlElement = $derived({
    ...mappingUi,
    scope: '#',
    rule: undefined,
  });
  function localErrors(errors: ErrorObject[] = []): ErrorObject[] {
    return errors.flatMap((error) => {
      if (error.instancePath === pointer || error.instancePath.startsWith(pointer + '/')) {
        return [{ ...error, instancePath: error.instancePath.slice(pointer.length) }];
      }
      const missing = error.params.missingProperty;
      if (
        (error.keyword === 'required' || error.keyword === 'dependencies') &&
        typeof missing === 'string' &&
        error.instancePath + '/' + missing.replaceAll('~', '~0').replaceAll('/', '~1') === pointer
      ) {
        return [{ ...error, instancePath: '', params: { ...error.params, missingProperty: '' } }];
      }
      return [];
    });
  }
  const validator = $derived(
    parent.core?.validationMode === 'NoValidation' ? undefined : parent.core?.ajv?.compile(schema),
  );
  const core = withReactivePropsFrom(() => parent.core!, {
    get data() {
      return value;
    },
    get schema() {
      return schema;
    },
    get validator() {
      return validator;
    },
    get uischema() {
      return uischema;
    },
    get errors() {
      return localErrors(parent.core?.errors);
    },
    get additionalErrors() {
      return localErrors(parent.core?.additionalErrors);
    },
  });
  setContext(
    JsonFormsContextSymbol,
    withReactiveProps(parent, {
      get core() {
        return core;
      },
    }),
  );

  function replaceMember(source: unknown, keys: string[], next: unknown): unknown {
    if (!keys.length) return next;
    const [key, ...rest] = keys;
    const record = source && typeof source === 'object' ? source : {};
    const copy = Array.isArray(record) ? [...record] : { ...record };
    const child = Object.hasOwn(record, key) ? (record as Record<string, unknown>)[key] : undefined;
    if (!rest.length && next === undefined) delete (copy as Record<string, unknown>)[key];
    else
      Object.defineProperty(copy, key, {
        value: replaceMember(child, rest, next),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    return copy;
  }
  function intercept(action: CoreActions) {
    if (action.type !== UPDATE_DATA) {
      dispatch(action);
      return;
    }
    if (!mapped.enabled || mapped.readonly) return;
    dispatch(
      update(
        props.path,
        (current) => {
          if (
            props.existingOnly &&
            segments.some((key, index) => {
              const container = mixedValueAt(current, segments.slice(0, index));
              return (
                container === null ||
                typeof container !== 'object' ||
                !Object.hasOwn(container, key)
              );
            })
          )
            return current;
          const local = cloneDeep(mixedValueAt(current, segments));
          const updated = action.updater(Resolve.data(local, action.path));
          const next =
            props.preservePropertyOnClear && action.path === '' && updated === undefined
              ? createDefaultValue(resolvedSchema, parent.core!.schema)
              : updated;
          const changed =
            action.path === ''
              ? next
              : next === undefined
                ? unsetDataAt(local, action.path)
                : setDataAt(local, action.path, next, schema);
          // Preserve local array command/descendant evidence before projecting
          // the value back into a literal parent member.
          identities?.update(value, changed, action);
          return replaceMember(current, segments, changed);
        },
        action.context,
      ),
    );
  }
  setContext(DispatchContextSymbol, intercept);
  const owners = getContext<OwnedErrorStore | undefined>(OwnedErrorsContextSymbol);
  if (owners) {
    // Owner registration is imperative; only identity/path changes trigger relocation.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const scopedOwners = new Map<
      ReturnType<OwnedErrorStore['createOwner']>,
      { relativePath: string }
    >();
    let previousIdentity = untrack(() => props.identity);
    $effect(() => {
      const identity = props.identity;
      const base = pointer;
      untrack(() => {
        for (const [owner, state] of scopedOwners) {
          if (identity !== undefined && identity === previousIdentity)
            owner.relocate(base + state.relativePath);
          else if (identity !== previousIdentity) owner.clear();
        }
        previousIdentity = identity;
      });
    });
    onDestroy(() => {
      for (const owner of scopedOwners.keys()) owner.dispose();
      scopedOwners.clear();
    });
    setContext(
      OwnedErrorsContextSymbol,
      new Proxy(owners, {
        get(target, key) {
          if (key === 'createOwner')
            return () => {
              const owner = target.createOwner();
              const state = { relativePath: '' };
              scopedOwners.set(owner, state);
              const location = (path: string) => pointer + path;
              return {
                ...owner,
                dispose: () => {
                  scopedOwners.delete(owner);
                  owner.dispose();
                },
                begin: (path: string, pending?: boolean) => {
                  state.relativePath = path;
                  return owner.begin(location(path), pending);
                },
                relocate: (path: string) => {
                  state.relativePath = path;
                  owner.relocate(location(path));
                },
              };
            };
          const member = Reflect.get(target, key, target);
          return typeof member === 'function' ? member.bind(target) : member;
        },
      }),
    );
  }
</script>

{#if mapped.visible}
  {#if props.cellMode}
    <DispatchCell
      {...props}
      {schema}
      {uischema}
      path=""
      required={mapped.required}
      enabled={mapped.enabled && !mapped.readonly}
    />
  {:else}
    <DispatchRenderer
      {...props}
      {schema}
      {uischema}
      path=""
      required={mapped.required}
      enabled={mapped.enabled && !mapped.readonly}
    />
  {/if}
{/if}
