import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MonacoEditor from '../src/lib/components/MonacoEditor.svelte';

const editorElement = () =>
  document.querySelector<HTMLElement>('.jsonforms-monaco-editor .monaco-editor');

const renderedTokens = () =>
  Array.from(editorElement()?.querySelectorAll<HTMLElement>('.view-line span span') ?? []).map(
    (token) => (token.textContent ?? '').replaceAll('\u00a0', ' '),
  );

afterEach(() => {
  document.documentElement.removeAttribute('data-mode');
  document.documentElement.style.removeProperty('color-scheme');
});

describe('MonacoEditor', () => {
  it('runs an available format-document initialization action', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const before = new Set(monaco.editor.getEditors());
    const onvaluechange = vi.fn();
    await render(MonacoEditor, {
      props: {
        value: 'const count=1;\nconsole.log(count)',
        language: 'javascript',
        initActions: ['editor.action.formatDocument'],
        onvaluechange,
      },
    });
    const editor = () => monaco.editor.getEditors().find((candidate) => !before.has(candidate));
    await vi.waitFor(() => expect(editor()).toBeDefined(), { timeout: 10_000 });
    expect(editor()?.getAction('editor.action.formatDocument')).not.toBeNull();
    await vi.waitFor(() => expect(editor()?.getModel()?.getValue()).toContain('const count = 1;'), {
      timeout: 10_000,
    });
    expect(onvaluechange).toHaveBeenCalledWith(editor()?.getModel()?.getValue());
  });

  it('keeps the editor available while an unsupported initialization action waits', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const before = new Set(monaco.editor.getEditors());
    const view = await render(MonacoEditor, {
      props: {
        value: 'plain text',
        language: 'plaintext',
        initActions: ['editor.action.formatDocument'],
      },
    });
    await vi.waitFor(
      () =>
        expect(monaco.editor.getEditors().some((candidate) => !before.has(candidate))).toBe(true),
      { timeout: 10_000 },
    );
    const root = view.container.querySelector('.jsonforms-monaco-editor');
    await vi.waitFor(() => expect(root?.getAttribute('aria-busy')).toBe('false'), {
      timeout: 1_000,
    });
  });

  it.each(['local edit', 'host replacement'])(
    'skips a delayed initialization action after a %s',
    async (change) => {
      const { monaco } = await import('../src/lib/components/monaco-api.js');
      const before = new Set(monaco.editor.getEditors());
      const view = await render(MonacoEditor, {
        props: {
          value: 'original',
          language: 'plaintext',
          initActions: ['editor.action.formatDocument'],
        },
      });
      const editor = () => monaco.editor.getEditors().find((candidate) => !before.has(candidate));
      await vi.waitFor(() => expect(editor()).toBeDefined(), { timeout: 10_000 });
      await vi.waitFor(
        () =>
          expect(
            view.container.querySelector('.jsonforms-monaco-editor')?.getAttribute('aria-busy'),
          ).toBe('false'),
        { timeout: 1_000 },
      );
      const initialModel = editor()?.getModel();
      const expected =
        change === 'local edit' ? 'typed before provider registration' : 'host replacement';
      if (change === 'local edit') editor()?.setValue(expected);
      else {
        await view.rerender({ value: expected });
        await vi.waitFor(() => expect(editor()?.getModel()).not.toBe(initialModel));
      }
      const provideDocumentFormattingEdits = vi.fn(() => []);
      const registration = monaco.languages.registerDocumentFormattingEditProvider('plaintext', {
        provideDocumentFormattingEdits,
      });
      try {
        await vi.waitFor(
          () =>
            expect(editor()?.getAction('editor.action.formatDocument')?.isSupported()).toBe(true),
          { timeout: 10_000 },
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(provideDocumentFormattingEdits).not.toHaveBeenCalled();
        expect(editor()?.getValue()).toBe(expected);
      } finally {
        registration.dispose();
      }
    },
  );

  it('forwards live descriptions and invalid state to the Monaco editor input', async () => {
    const view = await render(MonacoEditor, {
      props: { value: 'code', 'aria-describedby': 'author-help', invalid: true },
    });
    const input = () =>
      view.container.querySelector<HTMLElement>(
        '.monaco-editor .native-edit-context[role="textbox"], .monaco-editor textarea.inputarea',
      );
    await vi.waitFor(() => expect(input()).not.toBeNull(), { timeout: 10_000 });
    expect(input()?.getAttribute('aria-describedby')).toBe('author-help');
    expect(input()?.getAttribute('aria-invalid')).toBe('true');
    await view.rerender({ value: 'code', 'aria-describedby': 'visible-help', invalid: false });
    await vi.waitFor(() => expect(input()?.getAttribute('aria-describedby')).toBe('visible-help'));
    expect(input()?.hasAttribute('aria-invalid')).toBe(false);
    await view.rerender({ value: 'code', 'aria-describedby': undefined, invalid: false });
    await vi.waitFor(() => expect(input()?.hasAttribute('aria-describedby')).toBe(false));
  });

  it('uses the specified ten-row default and does not cap a fixed row count at the auto-grow maximum', async () => {
    const view = await render(MonacoEditor, { props: { value: 'fixed' } });
    const root = view.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(220);
    await view.rerender({ value: 'fixed', rows: 35 });
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(720);
  });

  it('sizes auto-grow from the initial text and the specified three-to-thirty-row bounds', async () => {
    const lines = Array.from({ length: 35 }, (_, index) => `line ${index}`).join('\n');
    const view = await render(MonacoEditor, {
      props: { value: lines, autoGrow: true },
    });
    const root = view.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(620);
    await view.rerender({ value: 'one line', autoGrow: true });
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(80);
    await view.rerender({ value: lines, autoGrow: true, minRows: 5, maxRows: 12 });
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(260);
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const matchingEditor = () =>
      monaco.editor.getEditors().find((candidate) => candidate.getModel()?.getValue() === lines);
    await vi.waitFor(() => expect(matchingEditor()).toBeDefined());
    const liveEditor = matchingEditor();
    expect(liveEditor).toBeDefined();
    liveEditor?.setValue(Array.from({ length: 7 }, (_, index) => `edited ${index}`).join('\n'));
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(160);
    liveEditor?.setValue('edited one line');
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(120);
  });

  it('passes native editor options to Monaco', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const value = 'select this text';
    await render(MonacoEditor, {
      props: { value, options: { wordWrap: 'on' } },
    });
    await vi.waitFor(
      () =>
        expect(
          monaco.editor
            .getEditors()
            .find((candidate) => candidate.getModel()?.getValue() === value)
            ?.getRawOptions().wordWrap,
        ).toBe('on'),
      { timeout: 10_000 },
    );
  });

  it('keeps live editor options independent and resets removed local options', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const first = await render(MonacoEditor, {
      props: { value: 'first options', options: { wordWrap: 'on' } },
    });
    const second = await render(MonacoEditor, { props: { value: 'second options' } });
    const editorFor = (value: string) =>
      monaco.editor.getEditors().find((candidate) => candidate.getModel()?.getValue() === value);
    const wordWrap = (value: string) =>
      editorFor(value)?.getOption(monaco.editor.EditorOption.wordWrap);
    await vi.waitFor(() => expect(editorFor('first options')?.getRawOptions().wordWrap).toBe('on'));
    await vi.waitFor(() => expect(wordWrap('second options')).toBe('off'));
    const firstEditor = editorFor('first options');
    const secondEditor = editorFor('second options');
    await first.rerender({ options: { wordWrap: 'wordWrapColumn' } });
    await vi.waitFor(() => expect(firstEditor?.getRawOptions().wordWrap).toBe('wordWrapColumn'));
    expect(wordWrap('second options')).toBe('off');
    await first.rerender({ options: {} });
    await vi.waitFor(() => expect(wordWrap('first options')).toBe('off'));
    expect(editorFor('first options')).toBe(firstEditor);
    expect(editorFor('second options')).toBe(secondEditor);
    await first.rerender({ options: { scrollbar: { vertical: 'hidden' } } });
    await vi.waitFor(() => expect(firstEditor?.getRawOptions().scrollbar?.vertical).toBe('hidden'));
    await first.rerender({ options: { scrollbar: { horizontal: 'hidden' } } });
    await vi.waitFor(() =>
      expect(firstEditor?.getRawOptions().scrollbar?.vertical).toBeUndefined(),
    );
    expect(firstEditor?.getRawOptions().scrollbar?.horizontal).toBe('hidden');
    await second.unmount();
    await first.unmount();
  });

  it('applies explicit CSS dimensions and updates them', async () => {
    const view = await render(MonacoEditor, {
      props: { value: 'sized', width: '320px', height: '180px' },
    });
    const root = view.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
    expect(root).not.toBeNull();
    await expect.poll(() => root?.getBoundingClientRect().width).toBe(320);
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(180);
    await view.rerender({ value: 'sized', width: '240px', height: '12rem' });
    await expect.poll(() => root?.getBoundingClientRect().width).toBe(240);
    await expect.poll(() => root?.getBoundingClientRect().height).toBe(192);
  });

  it('maximizes, restores and escapes one editor without replacing either model', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const first = await render(MonacoEditor, {
      props: { value: 'first maximized', width: '320px', height: '180px' },
    });
    const second = await render(MonacoEditor, {
      props: { value: 'second normal', width: '240px', height: '120px' },
    });
    const firstRoot = first.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
    const secondRoot = second.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
    const modelFor = (value: string) =>
      monaco.editor
        .getEditors()
        .find((editor) => editor.getModel()?.getValue() === value)
        ?.getModel();
    await vi.waitFor(() => expect(modelFor('first maximized')).toBeDefined());
    await vi.waitFor(() => expect(modelFor('second normal')).toBeDefined());
    const firstModel = modelFor('first maximized');
    const secondModel = modelFor('second normal');
    const maximize = first.container.querySelector<HTMLButtonElement>(
      '.jsonforms-monaco-editor__maximize',
    );
    maximize?.click();
    await expect.poll(() => firstRoot?.getBoundingClientRect().height).toBe(window.innerHeight);
    expect(firstRoot?.getBoundingClientRect().width).toBe(window.innerWidth);
    expect(secondRoot?.getBoundingClientRect().height).toBe(120);
    expect(secondRoot?.getBoundingClientRect().width).toBe(240);
    maximize?.click();
    await expect.poll(() => firstRoot?.getBoundingClientRect().height).toBe(180);
    maximize?.click();
    await expect.poll(() => firstRoot?.getBoundingClientRect().height).toBe(window.innerHeight);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await expect.poll(() => firstRoot?.getBoundingClientRect().height).toBe(180);
    expect(firstRoot?.getBoundingClientRect().width).toBe(320);
    expect(secondRoot?.getBoundingClientRect().height).toBe(120);
    expect(
      monaco.editor.getEditors().find((editor) => editor.getModel() === firstModel),
    ).toBeDefined();
    expect(
      monaco.editor.getEditors().find((editor) => editor.getModel() === secondModel),
    ).toBeDefined();
    await second.unmount();
    await first.unmount();
  });

  it('installs one editor stylesheet per ShadowRoot for sibling instances', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const target = document.createElement('div');
    shadow.append(target);
    const first = await render(MonacoEditor, { target, props: { value: 'shadow first' } });
    const second = await render(MonacoEditor, { target, props: { value: 'shadow second' } });
    let secondMounted = true;
    try {
      await vi.waitFor(
        () =>
          expect(shadow.querySelectorAll('.jsonforms-monaco-editor .monaco-editor')).toHaveLength(
            2,
          ),
        { timeout: 10_000 },
      );
      const styles = shadow.querySelectorAll<HTMLStyleElement>('#jsonforms-monaco-editor-styles');
      expect(styles).toHaveLength(1);
      expect(styles[0]?.textContent).toContain('.jsonforms-monaco-editor--maximized');
      expect(styles[0]?.textContent).toContain('.monaco-editor');
      const roots = shadow.querySelectorAll<HTMLElement>('.jsonforms-monaco-editor');
      expect(getComputedStyle(roots[0]!).height).toBe('220px');
      host.setAttribute('data-mode', 'dark');
      await vi.waitFor(() =>
        expect(roots[0]?.classList.contains('jsonforms-monaco-editor--dark')).toBe(true),
      );
      expect(roots[1]?.classList.contains('jsonforms-monaco-editor--dark')).toBe(true);
      host.setAttribute('data-mode', 'light');
      await vi.waitFor(() =>
        expect(roots[0]?.classList.contains('jsonforms-monaco-editor--light')).toBe(true),
      );
      await first.unmount();
      expect(shadow.querySelectorAll('.jsonforms-monaco-editor .monaco-editor')).toHaveLength(1);
      expect(shadow.querySelectorAll('#jsonforms-monaco-editor-styles')).toHaveLength(1);
      await second.unmount();
      secondMounted = false;
      expect(shadow.querySelectorAll('#jsonforms-monaco-editor-styles')).toHaveLength(0);
      const remounted = await render(MonacoEditor, {
        target,
        props: { value: 'shadow remounted' },
      });
      try {
        await vi.waitFor(() =>
          expect(shadow.querySelectorAll('.jsonforms-monaco-editor .monaco-editor')).toHaveLength(
            1,
          ),
        );
        expect(shadow.querySelectorAll('#jsonforms-monaco-editor-styles')).toHaveLength(1);
      } finally {
        await remounted.unmount();
      }
      expect(shadow.querySelectorAll('#jsonforms-monaco-editor-styles')).toHaveLength(0);
      const hostStyle = document.createElement('style');
      hostStyle.id = 'jsonforms-monaco-editor-styles';
      shadow.append(hostStyle);
      const hostStyled = await render(MonacoEditor, {
        target,
        props: { value: 'host styled' },
      });
      try {
        await vi.waitFor(() =>
          expect(shadow.querySelectorAll('.jsonforms-monaco-editor .monaco-editor')).toHaveLength(
            1,
          ),
        );
        expect(shadow.querySelectorAll('#jsonforms-monaco-editor-styles')).toHaveLength(1);
      } finally {
        await hostStyled.unmount();
      }
      expect(shadow.querySelector('#jsonforms-monaco-editor-styles')).toBe(hostStyle);
    } finally {
      if (secondMounted) await second.unmount();
      host.remove();
    }
  });

  it('uses an already active named host theme without a diagnostic', async () => {
    const { monaco, activeMonacoThemeName } = await import('../src/lib/components/monaco-api.js');
    const name = 'jsonforms-active-host-theme';
    monaco.editor.defineTheme(name, { base: 'vs', inherit: true, rules: [], colors: {} });
    monaco.editor.setTheme(name);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const view = await render(MonacoEditor, {
        props: { value: 'named-theme-active', appearance: name },
      });
      await vi.waitFor(
        () => expect(view.container.querySelector('.monaco-editor')).not.toBeNull(),
        { timeout: 10_000 },
      );
      expect(activeMonacoThemeName()).toBe(name);
      expect(
        warn.mock.calls.some(([message]) => String(message).includes('monaco.themeNotActive')),
      ).toBe(false);
      await view.unmount();
    } finally {
      warn.mockRestore();
      monaco.editor.setTheme('vs');
    }
  });

  it('diagnoses an inactive named theme without changing Monaco global state', async () => {
    const { monaco, activeMonacoThemeName } = await import('../src/lib/components/monaco-api.js');
    monaco.editor.setTheme('vs');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const view = await render(MonacoEditor, {
        props: { value: 'named-theme', appearance: 'host-theme-not-active' },
      });
      await vi.waitFor(
        () =>
          expect(warn).toHaveBeenCalledWith('monaco.themeNotActive', {
            severity: 'warning',
            message: 'The requested Monaco theme is not active; the host must activate it.',
            details: { requestedTheme: 'host-theme-not-active', activeTheme: 'vs' },
          }),
        { timeout: 10_000 },
      );
      expect(activeMonacoThemeName()).toBe('vs');
      const calls = warn.mock.calls.length;
      await view.rerender({ appearance: 'host-theme-not-active' });
      expect(warn.mock.calls).toHaveLength(calls);
      await view.unmount();
    } finally {
      warn.mockRestore();
    }
  });

  it.each(['vs', 'jsonforms-host-custom'])(
    'does not repaint a host Monaco editor using %s when its own appearance is dark',
    async (hostTheme) => {
      const { monaco } = await import('../src/lib/components/monaco-api.js');
      const { StandaloneServices } =
        await import('monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js');
      const { IStandaloneThemeService } =
        await import('monaco-editor/esm/vs/editor/standalone/common/standaloneTheme.js');
      const currentTheme = () =>
        (
          StandaloneServices.get(IStandaloneThemeService) as {
            getColorTheme(): { themeName: string };
          }
        ).getColorTheme().themeName;
      if (hostTheme !== 'vs')
        monaco.editor.defineTheme(hostTheme, { base: 'vs', inherit: true, rules: [], colors: {} });
      monaco.editor.setTheme(hostTheme);
      const hostContainer = document.createElement('div');
      hostContainer.style.cssText = 'width: 300px; height: 120px';
      document.body.appendChild(hostContainer);
      const host = monaco.editor.create(hostContainer, {
        value: 'host-owned',
        language: 'plaintext',
      });
      try {
        const view = await render(MonacoEditor, {
          props: { value: 'renderer-owned', appearance: 'dark' },
        });
        await vi.waitFor(
          () =>
            expect(
              view.container.querySelector('.jsonforms-monaco-editor--dark .monaco-editor'),
            ).not.toBeNull(),
          { timeout: 10_000 },
        );
        expect(currentTheme()).toBe(hostTheme);
        expect(hostContainer.querySelector('.monaco-editor')?.classList.contains('vs-dark')).toBe(
          false,
        );
        await view.unmount();
      } finally {
        host.dispose();
        hostContainer.remove();
        monaco.editor.setTheme('vs');
      }
    },
  );

  it('applies explicit light and dark appearance ahead of the surrounding host mode', async () => {
    document.documentElement.setAttribute('data-mode', 'light');
    const view = await render(MonacoEditor, {
      props: { value: 'appearance check', appearance: 'dark' },
    });
    await vi.waitFor(
      () =>
        expect(
          view.container.querySelector('.jsonforms-monaco-editor--dark .monaco-editor'),
        ).not.toBeNull(),
      { timeout: 10_000 },
    );
    await view.rerender({ appearance: 'light' });
    await vi.waitFor(() =>
      expect(view.container.querySelector('.jsonforms-monaco-editor--light')).not.toBeNull(),
    );
    await view.rerender({ appearance: undefined });
    document.documentElement.setAttribute('data-mode', 'dark');
    await vi.waitFor(() =>
      expect(view.container.querySelector('.jsonforms-monaco-editor--dark')).not.toBeNull(),
    );
  });

  it('uses a complete dark theme and reacts to language changes', async () => {
    document.documentElement.setAttribute('data-mode', 'dark');
    const value = "const greeting = 'Hello';";
    const view = await render(MonacoEditor, {
      props: {
        value,
        language: 'javascript',
        rows: 3,
        surfaceBackground: '#fff',
        darkSurfaceBackground: '#1e2939',
      },
    });

    await vi.waitFor(
      () => {
        expect(editorElement()?.classList.contains('vs-dark')).toBe(true);
        expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(30, 41, 57)');
        expect(renderedTokens()).toContain('const');
      },
      { timeout: 10_000 },
    );

    await view.rerender({
      value,
      language: 'json',
      rows: 3,
      surfaceBackground: '#fff',
      darkSurfaceBackground: '#1e2939',
    });

    await vi.waitFor(() => {
      expect(renderedTokens()).toEqual([value]);
    });

    document.documentElement.removeAttribute('data-mode');
    document.documentElement.style.colorScheme = 'light';
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--light'),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(255, 255, 255)');
    });

    document.documentElement.style.colorScheme = 'dark';
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--dark'),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(30, 41, 57)');
    });

    document.documentElement.style.colorScheme = 'light';
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--light'),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe('rgb(255, 255, 255)');
    });
  });

  it('treats removal of the dark class as light for class-based themes', async () => {
    document.documentElement.classList.add('dark');
    const view = await render(MonacoEditor, {
      props: {
        value: 'value',
        darkClassBasedTheme: true,
      },
    });

    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--dark'),
      ).toBe(true);
    });

    document.documentElement.classList.remove('dark');
    await vi.waitFor(() => {
      expect(
        document
          .querySelector('.jsonforms-monaco-editor')
          ?.classList.contains('jsonforms-monaco-editor--light'),
      ).toBe(true);
    });

    await view.unmount();
  });
});

