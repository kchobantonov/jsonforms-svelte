export type DemoContext = {
  data?: unknown;
  locale?: string;
  appStore?: unknown;
  getFormModeOverride?: unknown;
  setFormModeOverride?: unknown;
};

export type DemoActionEvent = {
  action: string;
  callback?: (event: DemoActionEvent) => void | Promise<void>;
  context: DemoContext;
  params: Record<string, unknown>;
  $el: Element;
};

export type DemoActionHandler = (event: DemoActionEvent) => void | Promise<void>;
