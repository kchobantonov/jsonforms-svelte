import type { ControlElement, JsonSchema } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  agGridArrayTester,
  flowbiteAgGridArrayRendererEntry,
  isAgGridRendererRuntimeRequested,
  shadcnAgGridArrayRendererEntry,
  skeletonAgGridArrayRendererEntry,
} from '../src/lib';

const arraySchema: JsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: { name: { type: 'string' } },
  },
};

const agGridControl: ControlElement = {
  type: 'Control',
  scope: '#',
  options: { variant: 'ag-grid' },
};
const testerContext = { rootSchema: arraySchema, config: {} };

describe('AG Grid renderer entries', () => {
  it('wins only for array controls that explicitly request the ag-grid variant', () => {
    expect(agGridArrayTester(agGridControl, arraySchema, testerContext)).toBe(10);
    expect(
      agGridArrayTester(
        { ...agGridControl, options: { variant: 'table' } },
        arraySchema,
        testerContext,
      ),
    ).toBe(-1);
    expect(agGridArrayTester(agGridControl, { type: 'object' }, testerContext)).toBe(-1);
  });

  it('shares the opt-in tester across all design-system adapters', () => {
    expect(shadcnAgGridArrayRendererEntry.tester).toBe(agGridArrayTester);
    expect(skeletonAgGridArrayRendererEntry.tester).toBe(agGridArrayTester);
    expect(flowbiteAgGridArrayRendererEntry.tester).toBe(agGridArrayTester);
  });

  it('does not request the AG Grid runtime by importing or evaluating testers', () => {
    agGridArrayTester(agGridControl, arraySchema, testerContext);
    shadcnAgGridArrayRendererEntry.tester(agGridControl, arraySchema, testerContext);

    expect(isAgGridRendererRuntimeRequested()).toBe(false);
  });
});
