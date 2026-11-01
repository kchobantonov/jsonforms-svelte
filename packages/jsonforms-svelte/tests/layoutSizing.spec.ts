import { describe, expect, it } from 'vite-plus/test';
import type { UISchemaElement } from '@jsonforms/core';
import {
  containerOptionDiagnostics,
  containerStyle,
  itemSizing,
  legacySizingDiagnosticEntries,
  legacySizingDiagnostics,
  type LayoutContainerOptions,
} from '../src/lib/layoutSizing';

const child = (layout: Record<string, unknown>) =>
  ({ type: 'Label', text: 'Item', options: { layout } }) as UISchemaElement;

describe('conflicting portable sizing modes', () => {
  it('keeps fixed width ahead of span and weight and diagnoses the conflict', () => {
    const result = itemSizing(child({ width: 120, span: 2, weight: 3 }), 'row', 4, 0);
    expect(result.style.flex).toBe('0 0 120px');
    expect(result.diagnostics).toContain(
      'Multiple sizing modes (fixed, span, weight); using fixed.',
    );
  });

  it('keeps span ahead of weight and diagnoses the conflict', () => {
    const result = itemSizing(child({ span: 2, weight: 3 }), 'row', 4, 0);
    expect(result.style.flex).toContain('50%');
    expect(result.diagnostics).toContain('Multiple sizing modes (span, weight); using span.');
  });

  it('does not count an invalid fixed width as an active mode', () => {
    const result = itemSizing(child({ width: -1, span: 2 }), 'row', 4, 0);
    expect(result.style.flex).toContain('50%');
    expect(result.diagnostics).toContain('`width` must be a non-negative dimension; ignored.');
    expect(result.diagnostics.some((message) => message.startsWith('Multiple sizing modes'))).toBe(
      false,
    );
  });
});

it('keeps explicit item diagnostic codes alongside the inspection messages', () => {
  const conflict = itemSizing(child({ width: 120, span: 2, weight: 3 }), 'row', 4, 0);
  expect(conflict.diagnosticEntries.map(({ code }) => code)).toEqual([
    'layout.multipleSizingModes',
  ]);
  expect(conflict.diagnosticEntries.map(({ message }) => message)).toEqual(conflict.diagnostics);

  const clamped = itemSizing(child({ span: 8, weight: -1 }), 'row', 4, 0);
  expect(clamped.diagnosticEntries.map(({ code }) => code)).toEqual([
    'layout.spanClamped',
    'layout.invalidOption',
  ]);
  expect(itemSizing(child({ span: 2 }), 'column', 4, 0).diagnosticEntries[0]?.code).toBe(
    'layout.spanUnsupported',
  );

  const legacy = { type: 'Label', options: { columns: 2, trim: true } } as UISchemaElement;
  expect(legacySizingDiagnosticEntries(legacy).map(({ code }) => code)).toEqual([
    'layout.unsupportedOption',
    'layout.unsupportedOption',
  ]);
  expect(legacySizingDiagnosticEntries(legacy).map(({ message }) => message)).toEqual(
    legacySizingDiagnostics(legacy),
  );
});

describe('layout container option diagnostics', () => {
  it('reports invalid local and global values without changing fallback selection', () => {
    const diagnostics = containerOptionDiagnostics(
      {
        gridColumns: 0,
        wrap: 'yes',
        align: 'middle',
        gap: -1,
      } as unknown as LayoutContainerOptions,
      { jsonformsExtended: { layoutDefaults: { minItemWidth: -1 } } },
      'row',
    );
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        {
          code: 'layout.invalidOption',
          message: 'options.gridColumns must be a positive integer; ignored.',
        },
        { code: 'layout.invalidOption', message: 'options.wrap must be a boolean; ignored.' },
        {
          code: 'layout.invalidOption',
          message:
            'config.jsonformsExtended.layoutDefaults.minItemWidth must be a non-negative dimension; ignored.',
        },
      ]),
    );
  });

  it('reports a local grid hint that cannot affect a vertical layout', () => {
    expect(containerOptionDiagnostics({ gridColumns: 4 }, undefined, 'column')).toContainEqual({
      code: 'layout.unsupportedOption',
      message: 'options.gridColumns has no effect in a vertical layout; ignored.',
    });
  });

  it('rejects prototype-looking alignment values instead of using inherited properties', () => {
    const options = {
      align: 'toString',
      justify: 'constructor',
    } as unknown as LayoutContainerOptions;
    expect(containerStyle(options, undefined, 'row').alignItems).toBeUndefined();
    expect(containerStyle(options, undefined, 'row').justifyContent).toBeUndefined();
    expect(containerOptionDiagnostics(options, undefined, 'row')).toEqual(
      expect.arrayContaining([
        {
          code: 'layout.invalidOption',
          message: 'options.align must be a supported alignment; ignored.',
        },
        {
          code: 'layout.invalidOption',
          message: 'options.justify must be a supported justification; ignored.',
        },
      ]),
    );
  });
});
