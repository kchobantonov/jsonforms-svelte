<script lang="ts">
  import { Resolve } from '@jsonforms/core';
  import { setContext } from 'svelte';
  import {
    useJsonForms,
    withReactiveProps,
    withReactivePropsFrom,
  } from '../jsonFormsCompositions.svelte';
  import { JsonFormsContextSymbol } from '../types';
  import { branchValidator, mergeBranchErrors } from '../branchErrors';
  import DispatchRenderer, { type DispatchRendererProps } from './DispatchRenderer.svelte';

  const {
    active = true,
    validationOptions,
    ...props
  }: DispatchRendererProps & {
    active?: boolean;
    validationOptions?: { validateActiveBranch?: boolean };
  } = $props();
  const parent = useJsonForms();
  const enabled = $derived(
    active &&
      (validationOptions?.validateActiveBranch ?? parent.config?.validateActiveBranch ?? true) &&
      parent.core?.validationMode !== 'NoValidation' &&
      parent.core?.validationMode !== 'ValidateAndHide',
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
    validate(Resolve.data(parent.core?.data, props.path));
    const prefix = props.path
      ? '/' +
        props.path
          .split('.')
          .map((part) => part.replaceAll('~', '~0').replaceAll('/', '~1'))
          .join('/')
      : '';
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
