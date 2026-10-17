<script lang="ts">
  import {
    DispatchRenderer,
    resolveUrlPolicy,
    useJsonForms,
    useRendererMessages,
    useJsonFormsLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { onDestroy, tick, untrack } from 'svelte';
  import {
    RactiveTemplateController,
    TemplateEngineLoadError,
    type SlotPlaceholder,
  } from '../core/ractiveTemplateController.js';
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
  const language = $derived(
    templateLanguage(binding.layout.uischema as TemplateLayout, jsonforms.config),
  );
  const urlPolicy = $derived(resolveUrlPolicy(jsonforms.config));
  const urlPolicyKey = $derived(JSON.stringify(urlPolicy));
  const supported = $derived(language === 'ractive');
  const allowed = $derived(supported && scriptEvaluationAllowed(jsonforms.config));

  let templateRoot: HTMLElement | null = $state(null);
  let templateError: string | null = $state(null);
  let engineLoadFailed = $state(false);
  let disposed = false;
  let slotPlaceholders: SlotPlaceholder[] = $state([]);

  const layout = $derived(binding.layout);
  const isVisible = $derived(layout.visible);
  const data = $derived(jsonforms.core?.data);
  const errors = $derived(jsonforms.core?.errors);
  const template = $derived((layout.uischema as TemplateLayout).template);

  const children = $derived(templateChildren((layout.uischema as TemplateLayout).elements ?? []));
  const namedElements = $derived(children.elements);
  const slotNames = $derived(JSON.stringify(namedElements.map((element) => element.name)));
  $effect(() => {
    for (const name of children.duplicateNames)
      console.warn(`template.duplicateChild: ${JSON.stringify(name)}`);
  });

  const namedElementMap = $derived.by<Record<string, NamedUISchemaElement>>(() =>
    Object.fromEntries(namedElements.map((element) => [element.name, element])),
  );

  const translate = $derived.by(() => {
    return (key: string, defaultMessage = '') =>
      formContext.translate?.(key, defaultMessage, {
        uischema: layout.uischema,
      }) ?? defaultMessage;
  });

  const errorTitle = $derived.by(() =>
    message(
      engineLoadFailed ? 'template.engineLoadError' : 'TemplateLayoutRenderer.template_error_title',
    ),
  );

  const controller = new RactiveTemplateController(
    (slots) => {
      slotPlaceholders = slots;
    },
    () => allowed,
    undefined,
    () => urlPolicy,
  );

  function reportTemplateError(error: unknown) {
    if (disposed) return;
    engineLoadFailed = error instanceof TemplateEngineLoadError;
    templateError = engineLoadFailed ? '' : error instanceof Error ? error.message : String(error);
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
    void urlPolicyKey;

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
        slotPlaceholders = [];
        await controller.destroy();
        return;
      }

      templateError = null;
      engineLoadFailed = false;

      try {
        await controller.setup(root, source, controllerData, visible);
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
