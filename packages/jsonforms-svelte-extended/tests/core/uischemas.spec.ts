import type {
  JsonFormsUISchemaRegistryEntry,
  UISchemaElement,
  ValidateFunctionContext,
} from '@jsonforms/core';
import { describe, expect, it, vi } from 'vite-plus/test';

const permittedConfig = { jsonformsExtended: { security: { allowScriptEvaluation: true } } };
import {
  parseAndTransformUISchemaRegistryEntries,
  resolveUISchemaValidations,
} from '../../src/lib/core/uischemas.ts';

const sampleUiSchema = {
  type: 'Label',
  text: 'Hello',
} as unknown as JsonFormsUISchemaRegistryEntry['uischema'];

describe('parseAndTransformUISchemaRegistryEntries', () => {
  it('revives tester functions encoded as strings', () => {
    const [entry] = parseAndTransformUISchemaRegistryEntries(
      [
        {
          tester: '() => 7',
          uischema: sampleUiSchema,
        },
      ],
      permittedConfig,
    );

    expect(typeof entry.tester).toBe('function');
    expect(entry.tester({ type: 'string' } as never, '#/properties/value', 'value')).toBe(7);
  });

  it('passes schema, schemaPath, and path to revived testers', () => {
    const [entry] = parseAndTransformUISchemaRegistryEntries(
      [
        {
          tester:
            "(schema, schemaPath, path) => schema.type === 'string' && schemaPath === '#/properties/value' && path === 'value' ? 5 : NOT_APPLICABLE",
          uischema: sampleUiSchema,
        },
      ],
      permittedConfig,
    );

    expect(entry.tester({ type: 'string' } as never, '#/properties/value', 'value')).toBe(5);
  });

  it('leaves existing function testers untouched', () => {
    const tester = () => 3;
    const [entry] = parseAndTransformUISchemaRegistryEntries(
      [
        {
          tester,
          uischema: sampleUiSchema,
        },
      ],
      permittedConfig,
    );

    expect(entry.tester).toBe(tester);
  });

  it('falls back to NOT_APPLICABLE for invalid tester strings', () => {
    const [entry] = parseAndTransformUISchemaRegistryEntries(
      [
        {
          tester: 'not valid javascript',
          uischema: sampleUiSchema,
        },
      ],
      permittedConfig,
    );

    expect(entry.tester({ type: 'string' } as never, '#/properties/value', 'value')).toBe(-1);
  });

  it('returns an empty array for undefined input', () => {
    expect(parseAndTransformUISchemaRegistryEntries(undefined)).toEqual([]);
  });

  it('transforms nested rule.condition.validate strings inside registry uischemas', () => {
    const [entry] = parseAndTransformUISchemaRegistryEntries(
      [
        {
          tester: () => 1,
          uischema: {
            type: 'Group',
            label: 'Wrapped',
            elements: [
              {
                type: 'Control',
                scope: '#/properties/value',
                rule: {
                  effect: 'SHOW',
                  condition: {
                    scope: '#',
                    validate: '(context) => Boolean(context?.config?.featureEnabled)',
                  },
                },
              },
            ],
          } as UISchemaElement,
        },
      ],
      { ...permittedConfig, featureEnabled: true },
    );

    const nested = (entry.uischema as { elements: UISchemaElement[] }).elements[0] as {
      rule: { condition: { validate: (context: ValidateFunctionContext) => boolean } };
    };

    expect(typeof nested.rule.condition.validate).toBe('function');
    expect(
      nested.rule.condition.validate({
        rootData: {},
        instancePath: '',
        parentData: undefined,
      } as unknown as ValidateFunctionContext),
    ).toBe(true);
  });
});

describe('resolveUISchemaValidations', () => {
  it('turns string validate functions into executable functions with config access', () => {
    const transformed = resolveUISchemaValidations(
      {
        type: 'Control',
        scope: '#/properties/value',
        rule: {
          effect: 'ENABLE',
          condition: {
            scope: '#',
            validate: '(context) => context.config?.featureEnabled === true',
          },
        },
      } as UISchemaElement,
      { ...permittedConfig, featureEnabled: true },
    ) as {
      rule: { condition: { validate: (context: ValidateFunctionContext) => boolean } };
    };

    expect(typeof transformed.rule.condition.validate).toBe('function');
    expect(
      transformed.rule.condition.validate({
        rootData: {},
        instancePath: '',
        parentData: undefined,
      } as unknown as ValidateFunctionContext),
    ).toBe(true);
  });
});

it('denies untrusted tester source before compilation and deduplicates diagnostics', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const [entry] = parseAndTransformUISchemaRegistryEntries([
      { tester: 'invalid syntax !!!', uischema: sampleUiSchema },
    ]);
    expect(entry.tester({}, '#', '')).toBe(-1);
    expect(entry.tester({}, '#', '')).toBe(-1);
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledExactlyOnceWith('script.evaluationDisabled', {
      capability: 'uischema.tester[0]',
    });
  } finally {
    warn.mockRestore();
    error.mockRestore();
  }
});

it('rechecks permission and isolates forms with the same tester source', () => {
  const config = { jsonformsExtended: { security: { allowScriptEvaluation: true } } };
  const entries = [{ tester: '() => 8', uischema: sampleUiSchema }];
  const [allowed] = parseAndTransformUISchemaRegistryEntries(entries, config);
  const [denied] = parseAndTransformUISchemaRegistryEntries(entries);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(allowed.tester({}, '#', '')).toBe(8);
    expect(denied.tester({}, '#', '')).toBe(-1);
    config.jsonformsExtended.security.allowScriptEvaluation = false;
    expect(allowed.tester({}, '#', '')).toBe(-1);
    config.jsonformsExtended.security.allowScriptEvaluation = true;
    expect(allowed.tester({}, '#', '')).toBe(8);
  } finally {
    warn.mockRestore();
  }
});

it('gates string rule predicates but retains trusted predicates without permission', () => {
  const native = () => true;
  const element = (validate: unknown) =>
    ({
      type: 'Control',
      scope: '#',
      rule: {
        effect: 'SHOW',
        condition: { validate },
      },
    }) as UISchemaElement;
  type Condition = {
    rule: { condition: { validate: (context: ValidateFunctionContext) => boolean } };
  };
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const denied = resolveUISchemaValidations(
      element('invalid syntax !!!'),
    ) as unknown as Condition;
    expect(denied.rule.condition.validate({} as ValidateFunctionContext)).toBe(false);
    const trusted = resolveUISchemaValidations(element(native)) as unknown as Condition;
    expect(trusted.rule.condition.validate).toBe(native);
    expect(trusted.rule.condition.validate({} as ValidateFunctionContext)).toBe(true);
  } finally {
    warn.mockRestore();
  }
});
