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
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';

  const props: ControlProps = $props();
  const jsonforms = useJsonForms();
  const binding = useFlowbiteControl(useJsonFormsControl(props));
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
    '--jsonforms-monaco-border: light-dark(var(--color-gray-300, #d1d5db), var(--color-gray-600, #4b5563))',
    '--jsonforms-monaco-error: var(--color-red-500, #ef4444)',
    '--jsonforms-monaco-focus: var(--color-primary-500, #3b82f6)',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: 0 0 0 1px var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-radius: 0.5rem',
    '--jsonforms-monaco-background: light-dark(#fff, var(--color-gray-800, #1f2937))',
    '--jsonforms-monaco-foreground: light-dark(#111827, var(--color-gray-50, #f9fafb))',
    '--jsonforms-monaco-button-background: light-dark(#fff, var(--color-gray-700, #374151))',
    '--jsonforms-monaco-button-hover-background: light-dark(var(--color-gray-100, #f3f4f6), var(--color-gray-600, #4b5563))',
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
    class="jsonforms-flowbite-monaco"
    style={monacoStyle}
    surfaceBackground="#fff"
    darkSurfaceBackground="var(--color-gray-800, #1f2937)"
    darkClassBasedTheme
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
