<script lang="ts">
  import { untrack } from 'svelte';
  import {
    MonacoEditor,
    useMonacoDraft,
    resolveMonacoLanguage,
    resolveMonacoOptions,
    resolveMonacoAppliedOptions,
    resolveMonacoDimension,
    isMixedCodeControl,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    type ControlProps,
    useJsonForms,
    useJsonFormsControl,
    dataPathSegments,
    scopeDataSegments,
  } from '@chobantonov/jsonforms-svelte';
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';

  const props: ControlProps = $props();
  const jsonforms = useJsonForms();
  const binding = useFlowbiteControl(useJsonFormsControl(props));
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

<ControlWrapper {...binding.controlWrapper} errors={displayErrors}>
  <MonacoEditor
    {...monacoOptions}
    width={resolveMonacoDimension(editorOptions.width)}
    height={resolveMonacoDimension(editorOptions.height)}
    id={`${binding.control.id}-input`}
    class="jsonforms-flowbite-monaco"
    style={monacoStyle}
    surfaceBackground="#fff"
    darkSurfaceBackground="var(--color-gray-800, #1f2937)"
    darkClassBasedTheme
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
</ControlWrapper>
