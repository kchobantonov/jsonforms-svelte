import { afterEach, expect, it, vi } from 'vite-plus/test';
import '../src/lib/webcomponent-register.js';

let element: HTMLElement | undefined;
afterEach(() => element?.remove());

it('forwards unsupported template language and re-reports after author recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const template = (lang: string) => ({
    type: 'TemplateLayout',
    lang,
    template: '<p>Template content</p>',
  });
  Object.assign(element, {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    data: { value: 'kept' },
    config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
    uischema: template('unavailable'),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () =>
    events.filter((event) => event.detail.code === 'template.unsupportedLanguage');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0].detail).toEqual({
    code: 'template.unsupportedLanguage',
    severity: 'warning',
    message: 'Unsupported template language: unavailable.',
    details: { language: 'unavailable', path: '' },
  });
  expect(warnings()[0].bubbles).toBe(true);
  expect(warnings()[0].composed).toBe(true);
  Object.assign(element, { data: { value: 'kept' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: template('ractive') });
  await vi.waitFor(() => expect(element?.shadowRoot?.textContent).toContain('Template content'));
  Object.assign(element, { uischema: template('unavailable') });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: 'kept' });
});

it('forwards active focus conflicts and reports them again after a Group reopens', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: {
      type: 'object',
      properties: { first: { type: 'string' }, second: { type: 'string' } },
    },
    data: { first: 'One', second: 'Two' },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/first', options: { focus: true } },
        {
          type: 'Group',
          label: 'Hidden details',
          options: { collapsible: true, collapsed: true },
          elements: [{ type: 'Control', scope: '#/properties/second', options: { focus: true } }],
        },
      ],
    },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'focus.conflict');
  const toggle = await vi.waitFor(() => {
    const button = element?.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[aria-label="Hidden details"]',
    );
    expect(button).not.toBeNull();
    return button!;
  });
  expect(warnings()).toHaveLength(0);
  toggle.click();
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail.details).toEqual({ paths: ['first', 'second'] });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  Object.assign(element, { data: { first: 'One', second: 'Two' } });
  expect(warnings()).toHaveLength(1);
  toggle.click();
  await vi.waitFor(() => expect(toggle.getAttribute('aria-expanded')).toBe('false'));
  toggle.click();
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({
    first: 'One',
    second: 'Two',
  });
});

it('forwards unresolved schema references through the author event after recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const invalidSchema = {
    $id: 'https://example.test/root.json',
    type: 'object',
    properties: { value: { $ref: '#missing' } },
  };
  Object.assign(element, {
    schema: invalidSchema,
    data: { value: 'kept' },
    uischema: { type: 'Control', scope: '#/properties/value' },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'reference.unresolved');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail).toEqual({
    code: 'reference.unresolved',
    severity: 'warning',
    message: 'The schema reference could not be resolved for rendering.',
    details: { reference: 'https://example.test/root.json#missing' },
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  Object.assign(element, { data: { value: 'kept' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
  });
  await vi.waitFor(() => expect(element?.shadowRoot?.querySelector('input')).not.toBeNull());
  Object.assign(element, { schema: invalidSchema });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: 'kept' });
});

