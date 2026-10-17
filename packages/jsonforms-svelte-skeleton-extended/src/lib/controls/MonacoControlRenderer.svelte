<script lang="ts">
  import {
    MonacoEditor,
    useMonacoDraft,
    resolveMonacoLanguage,
    resolveMonacoOptions,
    resolveMonacoAppliedOptions,
    isMixedCodeControl,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    type ControlProps,
    useJsonForms,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import { ControlWrapper, useSkeletonControl } from '@chobantonov/jsonforms-svelte-skeleton';

  const props: ControlProps = $props();
  const jsonforms = useJsonForms();
  const binding = useSkeletonControl(useJsonFormsControl(props));
  const editorOptions = $derived(
    resolveMonacoAppliedOptions(
      binding.control.config,
      binding.control.uischema.options,
      isMixedCodeControl(props.uischema, props.schema, {
        rootSchema: binding.control.rootSchema,
        config: binding.control.config,
      }),
    ),
  );
  const language = $derived(resolveMonacoLanguage(editorOptions, jsonforms.core?.data));
  const convertJson = $derived(editorOptions.convertJson === true);
  const monacoOptions = $derived(resolveMonacoOptions(editorOptions));
  const monacoStyle = [
    '--jsonforms-monaco-border: var(--color-surface-200-800, #e2e8f0)',
    '--jsonforms-monaco-error: var(--color-error-500, #ef4444)',
    '--jsonforms-monaco-focus: var(--color-primary-500, #3b82f6)',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: none',
    '--jsonforms-monaco-radius: var(--radius-base, 0.375rem)',
    '--jsonforms-monaco-background: var(--color-surface-50-950, Canvas)',
    '--jsonforms-monaco-foreground: var(--color-surface-950-50, CanvasText)',
    '--jsonforms-monaco-button-background: var(--color-surface-100-900, Canvas)',
    '--jsonforms-monaco-button-hover-background: var(--color-surface-200-800, #e2e8f0)',
  ].join('; ');
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
</script>

<ControlWrapper {...binding.controlWrapper} errors={displayErrors}>
  <MonacoEditor
    {...monacoOptions}
    id={`${binding.control.id}-input`}
    class="jsonforms-skeleton-monaco"
    style={monacoStyle}
    value={draft.text}
    locale={jsonforms.i18n?.locale}
    translator={jsonforms.i18n?.translate}
    {language}
    schema={binding.control.schema}
    rootSchema={jsonforms.core?.schema}
    validateJsonSchema={convertJson && editorOptions.validateJsonSchema !== false}
    disabled={!binding.control.enabled}
    invalid={draft.invalid || !!binding.control.errors}
    autofocus={editorOptions.focus === true}
    placeholder={typeof editorOptions.placeholder === 'string'
      ? editorOptions.placeholder
      : undefined}
    aria-label={binding.control.label}
    onvaluechange={draft.update}
    onmarkerschange={draft.updateDiagnostics}
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
  />
</ControlWrapper>
