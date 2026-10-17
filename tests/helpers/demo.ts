import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, test } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';
import type { AddressInfo } from 'node:net';
import { createDemoServer, assertCurrentDemoWebComponent } from './demo-server';

const families = ['flowbite', 'shadcn', 'skeleton'] as const;
const locales = ['en', 'bg'] as const;
const cases = families.flatMap((family) =>
  locales.flatMap((locale) =>
    [false, true].map((webcomponent) => ({
      family,
      locale,
      webcomponent,
      host: webcomponent ? 'webcomponent' : 'native',
    })),
  ),
);
type Scenario = (typeof cases)[number] & { page: Page; base: string };

/** One browser per suite, an isolated page/context for every family/locale/host case. */
export function demoTest(
  name: string,
  run: (scenario: Scenario) => Promise<void>,
  options: { hasTouch?: boolean } = {},
) {
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
  test.each(cases)(`${name}: $family / $locale / $host`, async (scenario) => {
    if (scenario.webcomponent && !process.env.JSONFORMS_DEMO_URL)
      assertCurrentDemoWebComponent(scenario.family);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, ...options });
    page.setDefaultTimeout(20_000);
    try {
      await run({ ...scenario, page, base });
    } catch (error) {
      const directory = path.resolve('test-results');
      await mkdir(directory, { recursive: true });
      await page
        .screenshot({
          path: path.join(
            directory,
            `${name}-${scenario.family}-${scenario.locale}-${scenario.host}.png`,
          ),
          fullPage: true,
          timeout: 5_000,
        })
        .catch(() => {});
      throw error;
    } finally {
      await page.close();
    }
  });
}
