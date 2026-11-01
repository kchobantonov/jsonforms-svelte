import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'demo remaining editor Apply and Reload isolation',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-cron-control?drawer=false`);
    await page.locator('input[id*="/properties/stockSync"]:visible').waitFor();

    const paste = async (value: string) => {
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
      }, value);
      await expect
        .poll(async () =>
          (await editor.locator('.view-lines').innerText()).replaceAll('\u00a0', ' '),
        )
        .toContain(value.slice(0, 12));
    };
    const editorTab = (name: string) =>
      page.getByRole('tab', {
        name:
          name === 'Demo'
            ? new RegExp(`^${demoEditorLabel(locale, name)}`)
            : demoEditorLabel(locale, name),
        exact: name !== 'Demo',
      });
    const action = (key: keyof typeof messages.en) =>
      page.getByRole('button', { name: messages[locale][key], exact: true }).first();
    const applyAndReload = async (
      name: string,
      valid: string,
      applyKey: keyof typeof messages.en,
      reloadKey: keyof typeof messages.en,
      sourceText: string,
    ) => {
      await editorTab(name).click();
      await paste(valid);
      await action(applyKey).click();
      await paste('{"broken":');
      await action(applyKey).click();
      await expect
        .poll(() =>
          page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText(),
        )
        .toContain('"broken":');
      await action(reloadKey).click();
      const reloaded = () =>
        page
          .locator('.monaco-editor:visible')
          .last()
          .locator('.view-lines')
          .innerText()
          .then((text) => text.replaceAll('\u00a0', ' ').trim());
      if (sourceText) await expect.poll(reloaded).toContain(sourceText);
      else await expect.poll(reloaded).toBe('');
    };

    const translations = {
      en: { 'featureNavigation.section1.label': 'Edited category' },
      bg: { 'featureNavigation.section1.label': 'Edited category' },
    };
    await applyAndReload(
      'Internationalization',
      JSON.stringify(translations),
      'editor.i18n.apply',
      'editor.i18n.reload',
      'Schema selection',
    );
    await editorTab('Demo').click();
    await page.getByRole('tab', { name: 'Edited category', exact: true }).waitFor();

    const uischema = {
      type: 'VerticalLayout',
      elements: [{ type: 'Label', text: 'Edited UI schema' }],
    };
    await applyAndReload(
      'UI Schema',
      JSON.stringify(uischema),
      'editor.uiSchema.apply',
      'editor.uiSchema.reload',
      'VerticalLayout',
    );
    await editorTab('Demo').click();
    await page.getByText('Edited UI schema', { exact: true }).waitFor();

    await applyAndReload(
      'UI Schemas',
      '[]',
      'editor.uiSchemas.apply',
      'editor.uiSchemas.reload',
      '',
    );
    await applyAndReload(
      'Config',
      '{"hideRequiredAsterisk":true}',
      'editor.config.apply',
      'editor.config.reload',
      '',
    );
    await editorTab('Demo').click();
    await page.getByRole('button', { name: messages[locale]['nav.svelte'] }).click();
    const host = page.locator(`jsonforms-svelte-${family}`);
    await expect.poll(() => host.count()).toBe(1);
    const props = await host.evaluate((element) => {
      const component = element as HTMLElement & {
        uischema?: unknown;
        uischemas?: unknown;
        translations?: string;
        config?: string;
      };
      return {
        uischema: component.uischema,
        uischemas: component.uischemas,
        translations: component.translations,
        config: component.config,
      };
    });
    expect(props.uischema).toEqual(uischema);
    expect(props.uischemas).toEqual([]);
    expect(JSON.parse(props.translations ?? '{}')).toEqual(translations);
    expect(JSON.parse(props.config ?? '{}').hideRequiredAsterisk).toBe(true);

    await page.evaluate(() => {
      location.hash = '#/examples/spec-string-controls?use-webcomponent=true&drawer=false';
    });
    await page.getByRole('heading', { name: 'Spec: String controls' }).waitFor();
    await expect.poll(() => page.getByText('Edited UI schema', { exact: true }).count()).toBe(0);
    const nextProps = await host.evaluate((element) => {
      const component = element as HTMLElement & {
        uischema?: unknown;
        uischemas?: unknown;
        translations?: string;
        config?: string;
      };
      return {
        uischema: component.uischema,
        uischemas: component.uischemas,
        translations: component.translations,
        config: component.config,
      };
    });
    expect(nextProps.uischema).not.toEqual(uischema);
    expect(nextProps.translations).not.toEqual(props.translations);
    expect(JSON.parse(nextProps.config ?? '{}').hideRequiredAsterisk).not.toBe(true);
    await editorTab('UI Schemas').click();
    await expect
      .poll(async () =>
        (
          await page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText()
        ).trim(),
      )
      .toBe('');
    await editorTab('UI Schema').click();
    await paste('{"abandoned":');
    await page.evaluate(() => {
      location.hash = '#/examples/spec-cron-control?use-webcomponent=true&drawer=false';
    });
    await page.getByRole('heading', { name: 'Spec: Cron control' }).waitFor();
    await editorTab('UI Schema').click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText())
      .toContain('jobName');
    await editorTab('Internationalization').click();
    await expect
      .poll(async () =>
        (
          await page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText()
        ).replaceAll('\u00a0', ' '),
      )
      .toContain('Schema selection');
    await page.evaluate(() => {
      location.hash = '#/examples/spec-string-controls?use-webcomponent=true&drawer=false';
    });
    await page.getByRole('heading', { name: 'Spec: String controls' }).waitFor();
    await editorTab('UI Schema').click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText())
      .not.toContain('abandoned');
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 45_000 },
);
