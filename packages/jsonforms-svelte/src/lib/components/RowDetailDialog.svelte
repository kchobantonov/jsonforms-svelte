<script lang="ts">
  import type { Component } from 'svelte';
  import { Generate, type ControlElement, type JsonSchema } from '@jsonforms/core';
  import type { DetailDialogProps } from '../tuplePresentation';
  import { useJsonForms } from '../jsonFormsCompositions.svelte';
  import { useRendererMessages } from '../rendererMessages.svelte';
  import { findDetailUISchema } from '../detail';
  import DispatchRenderer from './DispatchRenderer.svelte';

  let {
    Dialog,
    schema,
    path,
    scope,
    options,
    enabled,
    index,
    prepare,
  }: {
    Dialog: Component<DetailDialogProps>;
    schema: JsonSchema;
    path: string;
    scope: string;
    options: Record<string, unknown>;
    enabled: boolean;
    index: number;
    prepare: () => boolean;
  } = $props();
  const form = useJsonForms();
  const message = useRendererMessages();
  const detail = $derived(
    findDetailUISchema(
      form.uischemas ?? [],
      schema,
      scope,
      path,
      () => Generate.uiSchema(schema, 'VerticalLayout', undefined, form.core?.schema),
      { type: 'Control', scope, options: { detail: options.detail } } as ControlElement,
      form.core?.schema,
    ),
  );
  const editable = $derived(
    enabled && (!('readOnly' in schema) || schema.readOnly !== true) && !form.readonly,
  );
</script>

<Dialog
  label={message('collection.rowDetails', { index: index + 1 })}
  triggerLabel={message('collection.editRowDetails', { index: index + 1 })}
  inspectable
  beforeOpen={prepare}
  enabled={editable}
  {schema}
  {path}
  {options}
>
  <DispatchRenderer
    {schema}
    uischema={detail}
    {path}
    enabled={editable}
    renderers={form.renderers}
    cells={form.cells}
  />
</Dialog>
