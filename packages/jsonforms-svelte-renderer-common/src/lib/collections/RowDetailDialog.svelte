<script lang="ts">
  import type { Component } from 'svelte';
  import { Generate, type ControlElement, type JsonSchema } from '@jsonforms/core';
  import { type DetailDialogProps } from '../tuple/tuplePresentation.js';
  import { useJsonForms } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte.js';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import { findDetailUISchema } from '../core/detail';

  let {
    Dialog,
    schema,
    path,
    scope,
    options,
    enabled,
    index,
    prepare,
    returnFocus,
  }: {
    Dialog: Component<DetailDialogProps>;
    schema: JsonSchema;
    path: string;
    scope: string;
    options: Record<string, unknown>;
    enabled: boolean;
    index: number;
    prepare: () => boolean;
    returnFocus?: HTMLElement;
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
  {returnFocus}
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
