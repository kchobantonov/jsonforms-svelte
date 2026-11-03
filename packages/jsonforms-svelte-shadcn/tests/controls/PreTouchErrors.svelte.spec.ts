import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { createSpecPreTouchErrorsExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors/translations.json';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors/translations.supplement.json';

afterEach(cleanup);

it('lets a local keyword list override the form-wide pre-touch list', async () => {
  const example = createSpecPreTouchErrorsExample(() => 'en');
  const uischema = structuredClone(example.uischema) as UISchemaElement & {
    elements: {
      elements: { elements: { scope?: string; options?: Record<string, unknown> }[] }[];
    }[];
  };
  const legalName = uischema.elements[0].elements[0].elements.find(
    (element) => element.scope === '#/properties/legalName',
  )!;
  legalName.options = { filterErrorKeywordsBeforeTouch: ['server'] };
  const validity = vi.fn();
  await render(JsonForms, {
    props: {
      schema: example.schema as JsonSchema,
      uischema,
      data: structuredClone(example.data),
      i18n: example.i18n,
      config: {
        ...example.config,
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['required'],
      },
      additionalErrors: [
        {
          instancePath: '/legalName',
          schemaPath: '#/server',
          keyword: 'server',
          params: {},
          message: 'Server rejected the name',
        },
      ],
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onvaliditychange: validity,
    },
  });
  const panel = page.getByRole('tabpanel');
  await expect
    .element(panel.getByText(translations.en['error.required'], { exact: true }))
    .toBeVisible();
  expect(panel.getByText('Server rejected the name', { exact: true }).query()).toBeNull();
  expect(validity.mock.lastCall?.[0]).toMatchObject({ current: true, valid: false });
});

it.each(['en', 'bg'] as const)(
  'filters complete eligible errors until blur in %s',
  async (locale) => {
    const example = createSpecPreTouchErrorsExample(() => locale);
    const onchange = vi.fn();
    const validity = vi.fn();
    const hostMessage =
      locale === 'bg' ? 'Името не е одобрено от сървъра.' : 'The server did not approve this name.';
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: { ...example.config, enableFilterErrorsBeforeTouch: true },
        i18n: example.i18n,
        additionalErrors: [
          {
            instancePath: '/legalName',
            schemaPath: '#/server',
            keyword: 'server',
            params: {},
            message: hostMessage,
          },
        ],
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
        onvaliditychange: validity,
      },
    });
    const legalName = page.getByRole('textbox', {
      name: supplement[locale]['legalName.label'],
      exact: false,
    });
    const activePanel = page.getByRole('tabpanel');
    const required = translations[locale]['error.required'];
    await expect.element(page.getByText(hostMessage, { exact: true })).toBeVisible();
    const label = (legalName.query() as HTMLInputElement).labels?.[0];
    expect(label).toBeDefined();
    expect(getComputedStyle(label!).color).not.toBe(
      getComputedStyle(page.getByText(hostMessage, { exact: true }).query()!).color,
    );
    expect(activePanel.getByText(required, { exact: true }).query()).toBeNull();
    expect(validity.mock.lastCall?.[0]).toMatchObject({ current: true, valid: false });
    await legalName.click();
    expect(activePanel.getByText(required, { exact: true }).query()).toBeNull();
    await userEvent.tab();
    await expect.element(activePanel.getByText(required, { exact: false })).toBeVisible();
    expect(view.container.textContent).toContain(hostMessage);
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'required', params: { missingProperty: 'legalName' } }),
      ]),
    );
    const errors = validity.mock.lastCall?.[0].errors;
    await view.rerender({ validationMode: 'ValidateAndHide' });
    expect(validity.mock.lastCall?.[0]).toMatchObject({ current: true, valid: false, errors });
    await expect.element(page.getByText(hostMessage, { exact: true })).toBeVisible();
    expect(activePanel.getByText(required, { exact: false }).query()).toBeNull();
    await view.rerender({ validationMode: 'NoValidation' });
    await expect.element(page.getByText(hostMessage, { exact: true })).toBeVisible();
    expect(activePanel.getByText(required, { exact: false }).query()).toBeNull();
  },
);

it.each(['en', 'bg'] as const)(
  'treats an empty keyword list as hide-all while preserving a local opt-out in %s',
  async (locale) => {
    const example = createSpecPreTouchErrorsExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: {
          ...example.config,
          enableFilterErrorsBeforeTouch: true,
          filterErrorKeywordsBeforeTouch: [],
        },
        i18n: example.i18n,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const activePanel = page.getByRole('tabpanel');
    const required = activePanel.getByText(translations[locale]['error.required'], { exact: true });
    expect(required.query()).toBeNull();
    expect(
      activePanel
        .getByText(translations[locale]['memberNumber.error.pattern'], { exact: true })
        .query(),
    ).toBeNull();
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section2.label'],
        exact: true,
      })
      .click();
    await expect.element(required).toBeVisible();
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ keyword: 'required' })]),
    );
    await view.rerender({
      config: {
        ...example.config,
        enableFilterErrorsBeforeTouch: false,
        filterErrorKeywordsBeforeTouch: [],
      },
    });
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section1.label'],
        exact: true,
      })
      .click();
    await expect.element(required.first()).toBeVisible();
  },
);

it.each(['NoValidation', 'ValidateAndHide'] as const)(
  'keeps a host error on a literal dotted field out of its nested lookalike under %s',
  async (validationMode) => {
    await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            'a.b': { type: 'string', title: 'Literal key' },
            a: { type: 'object', properties: { b: { type: 'string', title: 'Nested key' } } },
          },
        } as JsonSchema,
        uischema: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/a.b' },
            { type: 'Control', scope: '#/properties/a/properties/b' },
          ],
        } as UISchemaElement,
        data: { 'a.b': 'literal', a: { b: 'nested' } },
        validationMode,
        additionalErrors: [
          {
            instancePath: '/a.b',
            schemaPath: '#/server',
            keyword: 'server',
            params: {},
            message: 'Host literal error',
          },
        ],
        renderers: shadcnRenderers,
        cells: shadcnCells,
      },
    });
    const literal = page.getByRole('textbox', { name: 'Literal key', exact: true });
    const nested = page.getByRole('textbox', { name: 'Nested key', exact: true });
    await expect.element(literal).toHaveAttribute('aria-invalid', 'true');
    await expect.element(nested).toHaveAttribute('aria-invalid', 'false');
    await expect.element(page.getByText('Host literal error', { exact: true })).toBeVisible();
  },
);
