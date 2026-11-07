import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { mountControl } from '../testUtils';

afterEach(cleanup);
const schema = {
  type: 'integer',
  title: 'Amount',
  minimum: 1,
  maximum: 6,
  default: 2,
  multipleOf: 2,
};
const mount = async (value?: unknown) =>
  await mountControl({
    renderers: shadcnRenderers,
    cells: shadcnCells,
    propertySchema: schema,
    value,
    options: { slider: true },
  });

it('announces an unset default, commits native keyboard input, and clears back to absence', async () => {
  const { onchange } = await mount();
  const thumb = page.getByRole('slider', { name: 'Amount', exact: true });
  await expect.element(thumb).toHaveAttribute('aria-valuetext', 'Not set');
  expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined();
  (thumb.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(4));
  await page.getByRole('button', { name: 'Clear value', exact: true }).click();
  await expect.element(thumb).toHaveAttribute('aria-valuetext', 'Not set');
  expect(onchange.mock.lastCall?.[0].data).not.toHaveProperty('value');
});

it.each(['2', null, false, 3, 8])(
  'retains and identifies an invalid stored value: %j',
  async (value) => {
    const { onchange } = await mount(value);
    const thumb = page.getByRole('slider', { name: 'Amount', exact: true });
    await expect
      .element(thumb)
      .toHaveAttribute('aria-valuetext', `Stored value: ${JSON.stringify(value)}`);
    expect(onchange.mock.lastCall?.[0].data.value).toEqual(value);
  },
);

it('keeps zero present and guards stale actions after readonly changes', async () => {
  const { view, onchange } = await mountControl({
    renderers: shadcnRenderers,
    propertySchema: { ...schema, minimum: 0 },
    value: 0,
    options: { slider: true },
  });
  const thumb = page.getByRole('slider', { name: 'Amount', exact: true });
  await expect.element(thumb).toHaveAttribute('aria-valuetext', '0');
  const clear = page
    .getByRole('button', { name: 'Clear value', exact: true })
    .element() as HTMLButtonElement;
  await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
  clear.click();
  (thumb.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(onchange.mock.lastCall?.[0].data.value).toBe(0);
  await view.rerender({ readonly: false, i18n: { locale: 'bg' } });
  await page.getByRole('button', { name: 'Изчистване на стойността', exact: true }).click();
  await expect.element(thumb).toHaveAttribute('aria-valuetext', 'Не е зададено');
});

it('uses zero-based fractional multiples for integer tracks and ignores text-input step options', async () => {
  const { onchange } = await mountControl({
    renderers: shadcnRenderers,
    propertySchema: { ...schema, maximum: 10, multipleOf: 1.5, default: 3 },
    value: 3,
    options: { slider: true, step: 1 },
  });
  const thumb = page.getByRole('slider', { name: 'Amount', exact: true });
  (thumb.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(6));
});

it('edits exact decimal multiples through native keyboard controls', async () => {
  const { onchange } = await mountControl({
    renderers: shadcnRenderers,
    propertySchema: {
      type: 'number',
      title: 'Amount',
      minimum: 0.1,
      maximum: 0.6,
      default: 0.2,
      multipleOf: 0.2,
    },
    value: 0.2,
    options: { slider: true },
  });
  const thumb = page.getByRole('slider', { name: 'Amount', exact: true });
  (thumb.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(0.6));
});

it('clears a primitive slider cell without deleting an array slot', async () => {
  const { view, onchange } = await mountControl({
    renderers: shadcnRenderers,
    cells: shadcnCells,
    propertySchema: { type: 'array', items: schema },
    value: [2, 4],
    options: { table: true, cells: { '': { slider: true } } },
  });
  const clear = view.container.querySelector<HTMLButtonElement>(
    'td button[aria-label="Clear value"]',
  )!;
  expect(clear).not.toBeNull();
  await page.elementLocator(clear).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual([0, 4]));
});

it('allows an explicit keyboard choice when only one value fits the grid', async () => {
  const { onchange } = await mountControl({
    renderers: shadcnRenderers,
    propertySchema: { ...schema, maximum: 2 },
    options: { slider: true },
  });
  const thumb = page.getByRole('slider', { name: 'Amount', exact: true });
  await expect.element(thumb).toHaveAttribute('aria-valuetext', 'Not set');
  (thumb.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(2));
});
