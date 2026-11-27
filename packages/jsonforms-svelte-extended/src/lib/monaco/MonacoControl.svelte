<script lang="ts">
  import type { Snippet, ComponentProps } from 'svelte';
  import MonacoEditor from './MonacoEditor.svelte';
  import { untrack } from 'svelte';
  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import {
    type ControlProps,
    type useJsonFormsControl,
    dataPathSegments,
    scopeDataSegments,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useMonacoDraft } from './monacoDraft.svelte';
  import {
    resolveMonacoLanguage,
    resolveMonacoOptions,
    resolveMonacoAppliedOptions,
    resolveMonacoDimension,
    isMixedCodeControl,
  } from './monaco';

  interface MonacoControlBinding {
    control: ReturnType<typeof useJsonFormsControl>['control'];
    controlWrapper: { errors?: string; persistentHint?: boolean };
    appliedOptions: Record<string, unknown>;
    isFocused: boolean;
    onChange(value: unknown): void;
    handleFocus(): void;
    handleBlur(): void;
  }
  const {
    props,
    binding,
    wrapper,
    ...appearance
  }: {
    props: ControlProps;
    binding: MonacoControlBinding;
    wrapper: Snippet<[string, Snippet]>;
  } & Pick<
    ComponentProps<typeof MonacoEditor>,
    'class' | 'style' | 'surfaceBackground' | 'darkSurfaceBackground' | 'darkClassBasedTheme'
  > = $props();
  const jsonforms = useJsonForms();
  const mixedCode = $derived(
    isMixedCodeControl(props.uischema, props.schema, {
      rootSchema: binding.control.rootSchema,
      config: binding.control.config,
    }),
  );
  const editorOptions = $derived(
    resolveMonacoAppliedOptions(
      binding.control.config,
      binding.control.uischema.options,
      mixedCode,
    ),
  );
  const initialMonacoFocus = untrack(() => editorOptions.focus === true);
  const language = $derived(resolveMonacoLanguage(editorOptions, jsonforms.core?.data));
  const convertJson = $derived(language === 'json' && editorOptions.convertJson === true);
  const monacoOptions = $derived(resolveMonacoOptions(editorOptions));
  const draft = useMonacoDraft({
    get value() {
      return binding.control.data;
    },
    get schema() {
      return binding.control.schema;
    },
    get path() {
      return binding.control.path;
    },
    get pathSegments() {
      return props.pathSegments
        ? [...props.pathSegments, ...scopeDataSegments(props.uischema.scope)]
        : dataPathSegments(binding.control.path);
    },
    get language() {
      return language;
    },
    get convertJson() {
      return convertJson;
    },
    get enabled() {
      return binding.control.enabled;
    },
    get validateJsonSchema() {
      return convertJson && editorOptions.validateJsonSchema !== false;
    },
    get diagnostics() {
      return editorOptions.propagateErrors === true;
    },
    get propagateErrors() {
      return editorOptions.propagateErrors === true;
    },
    get locale() {
      return jsonforms.i18n?.locale;
    },
    get translate() {
      return jsonforms.i18n?.translate;
    },
    onChange: (value) => binding.onChange(value),
  });
  const displayErrors = $derived(
    [
      binding.controlWrapper.errors,
      draft.message && !binding.controlWrapper.errors?.includes(draft.message) ? draft.message : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
  const describedBy = $derived(
    !binding.appliedOptions.hideControlWrapper &&
      (displayErrors ||
        (binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)))
      ? `${binding.control.id}-help`
      : undefined,
  );
</script>

{#snippet editor()}
  <MonacoEditor
    {...monacoOptions}
    width={resolveMonacoDimension(editorOptions.width)}
    height={resolveMonacoDimension(editorOptions.height)}
    id={`${binding.control.id}-input`}
    {...appearance}
    value={draft.text}
    subject={draft.subject}
    locale={jsonforms.i18n?.locale}
    translator={jsonforms.i18n?.translate}
    {language}
    appearance={typeof editorOptions.theme === 'string'
      ? editorOptions.theme
      : typeof editorOptions.mode === 'string'
        ? editorOptions.mode
        : undefined}
    schema={binding.control.schema}
    rootSchema={jsonforms.core?.schema}
    validateJsonSchema={convertJson && editorOptions.validateJsonSchema !== false}
    disabled={!binding.control.enabled}
    invalid={draft.invalid || !!binding.control.errors}
    required={binding.control.required}
    autofocus={initialMonacoFocus}
    placeholder={typeof editorOptions.placeholder === 'string'
      ? editorOptions.placeholder
      : undefined}
    aria-label={binding.control.label}
    aria-describedby={describedBy}
    onvaluechange={draft.update}
    validateDiagnostics={editorOptions.propagateErrors === true}
    ondiagnosticspending={draft.updateDiagnosticsPending}
    ondiagnosticserror={draft.updateDiagnosticsFailure}
    onmarkerschange={draft.updateDiagnostics}
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
  />
{/snippet}
{@render wrapper(displayErrors, editor)}
