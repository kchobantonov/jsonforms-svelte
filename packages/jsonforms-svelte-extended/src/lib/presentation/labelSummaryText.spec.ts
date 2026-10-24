import { expect, it } from 'vite-plus/test';
import { createTranslator, type JsonFormsState, type LabelElement } from '@jsonforms/core';
import * as markdown from './markdown';
import * as evaluator from './celTemplate';
import { labelSummaryText } from './labelSummaryText';

const label: LabelElement = {
  type: 'Label',
  text: '{name} · {heading}',
  options: { interpolate: true, textParams: { name: '{item.name}', heading: '{data.heading}' } },
};
const form = (enabled = true): JsonFormsState =>
  ({
    jsonforms: {
      config: { jsonformsExtended: { dynamicValues: { enabled } } },
      core: { data: { heading: 'Applicants', rows: [{ name: 'Alice' }] } },
    },
  }) as JsonFormsState;

it('resolves the same declared Label parameters for row and root data without mutating either', () => {
  const state = form();
  const item = { name: 'Alice' };
  expect(labelSummaryText(state, label, 'rows.0', item, undefined, evaluator)).toBe(
    'Alice · Applicants',
  );
  expect(item).toEqual({ name: 'Alice' });
  expect(state.jsonforms.core!.data.rows).toEqual([item]);
});
it('keeps unavailable and forbidden expression values out of search', () => {
  expect(labelSummaryText(form(), label, 'rows.0', { name: 'SECRET' }, undefined)).toBe('');
  const blocked = labelSummaryText(
    form(false),
    label,
    'rows.0',
    { name: 'SECRET' },
    undefined,
    evaluator,
  );
  expect(blocked).not.toContain('SECRET');
  expect(blocked).not.toContain('Applicants');
  expect(blocked).not.toContain('{item');
});
it('honors translated Label text and literal brace escapes', () => {
  const state = form();
  state.jsonforms.i18n = {
    locale: 'bg',
    translate: createTranslator((key, fallback) =>
      key === 'summary.text' ? '{heading}: {name}' : fallback,
    ),
  };
  expect(
    labelSummaryText(
      state,
      { ...label, i18n: 'summary' },
      'rows.0',
      { name: 'Ана' },
      undefined,
      evaluator,
    ),
  ).toBe('Applicants: Ана');
  expect(
    labelSummaryText(
      state,
      { type: 'Label', text: '{{literal}}', options: { interpolate: true } },
      '',
      undefined,
      undefined,
    ),
  ).toBe('{literal}');
});

it('searches displayed Markdown while keeping interpolated markup literal and honoring the host profile', () => {
  const summary: LabelElement = {
    type: 'Label',
    text: '**{name}**',
    options: { markup: 'markdown', interpolate: true, textParams: { name: '{item.name}' } },
  };
  expect(
    labelSummaryText(form(), summary, 'rows.0', { name: 'Boston' }, undefined, evaluator, markdown),
  ).toBe('Boston');
  expect(
    labelSummaryText(
      form(),
      summary,
      'rows.0',
      { name: '**Boston**' },
      undefined,
      evaluator,
      markdown,
    ),
  ).toBe('**Boston**');
  expect(
    labelSummaryText(form(), summary, 'rows.0', { name: 'Boston' }, undefined, evaluator),
  ).toBe('');
  const state = form();
  state.jsonforms.config = {
    jsonformsExtended: {
      markup: { markdown: { enabled: false } },
      dynamicValues: { enabled: true },
    },
  };
  expect(
    labelSummaryText(state, summary, 'rows.0', { name: 'Boston' }, undefined, evaluator, markdown),
  ).toBe('**Boston**');
  expect(
    labelSummaryText(
      form(),
      { type: 'Label', text: '**Boston**', options: { markup: 'markdown' } },
      '',
      undefined,
      undefined,
      undefined,
      markdown,
    ),
  ).toBe('Boston');
});