it('forwards malformed choice identifiers and re-reports after author recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const ui = (invalid: boolean) => ({
    type: 'Control',
    scope: '#',
    options: {
      format: 'cards',
      choices: invalid
        ? [
            { value: 'A', label: 'First' },
            { value: 'A', label: 'Duplicate' },
            { value: 'C', label: 'Unknown' },
          ]
        : [{ value: 'A', label: 'First' }],
    },
  });
  Object.assign(element, {
    schema: { type: 'string', enum: ['A', 'B'] },
    data: 'A',
    uischema: ui(true),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () =>
    events.filter(({ detail }) =>
      ['choice.duplicateIdentifier', 'choice.invalidIdentifier'].includes(detail.code),
    );
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect(warnings().map(({ detail }) => [detail.code, detail.details?.index])).toEqual([
    ['choice.duplicateIdentifier', 1],
    ['choice.invalidIdentifier', 2],
  ]);
  expect(warnings().every((event) => event.bubbles && event.composed)).toBe(true);
  expect(element.shadowRoot?.textContent).toContain('First');
  expect(element.shadowRoot?.textContent).not.toContain('Duplicate');
  expect(element.shadowRoot?.textContent).not.toContain('Unknown');
  Object.assign(element, { data: 'A' });
  expect(warnings()).toHaveLength(2);
  Object.assign(element, { uischema: ui(false) });
  await vi.waitFor(() => expect(element?.shadowRoot?.textContent).toContain('First'));
  Object.assign(element, { uischema: ui(true) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(4));
  expect((element as HTMLElement & { data: unknown }).data).toBe('A');
});

it('forwards unresolved UI-schema rule references through a composed author event', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const invalidUi = {
    type: 'Control',
    scope: '#/properties/value',
    rule: { effect: 'ENABLE', condition: { scope: '#', schema: { $ref: 'missing-rule' } } },
  };
  Object.assign(element, {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    data: { value: 'kept' },
    uischema: invalidUi,
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'rule.referenceFailed');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail).toEqual({
    code: 'rule.referenceFailed',
    severity: 'warning',
    message: 'The rule schema reference could not be resolved.',
    details: {
      path: '',
      elementScope: '#/properties/value',
      scope: '#',
      reference: 'missing-rule',
    },
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  Object.assign(element, { data: { value: 'updated' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, {
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      rule: { effect: 'ENABLE', condition: { scope: '#', schema: { type: 'object' } } },
    },
  });
  await vi.waitFor(() => expect(element?.shadowRoot?.querySelector('input')?.disabled).toBe(false));
  Object.assign(element, { uischema: invalidUi });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: 'updated' });
});

it('forwards invalid numeric-step author warnings without an in-form status', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const invalidUi = {
    type: 'Control',
    scope: '#/properties/value',
    options: { step: 0.25 },
  };
  Object.assign(element, {
    schema: { type: 'object', properties: { value: { type: 'integer', multipleOf: 0.5 } } },
    data: { value: 2 },
    uischema: invalidUi,
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'numeric.invalidStep');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail).toEqual({
    code: 'numeric.invalidStep',
    severity: 'warning',
    message: 'The explicit integer step must be a finite positive integer.',
    details: { path: 'value', option: 'step', kind: 'integer', valueType: 'number' },
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  expect(element.shadowRoot?.querySelector('[role="status"]')).toBeNull();
  expect(element.shadowRoot?.querySelector('input[type="number"]')?.getAttribute('step')).toBe('1');
  Object.assign(element, { data: { value: 3 } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, {
    uischema: { type: 'Control', scope: '#/properties/value', options: { step: 1 } },
  });
  Object.assign(element, { uischema: invalidUi });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: 3 });
});

it('forwards missing catalog parameters through the host diagnostic event', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    data: { value: 'kept' },
    uischema: { type: 'Control', scope: '#/properties/value' },
    translations: { en: { 'value.label': 'Value {missing}' } },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'i18n.missingParameter');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail).toEqual({
    code: 'i18n.missingParameter',
    severity: 'warning',
    message: 'Translation value.label is missing parameter missing.',
    details: { key: 'value.label', parameter: 'missing', locale: 'en' },
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  Object.assign(element, { data: { value: 'kept' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { translations: { en: { 'value.label': 'Value' } } });
  await vi.waitFor(() => expect(element?.shadowRoot?.textContent).toContain('Value'));
  Object.assign(element, { translations: { en: { 'value.label': 'Value {missing}' } } });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: 'kept' });
});

it('dispatches author diagnostics without changing form validity', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: { type: 'string' },
    data: 'kept',
    uischema: { type: 'UnsupportedLayout' },
  });
  const diagnostics = vi.fn();
  const changes = vi.fn();
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) diagnostics(event.detail);
  });
  element.addEventListener('change', (event) => {
    if (event instanceof CustomEvent) changes(event.detail);
  });
  document.body.append(element);

  await vi.waitFor(() =>
    expect(diagnostics).toHaveBeenCalledExactlyOnceWith({
      code: 'renderer.unsupported',
      severity: 'warning',
      message: 'No applicable renderer is registered for this UI-schema element.',
      details: { path: '', type: 'UnsupportedLayout', scope: undefined },
    }),
  );
  expect(changes.mock.lastCall?.[0].data).toBe('kept');
  expect(changes.mock.lastCall?.[0].errors).toEqual([]);
  Object.assign(element, { uischema: { type: 'Control', scope: '#' } });
  await vi.waitFor(() => expect(element?.shadowRoot?.querySelector('input')).not.toBeNull());
  Object.assign(element, { uischema: { type: 'UnsupportedLayout' } });
  await vi.waitFor(() => expect(diagnostics).toHaveBeenCalledTimes(2));
  expect(diagnostics.mock.calls[1]?.[0].code).toBe('renderer.unsupported');
  expect(changes.mock.lastCall?.[0].data).toBe('kept');
});

