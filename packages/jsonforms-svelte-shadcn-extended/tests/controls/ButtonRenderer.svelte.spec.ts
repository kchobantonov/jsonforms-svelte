import { tick } from 'svelte';
import type { OwnedErrorGeneration, OwnedErrorStore } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import type { ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { buttonRendererEntry } from '../../src/lib/controls';
import { mountForm, waitForFormChange } from '../testUtils';
import PendingActionRenderer from '../../../jsonforms-svelte/tests/fixtures/PendingActionRenderer.svelte';

describe('ButtonRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [buttonRendererEntry];
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      status: { type: 'string' },
    },
  };

  it('reports visible script denial once per permission interval', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ondiagnostic = vi.fn();
    try {
      const { view } = await mountForm({
        schema,
        renderers,
        uischema: { type: 'Button', label: 'Run', script: 'return 1;' } as UISchemaElement,
        ondiagnostic,
      });
      await vi.waitFor(() =>
        expect(
          view.container.querySelector('[data-button-diagnostic="script.evaluationDisabled"]'),
        ).toBeTruthy(),
      );
      expect(warn).toHaveBeenCalledWith('script.evaluationDisabled', {
        severity: 'warning',
        message: 'Button script evaluation is disabled by host policy.',
        details: { capability: 'button', path: '' },
      });
      expect(ondiagnostic).toHaveBeenCalledWith({
        code: 'script.evaluationDisabled',
        severity: 'warning',
        message: 'Button script evaluation is disabled by host policy.',
        details: { capability: 'button', path: '' },
      });
      await view.rerender({ data: { status: 'Changed' } });
      expect(warn.mock.calls.filter(([code]) => code === 'script.evaluationDisabled')).toHaveLength(
        1,
      );
      expect(
        ondiagnostic.mock.calls.filter(
          ([diagnostic]) => diagnostic.code === 'script.evaluationDisabled',
        ),
      ).toHaveLength(1);
      await view.rerender({
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
      });
      await vi.waitFor(() => expect(view.container.querySelector('button')).toBeTruthy());
      await view.rerender({ config: {} });
      await vi.waitFor(() =>
        expect(
          view.container.querySelector('[data-button-diagnostic="script.evaluationDisabled"]'),
        ).toBeTruthy(),
      );
      expect(warn.mock.calls.filter(([code]) => code === 'script.evaluationDisabled')).toHaveLength(
        2,
      );
      expect(
        ondiagnostic.mock.calls.filter(
          ([diagnostic]) => diagnostic.code === 'script.evaluationDisabled',
        ),
      ).toHaveLength(2);
    } finally {
      warn.mockRestore();
    }
  });

  it('fills its allocated width only when fullWidth is true', async () => {
    const element = (fullWidth?: boolean): UISchemaElement =>
      ({
        type: 'Button',
        label: 'Apply action',
        options: { fullWidth },
      }) as UISchemaElement;
    const { view } = await mountForm({ schema, uischema: element(true), renderers });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    expect(button.classList.contains('w-full')).toBe(true);
    await view.rerender({ uischema: element(false) });
    expect(button.classList.contains('w-full')).toBe(false);
    await view.rerender({ uischema: element() });
    expect(button.classList.contains('w-full')).toBe(false);
  });

  it('uses top-level action and label and honors disabled false', async () => {
    const onhandleaction = vi.fn();
    const element = (disabled: boolean): UISchemaElement =>
      ({
        type: 'Button',
        action: 'command',
        label: 'Command label',
        options: { disabled },
      }) as UISchemaElement;
    const { view } = await mountForm({
      schema,
      renderers,
      onhandleaction,
      uischema: element(true),
    });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    expect(button.textContent).toContain('Command label');
    expect(button.disabled).toBe(true);
    button.click();
    expect(onhandleaction).not.toHaveBeenCalled();

    await view.rerender({ uischema: element(false) });
    expect(button.disabled).toBe(false);
    button.click();
    await vi.waitFor(() => expect(onhandleaction).toHaveBeenCalledTimes(1));
    expect(onhandleaction.mock.lastCall?.[0].action).toBe('command');
  });

  it('flushes text before keyboard-style activation and blocks unfinished composition', async () => {
    const received: unknown[] = [];
    const { view } = await mountForm({
      schema,
      data: { status: 'old' },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/status' },
          { type: 'Button', label: 'Read data', action: 'read' },
        ],
      } as UISchemaElement,
      renderers: [...shadcnRenderers, buttonRendererEntry],
      onhandleaction: (event: ActionEvent) => {
        received.push(event.context.data);
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    const button = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button')).find(
      (element) => element.textContent?.includes('Read data'),
    )!;
    input.value = 'completed';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    // No blur: a consuming action must resolve the draft itself.
    button.click();
    await vi.waitFor(() => expect(received).toEqual([{ status: 'completed' }]));
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'unfinished';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    button.click();
    await tick();
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    expect(received).toHaveLength(1);
    input.value = 'finished';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    button.click();
    await vi.waitFor(() =>
      expect(received).toEqual([{ status: 'completed' }, { status: 'finished' }]),
    );
  });

  it('cancels an action disposed while pending edits are being resolved', async () => {
    const onhandleaction = vi.fn();
    const { view } = await mountForm({
      schema,
      renderers,
      onhandleaction,
      uischema: { type: 'Button', label: 'Read', action: 'read' } as UISchemaElement,
    });
    view.container.querySelector<HTMLButtonElement>('button')!.click();
    await view.unmount();
    await tick();
    expect(onhandleaction).not.toHaveBeenCalled();
  });

  it.each([
    { phase: 'before', source: 'data' },
    { phase: 'after', source: 'data' },
    { phase: 'before', source: 'schema' },
    { phase: 'before', source: 'config' },
  ] as const)(
    'cancels a Button action when host $source changes $phase pending-edit flush',
    async ({ phase, source }) => {
      let store!: OwnedErrorStore;
      let setOnFlush!: (callback: () => void) => void;
      const onhandleaction = vi.fn();
      const buttonSchema: JsonSchema = {
        type: 'object',
        properties: { status: { type: 'string' }, probe: { type: 'string' } },
      };
      const { view, onchange } = await mountForm({
        schema: buttonSchema,
        data: { status: 'before', probe: '' },
        uischema: {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/probe',
              options: {
                capture: (value: OwnedErrorStore) => (store = value),
                captureOnFlush: (value: typeof setOnFlush) => (setOnFlush = value),
              },
            },
            { type: 'Button', label: 'Read data', action: 'read' },
          ],
        } as UISchemaElement,
        renderers: [
          ...shadcnRenderers,
          buttonRendererEntry,
          {
            tester: (uischema: UISchemaElement) =>
              'scope' in uischema && uischema.scope === '#/properties/probe' ? 100 : -1,
            renderer: PendingActionRenderer,
          },
        ],
        onhandleaction,
      });
      await vi.waitFor(() => expect(store).toBeDefined());
      const owner = store.createOwner();
      let generation: OwnedErrorGeneration | undefined;
      const flushed = vi.fn();
      if (phase === 'before') generation = owner.begin('', true);
      setOnFlush(() => {
        flushed();
        if (phase === 'after') generation = owner.begin('', true);
      });
      const button = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
        (element) => element.textContent?.includes('Read data'),
      )!;
      button.click();
      if (phase === 'after') await vi.waitFor(() => expect(generation).toBeDefined());
      else await tick();
      await view.rerender(
        source === 'data'
          ? { data: { status: 'replacement', probe: '' } }
          : source === 'schema'
            ? { schema: { ...buttonSchema, title: 'Replacement schema' } }
            : { config: { readonly: false } },
      );
      owner.publish(generation!, []);
      await tick();
      if (phase === 'before') expect(flushed).not.toHaveBeenCalled();
      expect(onhandleaction).not.toHaveBeenCalled();
      if (source === 'data')
        expect(onchange.mock.lastCall?.[0].data).toEqual({ status: 'replacement', probe: '' });
      owner.dispose();
    },
  );

  it('uses native destructive focus/theme styles and honors an explicit native variant', async () => {
    const element = (options = {}): UISchemaElement =>
      ({ type: 'Button', label: 'Remove', color: 'error', options }) as UISchemaElement;
    const { view } = await mountForm({ schema, renderers, uischema: element() });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    expect(button.classList.contains('focus-visible:ring-destructive/20')).toBe(true);
    expect(button.classList.contains('dark:bg-destructive/20')).toBe(true);
    await view.rerender({ uischema: element({ button: { variant: 'link' } }) });
    expect(button.classList.contains('underline-offset-4')).toBe(true);
    expect(button.classList.contains('bg-destructive/10')).toBe(false);
  });

  it('renders button elements', async () => {
    const { view } = await mountForm({
      schema,
      uischema: {
        type: 'Button',
        label: 'Apply action',
        icon: '✓',
        action: 'applyStatus',
      } as UISchemaElement,
      renderers,
    });

    const button = view.container.querySelector<HTMLButtonElement>('button');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('Apply action');
    expect(button?.textContent).toContain('✓');
  });

  it('fires handle-action and applies the registered callback', async () => {
    const onhandleaction = vi.fn((event: ActionEvent) => {
      event.callback = (source: ActionEvent) => {
        source.context.data = {
          ...(source.context.data ?? {}),
          status: source.element?.options?.metadata.status,
        };
      };
    });

    const { view, onchange } = await mountForm({
      schema,
      uischema: {
        type: 'Button',
        label: 'Apply action',
        action: 'applyStatus',
        params: { status: 'Updated from action' },
        options: { metadata: { status: 'Updated from action metadata' } },
      } as UISchemaElement,
      renderers,
      data: { status: 'Idle' },
      onhandleaction,
    });

    const button = view.container.querySelector<HTMLButtonElement>('button');
    expect(button).toBeTruthy();

    const before = onchange.mock.calls.length;
    button!.click();

    await vi.waitFor(() => {
      expect(onhandleaction).toHaveBeenCalled();
    });

    expect(onhandleaction.mock.lastCall?.[0].action).toBe('applyStatus');
    expect(onhandleaction.mock.lastCall?.[0].params).toEqual({ status: 'Updated from action' });

    const changeEvent = await waitForFormChange(onchange, before);
    expect(changeEvent.data).toEqual({ status: 'Updated from action metadata' });
    expect(onhandleaction.mock.lastCall?.[0].element?.type).toBe('Button');
  });

  it('executes inline scripts with access to the form context', async () => {
    const { view, onchange } = await mountForm({
      schema,
      uischema: {
        type: 'Button',
        label: 'Run script',
        options: { metadata: { status: 'Updated from script' } },
        script:
          'this.context.data = { ...(this.context.data ?? {}), status: this.element.options.metadata.status };',
      } as UISchemaElement,
      renderers,
      data: { status: 'Idle' },
    });

    await view.rerender({
      config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
    });

    const button = view.container.querySelector<HTMLButtonElement>('button');
    expect(button).toBeTruthy();

    const before = onchange.mock.calls.length;
    button!.click();

    const changeEvent = await waitForFormChange(onchange, before);
    expect(changeEvent.data).toEqual({ status: 'Updated from script' });
  });
  it('denies string compilation even when UI options request permission', async () => {
    const { view } = await mountForm({
      schema,
      renderers,
      uischema: {
        type: 'Button',
        label: 'Run script',
        script: 'invalid syntax !!!',
        options: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
      } as UISchemaElement,
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[role="status"]')?.textContent).toContain(
        'disabled by the host',
      ),
    );
    expect(view.container.querySelector('button')).toBeNull();
  });

  it('awaits trusted callbacks without permission and ignores duplicate activation', async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const script = vi.fn(async function (this: ActionEvent, event: ActionEvent) {
      expect(this).toBe(event);
      expect(event.params).toEqual({});
      await pending;
    });
    const { view } = await mountForm({
      schema,
      renderers,
      uischema: {
        type: 'Button',
        label: 'Run callback',
        script,
        params: ['invalid'],
      } as UISchemaElement,
    });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    button.click();
    button.click();
    await vi.waitFor(() => expect(button.disabled).toBe(true));
    expect(button.getAttribute('aria-busy')).toBe('true');
    await expect.poll(() => script.mock.calls.length).toBe(1);
    finish();
    await vi.waitFor(() => expect(button.disabled).toBe(false));
  });
  it('dispatches the empty action and uses top-level fields', async () => {
    const onhandleaction = vi.fn();
    const ondiagnostic = vi.fn();
    const { view } = await mountForm({
      schema,
      renderers,
      onhandleaction,
      ondiagnostic,
      uischema: {
        type: 'Button',
        label: 'No command',
      } as UISchemaElement,
    });
    view.container.querySelector<HTMLButtonElement>('button')!.click();
    await vi.waitFor(() => expect(onhandleaction).toHaveBeenCalledTimes(1));
    expect(onhandleaction.mock.lastCall?.[0].action).toBe('');
    await view.rerender({
      uischema: {
        type: 'Button',
        label: 'Top',
        action: 'top',
        script: 'throw new Error("must not run")',
      } as UISchemaElement,
    });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    expect(button.textContent).toContain('Top');
    button.click();
    await vi.waitFor(() => expect(onhandleaction).toHaveBeenCalledTimes(2));
    expect(onhandleaction.mock.lastCall?.[0].action).toBe('top');
    await vi.waitFor(() =>
      expect(ondiagnostic).toHaveBeenCalledWith({
        code: 'action.conflict',
        severity: 'warning',
        message: 'Button declares both an action and a script; the action is used.',
        details: { action: 'top', path: '' },
      }),
    );
    expect(view.container.querySelector('[data-button-diagnostic="action.conflict"]')).toBeNull();
    await view.rerender({ data: {} });
    expect(
      ondiagnostic.mock.calls.filter(([entry]) => entry.code === 'action.conflict'),
    ).toHaveLength(1);
    await view.rerender({
      uischema: { type: 'Button', label: 'Top', action: 'top' } as UISchemaElement,
    });
    await view.rerender({
      uischema: {
        type: 'Button',
        label: 'Top',
        action: 'top',
        script: 'throw new Error("must not run")',
      } as UISchemaElement,
    });
    await vi.waitFor(() =>
      expect(
        ondiagnostic.mock.calls.filter(([entry]) => entry.code === 'action.conflict'),
      ).toHaveLength(2),
    );
  });
  it.each(['handler', 'callback', 'script'] as const)(
    'clears pending after a rejected %s, propagates the error and permits retry',
    async (source) => {
      let reject!: (reason: Error) => void;
      const pending = new Promise<void>((_, fail) => {
        reject = fail;
      });
      const failure = new Error(`Expected ${source} rejection`);
      const reported: unknown[] = [];
      const onRejection = (event: PromiseRejectionEvent) => {
        if (event.reason !== failure) return;
        // Observe the actual platform event; consume only this expected failure
        // so the browser runner still reports every unrelated unhandled error.
        reported.push(event.reason);
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      window.addEventListener('unhandledrejection', onRejection, { capture: true });
      try {
        const command = vi
          .fn()
          .mockImplementationOnce(() => pending)
          .mockResolvedValue(undefined);
        const onhandleaction = vi.fn((event: ActionEvent) => {
          if (source === 'callback') event.callback = command;
          else return command();
        });
        const { view } = await mountForm({
          schema,
          renderers,
          onhandleaction,
          uischema: {
            type: 'Button',
            label: 'Retry command',
            ...(source === 'script' ? { script: command } : { action: 'save' }),
          } as UISchemaElement,
        });
        const button = view.container.querySelector<HTMLButtonElement>('button')!;
        button.click();
        button.click();
        await expect.poll(() => button.getAttribute('aria-busy')).toBe('true');
        expect(button.disabled).toBe(true);
        await expect.poll(() => command.mock.calls.length).toBe(1);
        reject(failure);
        await expect.poll(() => reported).toEqual([failure]);
        await expect.poll(() => button.disabled).toBe(false);
        expect(button.hasAttribute('aria-busy')).toBe(false);
        button.click();
        await expect.poll(() => command.mock.calls.length).toBe(2);
        await expect.poll(() => button.disabled).toBe(false);
      } finally {
        window.removeEventListener('unhandledrejection', onRejection, { capture: true });
      }
    },
  );
  it('blocks unfinished OTP composition and consumes the completed code without blur', async () => {
    const received: unknown[] = [];
    const { view } = await mountForm({
      schema: {
        type: 'object',
        properties: { status: { type: 'string', format: 'password', minLength: 4, maxLength: 6 } },
      },
      data: { status: '00' },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/status', options: { variant: 'otp' } },
          { type: 'Button', label: 'Read code', action: 'read' },
        ],
      } as UISchemaElement,
      renderers: [...shadcnRenderers, buttonRendererEntry],
      onhandleaction: (event: ActionEvent) => {
        received.push(event.context.data);
      },
    });
    const input = view.container.querySelectorAll<HTMLInputElement>('input')[0];
    const button = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button')).find(
      (element) => element.textContent?.includes('Read code'),
    )!;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '00にほ';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    button.click();
    await tick();
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    expect(received).toEqual([]);
    input.value = '00日😀';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    button.click();
    await vi.waitFor(() => expect(received).toEqual([{ status: '00日😀' }]));
  });
});
