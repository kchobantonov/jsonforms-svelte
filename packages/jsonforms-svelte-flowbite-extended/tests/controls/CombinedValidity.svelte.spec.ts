import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { OwnedErrorStore } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { buttonRendererEntry } from '../../src/lib/controls';
import ValidityForm from '../../../jsonforms-svelte-extended/tests/fixtures/ValidityForm.svelte';

afterEach(cleanup);

it('gates submit on current schema, host errors, renderer errors and pending without data changes', async () => {
  let store: OwnedErrorStore;
  const submitted = vi.fn();
  const validity = vi.fn();
  const view = await render(ValidityForm, {
    renderers: [...flowbiteRenderers, buttonRendererEntry],
    capture: (value) => {
      store = value.store;
    },
    onhandleaction: submitted,
    onvaliditychange: validity,
    validationMode: 'NoValidation',
  });
  const button = view.container.querySelector<HTMLButtonElement>('button')!;
  async function blocked() {
    await vi.waitFor(() => expect(button.disabled).toBe(true));
    const count = submitted.mock.calls.length;
    button.click();
    await tick();
    expect(submitted).toHaveBeenCalledTimes(count);
  }
  async function allowed() {
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    const count = submitted.mock.calls.length;
    button.click();
    await vi.waitFor(() => expect(submitted).toHaveBeenCalledTimes(count + 1));
    expect(submitted.mock.lastCall?.[0].context.data).toEqual({ value: 'unchanged' });
  }
  await blocked();
  await view.rerender({ validationMode: 'ValidateAndHide' });
  await allowed();
  const host = {
    keyword: 'server',
    instancePath: '',
    schemaPath: '',
    params: {},
    message: 'Host error',
  };
  await view.rerender({ additionalErrors: [host] });
  await blocked();
  const owner = store!.createOwner();
  const generation = owner.begin('', true);
  await view.rerender({ additionalErrors: [] });
  await blocked();
  expect(validity.mock.lastCall?.[0]).toMatchObject({ current: true, pending: true, valid: false });
  owner.publish(generation, [{ ...host, keyword: 'editor' }]);
  await blocked();
  await vi.waitFor(() => expect(validity.mock.lastCall?.[0].pending).toBe(false));
  owner.clear();
  await allowed();
  await view.rerender({ schema: { type: 'object', required: ['missing'] } });
  await blocked();
  expect(validity.mock.lastCall?.[0].errors).toHaveLength(1);
  await view.rerender({ validationMode: 'NoValidation' });
  await blocked();
  await view.rerender({ schema: { type: 'object' }, validationMode: 'ValidateAndShow' });
  await allowed();
});
