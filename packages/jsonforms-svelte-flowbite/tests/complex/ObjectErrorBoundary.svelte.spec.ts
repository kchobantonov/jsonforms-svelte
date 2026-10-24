import '../test.css';
import { JsonForms, createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import type { ControlElement, JsonSchema7, Layout, ValidationMode } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';

afterEach(cleanup);
const schema: JsonSchema7 = {
  type: 'object',
  properties: {
    profile: {
      type: 'object',
      title: 'Profile',
      minProperties: 1,
      required: ['name'],
      properties: { name: { type: 'string', title: 'Name' } },
    },
  },
};
const detail: Layout = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/name' } as ControlElement],
};
const host: ErrorObject = {
  keyword: 'server',
  instancePath: '/profile',
  schemaPath: '#/server',
  params: {},
  message: 'Profile needs review',
};

it('shows direct messages above an unframed detail without repeating child errors', async () => {
  const { container } = await render(JsonForms, {
    props: {
      schema,
      data: { profile: {} },
      uischema: {
        type: 'Control',
        scope: '#/properties/profile',
        options: { detail },
      } as ControlElement,
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
    },
  });
  const direct = container.querySelector('[data-object-own-errors]')!;
  expect(direct.getAttribute('role')).toBe('alert');
  expect(direct.textContent).toContain('must NOT have fewer than 1 properties');
  expect(direct.textContent).not.toContain('required');
  expect(
    direct.compareDocumentPosition(
      page.getByRole('textbox', { name: 'Name', exact: false }).element(),
    ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

it.each(['ValidateAndHide', 'NoValidation'] satisfies ValidationMode[])(
  'retains host object feedback in %s and assigns it only to the outer Group',
  async (validationMode) => {
    const { container } = await render(JsonForms, {
      props: {
        schema,
        data: { profile: {} },
        validationMode,
        additionalErrors: [host],
        config: { showValidationIndicator: true },
        uischema: {
          type: 'Control',
          scope: '#/properties/profile',
          options: {
            detail: {
              type: 'Group',
              label: 'Outer',
              elements: [{ type: 'Group', label: 'Inner', elements: detail.elements }],
            },
          },
        } as ControlElement,
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
      },
    });
    const marker = page.getByRole('img', { name: host.message!, exact: true });
    await expect.element(marker).toBeVisible();
    expect(marker.element().closest('h3')?.textContent).toContain('Outer');
    expect(container.querySelectorAll('[data-object-own-errors]')).toHaveLength(1);
    expect(container.textContent).not.toContain('must NOT have fewer');
  },
);

it.each([undefined, detail])(
  'honors title suppression with a host locale and detail %j',
  async (detail) => {
    await render(JsonForms, {
      props: {
        schema,
        data: { profile: { name: 'Ada' } },
        uischema: {
          type: 'Control',
          scope: '#/properties/profile',
          label: false,
          options: { detail },
        } as ControlElement,
        i18n: {
          locale: 'fr-CA',
          translate: createCatalogTranslator('fr-CA', { 'fr-CA': { 'profile.label': 'Profil' } }),
        },
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
      },
    });
    await expect
      .element(page.getByRole('textbox', { name: 'Name', exact: false }))
      .toHaveValue('Ada');
    expect(page.getByRole('heading', { name: 'Profil', exact: true }).query()).toBeNull();
  },
);
