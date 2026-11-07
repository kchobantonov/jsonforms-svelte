import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { createCatalogTranslator, type UIDiagnostic } from '@chobantonov/jsonforms-svelte';
import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
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
  it('renders JSX expressions and preserves delegated children across data updates', async () => {
    const view = await render(JsonForms, {
      props: {
        data: { value: 'Before' },
        schema,
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        uischema: {
          type: 'TemplateLayout',
          lang: 'jsx',
          template:
            '<section><p data-value>{data.value}</p><div>{elements["field"]}</div></section>',
          elements: [{ type: 'Control', scope: '#/properties/value', name: 'field' }],
        } as unknown as UISchemaElement,
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-value]')?.textContent).toBe('Before'),
    );
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-testid="uischema-json"]')).not.toBeNull(),
    );
    const child = view.container.querySelector('[data-testid="uischema-json"]');
    await view.rerender({ data: { value: 'After' } });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-value]')?.textContent).toBe('After'),
    );
    expect(view.container.querySelector('[data-testid="uischema-json"]')).toBe(child);
  });

  it('resolves JSX from config and reports malformed source without leaving stale content', async () => {
    const ondiagnostic = vi.fn();
    const view = await render(JsonForms, {
      props: {
        data: { value: 'Initial' },
        schema,
        config: {
          jsonformsExtended: {
            defaultTemplateLang: 'jsx',
            security: { allowScriptEvaluation: true },
          },
        },
        uischema: {
          type: 'TemplateLayout',
          template: '<p data-value>{data.value}</p>',
          elements: [],
        } as unknown as UISchemaElement,
        renderers: [templateLayoutRendererEntry],
        ondiagnostic,
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-value]')?.textContent).toBe('Initial'),
    );
    await view.rerender({
      uischema: {
        type: 'TemplateLayout',
        template: '<p>{data.value',
        elements: [],
      } as unknown as UISchemaElement,
    });
    await vi.waitFor(() =>
      expect(ondiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'template.renderFailed',
          details: expect.objectContaining({ kind: 'jsx' }),
        }),
      ),
    );
    await expect.element(page.getByRole('alert')).toBeVisible();
    expect(view.container.querySelector('[data-value]')).toBeNull();
    await view.rerender({
      uischema: {
        type: 'TemplateLayout',
        template: '<p data-value>{data.value}</p>',
        elements: [],
      } as unknown as UISchemaElement,
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-value]')?.textContent).toBe('Initial'),
    );
  });

  it('gates JSX evaluation and removes template DOM when permission is revoked', async () => {
    const view = await render(JsonForms, {
      props: {
        data: { value: 'Visible' },
        schema,
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        uischema: {
          type: 'TemplateLayout',
          lang: 'jsx',
          template: '<><p data-value>{data.value}</p><a href="javascript:alert(1)">Link</a></>',
          elements: [],
        } as unknown as UISchemaElement,
        renderers: [templateLayoutRendererEntry],
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-value]')?.textContent).toBe('Visible'),
    );
    expect(view.container.querySelector('a')?.hasAttribute('href')).toBe(false);
    await view.rerender({
      config: { jsonformsExtended: { security: { allowScriptEvaluation: false } } },
    });
    await expect.element(page.getByRole('alert')).toBeVisible();
    expect(view.container.querySelector('[data-value]')).toBeNull();
  });

  it('renders template content and mounts named child renderers into placeholders', async () => {
    await render(JsonForms, {
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
    await expect
      .element(page.getByTestId('uischema-json'))
      .toMatchTextContent('#/properties/value');
  });

  it('updates a named slot when its child descriptor changes under the same name', async () => {
    const initial = createUiSchema();
    const view = await render(JsonForms, {
      props: {
        data: { value: 'First', other: 'Second' },
        schema: {
          type: 'object',
          properties: { value: { type: 'string' }, other: { type: 'string' } },
        },
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        uischema: initial,
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
      },
    });
    const descriptor = () =>
      JSON.parse(
        view.container.querySelector('[data-testid="uischema-json"]')?.textContent ?? '{}',
      );
    await expect.poll(() => descriptor().scope).toBe('#/properties/value');
    await view.rerender({
      uischema: {
        ...initial,
        elements: [{ type: 'Control', name: 'field', scope: '#/properties/other' }],
      } as unknown as UISchemaElement,
    });
    await expect.poll(() => descriptor().scope).toBe('#/properties/other');
  });

  it('updates the rendered template when form data changes', async () => {
    const view = await render(JsonForms, {
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

  // conformance/behavior.json: template-data-subscription-replacement
  it('keeps literal and nested template reads distinct after data replacement', async () => {
    const view = await render(JsonForms, {
      props: {
        data: { 'a.b': 'literal', a: { b: 'nested' } },
        schema: { type: 'object' },
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        uischema: {
          type: 'TemplateLayout',
          template: '<p data-literal>{{data["a.b"]}}</p><p data-nested>{{data.a.b}}</p>',
        } as unknown as UISchemaElement,
        renderers: [templateLayoutRendererEntry],
      },
    });
    const text = (selector: string) => view.container.querySelector(selector)?.textContent;
    await vi.waitFor(() => expect(text('[data-literal]')).toBe('literal'));
    expect(text('[data-nested]')).toBe('nested');

    await view.rerender({ data: { 'a.b': 'replaced', a: { b: 'new' } } });
    await vi.waitFor(() => expect(text('[data-literal]')).toBe('replaced'));
    expect(text('[data-nested]')).toBe('new');
  });

  it('shows a template error when the Ractive template is invalid', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ondiagnostic = vi.fn();

    const view = await render(JsonForms, {
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
        ondiagnostic,
      },
    });

    await expect.element(page.getByRole('alert')).toBeInTheDocument();
    await expect.element(page.getByRole('alert')).toMatchTextContent('Template Error');
    expect(view.container.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Template Error',
    );
    await vi.waitFor(() =>
      expect(ondiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'template.renderFailed',
          severity: 'error',
          details: expect.objectContaining({ path: '', kind: 'ractive' }),
        }),
      ),
    );

    const failureCount = () =>
      ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'template.renderFailed')
        .length;
    expect(failureCount()).toBe(1);
    await view.rerender({ data: { value: 'Still broken' } });
    expect(failureCount()).toBe(1);
    await view.rerender({
      uischema: {
        type: 'TemplateLayout',
        template: '{{/if}}',
        elements: [],
      } as unknown as UISchemaElement,
    });
    await vi.waitFor(() => expect(failureCount()).toBe(2));
    await view.rerender({
      uischema: {
        type: 'TemplateLayout',
        template: '<p data-value>{{data.value}}</p>',
        elements: [],
      } as unknown as UISchemaElement,
    });
    await vi.waitFor(() => expect(view.container.querySelector('[data-value]')).not.toBeNull());
    await view.rerender({
      uischema: {
        type: 'TemplateLayout',
        template: '{{/if}}',
        elements: [],
      } as unknown as UISchemaElement,
    });
    await vi.waitFor(() => expect(failureCount()).toBe(3));

    consoleError.mockRestore();
  });
});

