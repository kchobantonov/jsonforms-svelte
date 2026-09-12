<script lang="ts">
  import { JsonForms } from "@chobantonov/jsonforms-svelte";
  import {
    shadcnRenderers,
    shadcnCells,
  } from "@chobantonov/jsonforms-svelte-shadcn";
  import {
    effects,
    operators,
    visualRule,
    fromVisual,
  } from "../../rules/model.js";
  import { fields, resolve, object } from "../../document/commands/index.js";
  import { useEditorI18n } from "../../i18n/context.js";
  const i18n = useEditorI18n();
  let {
    rule,
    schema,
    onchange,
  }: { rule: unknown; schema: unknown; onchange: (rule: unknown) => void } =
    $props();
  const data = $derived(visualRule(rule));
  const valueType = $derived(
    data?.operator === "one of"
      ? "array"
      : typeof data?.value === "number"
        ? "number"
        : typeof data?.value === "boolean"
          ? "boolean"
          : data?.value === null
            ? "null"
            : "string",
  );
  const fieldSchema = $derived(
    data?.scope === "#" ? object(schema) : resolve(schema, data?.scope),
  );
  const allowed = $derived(
    operators.filter(
      (op) =>
        op === "equals" ||
        op === "one of" ||
        (op === "pattern"
          ? String(JSON.stringify(fieldSchema.type)).includes("string")
          : /number|integer/.test(JSON.stringify(fieldSchema.type))),
    ),
  );
  const properties = $derived({
    effect: { type: "string", title: i18n.t("Effect"), enum: effects },
    scope: {
      type: "string",
      title: i18n.t("Field/context"),
      oneOf: [
        { const: "#", title: i18n.t("Entire form") },
        ...fields(schema).map((f) => ({
          const: f.scope,
          title: `${f.name} (${f.scope})`,
        })),
      ],
    },
    operator: { type: "string", title: i18n.t("Condition"), enum: allowed },
    valueType: {
      type: "string",
      title: i18n.t("Value type"),
      enum: ["string", "number", "boolean", "null", "array"],
    },
    value: {
      type: valueType,
      title: i18n.t("Value"),
      ...(valueType === "array" ? { items: { type: Array.isArray(data?.value) && data.value.length ? (data.value[0] === null ? "null" : typeof data.value[0]) : "string" } } : {}),
    },
    failWhenUndefined: {
      type: "boolean",
      title: i18n.t("Do not match when the field is missing"),
    },
  });
</script>

{#if data}
  <JsonForms
    schema={{ type: "object", properties }}
    uischema={{
      type: "VerticalLayout",
      elements: Object.keys(properties).filter(key => key !== "value" || valueType !== "null").map((key) => ({
        type: "Control",
        scope: `#/properties/${key}`,
      })),
    }}
    data={{ ...data, valueType }}
    renderers={shadcnRenderers}
    cells={shadcnCells}
    onchange={({ data: next }) => {
      if (
        !next ||
        JSON.stringify(next) === JSON.stringify({ ...data, valueType })
      )
        return;
      if (next.operator !== data.operator) {
        if (next.operator === "one of") next.value = [data.value ?? ""];
        else if (next.operator === "minimum" || next.operator === "maximum")
          next.value = 0;
        else next.value = "";
        next.valueType =
          next.operator === "one of" ? "array" : typeof next.value;
      }
      if (next.operator === data.operator && next.valueType !== valueType)
        next.value = (
          {
            string: "",
            number: 0,
            boolean: false,
            null: null,
            array: [],
          } as Record<string, unknown>
        )[next.valueType];
      onchange(fromVisual(rule, next));
    }}
  />
{:else}<p>
    {i18n.t("This condition is edited as JSON to preserve its full meaning.")}
  </p>{/if}
