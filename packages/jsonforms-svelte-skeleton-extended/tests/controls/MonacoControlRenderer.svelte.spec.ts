import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers, skeletonCells } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedRenderers, skeletonExtendedCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import { tick } from 'svelte';

afterEach(cleanup);

it('associates focused Monaco help with its actual editor input', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { code: { type: 'string', title: 'Code', description: 'Code guidance' } },
      },
      data: { code: 'const answer = 42;' },
      uischema: { type: 'Control', scope: '#/properties/code', options: { format: 'code' } },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  const input = () =>
    view.container.querySelector<HTMLElement>(
      '.monaco-editor .native-edit-context[role="textbox"]',
    );
  await vi.waitFor(() => expect(input()).not.toBeNull(), { timeout: 10_000 });
  input()!.focus();
  await vi.waitFor(() => {
    const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
    expect(help.textContent).toContain('Code guidance');
    expect(input()?.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  });
});

it('diagnoses the flat Monaco error-publication fallback once', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'object', properties: { code: { type: 'string' } } },
        data: { code: 'before' },
        uischema: { type: 'Control', scope: '#/properties/code', options: { format: 'code' } },
        config: { propagateErrors: true },
        renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
        cells: [...skeletonCells, ...skeletonExtendedCells],
      },
    });
    const calls = () =>
      warning.mock.calls.filter(([text]) => String(text).includes('monaco.legacyPropagateErrors'));
    await vi.waitFor(() => expect(calls()).toHaveLength(1));
    await view.rerender({ data: { code: 'after' } });
    await tick();
    expect(calls()).toHaveLength(1);
  } finally {
    warning.mockRestore();
  }
});

it('uses a local Monaco option bag in place of the global bag', async () => {
  const { monaco } =
    await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
  const code = 'local Monaco options';
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { code: { type: 'string' } } },
      data: { code },
      uischema: {
        type: 'Control',
        scope: '#/properties/code',
        options: { format: 'code', monaco: { rows: 4, options: { wordWrap: 'on' } } },
      },
      config: { monaco: { rows: 20, options: { wordWrap: 'off' } } },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  const surface = view.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
  await vi.waitFor(() => expect(surface?.getBoundingClientRect().height).toBe(100));
  await vi.waitFor(
    () =>
      expect(
        monaco.editor
          .getEditors()
          .find((editor) => editor.getModel()?.getValue() === code)
          ?.getRawOptions().wordWrap,
      ).toBe('on'),
    { timeout: 10000 },
  );
});

it('updates and removes a local Monaco option without replacing form data or the editor model', async () => {
  const { monaco } =
    await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
  const code = 'live local Monaco options';
  const changes = vi.fn();
  const control = (options: Record<string, unknown>) => ({
    type: 'Control',
    scope: '#/properties/code',
    options: { format: 'code', monaco: { options } },
  });
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { code: { type: 'string' } } },
      data: { code },
      onchange: changes,
      uischema: control({ wordWrap: 'on' }),
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
    },
  });
  const editorForCode = () =>
    monaco.editor.getEditors().find((editor) => editor.getModel()?.getValue() === code);
  await vi.waitFor(() => expect(editorForCode()?.getRawOptions().wordWrap).toBe('on'));
  const model = editorForCode()?.getModel();
  const initialChangeCount = changes.mock.calls.length;
  await view.rerender({ uischema: control({ wordWrap: 'wordWrapColumn' }) });
  await vi.waitFor(() => expect(editorForCode()?.getRawOptions().wordWrap).toBe('wordWrapColumn'));
  await view.rerender({ uischema: control({}) });
  await vi.waitFor(() =>
    expect(editorForCode()?.getOption(monaco.editor.EditorOption.wordWrap)).toBe('off'),
  );
  expect(editorForCode()?.getModel()).toBe(model);
  expect(changes.mock.calls).toHaveLength(initialChangeCount);
  expect(view.container.querySelector('.jsonforms-monaco-editor')).not.toBeNull();
});

