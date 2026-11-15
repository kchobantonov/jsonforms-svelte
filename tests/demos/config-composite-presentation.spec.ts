import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import tupleLabels from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/translations.json';
import tupleFields from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/translations.json';
import tableUi from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/table-cells/uischema.json';

demoTest(
  'config-composite-presentation',
  async ({ page, family, locale, webcomponent, base }) => {
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
    const open = (example: string) =>
      page.goto(
        `${base}/${family}/#/examples/${example}?use-webcomponent=${webcomponent}&drawer=false`,
      );
    const replaceEditor = async (name: 'Config' | 'UI Schema', value: unknown) => {
      const label = demoEditorLabel(locale, name);
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
      await editor.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await editor.evaluate((element, content) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', content);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await toolbar.getByRole('button').nth(1).click();
    };
    const demo = async () =>
      page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

    await open('spec-tuple-control');
    const east = page.getByRole('spinbutton', {
      name: tupleLabels[locale]['coordinates.x.label'],
      exact: true,
    });
    const latitude = page.getByRole('spinbutton', {
      name: tupleFields[locale]['tupleExample.schema.properties.survey.items.0.label'],
      exact: true,
    });
    const coords = page.locator('[data-tuple-control]').filter({ has: east });
    const survey = page.locator('[data-tuple-control]').filter({ has: latitude });
    await expect.poll(() => coords.count()).toBe(1);
    expect(await coords.getAttribute('class')).not.toContain('tuple-bordered');
    expect(await survey.getAttribute('class')).toContain('tuple-bordered');

    await replaceEditor('Config', { jsonformsExtended: { showBorder: false } });
    await demo();
    expect(await survey.getAttribute('class')).toContain('tuple-bordered');
    await replaceEditor('Config', { showBorder: false });
    await demo();
    expect(await coords.getAttribute('class')).not.toContain('tuple-bordered');
    expect(await survey.getAttribute('class')).not.toContain('tuple-bordered');
    expect(await east.inputValue()).toBe('45.52');

    await open('table-cells');
    const uischema = structuredClone(tableUi) as unknown as {
      elements: Array<{
        options: { cells: Record<string, { summary?: unknown; showTypeIndicator?: boolean }> };
      }>;
    };
    uischema.elements[0].options.cells.address.summary = { type: 'Label', text: 'Address preview' };
    uischema.elements[0].options.cells.phoneNumbers.showTypeIndicator = false;
    await replaceEditor('UI Schema', uischema);
    await replaceEditor('Config', { showTypeIndicator: true });
    await demo();
    const row = page.getByRole('table').getByRole('row').nth(1);
    await expect.poll(() => row.locator('[data-composite-type]').count()).toBe(1);
    expect(await row.locator('[data-composite-type]').first().textContent()).toBe('{}');
    expect(await row.locator('[data-composite-type]').first().getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(await row.getByText('Address preview', { exact: true }).count()).toBe(1);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
