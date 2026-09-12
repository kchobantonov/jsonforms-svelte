<script lang="ts">
  import Runtime from "./Runtime.svelte";
  import {
    properties,
    type Document,
    type Node,
  } from "../../document/commands.js";
  let {
    document,
    node,
    mode,
    onchange,
  }: {
    document: Document;
    node: Node;
    mode: string;
    onchange: (value: {
      label: string;
      multi: boolean;
      required: boolean;
    }) => void;
  } = $props();
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

<Runtime
  {form}
  {mode}
  onchange={(data) => {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const next = { ...value, ...data };
      if (JSON.stringify(next) !== JSON.stringify(value)) onchange(next);
    }
  }}
/>
