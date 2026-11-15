export const defaultDemoConfig = () => ({
  restrict: true,
  trim: false,
  showUnfocusedDescription: false,
  hideRequiredAsterisk: false,
  collapseNewItems: false,
  breakHorizontal: false,
  hideAvatar: false,
  hideArraySummaryValidation: false,
  enableFilterErrorsBeforeTouch: false,
  filterErrorKeywordsBeforeTouch: ['required'],
  allowAdditionalPropertiesIfMissing: false,
  allowEmptyPropertyNames: false,
});

export type DemoConfig = ReturnType<typeof defaultDemoConfig> & Record<string, unknown>;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** The demo setting controls the portable array default, not the legacy local option. */
export function getDemoArrayCollapsed(config: DemoConfig): boolean {
  const extended = asRecord(config.jsonformsExtended);
  const array = asRecord(extended.array);
  return (array.collapsed ?? extended.collapsed) === true;
}

export function setDemoArrayCollapsed(
  overrides: Partial<DemoConfig>,
  collapsed: boolean,
): Partial<DemoConfig> {
  const extended = asRecord(overrides.jsonformsExtended);
  return {
    ...overrides,
    jsonformsExtended: {
      ...extended,
      array: { ...asRecord(extended.array), collapsed },
    },
  };
}

const mergeRecords = (
  source: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> => {
  const result = { ...source };
  for (const [key, value] of Object.entries(overrides)) {
    result[key] =
      isRecord(value) && isRecord(source[key]) ? mergeRecords(source[key], value) : value;
  }
  return result;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Authored example/editor values override defaults; only explicit settings override authors. */
export function mergeDemoConfig(
  example: Record<string, unknown> = {},
  overrides: Partial<DemoConfig> = {},
): DemoConfig {
  const result: DemoConfig = { ...defaultDemoConfig(), ...example, ...overrides };
  if (isRecord(example.jsonformsExtended) && isRecord(overrides.jsonformsExtended)) {
    result.jsonformsExtended = mergeRecords(example.jsonformsExtended, overrides.jsonformsExtended);
  }
  return result;
}
