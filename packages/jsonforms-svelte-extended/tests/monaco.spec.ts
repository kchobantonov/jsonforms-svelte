import { describe, expect, it } from 'vite-plus/test';
import {
  fromMonacoEditorValue,
  monacoControlTester,
  resolveMonacoLanguage,
  resolveMonacoOptions,
  resolveMonacoAppliedOptions,
  resolveMonacoErrorPublication,
  resolveMonacoDimension,
  toMonacoEditorValue,
} from '../src/lib/core/monaco';

describe('Monaco renderer helpers', () => {
  it('uses local and namespaced error-publication settings', () => {
    expect(resolveMonacoErrorPublication({}, {})).toBe(false);
    expect(
      resolveMonacoErrorPublication({ jsonformsExtended: { propagateErrors: false } }, {}),
    ).toBe(false);
    expect(
      resolveMonacoErrorPublication(
        { jsonformsExtended: { propagateErrors: true } },
        { propagateErrors: false },
      ),
    ).toBe(false);
    expect(resolveMonacoErrorPublication({ propagateErrors: false }, {}, true)).toBe(true);
  });
  it('resolves flat and local editor dimensions without reading removed namespaced values', () => {
    const applied = resolveMonacoAppliedOptions(
      { width: 420, height: '18rem', jsonformsExtended: { width: 900, height: 900 } },
      { width: '75%', height: 0 },
    );
    expect(resolveMonacoDimension(applied.width)).toBe('75%');
    expect(resolveMonacoDimension(applied.height)).toBe('0px');
    const flat = resolveMonacoAppliedOptions({ width: 420, height: '18rem' }, {});
    expect(resolveMonacoDimension(flat.width)).toBe('420px');
    expect(resolveMonacoDimension(flat.height)).toBe('18rem');
    const removed = resolveMonacoAppliedOptions(
      { jsonformsExtended: { width: 900, height: 900 } },
      {},
    );
    expect(resolveMonacoDimension(removed.width)).toBeUndefined();
    expect(resolveMonacoDimension(removed.height)).toBeUndefined();
    expect(resolveMonacoDimension(-1)).toBeUndefined();
    expect(resolveMonacoDimension('')).toBeUndefined();
  });

  it('replaces local Monaco bags without merging options or action arrays', () => {
    const config = {
      language: 'json',
      monaco: { rows: 20, options: { readOnly: true }, initActions: ['one', 'two'] },
    };
    const local = { monaco: { options: { minimap: { enabled: false } }, initActions: ['three'] } };
    const before = JSON.stringify([config, local]);
    expect(resolveMonacoAppliedOptions(config, local)).toMatchObject({
      language: 'json',
      monaco: local.monaco,
    });
    expect(resolveMonacoAppliedOptions(config, local).monaco).not.toHaveProperty('rows');
    expect(resolveMonacoOptions(resolveMonacoAppliedOptions(config, { monaco: null }))).toEqual({});
    expect(JSON.stringify([config, local])).toBe(before);
  });

  it('reads flat JSON conversion and ignores the removed namespaced location', () => {
    expect(
      resolveMonacoAppliedOptions(
        { convertJson: true, jsonformsExtended: { convertJson: false } },
        {},
      ).convertJson,
    ).toBe(true);
    expect(
      resolveMonacoAppliedOptions(
        { convertJson: true, jsonformsExtended: { convertJson: true } },
        { convertJson: false },
      ).convertJson,
    ).toBe(false);
    expect(
      resolveMonacoAppliedOptions({ jsonformsExtended: { convertJson: true } }, {}).convertJson,
    ).toBeUndefined();
  });

  it('reads every flat Monaco bag member and ignores the removed namespaced location', () => {
    const flat = {
      rows: 8,
      minRows: 2,
      maxRows: 18,
      autoGrow: true,
      initActions: ['format'],
      options: { wordWrap: 'on' },
    };
    const removed = {
      rows: 99,
      minRows: 91,
      maxRows: 100,
      autoGrow: false,
      initActions: ['other'],
      options: { wordWrap: 'off' },
    };
    expect(
      resolveMonacoOptions(
        resolveMonacoAppliedOptions({ monaco: flat, jsonformsExtended: { monaco: removed } }, {}),
      ),
    ).toEqual(flat);
    expect(
      resolveMonacoOptions(
        resolveMonacoAppliedOptions({ jsonformsExtended: { monaco: removed } }, {}),
      ),
    ).toEqual({});
    expect(
      resolveMonacoOptions(
        resolveMonacoAppliedOptions(
          { monaco: flat, jsonformsExtended: { monaco: removed } },
          { monaco: { rows: 4 } },
        ),
      ),
    ).toEqual({ rows: 4 });
  });

  it.each([
    [undefined, undefined, false],
    [{ jsonformsExtended: { propagateErrors: false } }, undefined, false],
    [{ jsonformsExtended: { propagateErrors: true } }, undefined, true],
    [{ jsonformsExtended: { propagateErrors: true } }, { propagateErrors: false }, false],
    [{ jsonformsExtended: { propagateErrors: false } }, { propagateErrors: true }, true],
    [{ jsonformsExtended: { propagateErrors: 'false' } }, undefined, false],
  ])('resolves error publication from local and namespaced settings', (config, local, expected) => {
    expect(resolveMonacoAppliedOptions(config, local).propagateErrors).toBe(expected);
  });
  it('resolves fixed and data-driven languages', () => {
    expect(resolveMonacoLanguage({ language: 'typescript' }, {})).toBe('typescript');
    expect(
      resolveMonacoLanguage({ ':language': 'editor.language' }, { editor: { language: 'json' } }),
    ).toBe('json');
    const config = {
      language: 'typescript',
      ':language': 'editor.language',
      jsonformsExtended: { language: 'css' },
    };
    const applied = resolveMonacoAppliedOptions(config, { language: 'javascript' });
    expect(resolveMonacoLanguage(applied, { editor: { language: 'json' } })).toBe('json');
    expect(resolveMonacoLanguage(applied, { editor: { language: null } })).toBe('javascript');
    expect(
      resolveMonacoLanguage(
        resolveMonacoAppliedOptions({ jsonformsExtended: { language: 'css' } }, {}),
        {},
      ),
    ).toBe('plaintext');
  });

  it('converts JSON without committing invalid content', () => {
    expect(toMonacoEditorValue({ enabled: true }, 'json', true)).toBe('{\n  "enabled": true\n}');
    expect(fromMonacoEditorValue('{"enabled":false}', 'json', true)).toEqual({
      valid: true,
      value: { enabled: false },
    });
    expect(fromMonacoEditorValue('{', 'json', true).valid).toBe(false);
    expect(fromMonacoEditorValue('', 'json', true).valid).toBe(false);
  });

  it('preserves explicit null and other scalar JSON values separately from absence', () => {
    expect(toMonacoEditorValue(undefined, 'json', true)).toBe('');
    for (const value of [null, false, 0, '', 'text', []]) {
      const encoded = toMonacoEditorValue(value, 'json', true);
      expect(fromMonacoEditorValue(encoded, 'json', true)).toEqual({ valid: true, value });
    }
  });

  it('keeps native options from replacing the bound model, language and value', () => {
    const options = {
      monaco: {
        rows: 12,
        options: {
          model: {},
          language: 'xml',
          value: 'other',
          theme: 'vs',
          readOnly: false,
          wordWrap: 'on',
        },
      },
    };
    expect(resolveMonacoOptions(options)).toEqual({
      rows: 12,
      options: { readOnly: false, wordWrap: 'on' },
    });
    expect(options.monaco.options.value).toBe('other');
    expect(resolveMonacoOptions({ monaco: true })).toEqual({});
  });

  it('reads renderer-neutral Monaco options', () => {
    expect(resolveMonacoOptions({ monaco: { rows: 12 } })).toEqual({
      rows: 12,
    });
    expect(resolveMonacoOptions(undefined)).toEqual({});
  });
});