it('forwards extended renderer diagnostics as composed host events', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    data: { value: 'kept' },
    uischema: { type: 'Button', label: 'Run', script: 'return 1;' },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);

  await vi.waitFor(() =>
    expect(events.some(({ detail }) => detail.code === 'script.evaluationDisabled')).toBe(true),
  );
  const warning = events.find(({ detail }) => detail.code === 'script.evaluationDisabled')!;
  expect(warning.bubbles).toBe(true);
  expect(warning.composed).toBe(true);
  expect(warning.detail).toEqual({
    code: 'script.evaluationDisabled',
    severity: 'warning',
    message: 'Button script evaluation is disabled by host policy.',
    details: { capability: 'button', path: '' },
  });
});

it('forwards a denied dynamic-default script warning through the author event', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const schema = (dynamic: boolean) => ({
    type: 'object',
    properties: { greeting: { type: 'string' } },
    ...(dynamic
      ? {
          dynamicDefaults: {
            greeting: { func: 'dynamic', args: { func: '() => "Hello"' } },
          },
        }
      : {}),
  });
  const invalidSchema = schema(true);
  Object.assign(element, {
    schema: invalidSchema,
    data: {},
    uischema: { type: 'Control', scope: '#/properties/greeting' },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () =>
    events.filter(
      ({ detail }) =>
        detail.code === 'script.evaluationDisabled' &&
        detail.details?.capability === 'dynamicDefaults',
    );
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail).toEqual({
    code: 'script.evaluationDisabled',
    severity: 'warning',
    message: 'Dynamic default script evaluation is disabled by host policy.',
    details: { capability: 'dynamicDefaults' },
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  Object.assign(element, { data: {} });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { schema: schema(false) });
  await vi.waitFor(() => expect(element?.shadowRoot?.querySelector('input')).not.toBeNull());
  Object.assign(element, { schema: invalidSchema });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({});
});

it('delivers Button action conflicts to the author without a form alert', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: { type: 'object' },
    data: {},
    uischema: { type: 'Button', label: 'Run', action: 'save', script: 'return 1;' },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const conflicts = () => events.filter(({ detail }) => detail.code === 'action.conflict');
  await vi.waitFor(() => expect(conflicts()).toHaveLength(1));
  expect(conflicts()[0]?.detail).toEqual({
    code: 'action.conflict',
    severity: 'warning',
    message: 'Button declares both an action and a script; the action is used.',
    details: { action: 'save', path: '' },
  });
  expect(conflicts()[0]?.bubbles).toBe(true);
  expect(conflicts()[0]?.composed).toBe(true);
  expect(
    element.shadowRoot?.querySelector('[data-button-diagnostic="action.conflict"]'),
  ).toBeNull();
  Object.assign(element, { data: {} });
  expect(conflicts()).toHaveLength(1);
  Object.assign(element, { uischema: { type: 'Button', label: 'Run', action: 'save' } });
  Object.assign(element, {
    uischema: { type: 'Button', label: 'Run', action: 'save', script: 'return 1;' },
  });
  await vi.waitFor(() => expect(conflicts()).toHaveLength(2));
});

it('delivers missing image alt to the author while the image stays visible', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: { type: 'object' },
    data: {},
    uischema: { type: 'ImageView', src: '/photo.png' },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'image.missingAlt');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail.severity).toBe('warning');
  expect(element.shadowRoot?.querySelector('img')?.getAttribute('src')).toBe('/photo.png');
  expect(element.shadowRoot?.querySelector('[data-image-diagnostic]')).toBeNull();
  Object.assign(element, { data: { changed: true } });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: { type: 'ImageView', src: '/photo.png', alt: 'Photo' } });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('img')?.getAttribute('alt')).toBe('Photo'),
  );
  Object.assign(element, { uischema: { type: 'ImageView', src: '/photo.png' } });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
});

