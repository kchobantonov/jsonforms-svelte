import '../test.css';
import type { ErrorObject } from 'ajv';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import ValidationIcon from '../../src/lib/controls/components/ValidationIcon.svelte';

afterEach(cleanup);

const errors = Array.from({ length: 5 }, (_, index) => ({
  instancePath: `/field${index + 1}`,
  schemaPath: `#/properties/field${index + 1}/minLength`,
  keyword: 'minLength',
  params: { limit: 2 },
  message: `Error ${index + 1}`,
})) satisfies ErrorObject[];

it('shows the validation summary on hover without a click', async () => {
  await render(ValidationIcon, { props: { errors, showCount: false } });

  const trigger = page.getByRole('button', { name: 'Validation errors' });
  await trigger.hover();
  await expect.element(page.getByText('Error 1')).toBeVisible();

  const content = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
  expect(content).not.toBeNull();
  await page.elementLocator(content!).hover();
  await expect.element(page.getByText('Error 1')).toBeVisible();

  await trigger.click();
  await expect.element(page.getByText('Error 1')).toBeVisible();
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

it('opens an interactive validation summary and keeps its expansion inside the popover', async () => {
  await render(ValidationIcon, { props: { errors } });

  const trigger = page.getByRole('button', { name: 'Validation errors' });
  await trigger.click();
  const content = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
  expect(content).not.toBeNull();
  await expect.element(page.getByText('Error 1')).toBeVisible();
  expect(content?.textContent).not.toContain('Error 5');

  await page.getByRole('button', { name: /show 2 more/i }).click();
  await expect.element(page.getByText('Error 5')).toBeVisible();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

it('keeps a long expanded error summary scrollable inside the popup', async () => {
  const manyErrors = Array.from({ length: 30 }, (_, index) => ({
    ...errors[0],
    instancePath: `/field${index + 1}`,
    message: `Error ${index + 1}`,
  }));
  await render(ValidationIcon, { props: { errors: manyErrors } });
  await page.getByRole('button', { name: 'Validation errors' }).click();
  await page.getByRole('button', { name: /show .* more/i }).click();

  const content = document.querySelector<HTMLElement>('[data-slot="popover-content"]')!;
  expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
  expect(content.clientHeight).toBeLessThanOrEqual(320);
  const last = page.getByText('Error 30').element();
  last.scrollIntoView({ block: 'end' });
  await expect.poll(() => content.scrollTop).toBeGreaterThan(0);
  expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    content.getBoundingClientRect().bottom,
  );
});
