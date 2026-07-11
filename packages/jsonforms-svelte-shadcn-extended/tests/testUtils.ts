import { JsonForms, type ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
import {
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

export type ChangeEvent = {
  data: { value?: unknown };
  errors: unknown[];
};

export type FormChangeEvent = {
  data: Record<string, unknown>;
  errors: unknown[];
};

type MountControlOptions = {
  propertySchema: JsonSchema;
  renderers: JsonFormsRendererRegistryEntry[];
  value?: unknown;
  options?: Record<string, unknown>;
  required?: boolean;
};

type MountFormOptions = {
  schema: JsonSchema;
  uischema: UISchemaElement;
  renderers: JsonFormsRendererRegistryEntry[];
  data?: Record<string, unknown>;
  onhandleaction?: (event: ActionEvent) => void | Promise<void>;
};

export const mountControl = ({
  propertySchema,
  renderers,
  value,
  options,
  required = false,
}: MountControlOptions) => {
  const schema = {
    type: 'object',
    properties: {
      // JsonForms' JsonSchema type is a draft-04/draft-07 union. Keep this helper draft-agnostic.
      value: propertySchema as unknown as JsonSchema,
    },
    ...(required ? { required: ['value'] } : {}),
  } as JsonSchema;

  const uischema: UISchemaElement = {
    type: 'Control',
    scope: '#/properties/value',
    ...(options ? { options } : {}),
  };

  const data = value === undefined ? {} : { value };
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      data,
      schema,
      uischema,
      renderers,
      onchange,
    },
  });

  return { view, onchange };
};

export const mountForm = ({
  schema,
  uischema,
  renderers,
  data,
  onhandleaction,
}: MountFormOptions) => {
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      data: data ?? {},
      schema,
      uischema,
      renderers,
      onchange,
      onhandleaction,
    },
  });

  return { view, onchange };
};

export const waitForChange = async (onchange: ReturnType<typeof vi.fn>, previousCalls: number) => {
  await vi.waitFor(
    () => {
      expect(onchange.mock.calls.length).toBeGreaterThan(previousCalls);
    },
    { timeout: 5000 },
  );

  return onchange.mock.lastCall?.[0] as ChangeEvent;
};

export const waitForFormChange = async (
  onchange: ReturnType<typeof vi.fn>,
  previousCalls: number,
) => {
  await vi.waitFor(
    () => {
      expect(onchange.mock.calls.length).toBeGreaterThan(previousCalls);
    },
    { timeout: 5000 },
  );

  return onchange.mock.lastCall?.[0] as FormChangeEvent;
};

export const expectLabelVisible = (container: HTMLElement, expectedLabel: string) => {
  const labels = Array.from(container.querySelectorAll('label'))
    .map((label) => (label.textContent ?? '').trim())
    .filter((label) => label.length > 0);

  expect(labels.some((label) => label === expectedLabel)).toBe(true);
};
