<script lang="ts">
  import { useDynamicTreeResolver } from '@chobantonov/jsonforms-svelte';
  const resolveTree = useDynamicTreeResolver();
  import {
    DispatchRenderer,
    resolveUrlPolicy,
    useJsonForms,
    useRendererMessages,
    useJsonFormsLayout,
    useUIDiagnosticReporter,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { onDestroy, tick, untrack } from 'svelte';
  import { type SlotPlaceholder } from '../core/ractiveTemplateController.js';
  import {
    JsxTemplateController,
    JsxTemplateEngineLoadError,
  } from '../core/jsxTemplateController.js';
  import { type NamedUISchemaElement, type TemplateLayout } from '../core/types.js';
  import { useFormContext } from '../jsonFormsCompositions.svelte';
  import { scriptEvaluationAllowed } from '../core/buttonScript';
  import { templateChildren } from '../core/templateChildren';
  import { templateLanguage } from '../core/templateLanguage';
  import TemplateSlotHost from './TemplateSlotHost.svelte';

  const props: RendererProps<TemplateLayout> = $props();
  const binding = useJsonFormsLayout(props);
  const jsonforms = useJsonForms();
  const formContext = useFormContext();
  const message = useRendererMessages();
  const reportDiagnostic = useUIDiagnosticReporter();
  const language = $derived(
    templateLanguage(binding.layout.uischema as TemplateLayout, jsonforms.config),
  );
  const urlPolicy = $derived(resolveUrlPolicy(jsonforms.config));
  const urlPolicyKey = $derived(JSON.stringify(urlPolicy));
  const supported = $derived(language === 'jsx');
  const allowed = $derived(supported && scriptEvaluationAllowed(jsonforms.config));

  let templateRoot: HTMLElement | null = $state(null);
  let templateError: string | null = $state(null);
  let engineLoadFailed = $state(false);
  let reportedTemplateFailure: string | undefined;
  let disposed = false;
  let slotPlaceholders: SlotPlaceholder[] = $state([]);

  const layout = $derived(binding.layout);
  let reportedDeniedPath: string | undefined;
  $effect(() => {
    if (!layout.visible || !supported || allowed) {
      reportedDeniedPath = undefined;
      return;
    }
    if (reportedDeniedPath === layout.path) return;
    reportedDeniedPath = layout.path;
    reportDiagnostic('script.evaluationDisabled', {
      severity: 'warning',
      message: 'Template script evaluation is disabled by host policy.',
      details: { capability: 'template', path: layout.path },
    });
  });
  let reportedUnsupportedLanguage: string | undefined;
  $effect(() => {
    const identity = JSON.stringify([layout.path, language]);
    if (!layout.visible || supported) {
      reportedUnsupportedLanguage = undefined;
      return;
    }
    if (reportedUnsupportedLanguage === identity) return;
    reportedUnsupportedLanguage = identity;
    reportDiagnostic('template.unsupportedLanguage', {
      severity: 'warning',
      message: `Unsupported template language: ${language}.`,
      details: { language, path: layout.path },
    });
  });
  const isVisible = $derived(layout.visible);
  const data = $derived(jsonforms.core?.data);
  const errors = $derived(jsonforms.core?.errors);
  const template = $derived((layout.uischema as TemplateLayout).template);

  const children = $derived(templateChildren((layout.uischema as TemplateLayout).elements ?? []));
  const namedElements = $derived(
    children.elements.map((element) => ({
      ...resolveTree(element, layout.path),
      name: element.name,
    })),
  );
  const slotNames = $derived(JSON.stringify(namedElements.map((element) => element.name)));
  let reportedDuplicateChildren = new Set<string>();
  $effect(() => {
    const active = new Set(
      children.duplicateNames.map((name) => JSON.stringify([layout.path, name])),
    );
    for (const name of children.duplicateNames) {
      if (reportedDuplicateChildren.has(JSON.stringify([layout.path, name]))) continue;
      reportDiagnostic('template.duplicateChild', {
        severity: 'warning',
        message: 'Several template children have the same name; the last is used.',
        path: layout.path,
        details: { name },
      });
    }
    reportedDuplicateChildren = active;
  });

  const namedElementMap = $derived.by<Record<string, NamedUISchemaElement>>(() =>
    Object.fromEntries(namedElements.map((element) => [element.name, element])),
  );

  const translate = $derived.by(() => {
    const translator = formContext.translate;
    return (key: string, defaultMessage = '') =>
      translator?.(key, defaultMessage, {
        uischema: layout.uischema,
      }) ?? defaultMessage;
  });

  const errorTitle = $derived.by(() =>
    message(
      engineLoadFailed ? 'template.engineLoadError' : 'TemplateLayoutRenderer.template_error_title',
    ),
  );

  const controller = new JsxTemplateController(
    (slots) => {
      slotPlaceholders = slots;
    },
    () => allowed,
    () => urlPolicy,
    reportDiagnostic,
  );

  function reportTemplateError(error: unknown) {
    if (disposed) return;
    engineLoadFailed = error instanceof JsxTemplateEngineLoadError;
    const code = engineLoadFailed ? 'template.engineLoadFailed' : 'template.renderFailed';
    const failureKey = JSON.stringify([code, layout.path, template]);
    if (reportedTemplateFailure !== failureKey) {
      reportedTemplateFailure = failureKey;
      reportDiagnostic(code, {
        severity: 'error',
        message: engineLoadFailed
          ? 'The template engine could not be loaded.'
          : 'The template could not be rendered.',
        path: layout.path,
        details: { kind: 'jsx' },
      });
    }
    templateError = '';
    slotPlaceholders = [];
    void controller.destroy();
  }

  $effect(() => {
    const visible = isVisible;
    void controller.updateVisibility(visible).catch(reportTemplateError);
  });

  $effect(() => {
    void data;
    void controller.updateData('data', data).catch(reportTemplateError);
  });

  $effect(() => {
    void errors;
    void controller.updateData('errors', errors).catch(reportTemplateError);
  });

  $effect(() => {
    void namedElements;
    void controller.updateData('elements', namedElements).catch(reportTemplateError);
  });

  $effect(() => {
    void translate;
    void controller.updateData('translate', translate).catch(reportTemplateError);
  });

  $effect(() => {
    void urlPolicyKey;
    void controller.refreshPolicy().catch(reportTemplateError);
  });

  $effect(() => {
    // Read the host context's live getters without replacing its capability proxy.
    Object.values(formContext);
    void controller.updateData('context', formContext).catch(reportTemplateError);
  });

  $effect(() => {
    void allowed;
    let cancelled = false;
    void isVisible;
    void templateRoot;
    void template;
    void slotNames;

    void (async () => {
      const root = templateRoot;
      const source = template;
      const elements = untrack(() => namedElements);
      const visible = isVisible;
      const controllerData = untrack(() => ({
        data,
        errors,
        context: formContext,
        elements,
        translate,
      }));

      await tick();
      if (cancelled) return;

      if (!allowed || !root || !source) {
        templateError = null;
        reportedTemplateFailure = undefined;
        slotPlaceholders = [];
        await controller.destroy();
        return;
      }

      templateError = null;
      engineLoadFailed = false;

      try {
        await controller.setup(root, source, controllerData, visible);
        reportedTemplateFailure = undefined;
      } catch (error) {
        if (cancelled) return;
        reportTemplateError(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  });

  onDestroy(async () => {
    disposed = true;
    await controller.destroy();
    slotPlaceholders = [];
  });
</script>

{#if layout.visible}
  {#if !supported}
    <div role="alert">{message('template.unsupportedLanguage', { language })}</div>
  {:else if !allowed}
    <div role="alert">{message('template.evaluationDisabled')}</div>
  {:else if templateError !== null}
    <div role="alert" class="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
      <strong class="me-2">{errorTitle}</strong>
      <span>{templateError}</span>
    </div>
  {/if}

  {#if allowed}
    <div bind:this={templateRoot} style="display: contents"></div>

    {#each slotPlaceholders as { name, el } (el)}
      <TemplateSlotHost mountTo={el} registerRoot={(root) => controller.registerSlotRoot(root)}>
        {#if Object.hasOwn(namedElementMap, name)}
          <DispatchRenderer
            schema={layout.schema}
            uischema={namedElementMap[name]}
            path={layout.path}
            enabled={layout.enabled}
            renderers={layout.renderers}
            cells={layout.cells}
          />
        {/if}
      </TemplateSlotHost>
    {/each}
  {/if}
{/if}