it('resolves flat and data-bound Monaco language without reading the removed namespace', async () => {
  const { monaco } =
    await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
  const code = 'const parityLanguage = true;';
  const changes = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { selection: { type: 'string' }, code: { type: 'string' } },
      },
      data: { selection: 'javascript', code },
      uischema: {
        type: 'Control',
        scope: '#/properties/code',
        options: { format: 'code', language: 'json' },
      },
      config: {
        language: 'typescript',
        ':language': 'selection',
        jsonformsExtended: { language: 'css' },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange: changes,
    },
  });
  const activeLanguage = () =>
    monaco.editor
      .getModels()
      .find((model) => model.getValue() === code)
      ?.getLanguageId();
  await vi.waitFor(() => expect(activeLanguage()).toBe('javascript'), { timeout: 10000 });
  await view.rerender({ data: { selection: 'css', code } });
  await vi.waitFor(() => expect(activeLanguage()).toBe('css'));
  await view.rerender({
    uischema: {
      type: 'Control',
      scope: '#/properties/code',
      options: { format: 'code', language: 'typescript', ':language': 'missing' },
    },
  });
  await vi.waitFor(() => expect(activeLanguage()).toBe('typescript'));
  await view.rerender({
    config: { jsonformsExtended: { language: 'json' } },
    uischema: { type: 'Control', scope: '#/properties/code', options: { format: 'code' } },
  });
  await vi.waitFor(() => expect(activeLanguage()).toBe('plaintext'));
  expect(changes.mock.lastCall?.[0].data).toEqual({ selection: 'css', code });
});

it('uses local theme ahead of flat theme and mode while preserving code data', async () => {
  const code = 'appearance parity';
  const changes = vi.fn();
  const control = {
    type: 'Control',
    scope: '#/properties/code',
    options: { format: 'code', language: 'plaintext', theme: 'light' },
  };
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { code: { type: 'string' } } },
      data: { code },
      uischema: control,
      config: { mode: 'dark' },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange: changes,
    },
  });
  const surface = () => view.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
  await vi.waitFor(
    () => expect(surface()?.classList.contains('jsonforms-monaco-editor--light')).toBe(true),
    { timeout: 10000 },
  );
  await view.rerender({
    uischema: { ...control, options: { format: 'code', language: 'plaintext' } },
  });
  await vi.waitFor(() =>
    expect(surface()?.classList.contains('jsonforms-monaco-editor--dark')).toBe(true),
  );
  await view.rerender({ config: { theme: 'light', mode: 'dark' } });
  await vi.waitFor(() =>
    expect(surface()?.classList.contains('jsonforms-monaco-editor--light')).toBe(true),
  );
  await view.rerender({
    uischema: { ...control, options: { format: 'code', language: 'plaintext', theme: 'dark' } },
  });
  await vi.waitFor(() =>
    expect(surface()?.classList.contains('jsonforms-monaco-editor--dark')).toBe(true),
  );
  expect(changes.mock.lastCall?.[0].data).toEqual({ code });
});

it('reports an inactive named theme separately from form validation', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const changes = vi.fn();
  try {
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'object', properties: { code: { type: 'string' } } },
        data: { code: 'valid code' },
        uischema: {
          type: 'Control',
          scope: '#/properties/code',
          options: { format: 'code', language: 'plaintext' },
        },
        config: { theme: 'jsonforms-unregistered-theme' },
        renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
        cells: [...skeletonCells, ...skeletonExtendedCells],
        onchange: changes,
        onvaliditychange: validity,
      },
    });
    await vi.waitFor(
      () => expect(warn).toHaveBeenCalledWith(expect.stringContaining('monaco.themeNotActive')),
      { timeout: 10000 },
    );
    expect(validity.mock.lastCall?.[0]).toMatchObject({
      valid: true,
      errors: [],
      additionalErrors: [],
    });
    expect(changes.mock.lastCall?.[0].data).toEqual({ code: 'valid code' });
    await view.unmount();
  } finally {
    warn.mockRestore();
  }
});

