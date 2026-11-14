import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { chromium, type Browser } from 'playwright';
import type { AddressInfo } from 'node:net';
import { createDemoServer } from '../helpers/demo-server';

const families = ['flowbite', 'shadcn', 'skeleton'] as const;
const server = createDemoServer();
let browser: Browser;
let base: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test.each(families)(
  'demo preference cross-tab: %s',
  async (family) => {
    const context = await browser.newContext();
    try {
      const first = await context.newPage();
      const second = await context.newPage();
      const url = `${base}/${family}/#/examples/spec-presentation?drawer=false`;
      await Promise.all([first.goto(url), second.goto(url)]);
      const preference =
        family === 'flowbite'
          ? {
              key: 'flowbite-example-theme-color',
              attribute: 'data-theme-color',
              fallback: 'sunset',
              changed: 'ocean',
            }
          : family === 'shadcn'
            ? {
                key: 'shadcn-example-theme',
                attribute: 'data-theme',
                fallback: 'slate',
                changed: 'zinc',
              }
            : {
                key: 'skeleton-example-theme',
                attribute: 'data-theme',
                fallback: 'cerberus',
                changed: 'rose',
              };
      const current = () =>
        second.evaluate(
          (attribute) => document.documentElement.getAttribute(attribute),
          preference.attribute,
        );
      await expect.poll(current).toBe(preference.fallback);

      await first.evaluate(
        ({ key, changed }) =>
          localStorage.setItem(key, JSON.stringify({ version: 1, value: changed })),
        preference,
      );
      await expect.poll(current).toBe(preference.changed);

      await first.evaluate(
        ({ key, changed }) =>
          localStorage.setItem(key, JSON.stringify({ version: 2, value: changed })),
        preference,
      );
      await expect.poll(current).toBe(preference.fallback);

      await first.evaluate((key) => localStorage.removeItem(key), preference.key);
      await expect.poll(current).toBe(preference.fallback);
    } finally {
      await context.close();
    }
  },
  20_000,
);