describe('Monaco schema ownership', () => {
  it('validates section references per model and cleans only its own schemas and models', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const defaults = monaco.json.jsonDefaults;
    const original = defaults.diagnosticsOptions;
    const hostModel = monaco.editor.createModel('"host"', 'json');
    const hostSchema = {
      uri: 'inmemory://host-schema.json',
      fileMatch: [hostModel.uri.toString()],
      schema: { type: 'string' },
    };
    defaults.setDiagnosticsOptions({
      ...original,
      schemas: [...(original.schemas ?? []), hostSchema],
    });
    const schema = {
      type: 'object',
      properties: { count: { $ref: '#/definitions/positive~1count' } },
    };
    const rootSchema = { definitions: { 'positive/count': { type: 'integer', minimum: 1 } } };
    const first = await render(MonacoEditor, {
      props: {
        value: '{"count":0}',
        language: 'json',
        schema,
        rootSchema,
        validateJsonSchema: true,
      },
    });
    const second = await render(MonacoEditor, {
      props: {
        value: '{"count":2}',
        language: 'json',
        schema,
        rootSchema,
        validateJsonSchema: true,
      },
    });
    let firstMounted = true;
    let secondMounted = true;
    try {
      await vi.waitFor(
        () =>
          expect(
            monaco.editor.getModels().filter((model) => model.getValue().startsWith('{"count":')),
          ).toHaveLength(2),
        { timeout: 10000 },
      );
      let firstModel = monaco.editor
        .getModels()
        .find((model) => model.getValue() === '{"count":0}')!;
      const secondModel = monaco.editor
        .getModels()
        .find((model) => model.getValue() === '{"count":2}')!;
      await vi.waitFor(
        () =>
          expect(
            monaco.editor
              .getModelMarkers({ resource: firstModel.uri })
              .some((marker) => /minimum.*1/i.test(marker.message)),
          ).toBe(true),
        { timeout: 10000 },
      );
      expect(monaco.editor.getModelMarkers({ resource: secondModel.uri })).toEqual([]);
      await first.rerender({
        rootSchema: { definitions: { 'positive/count': { type: 'integer', minimum: 3 } } },
      });
      await vi.waitFor(() => expect(firstModel.isDisposed()).toBe(true));
      firstModel = monaco.editor.getModels().find((model) => model.getValue() === '{"count":0}')!;
      await vi.waitFor(
        () =>
          expect(
            monaco.editor
              .getModelMarkers({ resource: firstModel.uri })
              .some((marker) => /minimum.*3/i.test(marker.message)),
          ).toBe(true),
        { timeout: 10000 },
      );
      expect(monaco.editor.getModelMarkers({ resource: secondModel.uri })).toEqual([]);
      await first.unmount();
      firstMounted = false;
      expect(firstModel.isDisposed()).toBe(true);
      expect(secondModel.isDisposed()).toBe(false);
      expect(hostModel.isDisposed()).toBe(false);
      expect(
        defaults.diagnosticsOptions.schemas?.some((entry) =>
          entry.fileMatch?.includes(firstModel.uri.toString()),
        ),
      ).toBe(false);
      expect(
        defaults.diagnosticsOptions.schemas?.some((entry) =>
          entry.fileMatch?.includes(secondModel.uri.toString()),
        ),
      ).toBe(true);
      await second.unmount();
      secondMounted = false;
      expect(defaults.diagnosticsOptions.schemas).toContainEqual(hostSchema);
    } finally {
      if (firstMounted) await first.unmount();
      if (secondMounted) await second.unmount();
      hostModel.dispose();
      defaults.setDiagnosticsOptions(original);
    }
  });

  it('resolves host-registered and nested-id references without taking ownership of the host schema', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const defaults = monaco.json.jsonDefaults;
    const original = defaults.diagnosticsOptions;
    const hostSchema = {
      uri: 'https://schemas.example.test/positive.json',
      schema: { $id: 'https://schemas.example.test/positive.json', type: 'integer', minimum: 5 },
    };
    defaults.setDiagnosticsOptions({
      ...original,
      schemas: [...(original.schemas ?? []), hostSchema],
    });
    const schema = {
      $id: 'https://schemas.example.test/main.json',
      type: 'object',
      properties: {
        count: { $ref: 'positive.json' },
        nestedCopy: { $ref: 'https://schemas.example.test/nested.json#/$defs/inner' },
        nested: {
          $id: 'https://schemas.example.test/nested.json',
          type: 'object',
          properties: { inner: { $ref: '#/$defs/inner' } },
          $defs: { inner: { type: 'integer', minimum: 2 } },
        },
      },
    };
    const first = await render(MonacoEditor, {
      props: {
        value: '{"count":1,"nestedCopy":1,"nested":{"inner":1}}',
        language: 'json',
        schema,
        rootSchema: schema,
        validateJsonSchema: true,
      },
    });
    const second = await render(MonacoEditor, {
      props: {
        value: '{"count":6,"nestedCopy":3,"nested":{"inner":3}}',
        language: 'json',
        schema,
        rootSchema: schema,
        validateJsonSchema: true,
      },
    });
    let firstMounted = true;
    try {
      const firstModel = () =>
        monaco.editor.getModels().find((model) => model.getValue().includes('"count":1'));
      const secondModel = () =>
        monaco.editor.getModels().find((model) => model.getValue().includes('"count":6'));
      await vi.waitFor(() => expect(firstModel()).toBeDefined(), { timeout: 10_000 });
      await vi.waitFor(() => expect(secondModel()).toBeDefined(), { timeout: 10_000 });
      const messages = (model: ReturnType<typeof firstModel>) =>
        monaco.editor.getModelMarkers({ resource: model!.uri }).map((marker) => marker.message);
      await vi.waitFor(
        () => {
          expect(
            messages(firstModel()).some((message) => /minimum.*5/i.test(message)),
            JSON.stringify(messages(firstModel())),
          ).toBe(true);
          expect(messages(firstModel()).some((message) => /minimum.*2/i.test(message))).toBe(true);
          expect(
            messages(firstModel()).filter((message) => /minimum.*2/i.test(message)),
          ).toHaveLength(2);
        },
        { timeout: 10_000 },
      );
      expect(messages(secondModel())).toEqual([]);
      await first.unmount();
      firstMounted = false;
      expect(firstModel()).toBeUndefined();
      expect(defaults.diagnosticsOptions.schemas).toContainEqual(hostSchema);
      expect(secondModel()?.isDisposed()).toBe(false);
    } finally {
      if (firstMounted) await first.unmount();
      await second.unmount();
      defaults.setDiagnosticsOptions(original);
    }
  });

  it('validates root and nested document-local anchor references', async () => {
    const { monaco } = await import('../src/lib/components/monaco-api.js');
    const schema = {
      $id: 'https://schemas.example.test/anchor-root.json',
      type: 'object',
      $defs: {
        rootNumber: { $anchor: 'rootNumber', type: 'integer', minimum: 4 },
        nested: {
          $id: 'nested.json',
          $defs: { nestedNumber: { $anchor: 'nestedNumber', type: 'integer', minimum: 7 } },
        },
      },
      properties: {
        rootValue: { $ref: '#rootNumber' },
        nestedValue: { $ref: 'nested.json#nestedNumber' },
      },
    };
    const view = await render(MonacoEditor, {
      props: {
        value: '{"rootValue":1,"nestedValue":2}',
        language: 'json',
        schema,
        rootSchema: schema,
        validateJsonSchema: true,
      },
    });
    try {
      const model = () =>
        monaco.editor.getModels().find((entry) => entry.getValue().includes('"rootValue"'));
      await vi.waitFor(() => expect(model()).toBeDefined(), { timeout: 10_000 });
      const messages = () =>
        monaco.editor.getModelMarkers({ resource: model()!.uri }).map((marker) => marker.message);
      await vi.waitFor(
        () => {
          expect(
            messages().some((message) => /minimum.*4/i.test(message)),
            JSON.stringify(messages()),
          ).toBe(true);
          expect(
            messages().some((message) => /minimum.*7/i.test(message)),
            JSON.stringify(messages()),
          ).toBe(true);
        },
        { timeout: 10_000 },
      );
    } finally {
      await view.unmount();
    }
  });
});

