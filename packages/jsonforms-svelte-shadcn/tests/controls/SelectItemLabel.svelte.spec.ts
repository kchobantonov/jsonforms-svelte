import '../test.css';
import { afterEach, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import SelectItemLabelFixture from './SelectItemLabelFixture.svelte';

afterEach(cleanup);

it('shows the supplied item label after selecting an item with richer child text', async () => {
  await render(SelectItemLabelFixture);
  await page.getByRole('button', { name: 'Choices' }).click();
  await page.getByRole('option', { name: 'Visible Beta and details' }).click();
  await expect.element(page.getByTestId('selection')).toHaveTextContent('choice-1');
  await expect.element(page.getByRole('button', { name: 'Choices' })).toHaveTextContent('Beta');
});
