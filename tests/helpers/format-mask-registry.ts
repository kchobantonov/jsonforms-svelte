import { expect } from 'vite-plus/test';

type RegisterTest = typeof import('vite-plus/test').it;

type TestableEntry = { tester: (ui: unknown, schema: unknown, context: unknown) => number };

const winner = <T extends TestableEntry>(registry: T[], ui: unknown, schema: unknown): T => {
  const context = { rootSchema: schema, config: {} };
  return registry.reduce((best, entry) =>
    entry.tester(ui, schema, context) > best.tester(ui, schema, context) ? entry : best,
  );
};

type ScalarCase = {
  name: string;
  property: Record<string, unknown>;
  options?: Record<string, unknown>;
  renderer: unknown;
  cell: unknown;
  generated?: { renderer: unknown; cell: unknown };
  incompatible?: Record<string, unknown>;
};

type Target = { renderer: unknown; cell: unknown };
type BaseTargets = {
  suggested: Target;
  toggle: Target;
  multiline: Target;
  oneOfRadio: Target;
  password: Target;
  radio: Target;
  slider: Target;
  mask: Target;
  boolean: Target;
  string: Target;
  oneOf: Target;
  enum: Target;
  number: Target;
};

export function baseScalarCases(targets: BaseTargets): ScalarCase[] {
  return [
    {
      name: 'suggested string',
      property: { anyOf: [{ enum: ['A', 'B'] }, { type: 'string' }] },
      ...targets.suggested,
      generated: targets.suggested,
      incompatible: { anyOf: [{ enum: ['A'] }, { type: 'number' }] },
    },
    {
      name: 'boolean toggle',
      property: { type: 'boolean' },
      options: { toggle: true },
      ...targets.toggle,
      generated: targets.boolean,
      incompatible: { type: 'number' },
    },
    {
      name: 'multiline string',
      property: { type: 'string' },
      options: { multi: true, mask: '###' },
      ...targets.multiline,
      generated: targets.string,
      incompatible: { type: 'number' },
    },
    {
      name: 'oneOf radio',
      property: {
        type: 'string',
        oneOf: [
          { const: 'A', title: 'A' },
          { const: 'B', title: 'B' },
        ],
      },
      options: { format: 'radio', mask: '###' },
      ...targets.oneOfRadio,
      generated: targets.oneOf,
      incompatible: { type: 'string' },
    },
    {
      name: 'password',
      property: { type: 'string', format: 'password' },
      options: { multi: true, mask: '###' },
      ...targets.password,
      generated: targets.password,
      incompatible: { type: 'number' },
    },
    {
      name: 'enum radio',
      property: { type: 'string', enum: ['A', 'B'] },
      options: { format: 'radio', mask: '###' },
      ...targets.radio,
      generated: targets.enum,
      incompatible: { type: 'string' },
    },
    {
      name: 'slider',
      property: { type: 'number', minimum: 0, maximum: 10, default: 2 },
      options: { slider: true, toggle: true },
      ...targets.slider,
      generated: targets.number,
      incompatible: { type: 'string' },
    },
    {
      name: 'masked string',
      property: { type: 'string' },
      options: { mask: '###' },
      ...targets.mask,
      generated: targets.string,
      incompatible: { type: 'number' },
    },
  ];
}

type ExtendedTargets = {
  color: Target;
  cron: Target;
  duration: Target;
  file: Target;
  null: Target;
};

export function extendedScalarCases(targets: ExtendedTargets): ScalarCase[] {
  return [
    {
      name: 'color',
      property: { type: 'string', format: 'color' },
      options: { mask: '###' },
      ...targets.color,
      generated: targets.color,
      incompatible: { type: 'number', format: 'color' },
    },
    {
      name: 'cron',
      property: { type: 'string', format: 'cron' },
      options: { mask: '###' },
      ...targets.cron,
      generated: targets.cron,
      incompatible: { type: 'number', format: 'cron' },
    },
    {
      name: 'duration',
      property: { type: 'string', format: 'duration' },
      options: { mask: '###' },
      ...targets.duration,
      generated: targets.duration,
      incompatible: { type: 'number', format: 'duration' },
    },
    {
      name: 'binary file',
      property: { type: 'string', format: 'binary' },
      options: { mask: '###' },
      ...targets.file,
      generated: targets.file,
      incompatible: { type: 'number', format: 'binary' },
    },
    {
      name: 'multiple files',
      property: { type: 'array', items: { type: 'string', format: 'byte' } },
      options: { mask: '###' },
      ...targets.file,
      generated: targets.file,
      incompatible: { type: 'array', items: { type: 'string' } },
    },
    {
      name: 'null',
      property: { type: 'null' },
      options: { mask: '###' },
      ...targets.null,
      generated: targets.null,
      incompatible: { type: 'string' },
    },
  ];
}