it('reports unsupported vertical-layout spans again after an authored correction', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const layout = (span: number | undefined) => ({
    type: 'VerticalLayout',
    elements: [{ type: 'Label', text: 'Sized', options: { layout: { span } } }],
  });
  Object.assign(element, { schema: { type: 'object' }, data: {}, uischema: layout(2) });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter((event) => event.detail.code === 'layout.spanUnsupported');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0].detail).toMatchObject({
    code: 'layout.spanUnsupported',
    severity: 'warning',
    details: { path: '', index: 0 },
  });
  expect(warnings()[0].bubbles).toBe(true);
  expect(warnings()[0].composed).toBe(true);
  Object.assign(element, { data: { changed: true } });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: layout(undefined) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('[data-layout-diagnostic]')).toBeNull(),
  );
  Object.assign(element, { uischema: layout(2) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ changed: true });
});

it('re-emits a layout sizing conflict after an authored correction', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const layout = (conflict: boolean) => ({
    type: 'HorizontalLayout',
    options: { gridColumns: 4 },
    elements: [
      {
        type: 'Label',
        text: 'Sized',
        options: { layout: conflict ? { width: 120, span: 2, weight: 3 } : { width: 120 } },
      },
    ],
  });
  Object.assign(element, { schema: { type: 'object' }, data: {}, uischema: layout(true) });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const conflicts = () =>
    events.filter(({ detail }) => detail.code === 'layout.multipleSizingModes');
  await vi.waitFor(() => expect(conflicts()).toHaveLength(1));
  expect(conflicts()[0]?.detail.details).toMatchObject({ path: '', index: 0 });
  Object.assign(element, { data: { changed: true } });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(conflicts()).toHaveLength(1);
  Object.assign(element, { uischema: layout(false) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('[data-layout-diagnostic]')).toBeNull(),
  );
  Object.assign(element, { uischema: layout(true) });
  await vi.waitFor(() => expect(conflicts()).toHaveLength(2));
});

it('delivers invalid layout container options through the host after recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const layout = (gridColumns: number) => ({
    type: 'HorizontalLayout',
    options: { gridColumns },
    elements: [{ type: 'Control', scope: '#/properties/firstName' }],
  });
  Object.assign(element, {
    schema: { type: 'object', properties: { firstName: { type: 'string' } } },
    data: { firstName: 'Ada' },
    uischema: layout(0),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () =>
    events.filter(
      ({ detail }) =>
        detail.code === 'layout.invalidOption' && detail.message.includes('options.gridColumns'),
    );
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  expect(warnings()[0]?.detail).toMatchObject({
    severity: 'warning',
    details: { path: '', index: -1 },
  });
  Object.assign(element, { data: { firstName: 'Grace' } });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: layout(4) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('[data-layout-diagnostic]')).toBeNull(),
  );
  Object.assign(element, { uischema: layout(0) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ firstName: 'Grace' });
});

it('forwards a clamped child span after a valid host layout interval', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const layout = (span: number) => ({
    type: 'HorizontalLayout',
    options: { gridColumns: 4 },
    elements: [{ type: 'Label', text: 'Sized', options: { layout: { span } } }],
  });
  Object.assign(element, { schema: { type: 'object' }, data: {}, uischema: layout(8) });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'layout.spanClamped');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  expect(warnings()[0]?.detail).toMatchObject({
    severity: 'warning',
    details: { path: '', index: 0 },
  });
  Object.assign(element, { data: { changed: true } });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: layout(4) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('[data-layout-diagnostic]')).toBeNull(),
  );
  Object.assign(element, { uischema: layout(8) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ changed: true });
});

