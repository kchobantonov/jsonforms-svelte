import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import JsonForms from '../../src/lib/components/JsonForms.svelte';
import { templateLayoutRendererEntry } from '../../src/lib/layouts';
import CaptureRenderer from '../fixtures/CaptureRenderer.svelte';

const captureRendererEntry: JsonFormsRendererRegistryEntry = {
  tester: () => 1,
  renderer: CaptureRenderer,
};

const schema: JsonSchema = {
  type: 'object',
  properties: {
    value: { type: 'string' },
  },
};

const createUiSchema = (): UISchemaElement =>
  ({
    type: 'TemplateLayout',
    template:
      '<section><h1>{{translate("title", "Template Title")}}</h1><div class="value">{{data.value}}</div>{{>field}}</section>',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/value',
        name: 'field',
      },
    ],
  }) as unknown as UISchemaElement;

describe('TemplateLayoutRenderer', () => {
  it('renders template content and mounts named child renderers into placeholders', async () => {
    render(JsonForms, {
      props: {
        data: { value: 'Initial value' },
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        schema,
        uischema: createUiSchema(),
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });

    await expect.element(page.getByText('Template Title')).toBeInTheDocument();
    await expect.element(page.getByText('Initial value')).toBeInTheDocument();
    await expect.element(page.getByTestId('uischema-json')).toHaveTextContent('#/properties/value');
  });

  it('updates the rendered template when form data changes', async () => {
    const view = render(JsonForms, {
      props: {
        data: { value: 'Before' },
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        schema,
        uischema: createUiSchema(),
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });

    await expect.element(page.getByText('Before')).toBeInTheDocument();
    const originalNode = page.getByText('Before', { exact: true }).element();

    await view.rerender({ data: { value: 'After' } });

    await expect.element(page.getByText('After')).toBeInTheDocument();
    expect(page.getByText('After', { exact: true }).element()).toBe(originalNode);
  });

  it('shows a template error when the Ractive template is invalid', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(JsonForms, {
      props: {
        data: { value: 'Broken' },
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        schema,
        uischema: {
          type: 'TemplateLayout',
          template: '{{#if data.value}}',
          elements: [],
        } as unknown as UISchemaElement,
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });

    await expect.element(page.getByRole('alert')).toBeInTheDocument();
    await expect.element(page.getByRole('alert')).toHaveTextContent('Template Error');

    consoleError.mockRestore();
  });
});

it('requires permission, supports a host translation, and tears down on revocation', async () => {
  const view = render(JsonForms, {
    props: {
      data: { value: 'Permitted template content' },
      schema,
      uischema: createUiSchema(),
      renderers: [templateLayoutRendererEntry, captureRendererEntry],
      i18n: {
        locale: 'fr',
        translate: createCatalogTranslator('fr', {
          fr: { 'template.evaluationDisabled': 'Permission requise' },
        }),
      },
    },
  });
  await expect.element(page.getByRole('alert')).toHaveTextContent('Permission requise');
  await expect.element(page.getByText('Permitted template content')).not.toBeInTheDocument();
  await view.rerender({
    config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
  });
  await expect.element(page.getByText('Permitted template content')).toBeInTheDocument();
  await view.rerender({ config: {} });
  await expect.element(page.getByRole('alert')).toHaveTextContent('Permission requise');
  await expect.element(page.getByText('Permitted template content')).not.toBeInTheDocument();
});

it.each(['en', 'bg'] as const)(
  'diagnoses unsupported language without interpreting source and recovers in %s',
  async (locale) => {
    const uischema = { ...createUiSchema(), lang: 'unavailable' } as unknown as UISchemaElement;
    const view = render(JsonForms, {
      props: {
        data: { value: 'Retained' },
        schema,
        uischema,
        i18n: { locale },
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });
    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent(
        messages[locale]['template.unsupportedLanguage'].replace('{language}', 'unavailable'),
      );
    expect(view.container.textContent).not.toContain('Template Title');
    await view.rerender({
      uischema: { ...uischema, lang: 'ractive' } as unknown as UISchemaElement,
    });
    await expect.element(page.getByText('Retained', { exact: true })).toBeVisible();
    await view.rerender({
      uischema: { ...uischema, lang: 'unavailable' } as unknown as UISchemaElement,
    });
    await expect.element(page.getByRole('alert')).toBeVisible();
    await vi.waitFor(() => expect(view.container.querySelector('[data-slot]')).toBeNull());
  },
);

it('reserves explicit child names before assigning index fallback names and diagnoses duplicates', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const view = render(JsonForms, {
      props: {
        schema,
        data: {},
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        uischema: {
          type: 'TemplateLayout',
          template: '{{>1}}{{>0}}',
          elements: [
            { type: 'Control', scope: '#/properties/unnamed' },
            { type: 'Control', scope: '#/properties/explicit', name: '0' },
            { type: 'Control', scope: '#/properties/duplicate', name: '0' },
          ],
        } as unknown as UISchemaElement,
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelectorAll('[data-testid="uischema-json"]')).toHaveLength(2),
    );
    const rendered = [...view.container.querySelectorAll('[data-testid="uischema-json"]')].map(
      (el) => JSON.parse(el.textContent ?? '{}'),
    );
    expect(rendered).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ scope: '#/properties/unnamed', name: '1' }),
        expect.objectContaining({ scope: '#/properties/explicit', name: '0' }),
      ]),
    );
    expect(warning).toHaveBeenCalledWith('template.duplicateChild: "0"');
  } finally {
    warning.mockRestore();
  }
});

