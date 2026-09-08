export type SplitPaneDirection = 'horizontal' | 'vertical';

export interface SplitPaneContextValue {
  registerPane: (id: string) => () => void;
  getIndex: (id: string) => number;
  getDefaultSize: (id: string) => number | undefined;
  getMinSize: () => number;
  isStacked: () => boolean;
}

export const SplitPaneContextSymbol = Symbol('SplitPaneContext');