it('delivers splitter option warnings through the host after recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const layout = (wrap: boolean) => ({
    type: 'VerticalLayout',
    options: { variant: 'splitter', wrap },
    elements: [
      { type: 'Control', scope: '#/properties/firstName' },
      { type: 'Control', scope: '#/properties/lastName' },
    ],
  });
  Object.assign(element, {
    schema: {
      type: 'object',
      properties: { firstName: { type: 'string' }, lastName: { type: 'string' } },
    },
    data: { firstName: 'Ada', lastName: 'Lovelace' },
    uischema: layout(true),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () =>
    events.filter(({ detail }) => detail.code === 'splitLayout.wrapUnsupported');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail.details.path).toBe('');
  expect(element.shadowRoot?.querySelector('[data-split-layout]')).not.toBeNull();
  expect(element.shadowRoot?.querySelector('[role="alert"]')).toBeNull();
  Object.assign(element, { uischema: layout(false) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('[data-layout-diagnostic]')).toBeNull(),
  );
  Object.assign(element, { uischema: layout(true) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({
    firstName: 'Ada',
    lastName: 'Lovelace',
  });
});

it('delivers invalid splitter resizable warnings through the host after recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const layout = (resizable: unknown) => ({
    type: 'HorizontalLayout',
    options: { variant: 'splitter', resizable },
    elements: [
      { type: 'Control', scope: '#/properties/firstName' },
      { type: 'Control', scope: '#/properties/lastName' },
    ],
  });
  Object.assign(element, {
    schema: {
      type: 'object',
      properties: { firstName: { type: 'string' }, lastName: { type: 'string' } },
    },
    data: { firstName: 'Ada', lastName: 'Lovelace' },
    config: { resizable: false },
    uischema: layout('yes'),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () =>
    events.filter(({ detail }) => detail.code === 'splitLayout.invalidResizable');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail.details).toEqual({
    path: '',
    option: 'resizable',
    source: 'local',
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  expect(element.shadowRoot?.querySelector('[role="separator"]')?.getAttribute('tabindex')).toBe(
    '-1',
  );
  Object.assign(element, { data: { firstName: 'Updated', lastName: 'Lovelace' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: layout(true) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('[role="separator"]')?.getAttribute('tabindex')).toBe(
      '0',
    ),
  );
  Object.assign(element, { uischema: layout('yes') });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({
    firstName: 'Updated',
    lastName: 'Lovelace',
  });
});

it('re-emits a categorization initial warning after a valid host update', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const categories = (initial: string) => ({
    type: 'Categorization',
    options: { initial },
    elements: [
      {
        type: 'Category',
        name: 'first',
        label: 'First',
        elements: [{ type: 'Label', text: 'One' }],
      },
      {
        type: 'Category',
        name: 'second',
        label: 'Second',
        elements: [{ type: 'Label', text: 'Two' }],
      },
    ],
  });
  Object.assign(element, { schema: { type: 'object' }, data: {}, uischema: categories('missing') });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () =>
    events.filter(({ detail }) => detail.code === 'categorization.initialNotFound');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail.details.initial).toBe('missing');
  Object.assign(element, { data: { changed: true } });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: categories('first') });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  Object.assign(element, { uischema: categories('missing') });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ changed: true });
});

it('sends refused Markdown links to the author event without a form alert', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const label = (href: string) => ({
    type: 'Label',
    text: `[Help](${href})`,
    options: { markup: 'markdown' },
  });
  Object.assign(element, {
    schema: { type: 'object' },
    data: {},
    uischema: label('javascript:alert%281%29'),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter((event) => event.detail.code === 'markup.urlRefused');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0].bubbles).toBe(true);
  expect(warnings()[0].composed).toBe(true);
  expect(element.shadowRoot?.textContent).toContain('Help');
  expect(element.shadowRoot?.querySelector('a, [role="alert"]')).toBeNull();
  Object.assign(element, { uischema: label('https://example.com/help') });
  await vi.waitFor(() => expect(element?.shadowRoot?.querySelector('a')).not.toBeNull());
  Object.assign(element, { uischema: label('javascript:alert%281%29') });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({});
});