it('requires permission, supports a host translation, and tears down on revocation', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const ondiagnostic = vi.fn();
  try {
    const view = await render(JsonForms, {
      props: {
        data: { value: 'Permitted template content' },
        schema,
        uischema: createUiSchema(),
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
        ondiagnostic,
        i18n: {
          locale: 'fr',
          translate: createCatalogTranslator('fr', {
            fr: { 'template.evaluationDisabled': 'Permission requise' },
          }),
        },
      },
    });
    await expect.element(page.getByRole('alert')).toMatchTextContent('Permission requise');
    await expect.element(page.getByText('Permitted template content')).not.toBeInTheDocument();
    expect(warning).toHaveBeenCalledWith('script.evaluationDisabled', {
      severity: 'warning',
      message: 'Template script evaluation is disabled by host policy.',
      details: { capability: 'template', path: '' },
    });
    await view.rerender({
      config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
    });
    await expect.element(page.getByText('Permitted template content')).toBeInTheDocument();
    await view.rerender({ config: {} });
    await expect.element(page.getByRole('alert')).toMatchTextContent('Permission requise');
    await expect.element(page.getByText('Permitted template content')).not.toBeInTheDocument();
    expect(
      warning.mock.calls.filter(([code]) => code === 'script.evaluationDisabled'),
    ).toHaveLength(2);
    expect(
      ondiagnostic.mock.calls.filter(
        ([diagnostic]) => diagnostic.code === 'script.evaluationDisabled',
      ),
    ).toHaveLength(2);
  } finally {
    warning.mockRestore();
  }
});

