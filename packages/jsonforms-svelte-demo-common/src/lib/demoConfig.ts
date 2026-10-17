export const defaultDemoConfig = () => ({
  restrict: true,
  trim: false,
  showUnfocusedDescription: false,
  hideRequiredAsterisk: false,
  collapseNewItems: false,
  breakHorizontal: false,
  initCollapsed: false,
  hideAvatar: false,
  hideArraySummaryValidation: false,
  enableFilterErrorsBeforeTouch: false,
  filterErrorKeywordsBeforeTouch: ['required'],
  allowAdditionalPropertiesIfMissing: false,
  allowEmptyPropertyNames: false,
});

export type DemoConfig = ReturnType<typeof defaultDemoConfig> & Record<string, unknown>;

/** Authored example/editor values override defaults; only explicit settings override authors. */
export function mergeDemoConfig(
  example: Record<string, unknown> = {},
  overrides: Partial<DemoConfig> = {},
): DemoConfig {
  return { ...defaultDemoConfig(), ...example, ...overrides };
}
