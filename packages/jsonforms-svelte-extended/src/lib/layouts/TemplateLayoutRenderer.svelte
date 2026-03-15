<script lang="ts">
  import {
    DispatchRenderer,
    useJsonForms,
    useJsonFormsLayout,
    type RendererProps,
  } from "@chobantonov/jsonforms-svelte";
  import { onDestroy, tick, untrack } from "svelte";
  import {
    RactiveTemplateController,
    type SlotPlaceholder,
  } from "../core/ractiveTemplateController.js";
  import {
    type NamedUISchemaElement,
    type TemplateLayout,
  } from "../core/types.js";
  import { useFormContext } from "../jsonFormsCompositions.svelte";
  import TemplateSlotHost from "./TemplateSlotHost.svelte";

  const props: RendererProps<TemplateLayout> = $props();
  const binding = useJsonFormsLayout(props);
  const jsonforms = useJsonForms();
  const formContext = useFormContext();

  let templateRoot: HTMLElement | null = $state(null);
  let templateError: string | null = $state(null);
  let slotPlaceholders: SlotPlaceholder[] = $state([]);

  const layout = $derived(binding.layout);
  const data = $derived(jsonforms.core?.data);
  const errors = $derived(jsonforms.core?.errors);
  const template = $derived((layout.uischema as TemplateLayout).template);

  const namedElements = $derived.by((): NamedUISchemaElement[] => {
    const uischema = layout.uischema as TemplateLayout;
    return (uischema.elements || []).map((element, index) => ({
      ...element,
      name:
        typeof (element as { name?: unknown }).name === "string"
          ? ((element as unknown as { name: string }).name ?? `${index}`)
          : `${index}`,
    }));
  });

  const namedElementMap = $derived.by<Record<string, NamedUISchemaElement>>(
    () =>
      Object.fromEntries(
        namedElements.map((element) => [element.name, element]),
      ),
  );

  const translate = $derived.by(() => {
    return (key: string, defaultMessage = "") =>
      formContext.translate?.(key, defaultMessage, {
        uischema: layout.uischema,
      }) ?? defaultMessage;
  });

  const errorTitle = $derived.by(() =>
    translate("TemplateLayoutRenderer.template_error_title", "Template Error"),
  );

  const controller = new RactiveTemplateController((slots) => {
    slotPlaceholders = slots;
  });

  $effect(() => {
    const visible = layout.visible;
    void controller.updateVisibility(visible);
  });

  $effect(() => {
    data;
    void controller.updateData("data", data);
  });

  $effect(() => {
    errors;
    void controller.updateData("errors", errors);
  });

  $effect(() => {
    namedElements;
    void controller.updateData("elements", namedElements);
  });

  $effect(() => {
    translate;
    void controller.updateData("translate", translate);
  });

  $effect(() => {
    layout.visible;
    templateRoot;
    template;
    namedElements;

    void (async () => {
      const root = templateRoot;
      const source = template;
      const elements = namedElements;
      const visible = layout.visible;
      const controllerData = untrack(() => ({
        data,
        errors,
        context: formContext,
        elements,
        translate,
      }));

      await tick();

      if (!root || !source) {
        templateError = null;
        slotPlaceholders = [];
        await controller.destroy();
        return;
      }

      templateError = null;

      try {
        await controller.setup(root, source, controllerData, visible);
      } catch (error) {
        templateError = error instanceof Error ? error.message : String(error);
        slotPlaceholders = [];
      }
    })();
  });

  onDestroy(async () => {
    await controller.destroy();
    slotPlaceholders = [];
  });
</script>

{#if layout.visible}
  {#if templateError !== null}
    <div
      role="alert"
      class="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <strong class="me-2">{errorTitle}</strong>
      <span>{templateError}</span>
    </div>
  {/if}

  <div bind:this={templateRoot} style="display: contents"></div>

  {#each slotPlaceholders as { name, el }, index (`${name}-${index}`)}
    <TemplateSlotHost mountTo={el}>
      {#snippet children()}
        {#if namedElementMap[name]}
          <DispatchRenderer
            schema={layout.schema}
            uischema={namedElementMap[name]}
            path={layout.path}
            enabled={layout.enabled}
            renderers={layout.renderers}
            cells={layout.cells}
          />
        {/if}
      {/snippet}
    </TemplateSlotHost>
  {/each}
{/if}