it('reports only errors from its own model and disposes marker subscriptions', async () => {
  const { monaco } = await import('../src/lib/components/monaco-api.js');
  const changed = vi.fn();
  const view = await render(MonacoEditor, {
    props: { value: 'owned-marker-test', language: 'plaintext', onmarkerschange: changed },
  });
  await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(0));
  const model = monaco.editor
    .getModels()
    .find((entry) => entry.getValue() === 'owned-marker-test')!;
  const foreign = monaco.editor.createModel('foreign', 'plaintext');
  const marker = {
    severity: monaco.MarkerSeverity.Error,
    message: 'invalid',
    startLineNumber: 1,
    endLineNumber: 1,
    startColumn: 1,
    endColumn: 2,
  };
  try {
    monaco.editor.setModelMarkers(model, 'test', [
      marker,
      { ...marker, severity: monaco.MarkerSeverity.Warning },
    ]);
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(1));
    monaco.editor.setModelMarkers(foreign, 'test', [marker, marker]);
    monaco.editor.setModelMarkers(model, 'test', []);
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(0));
    expect(changed.mock.calls.every(([count]) => count === 0 || count === 1)).toBe(true);
    await view.unmount();
    changed.mockClear();
    monaco.editor.setModelMarkers(foreign, 'test', []);
    // A subsequent marker event must not invoke the destroyed editor's callback.
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(changed).not.toHaveBeenCalled();
    expect(model.isDisposed()).toBe(true);
  } finally {
    foreign.dispose();
  }
});

