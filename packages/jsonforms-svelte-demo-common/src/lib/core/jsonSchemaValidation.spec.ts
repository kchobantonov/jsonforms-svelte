import { describe, expect, it, vi } from 'vitest';
import type { MonacoApi } from './monaco';
vi.mock('./monaco', () => ({ default: {} }));
import { configureDataValidation } from './jsonSchemaValidation';

describe('data editor schema associations', () => {
  it('removes a cleared authored schema without disturbing unrelated editors or diagnostics settings', () => {
    let options = {
      validate: true,
      allowComments: false,
      schemas: [
        {
          uri: 'current.schema.json',
          fileMatch: ['current.data.json'],
          schema: { type: 'string' },
        },
        { uri: 'current.schema.json', fileMatch: ['other.data.json'], schema: { type: 'number' } },
        { uri: 'other.schema.json', fileMatch: ['third.data.json'], schema: {} },
      ],
    };
    const setDiagnosticsOptions = vi.fn((next) => {
      options = next;
    });
    const editor = {
      json: {
        jsonDefaults: {
          get diagnosticsOptions() {
            return options;
          },
          setDiagnosticsOptions,
        },
      },
    } as unknown as MonacoApi;
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', undefined);
    expect(options.schemas.map((entry) => entry.fileMatch)).toEqual([
      ['other.data.json'],
      ['third.data.json'],
    ]);
    expect(options.validate).toBe(true);
    expect(options.allowComments).toBe(false);
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', {});
    expect(
      options.schemas.find((entry) => entry.fileMatch[0] === 'current.data.json')?.schema,
    ).toEqual({});
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', false);
    expect(
      options.schemas.find((entry) => entry.fileMatch[0] === 'current.data.json')?.schema,
    ).toBe(false);
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', true);
    expect(
      options.schemas.find((entry) => entry.fileMatch[0] === 'current.data.json')?.schema,
    ).toBe(true);
    expect(setDiagnosticsOptions).toHaveBeenCalledTimes(4);
  });
});
