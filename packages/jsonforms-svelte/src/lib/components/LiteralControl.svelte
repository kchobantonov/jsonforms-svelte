<script lang="ts">
  import { scopeDataSegments, resolveScopeSchema } from '../schemaScope';
  import { getContext, setContext, untrack } from 'svelte';
  import {
    isControl,
    composePaths,
    Resolve,
    UPDATE_DATA,
    getI18nKeyPrefix,
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
  import {
    useDispatch,
    useJsonForms,
    withReactiveProps,
    withReactivePropsFrom,
  } from '../jsonFormsCompositions.svelte';
  import { JsonFormsContextSymbol, DispatchContextSymbol } from '../types';
  import { literalPropertySchema } from '../literalPropertySchema';
  import { mixedValueAt } from '../mixedLiteral';
  import { ruleValidationElement, ruleValidationState } from '../ruleValidation';
  import { OwnedErrorsContextSymbol, type OwnedErrorStore } from '../ownedErrors';
  import DispatchRenderer, { type DispatchRendererProps } from './DispatchRenderer.svelte';

  const props: DispatchRendererProps = $props();
  // During a renderer transition, outgoing descendants may observe new props
  // before Svelte destroys them. Keep a valid control scope until teardown.
  const initialControl = untrack(() => cloneDeep(props.uischema as ControlElement));
  const control = $derived(isControl(props.uischema) ? { ...props.uischema } : initialControl);
  const parent = useJsonForms();
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
      uischema: ruleValidationElement(mappingUi),
    }),
  );
  const segments = $derived(scopeDataSegments(control.scope));
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
  const schema = $derived(literalPropertySchema(mapped.schema, parent.core!.schema));
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
          const local = cloneDeep(mixedValueAt(current, segments));
          const next = action.updater(Resolve.data(local, action.path));
          const changed =
            action.path === ''
              ? next
              : next === undefined
                ? unsetDataAt(local, action.path)
                : setDataAt(local, action.path, next, schema);
          return replaceMember(current, segments, changed);
        },
        action.context,
      ),
    );
  }
  setContext(DispatchContextSymbol, intercept);
  const owners = getContext<OwnedErrorStore | undefined>(OwnedErrorsContextSymbol);
  if (owners) {
    setContext(
      OwnedErrorsContextSymbol,
      new Proxy(owners, {
        get(target, key) {
          if (key === 'createOwner')
            return () => {
              const owner = target.createOwner();
              const location = (path: string) => pointer + path;
              return {
                ...owner,
                begin: (path: string, pending?: boolean) => owner.begin(location(path), pending),
                relocate: (path: string) => owner.relocate(location(path)),
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
  <DispatchRenderer
    {...props}
    {schema}
    {uischema}
    path=""
    required={mapped.required}
    enabled={mapped.enabled && !mapped.readonly}
  />
{/if}
