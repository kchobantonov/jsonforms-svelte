<script lang="ts">
  import {
    useJsonFormsControl,
    type ControlProps,
  } from "@chobantonov/jsonforms-svelte";
  import * as Select from "@jsonforms-svelte-shadcn-ui/select/index.js";
  import Label from "@jsonforms-svelte-shadcn-ui/label/label.svelte";
  import { getContext } from "svelte";
  import { editorPortalTarget } from "../../portal-context.js";
  import { useEditorI18n } from "../../i18n/context.js";
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const i18n = useEditorI18n();
  const target = getContext<() => HTMLElement | undefined>(editorPortalTarget);
  const id = $props.id();
  const types = [
    "string",
    "number",
    "integer",
    "boolean",
    "object",
    "array",
    "null",
  ];
  const arrayValue = $derived(
    binding.control.schema.type === "array" ||
      (Array.isArray(binding.control.schema.type) &&
        binding.control.schema.type.includes("array")),
  );
  const stringValue = $derived(
    binding.control.schema.type === "string" ||
      (Array.isArray(binding.control.schema.type) &&
        binding.control.schema.type.includes("string")),
  );
  const multiple = $derived(
    binding.control.uischema.options?.multiple ?? arrayValue,
  );
  const selected = $derived(
    Array.isArray(binding.control.data)
      ? binding.control.data
      : typeof binding.control.data === "string"
        ? [binding.control.data]
        : [],
  );
  const disabled = $derived(
    !binding.control.enabled || binding.control.readonly,
  );
  function update(values: string[]) {
    if (!values.length || disabled) return;
    binding.handleChange(
      binding.control.path,
      arrayValue && (values.length > 1 || !stringValue) ? values : values[0],
    );
  }
</script>

{#if binding.control.visible}
  <div class="schema-type-editor">
    <Label for={id}>{binding.control.label || i18n.t("Types")}</Label>
    {#if multiple && arrayValue}
      <Select.Root
        type="multiple"
        value={selected}
        onValueChange={update}
        {disabled}
      >
        <Select.Trigger
          {id}
          aria-label={binding.control.label || i18n.t("Types")}
          aria-invalid={!!binding.control.errors}
        >
          {selected.join(" | ") || i18n.t("Select a type")}
        </Select.Trigger>
        <Select.Content portalProps={{ to: target?.() }}>
          {#each types as type}<Select.Item value={type} label={type}
              >{type}</Select.Item
            >{/each}
        </Select.Content>
      </Select.Root>
    {:else}
      <Select.Root
        type="single"
        value={selected[0] ?? ""}
        onValueChange={(value) => update(value ? [value] : [])}
        {disabled}
      >
        <Select.Trigger
          {id}
          aria-label={binding.control.label || i18n.t("Types")}
          aria-invalid={!!binding.control.errors}
        >
          {selected[0] || i18n.t("Select a type")}
        </Select.Trigger>
        <Select.Content portalProps={{ to: target?.() }}>
          {#each types as type}<Select.Item value={type} label={type}
              >{type}</Select.Item
            >{/each}
        </Select.Content>
      </Select.Root>
    {/if}
    {#if binding.control.errors}<p role="alert">
        {binding.control.errors}
      </p>{/if}
  </div>
{/if}
