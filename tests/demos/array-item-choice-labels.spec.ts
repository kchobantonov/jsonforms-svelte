import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import originalUI from '@chobantonov/jsonforms-extended-spec/examples/array-controls/uischema.json';
import originalData from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

interface ItemLabelUI {
  name?: string;
  scope?: string;
  options?: Record<string, unknown>;
  elements?: ItemLabelUI[];
}

function findControl(node: ItemLabelUI, scope: string): ItemLabelUI | undefined {
  if (node.scope === scope) return node;
  for (const child of node.elements ?? []) {
    const found = findControl(child, scope);
    if (found) return found;
  }
  return undefined;
}

demoTest(
  'array-item-choice-labels',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const ui = structuredClone(originalUI) as ItemLabelUI;
    const speakersControl = findControl(ui, '#/properties/speakers');
    if (!speakersControl?.options) throw new Error('Expandable speakers Control is missing');
    speakersControl.options.elementLabelProp = 'track';
    await applyDemoEditor(page, locale, 'UI Schema', ui, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();

    const tabLabel = translations[locale]['expandableTab.label'];
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
    const speakersLabel = fields[locale]['specArrayControls.schema.properties.speakers.label'];
    const speakers = panel
      .getByRole('heading', { name: speakersLabel, exact: true })
      .locator('..')
      .locator('..')
      .locator('..');
    const triggers = speakers.locator(
      'button[aria-expanded]:not([aria-haspopup]):not([data-array-panel-toggle])',
    );
    await expect.poll(() => triggers.count()).toBe(2);
    await expect
      .poll(() => triggers.first().innerText())
      .toContain(
        fields[locale][
          'specArrayControls.schema.properties.speakers.items.properties.track.oneOf.1.label'
        ],
      );
    await expect
      .poll(() => triggers.last().innerText())
      .toContain(
        fields[locale][
          'specArrayControls.schema.properties.speakers.items.properties.track.oneOf.2.label'
        ],
      );
    await triggers.last().click();
    await expect.poll(() => triggers.last().getAttribute('aria-expanded')).toBe('true');
    await expect.poll(() => triggers.first().getAttribute('aria-expanded')).toBe('false');

    const duplicateData = structuredClone(originalData);
    duplicateData.speakers[1].track = duplicateData.speakers[0].track;
    await applyDemoEditor(page, locale, 'Data', duplicateData, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    const choiceLabel =
      fields[locale][
        'specArrayControls.schema.properties.speakers.items.properties.track.oneOf.1.label'
      ];
    await expect.poll(() => triggers.first().innerText()).toContain(choiceLabel);
    await expect.poll(() => triggers.last().innerText()).toContain(choiceLabel);
    if ((await triggers.last().getAttribute('aria-expanded')) !== 'true')
      await triggers.last().click();
    await expect
      .poll(() =>
        speakers
          .getByRole('textbox', {
            name: fields[locale][
              'specArrayControls.schema.properties.speakers.items.properties.name.label'
            ],
            exact: true,
          })
          .inputValue(),
      )
      .toBe('Tomas Lind');

    delete speakersControl.options.elementLabelProp;
    await applyDemoEditor(page, locale, 'UI Schema', ui, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    await expect.poll(() => triggers.first().innerText()).toContain('Rosa Iqbal');
    await expect.poll(() => triggers.last().innerText()).toContain('Tomas Lind');

    const sponsorsControl = findControl(ui, '#/properties/sponsors');
    if (!sponsorsControl?.options) throw new Error('ListWithDetail sponsors Control is missing');
    sponsorsControl.options.elementLabelProp = 'tier';
    await applyDemoEditor(page, locale, 'UI Schema', ui, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const listTabLabel = translations[locale]['listTab.label'];
    await page.getByRole('tab', { name: listTabLabel, exact: true }).click();
    const listPanel = page.getByRole('tabpanel', { name: listTabLabel, exact: true });
    const listItems = listPanel.locator('[role="option"], button[aria-current]');
    await expect.poll(() => listItems.count()).toBe(2);
    await expect
      .poll(() => listItems.first().innerText())
      .toContain(
        fields[locale][
          'specArrayControls.schema.properties.sponsors.items.properties.tier.oneOf.0.label'
        ],
      );
    await expect
      .poll(() => listItems.last().innerText())
      .toContain(
        fields[locale][
          'specArrayControls.schema.properties.sponsors.items.properties.tier.oneOf.1.label'
        ],
      );
    await listItems.last().click();
    await expect
      .poll(() =>
        listPanel
          .getByRole('textbox', {
            name: fields[locale][
              'specArrayControls.schema.properties.sponsors.items.properties.name.label'
            ],
            exact: true,
          })
          .inputValue(),
      )
      .toBe('Calder Coffee');
    expect(pageErrors).toEqual([]);
  },
  { timeout: 30_000 },
);
