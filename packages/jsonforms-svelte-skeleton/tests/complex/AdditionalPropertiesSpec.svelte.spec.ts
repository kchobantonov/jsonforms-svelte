import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { createAjv, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { createSpecAdditionalPropertiesExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-properties';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-properties/translations.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each([
  ['string', 'abc'],
  ['array', ['a', 'b']],
] as const)(
  'does not render %s members as dynamic keys and can replace invalid incoming data',
  async (_kind, readings) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            readings: {
              type: 'object',
              additionalProperties: { type: 'string' },
              maxProperties: 1,
            },
          },
        } as JsonSchema,
        uischema: { type: 'Control', scope: '#/properties/readings' },
        data: { readings },
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    expect(
      [...view.container.querySelectorAll('label')].some((label) => label.textContent === '0'),
    ).toBe(false);
    await page.getByRole('textbox', { name: 'Property Name' }).fill('sensor-a');
    await page.getByRole('button', { name: 'Add to readings button' }).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.readings).toEqual({ 'sensor-a': '' }),
    );
  },
);
it.each(['direct', 'referenced'] as const)(
  'adds a key whose %s pattern value schema is boolean true',
  async (source) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            readings: {
              type: 'object',
              additionalProperties: false,
              patternProperties: {
                '^sensor-':
                  source === 'direct' ? true : { $ref: '#/properties/readings/definitions/open' },
              },
              definitions: { open: true },
            },
          },
        } as unknown as JsonSchema,
        uischema: { type: 'Control', scope: '#/properties/readings' },
        data: {},
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    await page.getByRole('textbox', { name: 'Property Name' }).fill('sensor-a');
    await page.getByRole('button', { name: 'Add to readings button' }).click();
    await vi.waitFor(() =>
      expect(Object.hasOwn(onchange.mock.lastCall?.[0].data.readings ?? {}, 'sensor-a')).toBe(true),
    );
    expect(view.container.querySelector('[data-property-name-error]')).toBeNull();
  },
);
it('adds a key from boolean true additionalProperties when parent data is null', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { readings: { type: 'object', additionalProperties: true } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/readings' },
      data: { readings: null },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await page.getByRole('textbox', { name: 'Property Name' }).fill('sensor-a');
  await page.getByRole('button', { name: 'Add to readings button' }).click();
  await vi.waitFor(() =>
    expect(Object.hasOwn(onchange.mock.lastCall?.[0].data.readings ?? {}, 'sensor-a')).toBe(true),
  );
  expect(onchange.mock.lastCall?.[0].data.readings).toEqual({ 'sensor-a': '' });
});
it.each(['en', 'bg'] as const)(
  'shows host validator format errors and a translated Add label for invalid Add and Rename names in %s',
  async (locale) => {
    const example = createSpecAdditionalPropertiesExample(() => locale);
    const ajv = createAjv();
    ajv.addFormat('team-name', /^team-/);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            readings: {
              type: 'object',
              propertyNames: { format: 'team-name' },
              additionalProperties: true,
            },
          },
        } as JsonSchema,
        uischema: { type: 'Control', scope: '#/properties/readings' },
        data: { readings: { 'team-old': 'kept' } },
        ajv,
        i18n: example.i18n,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    expect(input.labels?.[0]?.textContent).toContain(
      messages[locale]['additionalProperties.propertyNameLabel'],
    );
    input.value = 'draft';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.waitFor(() => expect(view.container.textContent).toContain('team-name'));
    const addName =
      messages[locale]['additionalProperties.addAriaLabelWithValue'].split('{value}')[0];
    expect(
      [...view.container.querySelectorAll<HTMLButtonElement>('button[aria-label]')].find((button) =>
        button.getAttribute('aria-label')?.startsWith(addName),
      )?.disabled,
    ).toBe(true);
    const renameName = messages[locale]['additionalProperties.renameAriaLabel'];
    view.container.querySelector<HTMLButtonElement>(`button[aria-label="${renameName}"]`)!.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector<HTMLInputElement>('[id$="-rename-property"]')?.checkVisibility(),
      ).toBe(true),
    );
    const rename = document.querySelector<HTMLInputElement>('[id$="-rename-property"]')!;
    rename.value = 'draft';
    rename.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.waitFor(() =>
      expect(document.querySelector('[role="dialog"]')?.textContent).toContain('team-name'),
    );
    expect(document.querySelector<HTMLButtonElement>('form button[type="submit"]')?.disabled).toBe(
      true,
    );
    expect(onchange.mock.lastCall?.[0].data.readings).toEqual({ 'team-old': 'kept' });
  },
);
it.each(['direct', 'referenced'] as const)(
  'retains a key forbidden by a %s boolean false value schema for validation feedback',
  async (source) => {
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            readings: {
              type: 'object',
              additionalProperties: false,
              patternProperties: {
                '^sensor-':
                  source === 'direct'
                    ? false
                    : { $ref: '#/properties/readings/definitions/closed' },
              },
              definitions: { closed: false },
            },
          },
        } as unknown as JsonSchema,
        uischema: { type: 'Control', scope: '#/properties/readings' },
        data: {},
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    await page.getByRole('textbox', { name: 'Property Name' }).fill('sensor-a');
    await page.getByRole('button', { name: 'Add to readings button' }).click();
    await vi.waitFor(() =>
      expect(Object.hasOwn(onchange.mock.lastCall?.[0].data.readings ?? {}, 'sensor-a')).toBe(true),
    );
    expect(
      onchange.mock.lastCall?.[0].errors.some(
        (error: { instancePath: string }) => error.instancePath === '/readings/sensor-a',
      ),
    ).toBe(true);
  },
);
it.each(['en', 'bg'] as const)(
  'edits canonical literal keys without changing their neighbors in %s',
  async (locale) => {
    const example = createSpecAdditionalPropertiesExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const tab = (key: keyof typeof translations.en) =>
      (
        page
          .getByRole('tab', { name: translations[locale][key], exact: true })
          .element() as HTMLElement
      ).click();
    tab('featureNavigation.section2.label');
    const dotted = page.getByRole('textbox', { name: 'legacy.key', exact: true });
    await expect.element(dotted).toHaveValue('written by the old project system');
    await dotted.fill('Edited literal key');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.annotations['legacy.key']).toBe('Edited literal key'),
    );
    expect(onchange.mock.lastCall![0].data.annotations.legacy).toBeUndefined();
    expect(onchange.mock.lastCall![0].data.annotations['notes/1']).toBe(
      'a slash is an ordinary character in a key',
    );
    tab('featureNavigation.section1.label');
    let empty: HTMLInputElement | undefined;
    await vi.waitFor(() => {
      empty = [...view.container.querySelectorAll('input')].find(
        (input) => input.value === 'unnamed label',
      );
      expect(empty).toBeDefined();
    });
    await page.elementLocator(empty!).fill('Edited empty key');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.labels['']).toBe('Edited empty key'),
    );
    expect(onchange.mock.lastCall![0].data.labels['items[0]']).toBe('crate');
    expect(onchange.mock.lastCall![0].data.labels['  spaced  ']).toBe('kept exactly');
    expect(onchange.mock.lastCall![0].data.labels['2024']).toBe('season');
  },
);

