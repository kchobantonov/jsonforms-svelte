import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import type { ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
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
          status: source.params.status,
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
    expect(changeEvent.data).toEqual({ status: 'Updated from action' });
  });

  it('executes inline scripts with access to the form context', async () => {
    const { view, onchange } = mountForm({
      schema,
      uischema: {
        type: 'Button',
        label: 'Run script',
        script:
          'this.context.data = { ...(this.context.data ?? {}), status: "Updated from script" };',
      } as UISchemaElement,
      renderers,
      data: { status: 'Idle' },
    });

    const button = view.container.querySelector<HTMLButtonElement>('button');
    expect(button).toBeTruthy();

    const before = onchange.mock.calls.length;
    button!.click();

    const changeEvent = await waitForFormChange(onchange, before);
    expect(changeEvent.data).toEqual({ status: 'Updated from script' });
  });
});