it('selects code presentation for mixed values without displacing ordinary code languages', () => {
  const schema = { properties: { value: { type: ['string', 'object', 'null'] } } };
  const control = { type: 'Control', scope: '#/properties/value' };
  const config = { jsonformsExtended: { mixed: { structuredLayout: 'code' } } };
  expect(monacoControlTester(control, schema, { rootSchema: schema, config })).toBe(21);
  expect(
    monacoControlTester({ ...control, options: { structuredLayout: 'tree' } }, schema, {
      rootSchema: schema,
      config,
    }),
  ).toBe(-1);
  expect(
    monacoControlTester(
      { ...control, options: { format: 'code', language: 'javascript' } },
      { properties: { value: { type: 'string' } } },
      { rootSchema: schema, config },
    ),
  ).toBe(3);
  const options = resolveMonacoAppliedOptions(
    config,
    { language: 'javascript', ':language': 'format', propagateErrors: false },
    true,
  );
  expect(options).toMatchObject({ language: 'json', convertJson: true, propagateErrors: true });
  expect(resolveMonacoLanguage(options, { format: 'typescript' })).toBe('json');
});

it('selects explicitly requested code editors without requiring a language', () => {
  const schema = {
    type: 'object',
    properties: { code: { type: 'string' }, count: { type: 'number' } },
  };
  const context = { rootSchema: schema, config: {} };
  expect(
    monacoControlTester(
      { type: 'Control', scope: '#/properties/code', options: { format: 'code' } },
      schema,
      context,
    ),
  ).toBe(3);
  expect(resolveMonacoLanguage({ format: 'code' }, {})).toBe('plaintext');
  expect(
    monacoControlTester(
      { type: 'Control', scope: '#/properties/count', options: { format: 'code' } },
      schema,
      context,
    ),
  ).toBe(-1);
  expect(
    monacoControlTester({ type: 'Control', scope: '#/properties/code' }, schema, context),
  ).toBe(-1);
});
