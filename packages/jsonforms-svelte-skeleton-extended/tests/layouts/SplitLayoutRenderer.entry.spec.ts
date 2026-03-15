import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  extendedLayoutRenderers,
  splitLayoutRendererEntry,
  templateLayoutRendererEntry,
} from '../../src/lib/layouts';

const schema: JsonSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
};

const runTester = (uischema: UISchemaElement) =>
  splitLayoutRendererEntry.tester(uischema, schema, {
    rootSchema: schema,
    config: {},
  });

const createLayout = (
  type: 'HorizontalLayout' | 'VerticalLayout' | 'Group',
  variant?: string,
): UISchemaElement =>
  ({
    type,
    ...(type === 'Group' ? { label: 'Group' } : {}),
    elements: [],
    ...(variant ? { options: { variant } } : {}),
  }) as UISchemaElement;

describe('SplitLayoutRenderer entry', () => {
  it('matches horizontal and vertical layouts when splitter variant is configured', () => {
    expect(runTester(createLayout('HorizontalLayout', 'splitter'))).toBe(5);
    expect(runTester(createLayout('VerticalLayout', 'splitter'))).toBe(5);
  });

  it('does not match unsupported variants or non-layout types', () => {
    expect(runTester(createLayout('HorizontalLayout'))).toBe(-1);
    expect(runTester(createLayout('HorizontalLayout', 'split-pane'))).toBe(-1);
    expect(runTester(createLayout('HorizontalLayout', 'splitpane'))).toBe(-1);
    expect(runTester(createLayout('VerticalLayout', 'split'))).toBe(-1);
    expect(runTester(createLayout('VerticalLayout', 'stepper'))).toBe(-1);
    expect(runTester(createLayout('Group', 'splitter'))).toBe(-1);
  });

  it('exports split layout renderer entry', () => {
    expect(extendedLayoutRenderers).toHaveLength(2);
    expect(extendedLayoutRenderers).toContain(splitLayoutRendererEntry);
    expect(extendedLayoutRenderers).toContain(templateLayoutRendererEntry);
  });
});