it.each(['en', 'bg'] as const)(
  'diagnoses unsupported language without interpreting source and recovers in %s',
  async (locale) => {
    const uischema = { ...createUiSchema(), lang: 'unavailable' } as unknown as UISchemaElement;
    const ondiagnostic = vi.fn();
    const view = await render(JsonForms, {
      props: {
        data: { value: 'Retained' },
        schema,
        uischema,
        i18n: { locale },
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
        ondiagnostic,
      },
    });
    await expect
      .element(page.getByRole('alert'))
      .toMatchTextContent(
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
    await vi.waitFor(() =>
      expect(
        ondiagnostic.mock.calls.filter(
          ([diagnostic]) => diagnostic.code === 'template.unsupportedLanguage',
        ),
      ).toHaveLength(2),
    );
  },
);

it('emits one author warning per unsupported template language', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const uischema = { ...createUiSchema(), lang: 'unavailable' } as unknown as UISchemaElement;
  const view = await render(JsonForms, {
    props: {
      data: { value: 'Retained' },
      schema,
      uischema,
      config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
      renderers: [templateLayoutRendererEntry, captureRendererEntry],
    },
  });
  try {
    await expect.element(page.getByRole('alert')).toBeVisible();
    expect(warning).toHaveBeenCalledWith('template.unsupportedLanguage', {
      severity: 'warning',
      message: 'Unsupported template language: unavailable.',
      details: { language: 'unavailable', path: '' },
    });
    await view.rerender({ data: { value: 'Changed' } });
    await expect.element(page.getByRole('alert')).toBeVisible();
    expect(
      warning.mock.calls.filter(([code]) => code === 'template.unsupportedLanguage'),
    ).toHaveLength(1);
  } finally {
    await view.unmount();
    warning.mockRestore();
  }
});

