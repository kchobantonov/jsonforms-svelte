import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
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
      // JsonForms' JsonSchema type is a union of draft-04 and draft-07,
      // while `properties` is draft-specific. Keep the test utility draft-agnostic.
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

export const mountForm = ({ schema, uischema, renderers, data }: MountFormOptions) => {
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      data: data ?? {},
      schema,
      uischema,
      renderers,
      onchange,
    },
  });

  return { view, onchange };
};

export const waitForChange = async (onchange: ReturnType<typeof vi.fn>, previousCalls: number) => {
  await vi.waitFor(
    () => {
      expect(onchange.mock.calls.length).toBeGreaterThan(previousCalls);
    },
    { timeout: 3000 },
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
    { timeout: 3000 },
  );

  return onchange.mock.lastCall?.[0] as FormChangeEvent;
};

export const getBySelector = <T extends Element>(container: HTMLElement, selector: string): T => {
  const element = container.querySelector(selector);
  expect(element).toBeTruthy();
  return element as T;
};

export const expectValidationError = (container: HTMLElement) => {
  const input = getBySelector<HTMLElement>(container, '[aria-invalid]');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const validationMessage = getBySelector<HTMLElement>(container, '[role="alert"]');
  expect((validationMessage.textContent ?? '').trim().length).toBeGreaterThan(0);
};

export const expectLabelVisible = (container: HTMLElement, expectedLabel: string) => {
  const nonEmptyLabels = Array.from(container.querySelectorAll('label'))
    .map((label) => (label.textContent ?? '').trim())
    .filter((label) => label.length > 0);
  expect(nonEmptyLabels.some((label) => label === expectedLabel)).toBe(true);
};

export const getButtonByText = (container: HTMLElement, text: string): HTMLButtonElement => {
  const expected = text.trim().toLowerCase();
  const buttons = Array.from(container.querySelectorAll('button'));
  const button =
    buttons.find((candidate) => (candidate.textContent ?? '').trim().toLowerCase() === expected) ??
    buttons.find((candidate) =>
      (candidate.textContent ?? '').trim().toLowerCase().includes(expected),
    );

  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
};

export const getTabByText = (container: HTMLElement, text: string): HTMLButtonElement => {
  const expected = text.trim().toLowerCase();
  const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('button[role="tab"]'));
  const tab =
    tabs.find((candidate) => (candidate.textContent ?? '').trim().toLowerCase() === expected) ??
    tabs.find((candidate) => (candidate.textContent ?? '').trim().toLowerCase().includes(expected));

  expect(tab).toBeTruthy();
  return tab as HTMLButtonElement;
};

export const getInputByLabel = (container: HTMLElement, labelText: string): HTMLInputElement => {
  const label = Array.from(container.querySelectorAll<HTMLLabelElement>('label')).find(
    (candidate) => {
      return (candidate.textContent ?? '').trim() === labelText;
    },
  );
  expect(label).toBeTruthy();

  const id = label?.getAttribute('for');
  expect(id).toBeTruthy();

  const input = container.querySelector<HTMLInputElement>(`#${CSS.escape(id as string)}`);
  expect(input).toBeTruthy();
  return input as HTMLInputElement;
};