it('localizes real Monaco actions and keeps invalid converted JSON out of committed data', async () => {
  const changes = vi.fn();
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { payload: { type: 'object', properties: { name: { type: 'string' } } } },
      },
      data: { payload: { name: 'original' } },
      uischema: {
        type: 'Control',
        scope: '#/properties/payload',
        label: 'Payload',
        options: {
          format: 'code',
          language: 'json',
          convertJson: true,
          monaco: { options: { autoClosingBrackets: 'never', autoClosingQuotes: 'never' } },
        },
      },
      config: { propagateErrors: false, jsonformsExtended: { propagateErrors: true } },
      i18n: { locale: 'bg' },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange: changes,
      onvaliditychange: validity,
    },
  });
  await expect
    .element(page.getByRole('button', { name: 'Разгъване на редактора на код' }))
    .toBeVisible();
  const input = page.getByRole('textbox', { name: 'Payload' });
  await vi.waitFor(() => expect(input.element()).toBeDefined(), { timeout: 10000 });
  const replaceText = async (text: string) => {
    (input.element() as HTMLElement).focus();
    const modifier = navigator.platform.includes('Mac') ? 'Meta' : 'Control';
    await userEvent.keyboard(`{${modifier}>}a{/${modifier}}{Backspace}`);
    await userEvent.keyboard(text.replaceAll('{', '{{').replaceAll('[', '[['));
  };
  await replaceText('{ broken');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));
  expect(changes.mock.lastCall?.[0].data).toEqual({ payload: { name: 'original' } });
  expect(validity.mock.lastCall?.[0].additionalErrors[0].instancePath).toBe('/payload');
  expect(validity.mock.lastCall?.[0].additionalErrors[0].message).toBe('Невалиден JSON');
  await view.rerender({
    config: { propagateErrors: true, jsonformsExtended: { propagateErrors: false } },
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]));
  expect(view.container.querySelector('.view-lines')?.textContent).toContain('broken');
  await view.rerender({ config: { jsonformsExtended: { propagateErrors: true } } });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));

  await view.rerender({
    additionalErrors: [
      {
        keyword: 'server',
        instancePath: '/payload',
        schemaPath: '',
        params: {},
        message: 'Server says no',
      },
    ],
  });
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(2));
  expect(view.container.textContent).toContain('Server says no');
  await view.rerender({ additionalErrors: [] });
  await userEvent.keyboard('{Escape}');
  await page.getByRole('button', { name: 'Разгъване на редактора на код' }).click();
  await expect
    .element(page.getByRole('button', { name: 'Възстановяване на редактора на код' }))
    .toBeVisible();
  await page.getByRole('button', { name: 'Възстановяване на редактора на код' }).click();
  await replaceText('{"name":"edited"}');
  await vi.waitFor(() =>
    expect(changes.mock.lastCall?.[0].data).toEqual({ payload: { name: 'edited' } }),
  );
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
  await replaceText('null');
  await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data).toEqual({ payload: null }));
  await vi.waitFor(() =>
    expect(view.container.querySelector('.view-lines')?.textContent).toContain('null'),
  );
  expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]);
  expect(validity.mock.lastCall?.[0].valid).toBe(false);
  await view.rerender({ i18n: { locale: 'en' } });
  await expect.element(page.getByRole('button', { name: 'Maximize code editor' })).toBeVisible();
});

it('edits mixed code as a whole JSON value and owns invalid drafts', async () => {
  const changes = vi.fn();
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      schema: { type: ['string', 'object', 'null'] },
      data: 'original',
      uischema: {
        type: 'Control',
        scope: '#',
        label: 'Mixed payload',
        options: {
          monaco: { options: { autoClosingBrackets: 'never', autoClosingQuotes: 'never' } },
        },
      },
      config: {
        propagateErrors: false,
        jsonformsExtended: { mixed: { structuredLayout: 'code' } },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange: changes,
      onvaliditychange: validity,
    },
  });
  const input = page.getByRole('textbox', { name: 'Mixed payload', exact: true });
  await vi.waitFor(() => expect(input.element()).toBeDefined(), { timeout: 10000 });
  expect(view.container.querySelector('[id$="-input-selector"]')).toBeNull();
  const replaceText = async (text: string) => {
    (input.element() as HTMLElement).focus();
    const modifier = navigator.platform.includes('Mac') ? 'Meta' : 'Control';
    await userEvent.keyboard(`{${modifier}>}a{/${modifier}}{Backspace}`);
    await userEvent.keyboard(text.replaceAll('{', '{{').replaceAll('[', '[['));
  };
  await replaceText('{ broken');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));
  expect(changes.mock.lastCall?.[0].data).toBe('original');
  expect(validity.mock.lastCall?.[0].additionalErrors[0].instancePath).toBe('');
  await replaceText('null');
  await vi.waitFor(() => expect(changes.mock.lastCall?.[0].data).toBeNull());
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(0));
  await replaceText('{ broken');
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1));
  await view.rerender({
    uischema: {
      type: 'Control',
      scope: '#',
      label: 'Mixed payload',
      options: { structuredLayout: 'tree' },
    },
  });
  await vi.waitFor(() => expect(view.container.querySelector('.monaco-editor')).toBeNull());
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(0));
  expect(changes.mock.lastCall?.[0].data).toBeNull();
});