it('marks the imported propertyNames failure on sensor-x itself', async () => {
  const example = createSpecAdditionalPropertiesExample(() => 'en');
  const view = await render(JsonForms, {
    props: {
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data: structuredClone(example.data),
      config: example.config,
      i18n: example.i18n,
      renderers: skeletonRenderers,
      cells: skeletonCells,
    },
  });
  const label = [...view.container.querySelectorAll('label')].find(
    (candidate) => candidate.textContent?.trim() === 'sensor-x',
  );
  expect(label).toBeDefined();
  const row = label!.closest('.property-name-invalid');
  expect(row).not.toBeNull();
  const indicator = row!.querySelector('[data-property-name-error]');
  expect(indicator).not.toBeNull();
  expect(indicator!.querySelector('button')).not.toBeNull();
  expect(row!.querySelector('input')?.value).toBe('9.1');
  const validLabel = [...view.container.querySelectorAll('label')].find(
    (candidate) => candidate.textContent?.trim() === 'sensor-deck-a',
  );
  expect(getComputedStyle(label!).color).not.toBe(getComputedStyle(validLabel!).color);
});

it('shows the propertyNames constraint message while adding a new key', async () => {
  const example = createSpecAdditionalPropertiesExample(() => 'en');
  await render(JsonForms, {
    props: {
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data: structuredClone(example.data),
      config: example.config,
      i18n: example.i18n,
      renderers: skeletonRenderers,
      cells: skeletonCells,
    },
  });
  const name = page
    .getByRole('group', { name: 'Telemetry readings' })
    .getByRole('textbox', { name: 'Property Name', exact: true });
  await name.fill('sensor-z');
  const alert = page.getByRole('group', { name: 'Telemetry readings' }).getByRole('alert');
  await expect.element(alert).toBeVisible();
  expect(alert.element().textContent?.match(/Use at least 9 characters\./g)).toHaveLength(1);
});

