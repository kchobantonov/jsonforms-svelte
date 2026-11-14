<script lang="ts">
  import {
    DispatchRenderer,
    useJsonForms,
    useJsonFormsLayout,
    useRendererMessages,
    useUiSchemaCycleGuard,
    useUIDiagnosticReporter,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout, UISchemaElement } from '@jsonforms/core';
  import { getContext, setContext } from 'svelte';
  import {
    TemplateRenderSlotContentsKey,
    type TemplateElement,
    type TemplateRenderSlotContentsContext,
    type TemplateSlotContents,
  } from '../core/types.js';

  const props: RendererProps<TemplateElement> = $props();
  const binding = useJsonFormsLayout(props as unknown as RendererProps<Layout>);
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const reportDiagnostic = useUIDiagnosticReporter();

  const layout = $derived(binding.layout);
  const parentSlotContents = getContext<TemplateRenderSlotContentsContext | undefined>(
    TemplateRenderSlotContentsKey,
  );

  const elementTemplates = $derived.by<TemplateSlotContents>(() => {
    const elements = (layout.uischema as TemplateElement).elements ?? [];

    return Object.fromEntries(
      elements.flatMap((element) => {
        const name = (element as { name?: unknown }).name;
        return typeof name === 'string' ? [[name, element]] : [];
      }),
    );
  });

  const slotContents = $derived.by<TemplateSlotContents>(() => {
    const inherited = parentSlotContents?.value ?? {};
    return {
      ...inherited,
      ...elementTemplates,
    };
  });

  const slotContentsContext: TemplateRenderSlotContentsContext = {
    get value() {
      return slotContents;
    },
  };

  setContext(TemplateRenderSlotContentsKey, slotContentsContext);

  const name = $derived.by(() => {
    const template = layout.uischema as TemplateElement;
    return typeof template.name === 'string' ? template.name : undefined;
  });

  const matchingTemplates = $derived(
    name
      ? (jsonforms.uischemas ?? []).filter(
          (entry) => (entry.uischema as { name?: unknown }).name === name,
        )
      : [],
  );
  const templateUISchema = $derived<UISchemaElement | undefined>(matchingTemplates[0]?.uischema);
  const ancestry = useUiSchemaCycleGuard(() => ({
    uischema: templateUISchema ?? layout.uischema,
    path: layout.path,
  }));
  const diagnostic = $derived(
    ancestry.cycle
      ? 'template.cycle'
      : !templateUISchema
        ? 'template.missing'
        : matchingTemplates.length > 1
          ? 'template.duplicate'
          : undefined,
  );
  // Author diagnostics are separate from the validity of the caller's data.
  let reportedDiagnostic: string | undefined;
  $effect(() => {
    const key = diagnostic ? JSON.stringify([layout.path, name ?? '', diagnostic]) : undefined;
    if (key === reportedDiagnostic) return;
    reportedDiagnostic = key;
    if (!diagnostic) return;
    reportDiagnostic(diagnostic, {
      severity: 'warning',
      message:
        diagnostic === 'template.cycle'
          ? 'The named template resolves through a cycle.'
          : diagnostic === 'template.missing'
            ? 'The named template is not registered.'
            : 'Several registered templates have the same name; the first is used.',
      path: layout.path,
      details: { name: name ?? '' },
    });
  });
</script>

{#if templateUISchema && !ancestry.cycle}
  <DispatchRenderer
    visible={layout.visible}
    enabled={layout.enabled}
    schema={layout.schema}
    uischema={templateUISchema}
    path={layout.path}
    renderers={layout.renderers}
    cells={layout.cells}
  />
{:else if layout.visible && diagnostic === 'template.cycle'}
  <p role="status" data-template-diagnostic="template.cycle">{message('template.cycle')}</p>
{:else if layout.visible && diagnostic === 'template.missing'}
  <p role="status" data-template-diagnostic="template.missing">{message('template.missing')}</p>
{/if}