it.each(['en', 'bg'] as const)(
  'isolates native Monaco target replacement and late diagnostics in %s',
  async (locale) => {
    const { monaco } =
      await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const changes = vi.fn();
    const control = {
      type: 'Control',
      scope: '#/properties/first',
      options: { format: 'code', language: 'json', convertJson: true, propagateErrors: true },
    };
    const data = { first: { name: 'first' }, second: { name: 'second' }, sibling: 'keep' };
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: { first: { type: 'object' }, second: { type: 'object' } },
        },
        data,
        uischema: control,
        i18n: { locale },
        renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
        cells: [...skeletonCells, ...skeletonExtendedCells],
        onchange: changes,
        onvaliditychange: validity,
      },
    });
    await vi.waitFor(
      () => expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: false, valid: true }),
      { timeout: 10000 },
    );
    const oldModel = monaco.editor
      .getModels()
      .find((model) => model.getValue().includes('"first"'))!;
    const editor = monaco.editor.getEditors().find((editor) => editor.getModel() === oldModel)!;
    editor.executeEdits('test', [{ range: oldModel.getFullModelRange(), text: '{ incomplete' }]);
    await vi.waitFor(
      () =>
        expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
          expect.objectContaining({ instancePath: '/first', keyword: 'editor' }),
        ]),
      { timeout: 10000 },
    );
    await view.rerender({
      uischema: {
        ...control,
        scope: '#/properties/second',
      } as import('@jsonforms/core').ControlElement,
    });
    await vi.waitFor(() => expect(oldModel.isDisposed()).toBe(true));
    await vi.waitFor(
      () =>
        expect(validity.mock.lastCall?.[0]).toMatchObject({
          pending: false,
          valid: true,
          additionalErrors: [],
        }),
      { timeout: 10000 },
    );
    expect(changes.mock.lastCall?.[0].data).toEqual(data);
    monaco.editor.setModelMarkers(oldModel, 'late-test', [
      {
        severity: monaco.MarkerSeverity.Error,
        message: 'obsolete target',
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ]);
    await new Promise(requestAnimationFrame);
    expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]);
    monaco.editor.setModelMarkers(oldModel, 'late-test', []);
    const current = editor.getModel()!;
    editor.executeEdits('test', [
      { range: current.getFullModelRange(), text: '{"name":"edited"}' },
    ]);
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data).toEqual({ ...data, second: { name: 'edited' } }),
    );
    await vi.waitFor(
      () => expect(validity.mock.lastCall?.[0]).toMatchObject({ pending: false, valid: true }),
      { timeout: 10000 },
    );
    expect(editor.getModel()).toBe(current);
  },
);

it('uses JSON conversion only while the data-bound language is JSON', async () => {
  const { monaco } =
    await import('../../../jsonforms-svelte-extended/src/lib/components/monaco-api.js');
  const code = 'const broken = ;';
  const onchange = vi.fn();
  const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { selection: { type: 'string' }, code: { type: 'string' } },
      },
      data: { selection: 'json', code },
      uischema: {
        type: 'Control',
        scope: '#/properties/code',
        options: {
          format: 'code',
          language: 'json',
          ':language': 'selection',
          convertJson: true,
          propagateErrors: true,
        },
      },
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
      onchange,
      onvaliditychange: validity,
    },
  });
  const model = () =>
    monaco.editor
      .getModels()
      .find((entry) => entry.getValue() === JSON.stringify(code) || entry.getValue() === code);
  await vi.waitFor(() => expect(model()?.getLanguageId()).toBe('json'), { timeout: 10000 });
  expect(model()?.getValue()).toBe(JSON.stringify(code));
  await view.rerender({ data: { selection: 'javascript', code } });
  await vi.waitFor(() => expect(model()?.getLanguageId()).toBe('javascript'));
  await vi.waitFor(() => expect(model()?.getValue()).toBe(code));
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(1), {
    timeout: 10000,
  });
  await view.rerender({ data: { selection: 'json', code } });
  await vi.waitFor(() => expect(model()?.getLanguageId()).toBe('json'));
  await vi.waitFor(() => expect(model()?.getValue()).toBe(JSON.stringify(code)));
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]));
  expect(onchange.mock.lastCall?.[0].data).toEqual({ selection: 'json', code });
});
