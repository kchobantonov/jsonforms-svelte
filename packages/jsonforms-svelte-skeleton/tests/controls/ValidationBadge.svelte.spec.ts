import '../test.css';
import type { ErrorObject } from 'ajv';
import { afterEach, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import ValidationIcon from '../../src/lib/controls/components/ValidationIcon.svelte';

afterEach(cleanup);

const errors: ErrorObject[] = [
  {
    instancePath: '/name',
    schemaPath: '#/properties/name/minLength',
    keyword: 'minLength',
    params: { limit: 9 },
    message: 'Use at least 9 characters.',
  },
];

it('shows the single field error on hover and remains keyboard accessible', async () => {
  await render(ValidationIcon, { props: { errors, showCount: false } });
  const trigger = page.getByRole('button', { name: 'Validation errors' });
  await trigger.hover();
  await expect.element(page.getByText('Use at least 9 characters.')).toBeVisible();
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  trigger.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByText('Use at least 9 characters.')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

it('scrolls a long expanded summary to its final error', async () => {
  const manyErrors = Array.from({ length: 30 }, (_, index) => ({
    ...errors[0],
    instancePath: `/field${index + 1}`,
    message: `Error ${index + 1}`,
  }));
  await render(ValidationIcon, { props: { errors: manyErrors } });
  await page.getByRole('button', { name: 'Validation errors' }).hover();
  await page.getByRole('button', { name: /show .* more/i }).click();
  const content = document.querySelector<HTMLElement>(
    '[class*="max-h-"][class*="overflow-y-auto"]',
  )!;
  expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
  expect(content.clientHeight).toBeLessThanOrEqual(320);
  const last = page.getByText('Error 30').element();
  last.scrollIntoView({ block: 'end' });
  await expect.poll(() => content.scrollTop).toBeGreaterThan(0);
  expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    content.getBoundingClientRect().bottom,
  );
});