it('forwards template URL policy warnings after a host policy recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const config = (allowMailto: boolean) => ({
    jsonformsExtended: {
      security: {
        allowScriptEvaluation: true,
        urlPolicy: { allowedSchemes: allowMailto ? ['https', 'mailto'] : ['https'] },
      },
    },
  });
  Object.assign(element, {
    schema: { type: 'object' },
    data: { url: 'mailto:example@example.org' },
    uischema: {
      type: 'TemplateLayout',
      template: '<a href="{{data.url}}">Mail</a>',
    },
    config: config(false),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'template.urlRefused');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail).toEqual({
    code: 'template.urlRefused',
    severity: 'warning',
    message: 'Refused URL attribute href on a.',
    details: { tag: 'a', attribute: 'href' },
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  const link = element.shadowRoot?.querySelector('a');
  expect(link).not.toBeNull();
  expect(link?.hasAttribute('href')).toBe(false);
  Object.assign(element, { data: { url: 'mailto:example@example.org' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { config: config(true) });
  await vi.waitFor(() => expect(link?.getAttribute('href')).toBe('mailto:example@example.org'));
  Object.assign(element, { config: config(false) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect(link?.hasAttribute('href')).toBe(false);
  expect((element as HTMLElement & { data: unknown }).data).toEqual({
    url: 'mailto:example@example.org',
  });
});

it('forwards a nested named-template cycle and reports it after registry recovery', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const first = {
    type: 'VerticalLayout',
    name: 'first',
    elements: [{ type: 'Template', name: 'second' }],
  };
  const registry = (cycle: boolean) => [
    { tester: () => -1, uischema: first },
    {
      tester: () => -1,
      uischema: cycle
        ? {
            type: 'VerticalLayout',
            name: 'second',
            elements: [{ type: 'Template', name: 'first' }],
          }
        : { type: 'Label', name: 'second', text: 'Resolved template' },
    },
  ];
  Object.assign(element, {
    schema: { type: 'object' },
    data: { kept: true },
    uischema: { type: 'Template', name: 'first' },
    uischemas: registry(true),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter(({ detail }) => detail.code === 'template.cycle');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0]?.detail).toEqual({
    code: 'template.cycle',
    severity: 'warning',
    message: 'The named template resolves through a cycle.',
    details: { name: 'first', path: '' },
  });
  expect(warnings()[0]?.bubbles).toBe(true);
  expect(warnings()[0]?.composed).toBe(true);
  Object.assign(element, { data: { kept: true } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischemas: registry(false) });
  await vi.waitFor(() => expect(element?.shadowRoot?.textContent).toContain('Resolved template'));
  Object.assign(element, { uischemas: registry(true) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ kept: true });
});

it('re-emits an unsupported tuple diagnostic after a valid schema interval', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const property = (fixed: boolean) => ({
    type: 'array',
    items: { type: 'string' },
    ...(fixed ? { minItems: 1, maxItems: 1 } : {}),
  });
  const schema = (fixed: boolean) => ({
    type: 'object',
    properties: { value: property(fixed) },
  });
  Object.assign(element, {
    schema: schema(false),
    data: { value: ['kept'] },
    uischema: { type: 'Control', scope: '#/properties/value', options: { variant: 'tuple' } },
  });
  const codes: string[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) codes.push(event.detail.code);
  });
  document.body.append(element);
  const count = () => codes.filter((code) => code === 'variant.unsupported').length;
  await vi.waitFor(() => expect(count()).toBe(1));
  Object.assign(element, { schema: schema(true) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.textContent).not.toContain(
      'Tuple presentation requires positional schemas',
    ),
  );
  Object.assign(element, { schema: schema(false) });
  await vi.waitFor(() => expect(count()).toBe(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: ['kept'] });
});

it('dispatches an inapplicable tuple diagnostic and reclassifies live schema changes', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const schema = (type: 'string' | 'array') => ({
    type: 'object',
    properties: {
      value: type === 'string' ? { type: 'string' } : { type: 'array', items: { type: 'string' } },
    },
  });
  Object.assign(element, {
    schema: schema('string'),
    data: { value: 'kept' },
    uischema: { type: 'Control', scope: '#/properties/value', options: { variant: 'tuple' } },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const codes = () => events.map(({ detail }) => detail.code);
  await vi.waitFor(() => expect(codes()).toEqual(['variant.inapplicable']));
  expect(events[0]?.detail).toMatchObject({
    code: 'variant.inapplicable',
    severity: 'warning',
    details: { variant: 'tuple', path: 'value' },
  });
  expect(events[0]?.bubbles).toBe(true);
  expect(events[0]?.composed).toBe(true);
  Object.assign(element, { schema: schema('array') });
  await vi.waitFor(() => expect(codes()).toEqual(['variant.inapplicable', 'variant.unsupported']));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: 'kept' });
});