it('creates a missing dynamic object when adding its first property', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          readings: { type: 'object', additionalProperties: { type: 'string' } },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/readings' },
      data: {},
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await page.getByRole('textbox', { name: 'Property Name' }).fill('first');
  await page.getByRole('button', { name: 'Add to readings button' }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ readings: { first: '' } }),
  );
});

it('adds only keys matching patternProperties when additionalProperties is false', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          readings: {
            type: 'object',
            additionalProperties: false,
            patternProperties: { '^x-': { type: 'string' } },
          },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/readings' },
      data: { readings: {} },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const name = page.getByRole('textbox', { name: 'Property Name' });
  const add = page.getByRole('button', { name: 'Add to readings button' });
  await name.fill('other');
  await expect.element(add).toBeDisabled();
  await name.fill('x-one');
  await expect.element(add).toBeEnabled();
  await add.click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ readings: { 'x-one': '' } }),
  );
});

it('adds literal empty and whitespace keys when empty names are allowed', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          labels: { type: 'object', additionalProperties: { type: 'string' } },
        },
      } as JsonSchema,
      uischema: {
        type: 'Control',
        scope: '#/properties/labels',
        options: { allowEmptyPropertyNames: true },
      },
      data: { labels: {} },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const add = page.getByRole('button', { name: 'Add to labels button' });
  await expect.element(add).toBeEnabled();
  await add.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.labels).toHaveProperty('', ''));
  const name = page.getByRole('textbox', { name: 'Property Name' });
  await name.fill('   ');
  await expect.element(add).toBeEnabled();
  await add.click();
  await vi.waitFor(() =>
    expect(Object.keys(onchange.mock.lastCall?.[0].data.labels ?? {})).toEqual(['', '   ']),
  );
});

it('edits an additional property through every matching pattern constraint', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          readings: {
            type: 'object',
            patternProperties: {
              '^price_': { type: 'number', minimum: 0, maximum: 2000 },
              _total$: { minimum: 10, maximum: 1000 },
            },
            additionalProperties: { type: 'string' },
          },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/readings' },
      data: { readings: { price_total: 4 } },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[type="number"]');
  expect(input?.value).toBe('4');
  expect(onchange.mock.lastCall?.[0].errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ keyword: 'minimum', instancePath: '/readings/price_total' }),
    ]),
  );
  await page.elementLocator(input!).fill('12');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.readings.price_total).toBe(12));
  expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
});

it('adds a key matching two numeric patterns and edits it through their intersection', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          readings: {
            type: 'object',
            patternProperties: {
              '^price_': { type: 'number', minimum: 0, maximum: 2000 },
              _total$: { minimum: 10, maximum: 1000 },
            },
            additionalProperties: false,
          },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/readings' },
      data: { readings: {} },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await page.getByRole('textbox', { name: 'Property Name' }).fill('price_total');
  await page.getByRole('button', { name: 'Add to readings button' }).click();
  await vi.waitFor(() =>
    expect(Object.hasOwn(onchange.mock.lastCall?.[0].data.readings ?? {}, 'price_total')).toBe(
      true,
    ),
  );
  const input = view.container.querySelector<HTMLInputElement>('input[type="number"]');
  expect(input).not.toBeNull();
  await page.elementLocator(input!).fill('12');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.readings.price_total).toBe(12));
  expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
});

it('resolves a root propertyNames reference before adding a key', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        $defs: { key: { type: 'string', minLength: 9, pattern: '^sensor-' } },
        properties: {
          telemetry: {
            type: 'object',
            propertyNames: { $ref: '#/$defs/key' },
            additionalProperties: { type: 'string' },
          },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/telemetry' },
      data: { telemetry: {} },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const name = page.getByRole('textbox', { name: 'Property Name' });
  const add = page.getByRole('button', { name: 'Add to telemetry button' });
  await name.fill('sensor-x');
  await expect.element(add).toBeDisabled();
  await name.fill('sensor-deck-a');
  await expect.element(add).toBeEnabled();
  await add.click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ telemetry: { 'sensor-deck-a': '' } }),
  );
});

it('retains an editable field when matching patterns require a conjunctive schema', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          readings: {
            type: 'object',
            patternProperties: {
              '^ref_': { type: 'string', pattern: '^A' },
              _id$: { type: 'string', pattern: 'Z$' },
            },
            additionalProperties: { type: 'number' },
          },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/readings' },
      data: { readings: { ref_id: 'no' } },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const input = [...view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')].find(
    (candidate) => candidate.value === 'no',
  );
  expect(input).toBeDefined();
  expect(onchange.mock.lastCall?.[0].errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ keyword: 'pattern', instancePath: '/readings/ref_id' }),
    ]),
  );
  await page.elementLocator(input!).fill('ABZ');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.readings.ref_id).toBe('ABZ'));
  expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
});
