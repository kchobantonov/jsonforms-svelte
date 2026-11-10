import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'home view opens the introductory example',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/`);
    const title = page.getByRole('heading', { level: 1 });
    await expect.poll(() => title.textContent()).toContain('JSON Forms Svelte');
    const logo =
      family === 'flowbite'
        ? page.getByRole('img', { name: 'Flowbite Logo' }).last()
        : page
            .locator(
              family === 'shadcn'
                ? 'section.gradient-homepage-one img'
                : 'section.gradient-homepage-one svg',
            )
            .first();
    await expect.poll(() => logo.isVisible()).toBe(true);
    expect((await logo.boundingBox())!.width).toBeGreaterThan(20);
    await expect
      .poll(() => page.getByRole('heading', { name: messages[locale]['home.tagline'] }).isVisible())
      .toBe(true);
    const open = page.getByRole('link', { name: messages[locale]['home.open'] });
    await expect.poll(() => open.isVisible()).toBe(true);
    await open.click();
    await expect.poll(() => page.url()).toMatch(/#\/examples\/spec-kitchen-sink/);
    await expect
      .poll(() =>
        page.getByRole('heading', { name: 'Spec: Kitchen sink: job application' }).isVisible(),
      )
      .toBe(true);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'example title precedes the contained workspace tabs',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-presentation`);
    const title = page.getByRole('heading', { name: 'Spec: Presentation elements' });
    const tablist = page.getByRole('tablist').first();
    await title.waitFor();
    await tablist.waitFor();
    const titleBox = (await title.boundingBox())!;
    const tabsBox = (await tablist.boundingBox())!;
    expect(titleBox.y + titleBox.height).toBeLessThan(tabsBox.y);
    await expect
      .poll(() => page.getByRole('heading', { name: 'JSON Forms' }).isVisible())
      .toBe(true);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'example actions share the form heading row',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/additional-errors`);
    const heading = page.getByRole('heading', { name: 'JSON Forms' });
    const action = page.getByRole('button', { name: 'Add additional error' });
    await action.waitFor();
    const headingBox = (await heading.boundingBox())!;
    const actionBox = (await action.boundingBox())!;
    const headingCenter = headingBox.y + headingBox.height / 2;
    const actionCenter = actionBox.y + actionBox.height / 2;
    expect(Math.abs(headingCenter - actionCenter)).toBeLessThan(24);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'header tool order, names, and toggle state',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-presentation`);
    const labels = messages[locale];
    const formOnly = page.getByRole('button', { name: labels['nav.showFormOnly'] });
    const renderer = page.getByRole('button', { name: labels['nav.svelte'] });
    const repository = page.getByRole(family === 'flowbite' ? 'link' : 'button', {
      name: labels['nav.github'],
    });
    const settings = page.getByRole('button', { name: labels['nav.openSettings'] });
    await formOnly.waitFor();
    const positions = await Promise.all(
      [formOnly, renderer, repository, settings].map(async (tool) => (await tool.boundingBox())!.x),
    );
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(await formOnly.getAttribute('aria-pressed')).toBe('false');
    expect(await renderer.getAttribute('aria-pressed')).toBe('false');
    await formOnly.click();
    const fullUi = page.getByRole('button', { name: labels['nav.showFullUi'] });
    await expect.poll(() => fullUi.getAttribute('aria-pressed')).toBe('true');
    await fullUi.click();
    await expect.poll(() => formOnly.getAttribute('aria-pressed')).toBe('false');
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'header icon tooltips appear on keyboard focus',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-presentation`);
    const labels = messages[locale];
    for (const name of [labels['nav.svelte'], labels['nav.openSettings']]) {
      const action = page.getByRole('button', { name });
      const unfocused = await action.evaluate((node) => {
        const style = getComputedStyle(node);
        return `${style.outlineStyle}/${style.outlineWidth}/${style.boxShadow}`;
      });
      await action.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect
        .poll(() => action.evaluate((node) => node === document.activeElement))
        .toBe(true);
      const focused = await action.evaluate((node) => {
        const style = getComputedStyle(node);
        return `${style.outlineStyle}/${style.outlineWidth}/${style.boxShadow}`;
      });
      expect(focused).not.toBe(unfocused);
      const tooltip =
        family === 'shadcn'
          ? page.locator('[data-slot="tooltip-content"]').filter({ hasText: name })
          : page.getByRole('tooltip').filter({ hasText: name });
      await expect.poll(() => tooltip.isVisible()).toBe(true);
    }
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'narrow workspace tabs remain readable without page overflow',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=false`);
    const tablist = page.getByRole('tablist').first();
    await tablist.waitFor();
    const geometry = await tablist.evaluate((node) => {
      const ancestors: Array<{ overflow: string; width: number; scroll: number }> = [];
      let current: Element | null = node;
      while (current && current !== document.body) {
        ancestors.push({
          overflow: getComputedStyle(current).overflowX,
          width: current.clientWidth,
          scroll: current.scrollWidth,
        });
        current = current.parentElement;
      }
      return { ancestors, pageWidth: document.documentElement.scrollWidth };
    });
    expect(geometry.pageWidth).toBeLessThanOrEqual(391);
    expect(
      geometry.ancestors.some(
        ({ overflow, width, scroll }) => /auto|scroll/.test(overflow) && scroll > width + 8,
      ),
    ).toBe(true);
    const lastTab = tablist.getByRole('tab').last();
    await lastTab.click();
    await expect.poll(() => lastTab.getAttribute('aria-selected')).toBe('true');
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'sidebar wraps long labels and identifies the active example',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-ag-grid?drawer=true`);
    const sidebar = page.locator('aside').first();
    const item = sidebar.getByText('Spec: AG Grid: portable options and native overrides', {
      exact: true,
    });
    await item.waitFor();
    const details = await item.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const interactive = node.closest<HTMLElement>('a, button, [role="option"]');
      return {
        lines: range.getClientRects().length,
        textWidth: node.scrollWidth,
        visibleWidth: node.clientWidth,
        current: interactive?.getAttribute('aria-current'),
        selected: interactive?.getAttribute('aria-selected'),
      };
    });
    expect(details.lines).toBeGreaterThan(1);
    expect(details.textWidth).toBeLessThanOrEqual(details.visibleWidth + 1);
    expect(details.current === 'page' || details.selected === 'true').toBe(true);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'desktop sidebar scrolls independently of the workspace',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.setViewportSize({ width: 1440, height: 760 });
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=true`);
    const heading = page.getByRole('heading', { name: 'Spec: Presentation elements' });
    await heading.waitFor();
    await page.evaluate(() => document.fonts.ready);
    const originalY = (await heading.boundingBox())!.y;
    const sidebar = page.locator('aside').first();
    const scrollTop = await sidebar.evaluate((node) => {
      const scroller = [node, ...node.querySelectorAll<HTMLElement>('*')].find((element) => {
        const overflow = getComputedStyle(element).overflowY;
        return /auto|scroll/.test(overflow) && element.scrollHeight > element.clientHeight + 100;
      });
      if (!scroller) return -1;
      scroller.scrollTop = 200;
      return scroller.scrollTop;
    });
    expect(scrollTop).toBeGreaterThan(100);
    // Route settling can shift the heading a few pixels; sidebar scroll must
    // still leave the workspace in place rather than moving it by 200px.
    await expect
      .poll(async () => Math.abs((await heading.boundingBox())!.y - originalY))
      .toBeLessThan(16);
    expect((await page.locator('header').first().boundingBox())!.y).toBe(0);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'sidebar source and label search keep the current example',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=true`);
    const labels = messages[locale];
    const sidebar = page.locator('aside').first();
    const search = page.getByRole('textbox', { name: labels['sidebar.search'] });
    await search.fill('Cron');
    await expect
      .poll(() => sidebar.getByText('Spec: Cron control', { exact: true }).count())
      .toBe(1);
    expect(page.url()).toContain('/examples/spec-presentation');
    if (family === 'shadcn') {
      await sidebar.getByRole('button', { name: labels['sidebar.source'] }).click();
      await page
        .getByRole('option', { name: labels['sidebar.source.jsonforms'], exact: true })
        .click();
    } else {
      await sidebar
        .getByRole('combobox', { name: labels['sidebar.source'] })
        .selectOption('jsonforms');
    }
    await expect
      .poll(() => sidebar.getByText(labels['sidebar.empty'], { exact: true }).count())
      .toBe(1);
    await search.fill('');
    await expect.poll(() => sidebar.getByText(/^JsonForms:/).count()).toBeGreaterThan(0);
    expect(page.url()).toContain('/examples/spec-presentation');
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'desktop shell geometry and narrow sidebar backdrop',
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
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=true`);
    const header = page.locator('header').first();
    const sidebar = page.locator('aside').first();
    const heading = page.getByRole('heading', { name: 'Spec: Presentation elements' });
    await heading.waitFor();
    const headerBox = (await header.boundingBox())!;
    const sidebarBox = (await sidebar.boundingBox())!;
    const headingBox = (await heading.boundingBox())!;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(headerBox.y).toBe(0);
    expect(sidebarBox.y).toBeGreaterThanOrEqual(headerBox.height - 2);
    expect(headingBox.y).toBeGreaterThanOrEqual(headerBox.height);
    expect(headingBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width - 2);
    expect(overflow).toBeLessThanOrEqual(2);
    await page
      .getByRole('button', { name: messages[locale]['nav.hideExamples'], exact: true })
      .click();
    await expect.poll(() => sidebar.isVisible()).toBe(false);
    await expect
      .poll(async () => (await heading.boundingBox())!.x)
      .toBeLessThan(headingBox.x - 150);
    await page
      .getByRole('button', { name: messages[locale]['nav.showExamples'], exact: true })
      .click();
    await expect.poll(() => sidebar.isVisible()).toBe(true);
    await expect
      .poll(async () => (await heading.boundingBox())!.x)
      .toBeGreaterThanOrEqual(headingBox.x - 2);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=false`);
    await page
      .getByRole('button', { name: messages[locale]['nav.showExamples'], exact: true })
      .click();
    await expect.poll(() => sidebar.isVisible()).toBe(true);
    const backdrop = await page.evaluate(() => {
      const hit = document.elementFromPoint(
        document.documentElement.clientWidth - 12,
        innerHeight / 2,
      )!;
      const style = getComputedStyle(hit);
      return { background: style.backgroundColor, opacity: style.opacity };
    });
    expect(backdrop.background).not.toBe('rgba(0, 0, 0, 0)');
    await page.mouse.click(
      await page.evaluate(() => document.documentElement.clientWidth - 12),
      420,
    );
    await expect
      .poll(() =>
        page
          .getByRole('button', { name: messages[locale]['nav.showExamples'], exact: true })
          .count(),
      )
      .toBe(1);
    await page
      .getByRole('button', { name: messages[locale]['nav.showExamples'], exact: true })
      .click();
    await expect.poll(() => sidebar.isVisible()).toBe(true);
    await page.keyboard.press('Escape');
    await expect
      .poll(() =>
        page
          .getByRole('button', { name: messages[locale]['nav.showExamples'], exact: true })
          .count(),
      )
      .toBe(1);
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 45_000 },
);
