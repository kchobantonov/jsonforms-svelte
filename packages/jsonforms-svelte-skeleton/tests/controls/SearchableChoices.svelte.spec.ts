import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import { mountControl } from '../testUtils';

afterEach(cleanup);
const schema = {
  title: 'Choice',
  oneOf: [
    { const: false, title: 'Same' },
    { const: 0, title: 'Same' },
    { const: { code: 3 }, title: 'Gamma' },
  ],
};
const mount = (autocomplete = true) =>
  mountControl({
    renderers: skeletonRenderers,
    cells: skeletonCells,
    propertySchema: schema,
    options: { autocomplete },
  });
async function search(term: string) {
  const trigger = page.getByRole('combobox', { name: 'Choice', exact: true });
  if (trigger.element().tagName === 'INPUT') await trigger.fill(term);
  else {
    await trigger.click();
    await page.getByPlaceholder('Search choices', { exact: true }).fill(term);
  }
}
it('filters translated labels without committing the query and selects the exact JSON value', async () => {
  const { onchange } = mount();
  await search('gam');
  expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined();
  await expect
    .element(page.getByRole('option', { name: 'Same', exact: true }))
    .not.toBeInTheDocument();
  await page.getByRole('option', { name: 'Gamma', exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual({ code: 3 }));
});
it('keeps duplicate labels distinct and preserves zero', async () => {
  const { onchange } = mount();
  await search('Same');
  await page.getByRole('option', { name: 'Same', exact: true }).nth(1).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(0));
});
it('honors an explicit non-searchable selector', async () => {
  mount(false);
  const trigger = page.getByLabelText('Choice', { exact: true });
  await expect.element(trigger).toBeVisible();
  expect(['SELECT', 'BUTTON']).toContain(trigger.element().tagName);
  await expect
    .element(page.getByPlaceholder('Search choices', { exact: true }))
    .not.toBeInTheDocument();
});
it('localizes empty search feedback without writing a custom value', async () => {
  const { view, onchange } = mount();
  await view.rerender({ i18n: { locale: 'bg' } });
  const trigger = page.getByRole('combobox', { name: 'Choice', exact: true });
  if (trigger.element().tagName === 'INPUT') await trigger.fill('missing');
  else {
    await trigger.click();
    await page.getByPlaceholder('Търсене на опции', { exact: true }).fill('missing');
  }
  await expect.element(page.getByText('Няма съвпадащи опции', { exact: true })).toBeVisible();
  expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined();
});
it('continues to accept free text outside suggestions', async () => {
  const { onchange } = mountControl({
    renderers: skeletonRenderers,
    propertySchema: { type: 'string', title: 'City' },
    options: { suggestion: ['Sofia', 'Varna'] },
  });
  const input = page.getByLabelText('City', { exact: true });
  await input.fill('Plovdiv');
  await userEvent.keyboard('{Tab}');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe('Plovdiv'));
});

it('selects through native keyboard navigation', async () => {
  const { onchange } = mount();
  await search('gam');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual({ code: 3 }));
});
it('uses the same searchable contract for ordinary enums and clears the chosen value', async () => {
  const { onchange } = mountControl({
    renderers: skeletonRenderers,
    propertySchema: { type: 'integer', title: 'Choice', enum: [1, 2, 3] },
    options: { autocomplete: true, clearable: true },
  });
  await search('2');
  await page.getByRole('option', { name: '2', exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe(2));
  await page.getByRole('button', { name: 'Clear value', exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined());
});
it('closes search when permissions change and rejects a stale option', async () => {
  const { view, onchange } = mount();
  await search('gam');
  const stale = page.getByRole('option', { name: 'Gamma', exact: true }).element() as HTMLElement;
  await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
  stale.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined());
});

it('keeps arbitrary text editable with referenced and overlapping suggestion lists', async () => {
  const { onchange } = mountControl({
    renderers: skeletonRenderers,
    propertySchema: {
      title: 'Referenced choices',
      definitions: { first: { enum: ['A', 'B'] }, second: { enum: ['B', 'C'] } },
      anyOf: [
        { $ref: '#/properties/value/definitions/first' },
        { $ref: '#/properties/value/definitions/second' },
        { type: 'string' },
      ],
    },
  });
  const input = page.getByLabelText('Referenced choices', { exact: true });
  await input.fill('outside the list');
  await userEvent.keyboard('{Tab}');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe('outside the list'));
});
