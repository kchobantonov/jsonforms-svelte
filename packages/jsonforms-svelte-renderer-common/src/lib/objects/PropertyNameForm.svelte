<script lang="ts">
  import type { useJsonFormsControlWithDetail } from '../core/jsonFormsCompositions.svelte';
  import type { useAdditionalPropertyEditor } from './additionalPropertyEditor.svelte';
  import JsonForms from '../core/JsonForms.svelte';
  const {
    control,
    editor,
  }: {
    control: ReturnType<typeof useJsonFormsControlWithDetail>['control'];
    editor: ReturnType<typeof useAdditionalPropertyEditor>;
  } = $props();
</script>

<JsonForms
  data={editor.newPropertyName}
  uischema={editor.propertyNameUiSchema}
  schema={editor.propertyNameSchema}
  additionalErrors={editor.additionalErrors}
  renderers={control.renderers}
  cells={control.cells}
  config={control.config}
  readonly={!control.enabled || control.readonly}
  validationMode={editor.validationMode}
  i18n={editor.i18n}
  ajv={editor.ajv}
  onchange={editor.propertyNameChange}
/>
