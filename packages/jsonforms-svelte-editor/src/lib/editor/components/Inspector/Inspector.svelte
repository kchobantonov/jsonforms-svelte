<script lang="ts">
  import { setContext } from "svelte";
  import { JsonForms } from "@chobantonov/jsonforms-svelte";
  import {
    shadcnRenderers,
    shadcnCells,
    PortalTargetContextSymbol,
  } from "@chobantonov/jsonforms-svelte-shadcn";
  import {
    properties,
    type Document,
    type Node,
  } from "../../document/commands/index.js";
  let {
    document,
    node,
    onchange,
  }: {
    document: Document;
    node: Node;
    onchange: (value: {
      label: string;
      multi: boolean;
      required: boolean;
    }) => void;
  } = $props();
  let container: HTMLDivElement;
  setContext(PortalTargetContextSymbol, () => container);
  const value = $derived(properties(document, node));
  const form = $derived({
    schema: {
      type: "object",
      properties: {
        label: { type: "string", title: "Label" },
        ...(node.type === "Control"
          ? {
              multi: { type: "boolean", title: "Multiline" },
              required: { type: "boolean", title: "Required" },
            }
          : {}),
      },
    },
    uischema: {
      type: "VerticalLayout",
      elements: [
        { type: "Control", scope: "#/properties/label" },
        ...(node.type === "Control"
          ? [
              { type: "Control", scope: "#/properties/multi" },
              { type: "Control", scope: "#/properties/required" },
            ]
          : []),
      ],
    },
    data: value,
  });
</script>

<div bind:this={container}>
  <JsonForms
    schema={form.schema}
    uischema={form.uischema}
    data={form.data}
    renderers={shadcnRenderers}
    cells={shadcnCells}
    onchange={({ data }) => {
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const next = { ...value, ...data };
        if (JSON.stringify(next) !== JSON.stringify(value)) onchange(next);
      }
    }}
  />
</div>
