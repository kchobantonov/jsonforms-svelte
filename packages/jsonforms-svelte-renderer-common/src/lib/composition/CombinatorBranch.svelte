<script lang="ts">
  import { dataPathSegments, dataAtSegments, dataPathToPointer } from '../core/dataPath.js';
  import {
    useJsonForms,
    withReactiveProps,
    withReactivePropsFrom,
    JsonFormsContextSymbol,
  } from '@chobantonov/jsonforms-svelte';
  import {
    default as DispatchRenderer,
    type DispatchRendererProps,
  } from '../core/DispatchRenderer.svelte';
  import { setContext } from 'svelte';
  import { branchValidator, mergeBranchErrors, shouldValidateActiveBranch } from './branchErrors';

  const {
    active = true,
    validationOptions,
    ...props
  }: DispatchRendererProps & {
    active?: boolean;
    validationOptions?: { validateActiveBranch?: boolean };
  } = $props();
  const parent = useJsonForms();
  const pathSegments = $derived(props.pathSegments ?? dataPathSegments(props.path));
  const enabled = $derived(
    shouldValidateActiveBranch(
      active,
      validationOptions?.validateActiveBranch,
      parent.config?.validateActiveBranch,
      parent.core?.validationMode,
    ),
  );
  const validate = $derived.by(() => {
    if (!enabled || !parent.core?.ajv || !parent.core.schema) return undefined;
    try {
      return branchValidator(parent.core.ajv, props.schema, parent.core.schema);
    } catch {
      return undefined;
    }
  });
  const localErrors = $derived.by(() => {
    if (!validate) return [];
    const value = dataAtSegments(parent.core?.data, pathSegments);
    validate(value);
    const prefix = dataPathToPointer(pathSegments);
    return (validate.errors ?? []).map((error) => ({
      ...error,
      instancePath: prefix + error.instancePath,
    }));
  });
  const errors = $derived(mergeBranchErrors(parent.core?.errors ?? [], localErrors));
  // Only errors depend on branch validation. Keep schema, data and registries
  // independent so recursive children do not traverse all ancestor validators.
  const core = withReactivePropsFrom(() => parent.core!, {
    get errors() {
      return errors;
    },
  });
  setContext(
    JsonFormsContextSymbol,
    withReactiveProps(parent, {
      get core() {
        return parent.core ? core : undefined;
      },
    }),
  );
</script>

<DispatchRenderer {...props} />
