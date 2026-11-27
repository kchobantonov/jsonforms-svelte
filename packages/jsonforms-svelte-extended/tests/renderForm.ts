import { controlFixture } from '../../jsonforms-svelte-renderer-common/tests/controlFixture';
import { changeWaiters } from '../../jsonforms-svelte-renderer-common/tests/formAssertions';
export { expectLabelVisible } from '../../jsonforms-svelte-renderer-common/tests/formAssertions';
import type Ajv from 'ajv';
import { JsonForms, type ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
import type { UIDiagnostic } from '@chobantonov/jsonforms-svelte-renderer-common';
import {
  type JsonFormsCellRendererRegistryEntry,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';

type MountControlOptions = {
  propertySchema: JsonSchema;
  renderers: JsonFormsRendererRegistryEntry[];
  value?: unknown;
  options?: Record<string, unknown>;
  config?: Record<string, unknown>;
  required?: boolean;
  ajv?: Ajv;
  ondiagnostic?: (diagnostic: UIDiagnostic) => void;
};

type MountFormOptions = {
  schema: JsonSchema;
  uischema: UISchemaElement;
  renderers: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  data?: unknown;
  onhandleaction?: (event: ActionEvent) => void | Promise<void>;
  ondiagnostic?: (diagnostic: UIDiagnostic) => void;
};

export const mountControl = async ({
  propertySchema,
  renderers,
  value,
  options,
  config,
  required = false,
  ajv,
  ondiagnostic,
}: MountControlOptions) => {
  const fixture = controlFixture(propertySchema, value, options, required);
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      ...fixture,
      renderers,
      config,
      ajv,
      onchange,
      ondiagnostic,
    },
  });

  return { view, onchange };
};

export const mountForm = async ({
  schema,
  uischema,
  renderers,
  cells,
  data,
  onhandleaction,
  ondiagnostic,
}: MountFormOptions) => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      data: data === undefined ? {} : data,
      schema,
      uischema,
      renderers,
      cells,
      onchange,
      onhandleaction,
      ondiagnostic,
    },
  });

  return { view, onchange };
};

export const { waitForChange, waitForFormChange } = changeWaiters(5000);