/** Exercise the real registry order for specialized scalars, not just individual ranks. */
export function specializedScalarRegistryContract<TSchema>(
  renderers: unknown[],
  cells: unknown[],
  generateUi: (schema: TSchema) => unknown,
  cases: ScalarCase[],
  register: RegisterTest,
) {
  const rendererEntries = renderers as TestableEntry[];
  const cellEntries = cells as TestableEntry[];
  for (const scenario of cases) {
    for (const referenced of [false, true]) {
      register(
        `selects ${scenario.name} in ${referenced ? 'referenced' : 'inline'} schemas`,
        () => {
          const schema = {
            type: 'object',
            properties: {
              value: referenced ? { $ref: '#/$defs/value' } : scenario.property,
            },
            ...(referenced ? { $defs: { value: scenario.property } } : {}),
          };
          const ui = {
            type: 'Control',
            scope: '#/properties/value',
            ...(scenario.options ? { options: scenario.options } : {}),
          };
          expect(winner(rendererEntries, ui, schema)).toBe(scenario.renderer);
          expect(winner(cellEntries, ui, schema)).toBe(scenario.cell);
          if (scenario.incompatible) {
            const badSchema = referenced
              ? { ...schema, $defs: { value: scenario.incompatible } }
              : { ...schema, properties: { value: scenario.incompatible } };
            expect(
              (scenario.renderer as TestableEntry).tester(ui, badSchema, {
                rootSchema: badSchema,
                config: {},
              }),
            ).toBe(-1);
            expect(
              (scenario.cell as TestableEntry).tester(ui, badSchema, {
                rootSchema: badSchema,
                config: {},
              }),
            ).toBe(-1);
          }
        },
      );
    }
    if (scenario.generated) {
      for (const referenced of [false, true]) {
        register(
          `selects ${scenario.name} from generated UI with ${referenced ? 'referenced' : 'inline'} schema`,
          () => {
            const schema = {
              type: 'object',
              properties: {
                value: referenced ? { $ref: '#/$defs/value' } : scenario.property,
              },
              ...(referenced ? { $defs: { value: scenario.property } } : {}),
            };
            const generated = generateUi(schema as TSchema) as { elements?: unknown[] };
            const ui = generated.elements?.[0];
            expect(ui).toMatchObject({ type: 'Control', scope: '#/properties/value' });
            expect(winner(rendererEntries, ui, schema)).toBe(scenario.generated?.renderer);
            expect(winner(cellEntries, ui, schema)).toBe(scenario.generated?.cell);
          },
        );
      }
    }
  }
}

/** The same conflicting options must resolve to the format editor in both registries. */
export function formatMaskRegistryContract(
  renderers: unknown[],
  cells: unknown[],
  expected: Record<string, { renderer: unknown; cell: unknown }>,
  register: RegisterTest,
) {
  const rendererEntries = renderers as TestableEntry[];
  const cellEntries = cells as TestableEntry[];
  for (const [format, entries] of Object.entries(expected)) {
    for (const referenced of [false, true]) {
      register(
        `prefers ${format} over a mask in ${referenced ? 'referenced' : 'inline'} schemas`,
        () => {
          const property = { type: 'string', format };
          const schema = {
            type: 'object',
            properties: { value: referenced ? { $ref: '#/$defs/value' } : property },
            ...(referenced ? { $defs: { value: property } } : {}),
          };
          const ui = {
            type: 'Control',
            scope: '#/properties/value',
            options: { mask: '###-###', ...(format === 'password' ? { multi: true } : {}) },
          };
          expect(winner(rendererEntries, ui, schema)).toBe(entries.renderer);
          expect(winner(cellEntries, ui, schema)).toBe(entries.cell);
        },
      );
    }
  }
  if (expected.password) {
    register('prefers a locally requested password over multiline and mask presentations', () => {
      const schema = { type: 'object', properties: { value: { type: 'string' } } };
      const ui = {
        type: 'Control',
        scope: '#/properties/value',
        options: { format: 'password', multi: true, mask: '###-###' },
      };
      expect(winner(rendererEntries, ui, schema)).toBe(expected.password.renderer);
      expect(winner(cellEntries, ui, schema)).toBe(expected.password.cell);
    });
  }
}

