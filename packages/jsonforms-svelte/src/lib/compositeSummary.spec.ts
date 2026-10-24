import { describe, it, expect } from 'vite-plus/test';
import { compositeSummaryPresentation, compositeCellTester } from './compositeSummary';
import { rendererMessage } from './rendererMessages';
import type { ControlElement } from '@jsonforms/core';

const summary: ControlElement = { type: 'Control', scope: '#/properties/city' };
const present = (data: unknown, descriptor: ControlElement = summary) =>
  compositeSummaryPresentation(
    data,
    descriptor,
    'Contact',
    (_key, fallback) => fallback!,
    (key) => rendererMessage('en', key),
  );

describe('composite summary presentation', () => {
  it('distinguishes missing, empty, unspecified and literal values', () => {
    expect(present(undefined)).toEqual({ text: 'Not set', generated: true });
    expect(present({})).toEqual({ text: 'Empty object', generated: true });
    expect(present({ phone: '123' })).toEqual({
      text: 'City not specified',
      generated: true,
    });
    expect(present({ city: 'Contact' })).toEqual({
      text: 'Contact',
      generated: false,
    });
    expect(present({ city: '  ', phone: '123' }).generated).toBe(true);
    expect(present({ city: 0 })).toEqual({ text: '0', generated: false });
    expect(present({ city: false })).toEqual({
      text: 'false',
      generated: false,
    });
  });
  it('distinguishes generated counts from previews', () => {
    expect(present([])).toEqual({ text: '0 items', generated: true });
    expect(present([{}, {}])).toEqual({ text: '2 items', generated: true });
    expect(present([{ city: 'London' }])).toEqual({
      text: 'London',
      generated: false,
    });
  });
});

it('reserves the composite fallback for structured/mixed values and explicit Label summaries', () => {
  const ui: ControlElement = { type: 'Control', scope: '#' };
  const context = { rootSchema: {}, config: {} };
  expect(compositeCellTester(ui, { type: 'string' }, context)).toBe(-1);
  expect(compositeCellTester(ui, { type: 'object' }, context)).toBe(1);
  expect(compositeCellTester(ui, { type: ['string', 'object'] }, context)).toBe(1);
  expect(
    compositeCellTester(
      { ...ui, options: { summary: { type: 'Label', text: 'Summary' } } },
      { type: 'number' },
      context,
    ),
  ).toBe(6);
});
