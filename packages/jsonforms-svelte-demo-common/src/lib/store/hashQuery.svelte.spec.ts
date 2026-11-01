import { afterEach, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import HashQueryHost from './HashQueryHost.svelte';

afterEach(cleanup);

it('syncs external navigation and writes a single canonical hash value', async () => {
  const original = window.location.href;
  try {
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}?form-only=true&campaign=spring#/examples/a%20b?form-only=false&drawer=true`,
    );
    await render(HashQueryHost);
    const value = page.getByTestId('form-only');
    await expect.poll(() => value.element().textContent).toBe('false');

    await page.getByRole('button', { name: 'Toggle form only' }).click();
    await expect.poll(() => value.element().textContent).toBe('true');
    expect(window.location.search).toBe('?campaign=spring');
    expect(window.location.hash).toBe('#/examples/a%20b?form-only=true&drawer=true');

    window.history.pushState(
      window.history.state,
      '',
      `${window.location.pathname}?campaign=spring#/examples/a%20b?drawer=true`,
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
    await expect.poll(() => value.element().textContent).toBe('false');
    window.history.back();
    await expect.poll(() => value.element().textContent).toBe('true');
    window.history.forward();
    await expect.poll(() => value.element().textContent).toBe('false');

    window.history.pushState(
      window.history.state,
      '',
      `${window.location.pathname}?form-only=true#/examples/a%20b?drawer=true`,
    );
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await expect.poll(() => value.element().textContent).toBe('true');
  } finally {
    window.history.replaceState(window.history.state, '', original);
  }
});