it('refreshes live context capabilities without substituting schema errors for combined validity', async () => {
  const view = render(JsonForms, {
    props: {
      schema,
      data: { value: 'Retained' },
      config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
      context: { status: 'Before' },
      uischema: {
        type: 'TemplateLayout',
        template:
          '<p data-context>{{context.status}} / {{context.readonly}} / {{context.additionalErrors.length}}</p><p data-core-errors>{{errors.length}}</p>',
        elements: [],
      } as unknown as UISchemaElement,
      renderers: [templateLayoutRendererEntry],
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-context]')?.textContent).toBe('Before / false / 0'),
  );
  await view.rerender({
    context: { status: 'After' },
    readonly: true,
    additionalErrors: [
      {
        instancePath: '/value',
        schemaPath: '',
        keyword: 'server',
        params: {},
        message: 'Rejected',
      },
    ],
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-context]')?.textContent).toBe('After / true / 1'),
  );
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-core-errors]')?.textContent).toBe('0'),
  );
});

it('rechecks template URLs when host policy changes and restores newly permitted bindings', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const config = { jsonformsExtended: { security: { allowScriptEvaluation: true } } };
  const view = render(JsonForms, {
    props: {
      data: { url: 'mailto:example@example.org' },
      schema: { type: 'object' },
      config,
      uischema: {
        type: 'TemplateLayout',
        template: '<a href="{{data.url}}" target="_blank">Mail</a>',
      } as unknown as UISchemaElement,
      renderers: [templateLayoutRendererEntry],
    },
  });
  try {
    await expect
      .element(page.getByRole('link', { name: 'Mail' }))
      .toHaveAttribute('href', 'mailto:example@example.org');
    await view.rerender({
      config: {
        jsonformsExtended: {
          security: { allowScriptEvaluation: true, urlPolicy: { allowedSchemes: ['https'] } },
        },
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('a')?.hasAttribute('href')).toBe(false),
    );
    expect(warn).toHaveBeenCalledWith('template.urlRefused: href');
    await view.rerender({ config });
    await expect
      .element(page.getByRole('link', { name: 'Mail' }))
      .toHaveAttribute('href', 'mailto:example@example.org');
    expect(view.container.querySelector('a')?.rel).toContain('noopener');
  } finally {
    await view.unmount();
    warn.mockRestore();
  }
});

it('keeps the surviving repeated placeholder editor when an earlier occurrence disappears', async () => {
  const view = render(JsonForms, {
    props: {
      data: { first: true },
      schema: { type: 'object' },
      config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
      uischema: {
        type: 'TemplateLayout',
        template: '{{#if data.first}}{{>field}}{{/if}}{{>field}}',
        elements: [{ type: 'Control', scope: '#', name: 'field' }],
      } as unknown as UISchemaElement,
      renderers: [templateLayoutRendererEntry, captureRendererEntry],
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('[data-testid="uischema-json"]')).toHaveLength(2),
  );
  const surviving = view.container.querySelectorAll('[data-testid="uischema-json"]')[1];
  await view.rerender({ data: { first: false } });
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('[data-testid="uischema-json"]')).toHaveLength(1),
  );
  expect(view.container.querySelector('[data-testid="uischema-json"]')).toBe(surviving);
});
