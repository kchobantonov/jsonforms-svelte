import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';

demoTest(
  'applied UI Schemas registry changes delegated detail',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?drawer=false`);
    const tab = (name: string) =>
      page.getByRole('tab', {
        name:
          name === 'Demo'
            ? new RegExp(`^${demoEditorLabel(locale, name)}`)
            : demoEditorLabel(locale, name),
        exact: name !== 'Demo',
      });
    const apply = async (name: string, value: unknown, action: keyof typeof messages.en) => {
      await tab(name).click();
      const editor = page.locator('.monaco-editor:visible').last();
      const input = editor.locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate((element, content) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', content);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await page
        .getByRole('button', { name: messages[locale][action], exact: true })
        .first()
        .click();
    };

    await page.getByRole('tab', { name: translations[locale]['cards.detailModes.label'] }).click();
    await page
      .getByRole('textbox', { name: translations[locale]['cards.registeredAddress.label'] })
      .waitFor();
    await apply(
      'Config',
      {
        jsonformsExtended: { security: { allowScriptEvaluation: true } },
      },
      'editor.config.apply',
    );
    await apply(
      'UI Schemas',
      [
        {
          tester:
            "(schema, schemaPath) => schemaPath === '#/properties/cardContact' && schema?.properties?.address?.format === 'email' ? 10 : -1",
          uischema: {
            type: 'VerticalLayout',
            elements: [
              { type: 'Label', text: 'Applied registry marker' },
              { type: 'Control', scope: '#/properties/address' },
            ],
          },
        },
      ],
      'editor.uiSchemas.apply',
    );
    await tab('Demo').click();
    await page.getByRole('tab', { name: translations[locale]['cards.detailModes.label'] }).click();
    await expect
      .poll(() => page.getByText('Applied registry marker', { exact: true }).count())
      .toBe(1);
    await page.getByRole('button', { name: messages[locale]['nav.svelte'] }).click();
    await page.locator(`jsonforms-svelte-${family}`).waitFor();
    await expect
      .poll(() => page.getByText('Applied registry marker', { exact: true }).count())
      .toBe(1);
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'applying an unchanged trusted UI Schemas registry keeps its tester',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?drawer=false`);
    await page
      .getByRole('tab', { name: demoEditorLabel(locale, 'UI Schemas'), exact: true })
      .click();
    const editor = page.locator('.monaco-editor:visible').last();
    await expect.poll(() => editor.locator('.view-lines').innerText()).toContain('tester');
    await page
      .getByRole('button', { name: messages[locale]['editor.uiSchemas.apply'], exact: true })
      .first()
      .click();
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    await page.getByRole('tab', { name: translations[locale]['cards.detailModes.label'] }).click();
    await expect
      .poll(() =>
        page
          .getByRole('textbox', { name: translations[locale]['cards.registeredAddress.label'] })
          .count(),
      )
      .toBe(1);
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 45_000 },
);
