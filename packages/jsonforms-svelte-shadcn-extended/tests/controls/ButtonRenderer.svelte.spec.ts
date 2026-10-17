import { tick } from 'svelte';
import { shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import type { ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { buttonRendererEntry } from '../../src/lib/controls';
import { mountForm, waitForFormChange } from '../testUtils';

describe('ButtonRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [buttonRendererEntry];
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      status: { type: 'string' },
    },
  };

  it('fills its allocated width only when fullWidth is true', async () => {
    const element = (fullWidth?: boolean): UISchemaElement =>
      ({
        type: 'Button',
        label: 'Apply action',
        options: { fullWidth },
      }) as UISchemaElement;
    const { view } = mountForm({ schema, uischema: element(true), renderers });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    expect(button.classList.contains('w-full')).toBe(true);
    await view.rerender({ uischema: element(false) });
    expect(button.classList.contains('w-full')).toBe(false);
    await view.rerender({ uischema: element() });
    expect(button.classList.contains('w-full')).toBe(false);
  });

  it('flushes text before keyboard-style activation and blocks unfinished composition', async () => {
    const received: unknown[] = [];
    const { view } = mountForm({
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
    const { view } = mountForm({
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

  it('uses native destructive focus/theme styles and honors an explicit native variant', async () => {
    const element = (options = {}): UISchemaElement =>
      ({ type: 'Button', label: 'Remove', color: 'error', options }) as UISchemaElement;
    const { view } = mountForm({ schema, renderers, uischema: element() });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    expect(button.classList.contains('focus-visible:ring-destructive/20')).toBe(true);
    expect(button.classList.contains('dark:bg-destructive/20')).toBe(true);
    await view.rerender({ uischema: element({ button: { variant: 'link' } }) });
    expect(button.classList.contains('underline-offset-4')).toBe(true);
    expect(button.classList.contains('bg-destructive/10')).toBe(false);
  });

  it('renders button elements', () => {
    const { view } = mountForm({
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

    const { view, onchange } = mountForm({
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
    const { view, onchange } = mountForm({
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
    const { view } = mountForm({
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
    const { view } = mountForm({
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
  it('dispatches the empty action and keeps top-level fields above legacy options', async () => {
    const onhandleaction = vi.fn();
    const { view } = mountForm({
      schema,
      renderers,
      onhandleaction,
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
        options: { action: 'legacy', label: 'Legacy' },
        script: 'throw new Error("must not run")',
      } as UISchemaElement,
    });
    const button = view.container.querySelector<HTMLButtonElement>('button')!;
    expect(button.textContent).toContain('Top');
    button.click();
    await vi.waitFor(() => expect(onhandleaction).toHaveBeenCalledTimes(2));
    expect(onhandleaction.mock.lastCall?.[0].action).toBe('top');
    expect(
      view.container.querySelector('[data-button-diagnostic="action.conflict"]'),
    ).not.toBeNull();
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
        const { view } = mountForm({
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
    const { view } = mountForm({
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