it('retracts language diagnostics when switching to a language without validation', async () => {
  const changed = vi.fn();
  const view = await render(MonacoEditor, {
    props: { value: '{ "broken": }', language: 'json', onmarkerschange: changed },
  });
  await vi.waitFor(() => expect(changed.mock.lastCall?.[0]).toBeGreaterThan(0), { timeout: 10000 });
  await view.rerender({ language: 'markdown' });
  await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(0));
});

it('preserves worker providers installed by the host application', async () => {
  const { ensureMonacoWorkers } = await import('../src/lib/components/monaco-api.js');
  const target = globalThis as typeof globalThis & {
    MonacoEnvironment?: import('monaco-editor').Environment;
  };
  const previous = target.MonacoEnvironment;
  try {
    const getWorker = vi.fn();
    target.MonacoEnvironment = { getWorker };
    ensureMonacoWorkers();
    expect(target.MonacoEnvironment.getWorker).toBe(getWorker);
    const getWorkerUrl = () => '/host-worker.js';
    target.MonacoEnvironment = { getWorkerUrl };
    ensureMonacoWorkers();
    expect(target.MonacoEnvironment.getWorkerUrl).toBe(getWorkerUrl);
    expect(target.MonacoEnvironment.getWorker).toBeUndefined();
  } finally {
    target.MonacoEnvironment = previous;
  }
});

