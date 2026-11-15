<script lang="ts">
  import { JsonForms, type ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
  import type { JsonFormsValidityEvent, OwnedErrorStore } from '@chobantonov/jsonforms-svelte';
  import {
    RuleEffect,
    type JsonFormsRendererRegistryEntry,
    type JsonSchema,
    type UISchemaElement,
    type ValidationMode,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import OwnedErrorRenderer from '../../../jsonforms-svelte/tests/fixtures/OwnedErrorRenderer.svelte';

  let {
    renderers,
    capture,
    onhandleaction,
    onvaliditychange,
    validationMode = 'ValidateAndShow',
    additionalErrors = [],
    schema = { type: 'object' },
  }: {
    renderers: JsonFormsRendererRegistryEntry[];
    capture: (value: { store: OwnedErrorStore }) => void;
    onhandleaction: (event: ActionEvent) => void;
    onvaliditychange: (event: JsonFormsValidityEvent) => void;
    validationMode?: ValidationMode;
    additionalErrors?: ErrorObject[];
    schema?: JsonSchema;
  } = $props();
  let validity = $state.raw<JsonFormsValidityEvent>();
  const uischema: UISchemaElement = {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Capture',
        options: { capture: (value: { store: OwnedErrorStore }) => capture(value) },
      },
      {
        type: 'Button',
        label: 'Submit valid form',
        action: 'submit',
        rule: {
          effect: RuleEffect.ENABLE,
          condition: {
            scope: '#',
            validate: () =>
              validity?.current === true &&
              !validity.pending &&
              validity.errors.length === 0 &&
              validity.additionalErrors.length === 0,
          },
        },
      },
    ],
  } as UISchemaElement;
</script>

<JsonForms
  data={{ value: 'unchanged' }}
  {schema}
  {uischema}
  renderers={[
    ...renderers,
    { tester: (element) => (element.type === 'Capture' ? 100 : -1), renderer: OwnedErrorRenderer },
  ]}
  {validationMode}
  {additionalErrors}
  {onhandleaction}
  onvaliditychange={(event) => {
    validity = event;
    onvaliditychange(event);
  }}
/>
