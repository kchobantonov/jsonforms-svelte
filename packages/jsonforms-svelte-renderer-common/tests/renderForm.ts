import { controlFixture } from './controlFixture';
import { changeWaiters } from './formAssertions';
import { JsonForms, type UIDiagnosticSink } from '@chobantonov/jsonforms-svelte-renderer-common';
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  JsonFormsI18nState,
  UISchemaElement,
  ValidationMode,
} from '@jsonforms/core';
import type Ajv from 'ajv';
import { vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ControlledJsonForms from './fixtures/ControlledJsonForms.svelte';

type MountControlOptions = {
  propertySchema: JsonSchema;
  renderers: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  value?: unknown;
  options?: Record<string, unknown>;
  config?: Record<string, unknown>;
  required?: boolean;
  i18n?: JsonFormsI18nState;
  controlled?: boolean;
};

type MountFormOptions = {
  schema: JsonSchema;
  uischema: UISchemaElement;
  renderers: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  data?: unknown;
  ajv?: Ajv;
  config?: Record<string, unknown>;
  i18n?: JsonFormsI18nState;
  validationMode?: ValidationMode;
  ondiagnostic?: UIDiagnosticSink;
};

export const mountControl = async ({
  propertySchema,
  renderers,
  cells,
  value,
  options,
  config,
  required = false,
  i18n,
  controlled = false,
}: MountControlOptions) => {
  const fixture = controlFixture(propertySchema, value, options, required);
  const onchange = vi.fn();
  const view = await render(controlled ? ControlledJsonForms : JsonForms, {
    props: {
      ...fixture,
      renderers,
      cells,
      i18n,
      config,
      onchange,
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
  ajv,
  config,
  i18n,
  validationMode,
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
      ajv,
      config,
      i18n,
      validationMode,
      onchange,
      ondiagnostic,
    },
  });

  return { view, onchange };
};

export const { waitForChange, waitForFormChange } = changeWaiters(3000);
export {
  getBySelector,
  expectValidationError,
  expectLabelVisible,
  getButtonByText,
  getTabByText,
  getInputByLabel,
} from './formAssertions';