it('isolates late markers from replaced content while retaining the editor instance and selection', async () => {
  const { monaco } = await import('../src/lib/components/monaco-api.js');
  const changed = vi.fn();
  const view = await render(MonacoEditor, {
    props: { value: 'versioned diagnostic', language: 'plaintext', onmarkerschange: changed },
  });
  await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(0));
  const model = monaco.editor
    .getModels()
    .find((model) => model.getValue() === 'versioned diagnostic')!;
  const editor = monaco.editor.getEditors().find((editor) => editor.getModel() === model)!;
  const selection = new monaco.Selection(1, 2, 1, 5);
  editor.setSelection(selection);
  const marker = {
    severity: monaco.MarkerSeverity.Error,
    message: 'obsolete',
    startLineNumber: 1,
    endLineNumber: 1,
    startColumn: 1,
    endColumn: 2,
  };
  monaco.editor.setModelMarkers(model, 'version-test', [marker]);
  await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(1));
  await view.rerender({ value: 'replacement content' });
  await vi.waitFor(() => expect(model.isDisposed()).toBe(true));
  expect(monaco.editor.getEditors()).toContain(editor);
  expect(editor.getSelection()).toEqual(selection);
  const replacement = monaco.editor
    .getModels()
    .find((model) => model.getValue() === 'replacement content')!;
  expect(replacement.uri.toString()).not.toBe(model.uri.toString());
  monaco.editor.setModelMarkers(model, 'version-test', [
    { ...marker, message: 'late obsolete result' },
  ]);
  await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(0));
  monaco.editor.setModelMarkers(replacement, 'version-test', [marker]);
  await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(1));
});

