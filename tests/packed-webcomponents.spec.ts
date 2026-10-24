import type { JsonFormsFlowbiteElement } from '../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { test } from 'vite-plus/test';
import type { AddressInfo } from 'node:net';

test('packed Web Component imports and behavior', async () => {
  const artifacts = path.resolve(
    process.env.JSONFORMS_PACKED_ARTIFACTS ?? path.join(tmpdir(), 'jsonforms-release-packs'),
  );
  const overrides = JSON.parse(readFileSync(path.join(artifacts, 'overrides.json'), 'utf8'));
  const staging = mkdtempSync(path.join(tmpdir(), 'jsonforms-packed-browser-'));
  const server = createServer((request, response) => {
    try {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
      if (pathname === '/') {
        response.setHeader('Content-Type', 'text/html');
        response.end('<!doctype html><html><body></body></html>');
        return;
      }
      const file = path.resolve(staging, '.' + decodeURIComponent(pathname));
      if (!file.startsWith(staging + path.sep)) throw new Error('Invalid path');
      response.setHeader(
        'Content-Type',
        file.endsWith('.css')
          ? 'text/css'
          : file.endsWith('.js')
            ? 'text/javascript'
            : 'application/octet-stream',
      );
      response.end(readFileSync(file));
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  let browser;
  try {
    for (const style of ['flowbite', 'skeleton', 'shadcn']) {
      const directory = path.join(staging, style);
      mkdirSync(directory);
      execFileSync('tar', [
        '-xzf',
        overrides[`@chobantonov/jsonforms-svelte-${style}-webcomponent`].slice(5),
        '-C',
        directory,
      ]);
    }
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    browser = await chromium.launch();
    for (const style of ['flowbite', 'skeleton', 'shadcn']) {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(base);
      await page.addScriptTag({
        type: 'module',
        url: `${base}/${style}/package/dist/jsonforms-svelte-${style}.js`,
      });
      await page.evaluate(async (style) => {
        await customElements.whenDefined(`jsonforms-svelte-${style}`);
        const form = document.createElement(
          `jsonforms-svelte-${style}`,
        ) as JsonFormsFlowbiteElement;
        form.schema = {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        };
        form.uischema = {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        };
        form.data = { name: 'Ada' };
        form.mode = 'dark';
        form.addEventListener('validity-change', (event) => {
          if (event instanceof CustomEvent) window.formValidity = event.detail;
        });
        form.addEventListener('change', (event) => {
          if (event instanceof CustomEvent) window.formChange = event.detail;
        });
        document.body.append(form);
      }, style);
      const input = page.getByRole('textbox');
      await input.waitFor();
      assert.equal(await input.inputValue(), 'Ada');
      await input.fill('Grace');
      await page.waitForFunction(
        () =>
          typeof window.formChange?.data === 'object' &&
          window.formChange.data !== null &&
          'name' in window.formChange.data &&
          window.formChange.data.name === 'Grace',
      );
      await page.waitForFunction(() => window.formValidity?.valid === true);
      await page.evaluate((style) => {
        document.querySelector<JsonFormsFlowbiteElement>(
          `jsonforms-svelte-${style}`,
        )!.additionalErrors = [
          {
            keyword: 'server',
            instancePath: '/name',
            schemaPath: '',
            params: {},
            message: 'Server rejected name',
          },
        ];
      }, style);
      await page.waitForFunction(
        () =>
          window.formValidity?.valid === false && window.formValidity.additionalErrors.length === 1,
      );
      assert.equal(await input.inputValue(), 'Grace');
      await page.evaluate((style) => {
        document.querySelector<JsonFormsFlowbiteElement>(
          `jsonforms-svelte-${style}`,
        )!.additionalErrors = [];
      }, style);
      await page.waitForFunction(() => window.formValidity?.valid === true);

      await page.evaluate((style) => {
        document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!.readonly =
          true;
      }, style);
      await page.waitForFunction(() => {
        const input = document.body.firstElementChild!.shadowRoot!.querySelector('input')!;
        return input.disabled || input.readOnly;
      });
      await page.evaluate((style) => {
        document.body.firstElementChild!.remove();
        window.formChange = undefined;
        const form = document.createElement(
          `jsonforms-svelte-${style}`,
        ) as JsonFormsFlowbiteElement;
        form.addEventListener('change', (event) => {
          if (event instanceof CustomEvent) window.formChange = event.detail;
        });
        document.body.append(form);
      }, style);
      await page.locator('[id$="-input-selector"]').waitFor();
      await page.waitForFunction(() => window.formChange && window.formChange.data === undefined);
      await page.evaluate((style) => {
        document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!.data =
          JSON.stringify('hello');
      }, style);
      await page.getByRole('textbox').waitFor();
      assert.equal(await page.getByRole('textbox').inputValue(), 'hello');
      await page.getByRole('textbox').fill('updated');
      await page.waitForFunction(() => window.formChange?.data === 'updated');
      await page.evaluate((style) => {
        const form = document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!;
        form.schema = {};
        form.data = JSON.stringify('null');
      }, style);
      await page.waitForFunction(() => window.formChange?.data === 'null');
      assert.equal(await page.getByRole('textbox').inputValue(), 'null');
      await page.evaluate((style) => {
        const form = document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!;
        form.schema = undefined;
        form.data = ['first', 'second'];
      }, style);
      await page.waitForFunction(
        () => Array.isArray(window.formChange?.data) && window.formChange.data[1] === 'second',
      );
      await page.evaluate((style) => {
        document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!.data = null;
      }, style);
      await page.getByRole('checkbox').waitFor();
      assert.equal(await page.getByRole('checkbox').isChecked(), true);
      await page.evaluate((style) => {
        document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!.data =
          undefined;
      }, style);
      await page.locator('[id$="-input-selector"]').waitFor();
      await page.waitForFunction(() => window.formChange && window.formChange.data === undefined);
      await page.evaluate((style) => {
        const form = document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!;
        form.schema = { type: 'string' };
        form.uischema = { type: 'Control', scope: '#', label: 'Value', i18n: 'value' };
        form.translations = {
          'bg-BG': { other: 'Регион' },
          bg: { 'value.label': 'Стойност' },
          en: { 'value.label': 'Value' },
        };
        form.locale = 'bg-BG';
        form.data = JSON.stringify('kept');
      }, style);
      await page.getByRole('textbox', { name: 'Стойност', exact: true }).waitFor();
      assert.equal(
        await page.getByRole('textbox', { name: 'Стойност', exact: true }).inputValue(),
        'kept',
      );
      await page.evaluate((style) => {
        document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!.locale =
          'en';
      }, style);
      await page.getByRole('textbox', { name: 'Value', exact: true }).waitFor();
      assert.equal(
        await page.getByRole('textbox', { name: 'Value', exact: true }).inputValue(),
        'kept',
      );
      await page.evaluate((style) => {
        const form = document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!;
        form.schema = { type: 'string', format: 'password', minLength: 4, maxLength: 6 };
        form.uischema = { type: 'Control', scope: '#', label: 'Code', options: { variant: 'otp' } };
        form.data = JSON.stringify('0012');
      }, style);
      if (style === 'shadcn') {
        const otp = page.locator('[data-pin-input-input]');
        await otp.waitFor();
        assert.equal(await page.locator('[data-pin-input-cell]').count(), 6);
        await otp.focus();
        await otp.fill('009876');
        await otp.press('Tab');
      } else {
        const otp = page.getByRole('group', { name: 'Code', exact: true }).locator('input');
        await otp.first().waitFor();
        assert.equal(await otp.count(), 6);
        await otp.first().fill('009876');
        await otp.last().press('Tab');
      }
      await page.waitForFunction(() => window.formChange?.data === '009876');
      await page.evaluate((style) => {
        const form = document.querySelector<JsonFormsFlowbiteElement>(`jsonforms-svelte-${style}`)!;
        form.addEventListener('validity-change', (event) => {
          window.formValidity = event.detail;
        });
        form.schema = { type: 'string', format: 'byte' };
        form.uischema = {
          type: 'Control',
          scope: '#',
          label: 'Attachment',
          options: { restrict: false, formatMaximum: 2 },
        };
        form.data = undefined;
      }, style);
      await page
        .locator('input[type="file"]')
        .setInputFiles({ name: 'large.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
      await page.waitForFunction(() => window.formChange?.data === 'aGVsbG8=');
      await page.waitForFunction(() =>
        window.formValidity?.additionalErrors?.some((error) => error.keyword === 'fileSize'),
      );
      await page
        .locator('input[type="file"]')
        .setInputFiles({ name: 'small.txt', mimeType: 'text/plain', buffer: Buffer.from('a') });
      await page.waitForFunction(() => window.formChange?.data === 'YQ==');
      await page.waitForFunction(
        () => window.formValidity?.valid === true && window.formValidity.pending === false,
      );
      assert.deepEqual(errors, [], `${style}: browser errors or missing packed assets`);
      console.log(
        `${style}: packed browser registration, rendering, data changes, readonly, root inference, locale fallback, OTP, file validity and assets passed`,
      );
      await page.close();
    }
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    rmSync(staging, { recursive: true, force: true });
  }
}, 180_000);
