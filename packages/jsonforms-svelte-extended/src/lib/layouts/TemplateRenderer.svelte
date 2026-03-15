<script lang="ts">
  import {
    DispatchRenderer,
    useJsonForms,
    useJsonFormsLayout,
    type RendererProps,
  } from "@chobantonov/jsonforms-svelte";
  import type { Layout, UISchemaElement } from "@jsonforms/core";
  import { getContext, setContext } from "svelte";
  import {
    TemplateRenderSlotContentsKey,
    type TemplateElement,
    type TemplateRenderSlotContentsContext,
    type TemplateSlotContents,
  } from "../core/types.js";

  const props: RendererProps<TemplateElement> = $props();
  const binding = useJsonFormsLayout(props as unknown as RendererProps<Layout>);
  const jsonforms = useJsonForms();

  const layout = $derived(binding.layout);
  const parentSlotContents = getContext<
    TemplateRenderSlotContentsContext | undefined
  >(TemplateRenderSlotContentsKey);

  const elementTemplates = $derived.by<TemplateSlotContents>(() => {
    const elements = (layout.uischema as TemplateElement).elements ?? [];

    return elements.reduce<TemplateSlotContents>((result, element) => {
      const name = (element as { name?: unknown }).name;

      if (typeof name === "string") {
        result[name] = element;
      }

      return result;
    }, {});
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
    return typeof template.name === "string" ? template.name : undefined;
  });

  const templateUISchema = $derived.by<UISchemaElement | undefined>(() => {
    const templateName = name;

    if (!templateName) {
      return undefined;
    }

    return jsonforms.uischemas?.find((entry) => {
      const candidate = entry.uischema as { name?: unknown };
      return candidate.name === templateName;
    })?.uischema;
  });
</script>

{#if templateUISchema}
  <DispatchRenderer
    visible={layout.visible}
    enabled={layout.enabled}
    schema={layout.schema}
    uischema={templateUISchema}
    path={layout.path}
    renderers={layout.renderers}
    cells={layout.cells}
  />
{/if}
