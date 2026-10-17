import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { flowbiteRenderers } from '../../src/lib';
import { mountControl } from '../testUtils';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
function setup(
  schema: Parameters<typeof mountControl>[0]['propertySchema'],
  value: unknown = 2,
  options: Record<string, unknown> = {},
) {
  const result = mountControl({
    propertySchema: schema,
    value,
    options,
    renderers: flowbiteRenderers,
  });
  const input = result.view.container.querySelector<HTMLInputElement>('input[type="number"]')!;
  const enter = (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  return { ...result, input, enter };
}
it('retains fractional integer text without silently truncating and parses complete exponents', async () => {
  const { view, onchange, input, enter } = setup({ type: 'integer' });
  enter('7.9');
  await expect
    .element(page.getByText(messages.en['numeric.integer'], { exact: true }))
    .toBeVisible();
  expect(input.value).toBe('7.9');
  expect(onchange.mock.lastCall?.[0].data.value).toBe(2);
  enter('1e3');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(1000));
  expect(view.container.textContent).not.toContain(messages.en['numeric.integer']);
});
it('rejects unsupported precision and overflow while retaining the stored value', async () => {
  const { onchange, enter, view } = setup({ type: 'number' });
  for (const text of ['9007199254740993', '1.234567890123456789']) {
    enter(text);
    await vi.waitFor(() =>
      expect(view.container.querySelector('[aria-invalid="true"]')).not.toBeNull(),
    );
    expect(onchange.mock.lastCall?.[0].data.value).toBe(2);
  }
  enter('-0.125');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(-0.125));
});
it('guards inclusive/exclusive commits, permits repairs and respects restrict false', async () => {
  const { view, onchange, enter, input } = setup(
    { type: 'number', exclusiveMinimum: 0, maximum: 10 },
    -5,
  );
  enter('-3');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(-3));
  enter('-4');
  await expect.element(page.getByRole('alert')).toHaveTextContent('Enter a number greater than 0.');
  expect(onchange.mock.lastCall?.[0].data.value).toBe(-3);
  enter('0');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(0)); // Improves the imported violation.
  enter('1');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(1));
  enter('11');
  await expect.element(page.getByText('Enter 10 or less.', { exact: true })).toBeVisible();
  expect(onchange.mock.lastCall?.[0].data.value).toBe(1);
  await view.rerender({ config: { restrict: false } });
  enter('11');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(11));
  expect(input.hasAttribute('max')).toBe(false);
});
it('keeps incomplete native entry local and clears to absence rather than zero', async () => {
  const { input, onchange, enter } = setup({ type: 'number' });
  input.focus();
  input.select();
  await userEvent.keyboard('-');
  await expect
    .element(page.getByText(messages.en['numeric.incomplete'], { exact: true }))
    .toBeVisible();
  expect(onchange.mock.lastCall?.[0].data.value).toBe(2);
  await userEvent.keyboard('3');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(-3));
  enter('0');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(0));
  enter('');
  await vi.waitFor(() =>
    expect(Object.hasOwn(onchange.mock.lastCall?.[0].data ?? {}, 'value')).toBe(false),
  );
});
it('uses integer-safe stepping and diagnoses invalid explicit steps', async () => {
  const { input, view } = setup({ type: 'integer', multipleOf: 0.5 });
  expect(input.step).toBe('1');
  await view.rerender({
    uischema: { type: 'Control', scope: '#/properties/value', options: { step: 0.25 } },
  });
  expect(input.step).toBe('1');
  await expect
    .element(page.getByRole('status'))
    .toHaveTextContent(messages.en['numeric.integerStep']);
});
it('refreshes draft feedback in Bulgarian and discards it for a new host value', async () => {
  const { view, input, enter } = setup({ type: 'integer' });
  enter('2.5');
  await view.rerender({ i18n: { locale: 'bg' } });
  await expect
    .element(page.getByText(messages.bg['numeric.integer'], { exact: true }))
    .toBeVisible();
  expect(input.value).toBe('2.5');
  await view.rerender({ data: { value: 8 } });
  expect(input.value).toBe('8');
  expect(view.container.textContent).not.toContain(messages.bg['numeric.integer']);
});

it('never commits non-finite values during native exponent entry', async () => {
  const { input, onchange } = setup({ type: 'number' });
  input.focus();
  input.select();
  await userEvent.keyboard('1e309');
  await expect.element(page.getByText(messages.en['numeric.incomplete'], { exact: true })).toBeVisible();
  expect(onchange.mock.lastCall?.[0].data.value).toBe(1000);
  for (const [event] of onchange.mock.calls) expect(Number.isFinite(event.data.value)).toBe(true);
});
