import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import catalog from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-combinators/supplemental-translations.json';

const runOneOf =
  (generated: boolean): Parameters<typeof demoTest>[1] =>
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
    );
    if (generated) {
      const label = demoEditorLabel(locale, 'UI Schema');
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.monaco-editor');
      await editor.locator('.inputarea, .native-edit-context').focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('Backspace');
      await toolbar.getByRole('button').nth(1).click();
      await page
        .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
        .click();
      await expect
        .poll(() => page.getByRole('tab', { name: 'anyOf', exact: true }).count())
        .toBe(0);
    }
    const labels = catalog[locale];
    const email = page.locator('input[id*="/properties/email-input"]');
    await expect.poll(() => email.inputValue()).toBe('alex.moreau@example.com');
    const selectPhone = async () => {
      if (family === 'flowbite') {
        await page.locator('select[id*="/properties/contact"]:visible').selectOption('1');
      } else {
        const trigger =
          family === 'shadcn'
            ? page.locator('button[id*="/properties/contact"][aria-haspopup="listbox"]:visible')
            : page
                .locator('input[id*="/properties/contact"]:visible')
                .locator('..')
                .locator('button[aria-haspopup="listbox"]');
        await trigger.click();
        await page.getByRole('option', { name: labels['Phone contact'], exact: true }).click();
      }
    };
    const readContact = async () => {
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const lines = page.locator('.monaco-editor:visible .view-lines');
      await lines.waitFor();
      return JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).contact;
    };
    await selectPhone();
    await expect.poll(() => page.getByRole('dialog').count()).toBe(1);
    await page
      .getByRole('button', { name: messages[locale]['combinator.clearDialogDecline'], exact: true })
      .click();
    await expect.poll(() => email.inputValue()).toBe('alex.moreau@example.com');
    expect(await readContact()).toEqual({
      name: 'Alex Moreau',
      kind: 'email',
      email: 'alex.moreau@example.com',
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await selectPhone();
    await page
      .getByRole('button', { name: messages[locale]['combinator.clearDialogAccept'], exact: true })
      .click();
    await expect.poll(() => page.locator('input[id*="/properties/phone-input"]').count()).toBe(1);
    expect(await readContact()).toEqual({ name: 'Alex Moreau', kind: 'phone', phone: '' });
    expect(errors).toEqual([]);
  };

demoTest('composition-oneof-authored', runOneOf(false), { timeout: 30_000 });
demoTest('composition-oneof-generated', runOneOf(true), { timeout: 30_000 });

demoTest(
  'composition-oneof-complex-confirmation',
  async ({ page, family, locale, webcomponent, base }) => {
    page.setDefaultTimeout(3_000);
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const apply = async (name: string, value: unknown) => {
      const label = demoEditorLabel(locale, name);
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.monaco-editor');
      const input = editor.locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate((element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      await toolbar.getByRole('button').nth(1).click();
    };
    const demo = () =>
      page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
    const readContact = async () => {
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const lines = page.locator('.monaco-editor:visible .view-lines');
      await lines.waitFor();
      return JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).contact;
    };
    const choosePhone = async () => {
      if (family === 'flowbite') {
        await page.locator('select[id*="/properties/contact"]:visible').selectOption('1');
      } else {
        const trigger =
          family === 'shadcn'
            ? page.locator('button[id*="/properties/contact"][aria-haspopup="listbox"]:visible')
            : page
                .locator('input[id*="/properties/contact"]:visible')
                .locator('..')
                .locator('button[aria-haspopup="listbox"]');
        await trigger.click();
        await page
          .getByRole('option', { name: catalog[locale]['Phone contact'], exact: true })
          .click();
      }
    };
    await apply('UI Schema', {
      type: 'Control',
      scope: '#/properties/contact',
      options: { confirmation: { branchChange: 'complex' } },
    });
    await apply('Data', { contact: { name: 'Alex', kind: 'email' } });
    await demo();
    await choosePhone();
    await expect.poll(() => page.locator('input[id*="/properties/phone-input"]').count()).toBe(1);
    expect(await readContact()).toEqual({ name: 'Alex', kind: 'phone', phone: '' });
    expect(await page.getByRole('dialog').count()).toBe(0);

    const meaningful = { name: 'Alex', kind: 'email', email: 'alex@example.test' };
    await apply('Data', { contact: meaningful });
    await demo();
    await choosePhone();
    await expect.poll(() => page.getByRole('dialog').count()).toBe(1);
    await page
      .getByRole('button', { name: messages[locale]['combinator.clearDialogDecline'], exact: true })
      .click();
    expect(await readContact()).toEqual(meaningful);
    await demo();
    await choosePhone();
    await page
      .getByRole('button', { name: messages[locale]['combinator.clearDialogAccept'], exact: true })
      .click();
    expect(await readContact()).toEqual({ name: 'Alex', kind: 'phone', phone: '' });
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);

demoTest(
  'composition-oneof-overlap',
  async ({ page, family, locale, webcomponent, base }) => {
    page.setDefaultTimeout(3_000);
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const apply = async (name: string, value: unknown) => {
      const label = demoEditorLabel(locale, name);
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.monaco-editor');
      const input = editor.locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate((element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      await toolbar.getByRole('button').nth(1).click();
    };
    const demo = () =>
      page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
    const titles = locale === 'bg' ? ['Първа', 'Втора'] : ['First', 'Second'];
    await apply('UI Schema', { type: 'VerticalLayout', elements: [] });
    await apply('Schema', {
      type: 'object',
      properties: {
        value: {
          oneOf: [
            {
              type: 'object',
              title: titles[0],
              properties: { shared: { type: 'string' }, firstNote: { type: 'string' } },
              required: ['shared'],
            },
            {
              type: 'object',
              title: titles[1],
              properties: { shared: { type: 'string' }, secondNote: { type: 'string' } },
              required: ['shared'],
            },
          ],
        },
      },
    });
    await apply('Data', { value: { shared: 'ambiguous' } });
    await apply('UI Schema', {
      type: 'Control',
      scope: '#/properties/value',
      options: { confirmation: { branchChange: 'never' } },
    });
    await demo();
    const firstNote = page.locator('input[id*="/properties/firstNote"]:visible');
    const secondNote = page.locator('input[id*="/properties/secondNote"]:visible');
    await expect.poll(() => firstNote.count()).toBe(1);
    const chooseSecond = async () => {
      if (family === 'flowbite') {
        await page.locator('select[id*="/properties/value"]:visible').selectOption('1');
      } else {
        const trigger =
          family === 'shadcn'
            ? page.locator('button[id*="/properties/value"][aria-haspopup="listbox"]:visible')
            : page
                .locator('input[id*="/properties/value"]:visible')
                .locator('..')
                .locator('button[aria-haspopup="listbox"]');
        await trigger.click();
        await page.getByRole('option', { name: titles[1], exact: true }).click();
      }
    };
    await chooseSecond();
    await expect.poll(() => secondNote.count()).toBe(1);
    if (family === 'flowbite') {
      const shared = page.locator('input[id*="/properties/shared"]:visible');
      await shared.fill('external');
      await shared.press('Tab');
    } else {
      await apply('Data', { value: { shared: 'external' } });
      await demo();
    }
    await expect.poll(() => secondNote.count()).toBe(1);
    expect(await firstNote.count()).toBe(0);
    await expect
      .poll(() => page.locator('input[id*="/properties/shared"]:visible').inputValue())
      .toBe('external');
    await expect.poll(() => page.getByTestId('form-validation-errors').count()).toBe(1);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    expect(JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' '))).toEqual({
      value: { shared: 'external' },
    });
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