it('retains its model and input DOM for feedback from its own edits', async () => {
  const { monaco } = await import('../src/lib/components/monaco-api.js');
  const changed = vi.fn();
  const view = await render(MonacoEditor, {
    props: { value: 'own edit', language: 'plaintext', onvaluechange: changed },
  });
  let model: import('monaco-editor').editor.ITextModel | undefined;
  await vi.waitFor(() => {
    model = monaco.editor.getModels().find((model) => model.getValue() === 'own edit');
    expect(model).toBeDefined();
  });
  const editor = monaco.editor.getEditors().find((editor) => editor.getModel() === model)!;
  const element = view.container.querySelector('.monaco-editor');
  editor.executeEdits('test', [{ range: new monaco.Range(1, 1, 1, 4), text: 'native' }]);
  await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith('native edit'));
  await view.rerender({ value: 'native edit' });
  expect(editor.getModel()).toBe(model);
  expect(view.container.querySelector('.monaco-editor')).toBe(element);
  expect(model!.isDisposed()).toBe(false);
});

it.each([
  { language: 'json', invalid: '{ "broken": }', valid: '{ "ok": true }' },
  {
    language: 'typescript',
    invalid: 'const count: number = "wrong";',
    valid: 'const count: number = 1;',
  },
  { language: 'css', invalid: 'a { color: }', valid: 'a { color: red; }' },
])(
  'completes current $language diagnostics with explicit pending state',
  async ({ language, invalid, valid }) => {
    const changed = vi.fn();
    const pending = vi.fn();
    const view = await render(MonacoEditor, {
      props: {
        value: invalid,
        language,
        validateDiagnostics: true,
        onmarkerschange: changed,
        ondiagnosticspending: pending,
      },
    });
    await vi.waitFor(() => expect(pending).toHaveBeenCalledWith(true), { timeout: 10000 });
    await vi.waitFor(() => expect(changed.mock.lastCall?.[0]).toBeGreaterThan(0), {
      timeout: 10000,
    });
    expect(pending).toHaveBeenLastCalledWith(false);
    changed.mockClear();
    pending.mockClear();
    await view.rerender({ value: valid });
    await vi.waitFor(() => expect(pending).toHaveBeenCalledWith(true));
    await vi.waitFor(
      () => {
        expect(pending).toHaveBeenLastCalledWith(false);
        expect(changed).toHaveBeenLastCalledWith(0);
      },
      { timeout: 10000 },
    );
    // No stale invalid result may arrive after the settled valid generation.
    await view.rerender({ value: invalid });
    await view.rerender({ value: valid });
    await vi.waitFor(
      () => {
        expect(pending).toHaveBeenLastCalledWith(false);
        expect(changed).toHaveBeenLastCalledWith(0);
      },
      { timeout: 10000 },
    );
  },
);
