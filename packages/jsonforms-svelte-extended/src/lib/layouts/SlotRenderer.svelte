<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    type RendererProps,
  } from "@chobantonov/jsonforms-svelte";
  import type { Layout, UISchemaElement } from "@jsonforms/core";
  import { getContext } from "svelte";
  import {
    TemplateRenderSlotContentsKey,
    type SlotElement,
    type TemplateRenderSlotContentsContext,
  } from "../core/types.js";

  const props: RendererProps<SlotElement> = $props();
  const binding = useJsonFormsLayout(props as unknown as RendererProps<Layout>);

  const layout = $derived(binding.layout);
  const slotContents = getContext<
    TemplateRenderSlotContentsContext | undefined
  >(TemplateRenderSlotContentsKey);

  const name = $derived.by(() => {
    const slot = layout.uischema as SlotElement;
    return typeof slot.name === "string" ? slot.name : undefined;
  });

  const defaultSlot = $derived.by<UISchemaElement | undefined>(() => {
    const elements = (layout.uischema as SlotElement).elements;
    return elements && elements.length > 0 ? elements[0] : undefined;
  });

  const slotUISchema = $derived.by<UISchemaElement | undefined>(() => {
    const contents = slotContents?.value ?? {};
    const slotName = name;

    if (slotName) {
      return contents[slotName] ?? defaultSlot;
    }

    return defaultSlot;
  });
</script>

{#if slotUISchema}
  <DispatchRenderer
    visible={layout.visible}
    enabled={layout.enabled}
    schema={layout.schema}
    uischema={slotUISchema}
    path={layout.path}
    renderers={layout.renderers}
    cells={layout.cells}
  />
{/if}