it('re-emits an unresolved conditional reference after host repair and removal', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const schema = (resolved: boolean) => ({
    type: 'object',
    ...(resolved && {
      definitions: {
        Branch: {
          if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
          then: { properties: { vat: { type: 'string' } } },
        },
      },
    }),
    properties: {
      value: {
        type: 'object',
        properties: { kind: { type: 'string' } },
        allOf: [{ $ref: '#/definitions/Branch' }],
      },
    },
  });
  Object.assign(element, {
    schema: schema(false),
    data: { value: { kind: 'business' } },
    validationMode: 'NoValidation',
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: { conditionalFields: true },
    },
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const count = () =>
    events.filter(({ detail }) => detail.code === 'conditional.referenceFailed').length;
  await vi.waitFor(() => expect(count()).toBe(1));
  expect(events[0]?.detail).toEqual({
    code: 'conditional.referenceFailed',
    severity: 'warning',
    message: 'A conditional field reference could not be resolved.',
    details: { path: 'value' },
  });
  expect(events[0]?.bubbles).toBe(true);
  expect(events[0]?.composed).toBe(true);
  Object.assign(element, { schema: schema(true) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.textContent).not.toContain('could not be resolved'),
  );
  Object.assign(element, { schema: schema(false) });
  await vi.waitFor(() => expect(count()).toBe(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({
    value: { kind: 'business' },
  });
});

it('re-emits a Group option diagnostic after a valid host update', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const group = (collapsed: unknown) => ({
    type: 'Group',
    label: 'Details',
    options: { collapsible: true, collapsed },
    elements: [{ type: 'Control', scope: '#/properties/value' }],
  });
  Object.assign(element, {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    data: { value: 'kept' },
    uischema: group(null),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter((event) => event.detail.code === 'section.invalidCollapsed');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0].detail).toEqual({
    code: 'section.invalidCollapsed',
    severity: 'warning',
    message: 'The collapsed option must be a boolean; the invalid value is ignored.',
    details: { component: 'group', source: 'options.collapsed', type: 'null' },
  });
  expect(warnings()[0].bubbles).toBe(true);
  expect(warnings()[0].composed).toBe(true);
  Object.assign(element, { data: { value: 'kept' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: group(false) });
  await vi.waitFor(() =>
    expect(element?.shadowRoot?.querySelector('button[aria-expanded]')).not.toBeNull(),
  );
  Object.assign(element, { uischema: group(null) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ value: 'kept' });
});

it('re-emits a focus conflict after the competing request is removed', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const layout = (secondVisible: boolean) => ({
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/first', options: { focus: true } },
      ...(secondVisible
        ? [{ type: 'Control', scope: '#/properties/second', options: { focus: true } }]
        : []),
    ],
  });
  Object.assign(element, {
    schema: {
      type: 'object',
      properties: { first: { type: 'string' }, second: { type: 'string' } },
    },
    data: { first: 'One', second: 'Two' },
    uischema: layout(true),
  });
  const events: CustomEvent[] = [];
  element.addEventListener('diagnostic', (event) => {
    if (event instanceof CustomEvent) events.push(event);
  });
  document.body.append(element);
  const warnings = () => events.filter((event) => event.detail.code === 'focus.conflict');
  await vi.waitFor(() => expect(warnings()).toHaveLength(1));
  expect(warnings()[0].detail).toEqual({
    code: 'focus.conflict',
    severity: 'warning',
    message: 'Several active controls request initial focus; the winner is not portable.',
    details: { paths: ['first', 'second'] },
  });
  expect(warnings()[0].bubbles).toBe(true);
  expect(warnings()[0].composed).toBe(true);
  Object.assign(element, { data: { first: 'One', second: 'Two' } });
  expect(warnings()).toHaveLength(1);
  Object.assign(element, { uischema: layout(false) });
  await vi.waitFor(() => expect(element?.shadowRoot?.querySelectorAll('input').length).toBe(1));
  Object.assign(element, { uischema: layout(true) });
  await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({
    first: 'One',
    second: 'Two',
  });
});