it('reserves explicit child names before assigning index fallback names and diagnoses duplicates', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const diagnostics: UIDiagnostic[] = [];
  const uischema = {
    type: 'TemplateLayout',
    template: '{{>1}}{{>0}}',
    elements: [
      { type: 'Control', scope: '#/properties/unnamed' },
      { type: 'Control', scope: '#/properties/explicit', name: '0' },
      { type: 'Control', scope: '#/properties/duplicate', name: '0' },
    ],
  } as unknown as UISchemaElement;
  try {
    const view = await render(JsonForms, {
      props: {
        schema,
        data: {},
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        uischema,
        renderers: [templateLayoutRendererEntry, captureRendererEntry],
        ondiagnostic: (diagnostic) => diagnostics.push(diagnostic),
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
    expect(warning).toHaveBeenCalledWith('template.duplicateChild', {
      severity: 'warning',
      message: 'Several template children have the same name; the last is used.',
      path: '',
      details: { name: '0' },
    });
    await view.rerender({ data: { changed: true } });
    expect(warning.mock.calls.filter(([code]) => code === 'template.duplicateChild')).toHaveLength(
      1,
    );
    expect(diagnostics.filter(({ code }) => code === 'template.duplicateChild')).toHaveLength(1);
    await view.rerender({
      uischema: {
        ...uischema,
        elements: (uischema as UISchemaElement & { elements: UISchemaElement[] }).elements.slice(
          0,
          2,
        ),
      } as UISchemaElement,
    });
    await vi.waitFor(() =>
      expect(view.container.querySelectorAll('[data-testid="uischema-json"]')).toHaveLength(2),
    );
    await view.rerender({ uischema });
    await vi.waitFor(() =>
      expect(diagnostics.filter(({ code }) => code === 'template.duplicateChild')).toHaveLength(2),
    );
  } finally {
    warning.mockRestore();
  }
});

it('refreshes live context capabilities without substituting schema errors for combined validity', async () => {
  const view = await render(JsonForms, {
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

// conformance/behavior.json: template-policy-update-preserves-draft
it('rechecks template URLs when host policy changes and restores newly permitted bindings', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const diagnostics: UIDiagnostic[] = [];
  const config = { jsonformsExtended: { security: { allowScriptEvaluation: true } } };
  const view = await render(JsonForms, {
    props: {
      data: { url: 'mailto:example@example.org' },
      schema: { type: 'object' },
      config,
      uischema: {
        type: 'TemplateLayout',
        template: '<a href="{{data.url}}" target="_blank">Mail</a><input value="initial">',
      } as unknown as UISchemaElement,
      renderers: [templateLayoutRendererEntry],
      ondiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    },
  });
  try {
    await expect
      .element(page.getByRole('link', { name: 'Mail' }))
      .toHaveAttribute('href', 'mailto:example@example.org');
    const link = view.container.querySelector('a')!;
    const input = view.container.querySelector('input')!;
    input.value = 'unsaved draft';
    input.focus();
    input.setSelectionRange(4, 4);
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
    expect(view.container.querySelector('a')).toBe(link);
    expect(view.container.querySelector('input')).toBe(input);
    expect(input.value).toBe('unsaved draft');
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(4);
    expect(warn).toHaveBeenCalledWith('template.urlRefused', {
      severity: 'warning',
      message: 'Refused URL attribute href on a.',
      details: { tag: 'a', attribute: 'href' },
    });
    expect(diagnostics).toContainEqual({
      code: 'template.urlRefused',
      severity: 'warning',
      message: 'Refused URL attribute href on a.',
      details: { tag: 'a', attribute: 'href' },
    });
    await view.rerender({ data: { url: 'mailto:new@example.org' } });
    await vi.waitFor(() => expect(link.hasAttribute('href')).toBe(false));
    await view.rerender({ config });
    await expect
      .element(page.getByRole('link', { name: 'Mail' }))
      .toHaveAttribute('href', 'mailto:new@example.org');
    expect(view.container.querySelector('a')).toBe(link);
    expect(view.container.querySelector('input')).toBe(input);
    expect(input.value).toBe('unsaved draft');
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(4);
    expect(view.container.querySelector('a')?.rel).toContain('noopener');

    await view.rerender({
      data: { url: '/details' },
      config: {
        jsonformsExtended: {
          security: { allowScriptEvaluation: true, urlPolicy: { allowRelative: true } },
        },
      },
    });
    await vi.waitFor(() => expect(link.getAttribute('href')).toBe('/details'));
    await view.rerender({
      config: {
        jsonformsExtended: {
          security: { allowScriptEvaluation: true, urlPolicy: { allowRelative: false } },
        },
      },
    });
    await vi.waitFor(() => expect(link.hasAttribute('href')).toBe(false));
    expect(view.container.querySelector('input')).toBe(input);
    expect(input.value).toBe('unsaved draft');
    expect(document.activeElement).toBe(input);
  } finally {
    await view.unmount();
    warn.mockRestore();
  }
});

it('keeps the surviving repeated placeholder editor when an earlier occurrence disappears', async () => {
  const view = await render(JsonForms, {
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
