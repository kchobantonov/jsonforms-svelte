import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import groupUi from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-group-layout/uischema.json';
import groupTranslations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-group-layout/translations.json';
import categorizationUi from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/uischema.json';
import categorizationTranslations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.json';

type CollapsedWarning = [string, { details?: { component?: string; source?: string } }];

const hasCollapsedWarning = async (warnings: Promise<CollapsedWarning>[], component: string) =>
  (await Promise.all(warnings)).some(
    ([code, payload]) =>
      code === 'section.invalidCollapsed' &&
      payload.details?.component === component &&
      payload.details?.source === 'options.collapsed',
  );

const showDemo = async (
  page: Parameters<Parameters<typeof demoTest>[1]>[0]['page'],
  locale: 'en' | 'bg',
) => {
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
};

demoTest(
  'group-collapsed-option-diagnostic',
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
    const warnings: Promise<CollapsedWarning>[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('section.invalidCollapsed')) {
        warnings.push(
          Promise.all(
            message.args().map((argument) => argument.jsonValue()),
          ) as Promise<CollapsedWarning>,
        );
      }
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-group-layout?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const contactTab = page.getByRole('tab', {
      name: groupTranslations[locale]['featureNavigation.section2.label'],
      exact: true,
    });
    await contactTab.click();
    const group = page
      .getByRole('tabpanel', {
        name: groupTranslations[locale]['featureNavigation.section2.label'],
        exact: true,
      })
      .locator('[data-group-frame]')
      .first()
      .locator('button[aria-expanded]')
      .first();
    await expect.poll(() => group.getAttribute('aria-expanded')).toBe('true');

    const invalidUi = structuredClone(groupUi);
    const groupControl = invalidUi.elements[0].elements[1].elements[0] as unknown as {
      options: Record<string, unknown>;
    };
    Object.assign(groupControl.options, { collapsed: 'invalid' });
    await applyDemoEditor(page, locale, 'UI Schema', invalidUi, { verifyVisibleText: false });
    await showDemo(page, locale);
    await contactTab.click();
    await expect.poll(() => hasCollapsedWarning(warnings, 'group')).toBe(true);

    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { group: { collapsed: false } },
    });
    await showDemo(page, locale);
    await contactTab.click();
    await expect.poll(() => group.getAttribute('aria-expanded')).toBe('true');
    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { group: { collapsed: true } },
    });
    await showDemo(page, locale);
    await contactTab.click();
    await expect.poll(() => group.getAttribute('aria-expanded')).toBe('false');
    expect(errors).toEqual([]);
  },
  { timeout: 15_000 },
);

demoTest(
  'accordion-collapsed-option-diagnostic',
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
    const warnings: Promise<CollapsedWarning>[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('section.invalidCollapsed')) {
        warnings.push(
          Promise.all(
            message.args().map((argument) => argument.jsonValue()),
          ) as Promise<CollapsedWarning>,
        );
      }
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const accordionTab = page.getByRole('tab', {
      name: categorizationTranslations[locale]['featureNavigation.section3.label'],
      exact: false,
    });
    await accordionTab.click();
    const planning = page.getByRole('button', { name: /Planning|Планиране/, exact: false });
    await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('true');

    const invalidUi = structuredClone(categorizationUi);
    const accordionSection = invalidUi.elements[2];
    if (!accordionSection?.elements) throw new Error('Missing canonical accordion section');
    const accordion = accordionSection.elements[2].elements[1] as unknown as {
      options: Record<string, unknown>;
    };
    Object.assign(accordion.options, { collapsed: 'invalid' });
    Reflect.deleteProperty(accordion.options, 'initial');
    await applyDemoEditor(page, locale, 'UI Schema', invalidUi, { verifyVisibleText: false });
    await showDemo(page, locale);
    await accordionTab.click();
    await expect.poll(() => hasCollapsedWarning(warnings, 'accordion')).toBe(true);

    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { accordion: { collapsed: true } },
    });
    await showDemo(page, locale);
    await accordionTab.click();
    await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('false');
    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { accordion: { collapsed: false } },
    });
    await showDemo(page, locale);
    await accordionTab.click();
    const contact = page.getByRole('button', { name: /Contact|Контакт/, exact: false });
    await expect.poll(() => contact.getAttribute('aria-expanded')).toBe('true');
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