/** Composite cells must win for structured values without swallowing ordinary scalar cells. */
export function compositeCellRegistryContract(
  cells: unknown[],
  entries: { composite: unknown; text: unknown; number: unknown },
  register: RegisterTest,
) {
  const registry = cells as TestableEntry[];
  const selected = (ui: unknown, schema: unknown, rootSchema: unknown) => {
    const context = { rootSchema, config: {} };
    return registry.reduce((best, entry) =>
      entry.tester(ui, schema, context) > best.tester(ui, schema, context) ? entry : best,
    );
  };
  const cases = [
    { name: 'plain text', property: { type: 'string' }, expected: entries.text },
    { name: 'number', property: { type: 'number' }, expected: entries.number },
    { name: 'object', property: { type: 'object' }, expected: entries.composite },
    {
      name: 'array',
      property: { type: 'array', items: { type: 'string' } },
      expected: entries.composite,
    },
    { name: 'mixed value', property: { type: ['string', 'object'] }, expected: entries.composite },
    {
      name: 'composed value',
      property: { allOf: [{ type: 'object', properties: { name: { type: 'string' } } }] },
      expected: entries.composite,
    },
  ];
  for (const scenario of cases) {
    for (const referenced of [false, true]) {
      register(
        `selects ${scenario.name} cell from ${referenced ? 'referenced' : 'inline'} schema`,
        () => {
          const schema = {
            type: 'object',
            properties: { value: referenced ? { $ref: '#/$defs/value' } : scenario.property },
            ...(referenced ? { $defs: { value: scenario.property } } : {}),
          };
          const ui = { type: 'Control', scope: '#/properties/value' };
          // DispatchCell receives the resolved property schema and the full root separately.
          expect(selected(ui, scenario.property, schema)).toBe(scenario.expected);
        },
      );
    }
  }
  register(
    'selects a Label summary cell for a scalar but leaves a Control summary with its scalar cell',
    () => {
      const schema = { type: 'object', properties: { value: { type: 'string' } } };
      const control = { type: 'Control', scope: '#/properties/value' };
      expect(
        selected(
          { ...control, options: { summary: { type: 'Label', text: 'Shown' } } },
          schema.properties.value,
          schema,
        ),
      ).toBe(entries.composite);
      expect(
        selected(
          { ...control, options: { summary: { type: 'Control', scope: '#' } } },
          schema.properties.value,
          schema,
        ),
      ).toBe(entries.text);
    },
  );
}

/** File markers must outrank a conflicting mask even when base entries are registered first. */
export function fileMaskRegistryContract(
  baseRenderers: unknown[],
  extendedRenderers: unknown[],
  baseCells: unknown[],
  extendedCells: unknown[],
  fileRenderer: unknown,
  fileCell: unknown,
  register: RegisterTest,
) {
  const renderers = [...baseRenderers, ...extendedRenderers] as TestableEntry[];
  const cells = [...baseCells, ...extendedCells] as TestableEntry[];
  for (const marker of ['binary', 'byte', 'base64']) {
    for (const referenced of [false, true]) {
      register(
        `selects ${marker} file over mask in ${referenced ? 'referenced' : 'inline'} schemas`,
        () => {
          const property = {
            type: 'string',
            ...(marker === 'base64' ? { contentEncoding: 'base64' } : { format: marker }),
          };
          const schema = {
            type: 'object',
            properties: { value: referenced ? { $ref: '#/$defs/value' } : property },
            ...(referenced ? { $defs: { value: property } } : {}),
          };
          const ui = {
            type: 'Control',
            scope: '#/properties/value',
            options: { mask: '###-###' },
          };
          expect(winner(renderers, ui, schema)).toBe(fileRenderer);
          expect(winner(cells, ui, schema)).toBe(fileCell);
        },
      );
    }
  }
  register('selects multiple files when the item schema is referenced', () => {
    const schema = {
      type: 'object',
      properties: { value: { type: 'array', items: { $ref: '#/$defs/file' } } },
      $defs: { file: { type: 'string', format: 'byte' } },
    };
    const ui = { type: 'Control', scope: '#/properties/value' };
    expect(winner(renderers, ui, schema)).toBe(fileRenderer);
    expect(winner(cells, ui, schema)).toBe(fileCell);
  });
}

/** Monaco remains a full control; compact string cells use the native text editor. */
export function codeCellFallbackRegistryContract(
  baseRenderers: unknown[],
  extendedRenderers: unknown[],
  baseCells: unknown[],
  extendedCells: unknown[],
  codeRenderer: unknown,
  textCell: unknown,
  register: RegisterTest,
) {
  const renderers = [...baseRenderers, ...extendedRenderers] as TestableEntry[];
  const cells = [...baseCells, ...extendedCells] as TestableEntry[];
  for (const referenced of [false, true]) {
    register(
      `keeps ${referenced ? 'referenced' : 'inline'} code strings in compact text cells`,
      () => {
        const property = { type: 'string' };
        const schema = {
          type: 'object',
          properties: { value: referenced ? { $ref: '#/$defs/value' } : property },
          ...(referenced ? { $defs: { value: property } } : {}),
        };
        const ui = {
          type: 'Control',
          scope: '#/properties/value',
          options: { format: 'code', language: 'typescript' },
        };
        expect(winner(renderers, ui, schema)).toBe(codeRenderer);
        expect(winner(cells, ui, schema)).toBe(textCell);
      },
    );
  }
}
