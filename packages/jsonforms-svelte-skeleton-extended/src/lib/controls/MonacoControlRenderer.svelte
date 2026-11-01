<script lang="ts">
  import { untrack } from 'svelte';
  import {
    MonacoEditor,
    useMonacoDraft,
    resolveMonacoLanguage,
    resolveMonacoOptions,
    resolveMonacoAppliedOptions,
    resolveMonacoErrorPublication,
    resolveMonacoDimension,
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
  let warnedLegacyErrorPublication = false;
  $effect(() => {
    if (
      resolveMonacoErrorPublication(
        binding.control.config,
        binding.control.uischema.options,
        mixedCode,
      ).legacyFlatDefault &&
      !warnedLegacyErrorPublication
    ) {
      warnedLegacyErrorPublication = true;
      console.warn(
        'monaco.legacyPropagateErrors: config.propagateErrors is deprecated; use config.jsonformsExtended.propagateErrors.',
      );
    }
  });
  const initialMonacoFocus = untrack(() => editorOptions.focus === true);
  const language = $derived(resolveMonacoLanguage(editorOptions, jsonforms.core?.data));
  const convertJson = $derived(language === 'json' && editorOptions.convertJson === true);
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
    class="jsonforms-skeleton-monaco"
    style={monacoStyle}
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
